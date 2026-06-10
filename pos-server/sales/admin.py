from django.contrib import admin
from .models import Sale, SaleItem


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0
    readonly_fields = ['line_total']


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ['id', 'cashier', 'payment_method', 'total_amount', 'created_at']
    list_filter = ['payment_method', 'created_at', 'cashier']
    search_fields = ['cashier__username', 'cashier__first_name']
    readonly_fields = ['total_amount', 'created_at']
    inlines = [SaleItemInline]
    ordering = ['-created_at']


@admin.register(SaleItem)
class SaleItemAdmin(admin.ModelAdmin):
    list_display = ['sale', 'product_name', 'quantity', 'unit_price', 'line_total']
    readonly_fields = ['line_total']

