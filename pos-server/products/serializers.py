from rest_framework import serializers
from .models import Category, Product, ProductIngredient, ProductColorStock, IPHONE_COLORS
from .models import ModifierGroup, Modifier, WriteOff, StocktakeSession, StocktakeLine, SystemSettings


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'product_count', 'created_at']
        read_only_fields = ['id', 'created_at', 'product_count']

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'price', 'cost_price', 'category', 'category_name',
            'image', 'image_url', 'sku', 'stock_quantity', 'is_active',
            'is_ingredient', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'category_name', 'image_url']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ProductIngredientReadSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.CharField(source='ingredient.name', read_only=True)

    class Meta:
        model = ProductIngredient
        fields = ['id', 'ingredient', 'ingredient_name', 'quantity']


class RecipeLineInputSerializer(serializers.Serializer):
    ingredient_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1)


class ColorStockSerializer(serializers.ModelSerializer):
    color_label = serializers.SerializerMethodField()

    class Meta:
        model = ProductColorStock
        fields = ['id', 'color', 'color_label', 'quantity']

    def get_color_label(self, obj):
        return dict(IPHONE_COLORS).get(obj.color, obj.color)


# ── Modifier serializers ─────────────────────────────────────────────────────

class ModifierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Modifier
        fields = ['id', 'name', 'price', 'is_available', 'sort_order']


class ModifierGroupSerializer(serializers.ModelSerializer):
    modifiers = ModifierSerializer(many=True, read_only=True)
    product_ids = serializers.PrimaryKeyRelatedField(
        source='products', many=True, queryset=Product.objects.all(), required=False,
    )

    class Meta:
        model = ModifierGroup
        fields = ['id', 'name', 'required', 'max_select', 'modifiers', 'product_ids']

    def create(self, validated_data):
        products = validated_data.pop('products', [])
        group = ModifierGroup.objects.create(**validated_data)
        if products:
            group.products.set(products)
        return group

    def update(self, instance, validated_data):
        products = validated_data.pop('products', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if products is not None:
            instance.products.set(products)
        return instance


class ModifierGroupMinimalSerializer(serializers.ModelSerializer):
    modifiers = ModifierSerializer(many=True, read_only=True)

    class Meta:
        model = ModifierGroup
        fields = ['id', 'name', 'required', 'max_select', 'modifiers']


# ── Write-off serializer ──────────────────────────────────────────────────────

class WriteOffSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    reason_label = serializers.SerializerMethodField()

    class Meta:
        model = WriteOff
        fields = [
            'id', 'product', 'product_name', 'quantity',
            'reason', 'reason_label', 'note',
            'created_by', 'created_by_name', 'created_at',
        ]
        read_only_fields = ['id', 'product_name', 'created_by', 'created_by_name', 'created_at', 'reason_label']

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() or obj.created_by.username if obj.created_by else '—'

    def get_reason_label(self, obj):
        return dict(WriteOff.REASON_CHOICES).get(obj.reason, obj.reason)

    def create(self, validated_data):
        request = self.context.get('request')
        product = validated_data['product']
        qty = validated_data['quantity']
        product.stock_quantity = max(0, (product.stock_quantity or 0) - qty)
        product.save(update_fields=['stock_quantity', 'updated_at'])
        validated_data['created_by'] = request.user if request else None
        return WriteOff.objects.create(**validated_data)


# ── Public menu ───────────────────────────────────────────────────────────────

class PublicMenuProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_id = serializers.IntegerField(source='category.id', read_only=True)
    image_url = serializers.SerializerMethodField()
    ingredients = serializers.JSONField(source='ingredients_text')
    modifier_groups = ModifierGroupMinimalSerializer(many=True, read_only=True)
    color_stocks = ColorStockSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'discount_price',
            'category_id', 'category_name', 'image_url',
            'is_active', 'ingredients', 'modifier_groups', 'color_stocks',
            'stock_quantity',
        ]

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class PublicMenuCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class SystemSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSettings
        fields = ['telegram_bot_token', 'telegram_chat_id', 'telegram_enabled']


class StocktakeLineSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    diff = serializers.SerializerMethodField()

    class Meta:
        model = StocktakeLine
        fields = ['id', 'product', 'product_name', 'system_qty', 'actual_qty', 'diff']
        read_only_fields = ['id', 'product_name', 'system_qty', 'diff']

    def get_diff(self, obj):
        return obj.diff


class StocktakeSessionSerializer(serializers.ModelSerializer):
    lines = StocktakeLineSerializer(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = StocktakeSession
        fields = ['id', 'status', 'note', 'created_by', 'created_by_name', 'created_at', 'closed_at', 'lines']
        read_only_fields = ['id', 'created_by', 'created_by_name', 'created_at', 'closed_at', 'lines']

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return '—'


class RecipeReplaceSerializer(serializers.Serializer):
    lines = RecipeLineInputSerializer(many=True, allow_empty=True)

    def validate(self, attrs):
        lines = attrs.get('lines') or []
        seen = set()
        for line in lines:
            iid = line['ingredient_id']
            if iid in seen:
                raise serializers.ValidationError('Компонент такрорӣ аст.')
            seen.add(iid)
        return attrs

