from django.contrib import admin
from .models import Category, Product, ProductIngredient


class ProductIngredientInline(admin.TabularInline):
    model = ProductIngredient
    fk_name = 'product'
    extra = 1
    autocomplete_fields = ['ingredient']


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'stock_quantity', 'category', 'sku', 'is_active', 'created_at']
    list_filter = ['category', 'is_active']
    search_fields = ['name', 'sku']
    list_editable = ['is_active']
    inlines = [ProductIngredientInline]
