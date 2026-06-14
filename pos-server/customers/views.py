from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from .models import Customer
from .serializers import CustomerSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    queryset           = Customer.objects.all()
    serializer_class   = CustomerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, SearchFilter]
    search_fields      = ['name', 'phone', 'email']
    filterset_fields   = ['is_active']

    @action(detail=True, methods=['post'])
    def add_bonus(self, request, pk=None):
        customer = self.get_object()
        amount   = float(request.data.get('amount', 0))
        if amount <= 0:
            return Response({'detail': 'Маблағ мусбат бошад'}, status=400)
        customer.bonus_points += amount
        customer.save()
        return Response(CustomerSerializer(customer).data)

    @action(detail=True, methods=['post'])
    def use_bonus(self, request, pk=None):
        customer = self.get_object()
        amount   = float(request.data.get('amount', 0))
        if amount <= 0:
            return Response({'detail': 'Маблағ мусбат бошад'}, status=400)
        if customer.bonus_points < amount:
            return Response({'detail': 'Бонус кам аст'}, status=400)
        customer.bonus_points -= amount
        customer.save()
        return Response(CustomerSerializer(customer).data)

    @action(detail=False, methods=['get'])
    def search_phone(self, request):
        phone = request.query_params.get('phone', '')
        try:
            customer = Customer.objects.get(phone=phone)
            return Response(CustomerSerializer(customer).data)
        except Customer.DoesNotExist:
            return Response({'detail': 'Топилмад'}, status=404)
