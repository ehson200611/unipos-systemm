from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsManagerOrAdmin
from .models import Supplier, Purchase
from .serializers import SupplierSerializer, PurchaseSerializer


class SupplierViewSet(viewsets.ModelViewSet):
    queryset           = Supplier.objects.all()
    serializer_class   = SupplierSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['get'])
    def purchases(self, request, pk=None):
        supplier  = self.get_object()
        purchases = supplier.purchases.all()
        return Response(PurchaseSerializer(purchases, many=True).data)

    @action(detail=True, methods=['post'])
    def pay_debt(self, request, pk=None):
        supplier = self.get_object()
        amount   = float(request.data.get('amount', 0))
        if amount <= 0:
            return Response({'detail': 'Маблағ мусбат бошад'}, status=400)
        supplier.debt = max(0, float(supplier.debt) - amount)
        supplier.save()
        return Response(SupplierSerializer(supplier).data)


class PurchaseViewSet(viewsets.ModelViewSet):
    queryset           = Purchase.objects.all()
    serializer_class   = PurchaseSerializer
    permission_classes = [IsManagerOrAdmin]

    def perform_create(self, serializer):
        purchase = serializer.save()
        remaining = float(purchase.amount) - float(purchase.paid)
        if remaining > 0:
            purchase.supplier.debt += remaining
            purchase.supplier.save()
