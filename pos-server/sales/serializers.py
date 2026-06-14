import random
from decimal import Decimal
from rest_framework import serializers
from django.db import transaction
from .models import Sale, SaleItem
from products.models import Product, ProductColorStock


def generate_order_number():
    for _ in range(100):
        num = f"{random.randint(1, 999):03d}"
        if not Sale.objects.filter(order_number=num).exists():
            return num
    return f"{random.randint(1, 999):03d}"


class SaleItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleItem
        fields = ['id', 'product', 'product_name', 'color', 'quantity', 'unit_price', 'cost_price', 'modifiers', 'modifiers_price', 'line_total']
        read_only_fields = ['id', 'line_total', 'modifiers_price']


class SaleItemCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    color = serializers.CharField(required=False, allow_blank=True, default='')
    modifiers = serializers.ListField(
        child=serializers.DictField(), required=False, default=list
    )

    def validate_product_id(self, value):
        if not Product.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError(f"Product #{value} not found or inactive.")
        return value


class SaleCreateSerializer(serializers.Serializer):
    payment_method = serializers.ChoiceField(choices=['cash', 'card', 'card_alif', 'card_dc', 'mixed'])
    note = serializers.CharField(required=False, allow_blank=True)
    table_number = serializers.CharField(required=False, allow_blank=True, default='')
    discount_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)
    items = SaleItemCreateSerializer(many=True, min_length=1)
    itemPrices = serializers.DictField(child=serializers.DecimalField(max_digits=12, decimal_places=2), required=False, default=dict)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one item is required.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        request = self.context['request']
        items_data = validated_data.pop('items')
        item_prices = validated_data.pop('itemPrices', {})

        total = Decimal('0')
        item_objects = []
        for item_data in items_data:
            product = Product.objects.get(id=item_data['product_id'])
            qty = item_data['quantity']
            color = item_data.get('color', '')
            # Use override price if provided, else product price
            key = f"{product.id}::{color}"
            unit_price = Decimal(str(item_prices[key])) if key in item_prices else product.price
            modifiers = item_data.get('modifiers', [])
            mod_unit = sum(Decimal(str(m.get('price', 0))) for m in modifiers)
            line_total = (unit_price + mod_unit) * qty
            total += line_total

            # Deduct from color stock if color specified
            if color:
                color_stock = (
                    ProductColorStock.objects
                    .select_for_update(of=('self',))
                    .filter(product=product, color=color)
                    .first()
                )
                if color_stock:
                    if color_stock.quantity < qty:
                        raise serializers.ValidationError({
                            'items': [f'{product.name} ({color}): склад кам аст. Мавҷуд: {color_stock.quantity} дона.']
                        })
                    color_stock.quantity -= qty
                    color_stock.save()

            # Deduct from general stock
            prod_lock = Product.objects.select_for_update(of=('self',)).get(id=product.id)
            if prod_lock.stock_quantity >= qty:
                prod_lock.stock_quantity -= qty
                prod_lock.save(update_fields=['stock_quantity', 'updated_at'])

            # Deduct recipe ingredients with unit conversion
            from products.models import ProductIngredient, convert_units
            for line in ProductIngredient.objects.filter(product=product).select_related('ingredient'):
                ing = Product.objects.select_for_update(of=('self',)).get(id=line.ingredient_id)
                recipe_qty = float(line.quantity) * qty
                warehouse_unit = ing.sku or 'дона'
                recipe_unit = line.unit or warehouse_unit
                deduct = convert_units(recipe_qty, recipe_unit, warehouse_unit)
                ing.stock_quantity = max(0, float(ing.stock_quantity or 0) - deduct)
                ing.save(update_fields=['stock_quantity', 'updated_at'])

            item_objects.append({
                'product': product,
                'product_name': product.name,
                'color': color,
                'quantity': qty,
                'unit_price': unit_price,
                'cost_price': product.cost_price,
                'modifiers': modifiers,
                'modifiers_price': mod_unit * qty,
                'line_total': line_total,
            })

        discount = Decimal(str(validated_data.pop('discount_amount', 0)))
        final_total = max(total - discount, Decimal('0'))

        sale = Sale.objects.create(
            cashier=request.user,
            total_amount=final_total,
            discount_amount=discount,
            order_number=generate_order_number(),
            **validated_data
        )

        for item in item_objects:
            SaleItem.objects.create(sale=sale, **item)

        # Telegram notification (non-blocking)
        try:
            from products.models import SystemSettings
            from products.views import send_telegram
            cfg = SystemSettings.get()
            if cfg.telegram_enabled and cfg.telegram_bot_token and cfg.telegram_chat_id:
                pay_labels = {'cash': 'Нақд', 'card': 'Кард', 'card_alif': 'Alif Pay',
                              'card_dc': 'DC Pay', 'mixed': 'Омехта'}
                lines = '\n'.join(
                    f"  • {it['product_name']} ×{it['quantity']}"
                    for it in item_objects
                )
                cashier_name = request.user.get_full_name() or request.user.username
                table = f"\n🪑 Миз: {sale.table_number}" if sale.table_number else ''
                msg = (
                    f"🛒 <b>Нав фурӯш #{sale.order_number}</b>{table}\n"
                    f"👤 {cashier_name}\n"
                    f"💰 <b>{final_total} сомонӣ</b>\n"
                    f"💳 {pay_labels.get(sale.payment_method, sale.payment_method)}\n"
                    f"📦 Маҳсулот:\n{lines}"
                )
                send_telegram(cfg.telegram_bot_token, cfg.telegram_chat_id, msg)
        except Exception:
            pass

        return sale


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    cashier_name = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        fields = [
            'id', 'order_number', 'status', 'cashier', 'cashier_name', 'payment_method',
            'total_amount', 'discount_amount', 'table_number', 'note', 'item_count', 'items', 'created_at',
        ]
        read_only_fields = ['id', 'order_number', 'status', 'cashier', 'cashier_name', 'total_amount', 'created_at']

    def get_cashier_name(self, obj):
        if obj.cashier:
            return obj.cashier.get_full_name() or obj.cashier.username
        return 'Unknown'

    def get_item_count(self, obj):
        return sum(item.quantity for item in obj.items.all())


class SaleListSerializer(serializers.ModelSerializer):
    cashier_name = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()
    items = SaleItemSerializer(many=True, read_only=True)

    class Meta:
        model = Sale
        fields = [
            'id', 'order_number', 'status', 'cashier', 'cashier_name', 'payment_method',
            'total_amount', 'discount_amount', 'table_number', 'item_count', 'items', 'created_at',
        ]

    def get_cashier_name(self, obj):
        if obj.cashier:
            return obj.cashier.get_full_name() or obj.cashier.username
        return 'Unknown'

    def get_item_count(self, obj):
        return sum(item.quantity for item in obj.items.all())
