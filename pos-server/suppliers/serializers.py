from rest_framework import serializers
from .models import Supplier, Purchase


class PurchaseSerializer(serializers.ModelSerializer):
    remaining = serializers.ReadOnlyField()

    class Meta:
        model  = Purchase
        fields = '__all__'


class SupplierSerializer(serializers.ModelSerializer):
    total_purchases = serializers.SerializerMethodField()

    class Meta:
        model  = Supplier
        fields = '__all__'

    def get_total_purchases(self, obj):
        return obj.purchases.count()
