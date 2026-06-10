from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as filters

from .models import Sale
from .serializers import SaleSerializer, SaleListSerializer, SaleCreateSerializer


class SaleFilter(filters.FilterSet):
    date_from = filters.DateFilter(field_name='created_at', lookup_expr='date__gte')
    date_to = filters.DateFilter(field_name='created_at', lookup_expr='date__lte')
    cashier = filters.NumberFilter(field_name='cashier__id')
    status = filters.CharFilter(field_name='status')

    class Meta:
        model = Sale
        fields = ['payment_method', 'cashier', 'status', 'date_from', 'date_to']


class SaleViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet
):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = SaleFilter
    ordering_fields = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        qs = Sale.objects.select_related('cashier').prefetch_related('items__product')
        if user.role == 'cashier':
            qs = qs.filter(cashier=user)
        elif user.role == 'chef':
            category_ids = user.chef_categories.values_list('id', flat=True)
            qs = qs.filter(items__product__category__in=category_ids).distinct()
        # assembler sees all orders — filters on frontend by status
        return qs.order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return SaleCreateSerializer
        if self.action == 'list':
            return SaleListSerializer
        return SaleSerializer


    def destroy(self, request, *args, **kwargs):
        from accounts.permissions import IsManagerOrAdmin
        if not (request.user.role in ('admin', 'manager')):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Танҳо admin ё manager метавонад фурӯшро ҳазф кунад.')
        return super().destroy(request, *args, **kwargs)
    def create(self, request, *args, **kwargs):
        serializer = SaleCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        sale = serializer.save()
        return Response(
            SaleSerializer(sale, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def mark_preparing(self, request, pk=None):
        sale = self.get_object()
        sale.status = 'preparing'
        sale.save(update_fields=['status'])
        return Response(
            SaleSerializer(sale, context={'request': request}).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def mark_ready(self, request, pk=None):
        """Mark order as ready — кассир мегӯяд фармоиш тайёр аст."""
        sale = self.get_object()
        sale.status = 'ready'
        sale.save(update_fields=['status'])
        return Response(
            SaleSerializer(sale, context={'request': request}).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def mark_served(self, request, pk=None):
        sale = self.get_object()
        sale.status = 'served'
        sale.save(update_fields=['status'])
        return Response(
            SaleSerializer(sale, context={'request': request}).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        """Баргардонидани фармоиш / Возврат заказа."""
        sale = self.get_object()
        if sale.status in ('refunded', 'cancelled'):
            return Response(
                {'detail': 'Sale is already refunded or cancelled.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        sale.status = 'refunded'
        reason = request.data.get('reason', '')
        if reason:
            prefix = 'ВОЗДОШТ: ' if not sale.note else f'{sale.note}\nВОЗДОШТ: '
            sale.note = prefix + reason
        sale.save(update_fields=['status', 'note'])
        return Response(
            SaleSerializer(sale, context={'request': request}).data,
            status=status.HTTP_200_OK
        )

