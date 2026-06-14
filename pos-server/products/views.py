import json
import urllib.request
import urllib.error
from decimal import Decimal

from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from .models import Category, Product, ProductIngredient, ProductColorStock, IPHONE_COLORS
from .models import ModifierGroup, Modifier, WriteOff, StocktakeSession, StocktakeLine, SystemSettings
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    ProductIngredientReadSerializer,
    RecipeReplaceSerializer,
    ColorStockSerializer,
    PublicMenuProductSerializer,
    PublicMenuCategorySerializer,
    ModifierGroupSerializer,
    ModifierSerializer,
    WriteOffSerializer,
    StocktakeSessionSerializer,
    StocktakeLineSerializer,
    SystemSettingsSerializer,
)
from accounts.permissions import IsManagerOrAdmin, IsManagerOrAdminOrReadOnly


def send_telegram(token, chat_id, text):
    """Ба Telegram паём мефиристад. Хато мушкил намеофарад."""
    try:
        url  = f'https://api.telegram.org/bot{token}/sendMessage'
        data = json.dumps({'chat_id': chat_id, 'text': text, 'parse_mode': 'HTML'}).encode()
        req  = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
        urllib.request.urlopen(req, timeout=5)
    except Exception:
        pass


@api_view(['GET'])
@permission_classes([AllowAny])
def public_menu_products(request):
    """Public endpoint — no auth required. Returns active menu items (not ingredients)."""
    qs = Product.objects.select_related('category').prefetch_related(
        'modifier_groups__modifiers', 'color_stocks'
    ).filter(is_active=True, is_ingredient=False).order_by('category__name', 'name')
    category_id = request.query_params.get('category')
    if category_id:
        qs = qs.filter(category_id=category_id)
    search = request.query_params.get('search', '').strip()
    if search:
        qs = qs.filter(name__icontains=search)
    ser = PublicMenuProductSerializer(qs, many=True, context={'request': request})
    return Response(ser.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_menu_categories(request):
    """Public endpoint — no auth required."""
    cats = Category.objects.order_by('name')
    ser = PublicMenuCategorySerializer(cats, many=True)
    return Response(ser.data)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsManagerOrAdminOrReadOnly]
    search_fields = ['name']


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category').all()
    serializer_class = ProductSerializer
    permission_classes = [IsManagerOrAdminOrReadOnly]
    filterset_fields = ['category', 'is_active', 'is_ingredient']
    search_fields = ['name', 'sku']
    ordering_fields = ['name', 'price', 'created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        # For POS view, return only active products
        active_only = self.request.query_params.get('active_only')
        if active_only and active_only.lower() == 'true':
            qs = qs.filter(is_active=True)
        return qs

    @action(detail=True, methods=['post'], url_path='toggle-active')
    def toggle_active(self, request, pk=None):
        product = self.get_object()
        product.is_active = not product.is_active
        product.save()
        return Response(ProductSerializer(product, context={'request': request}).data)

    @action(
        detail=True,
        methods=['post'],
        url_path='add-stock',
        permission_classes=[IsManagerOrAdmin],
    )
    def add_stock(self, request, pk=None):
        product = self.get_object()
        qty_raw = request.data.get('quantity') or request.data.get('grams')
        try:
            qty = int(Decimal(str(qty_raw)))
        except Exception:
            return Response(
                {'detail': 'Миқдор (quantity) нодуруст аст.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if qty <= 0:
            return Response(
                {'detail': 'Миқдор бояд аз 0 калон бошад.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        product.stock_quantity = (product.stock_quantity or 0) + qty
        product.save(update_fields=['stock_quantity', 'updated_at'])
        return Response(ProductSerializer(product, context={'request': request}).data)

    @action(detail=True, methods=['get'], url_path='color-stocks')
    def color_stocks(self, request, pk=None):
        product = self.get_object()
        stocks = ProductColorStock.objects.filter(product=product)
        return Response(ColorStockSerializer(stocks, many=True).data)

    @action(
        detail=True,
        methods=['post'],
        url_path='add-color-stock',
        permission_classes=[IsManagerOrAdmin],
    )
    def add_color_stock(self, request, pk=None):
        product = self.get_object()
        color = request.data.get('color', '').strip()
        qty_raw = request.data.get('quantity')

        valid_colors = [c[0] for c in IPHONE_COLORS]
        if color not in valid_colors:
            return Response({'detail': f'Ранг нодуруст аст.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            qty = int(qty_raw)
        except (TypeError, ValueError):
            return Response({'detail': 'Миқдор нодуруст аст.'}, status=status.HTTP_400_BAD_REQUEST)

        if qty <= 0:
            return Response({'detail': 'Миқдор бояд аз 0 зиёд бошад.'}, status=status.HTTP_400_BAD_REQUEST)

        color_stock, _ = ProductColorStock.objects.get_or_create(product=product, color=color)
        color_stock.quantity += qty
        color_stock.save()

        # Also update general stock_quantity
        product.stock_quantity = (product.stock_quantity or 0) + qty
        product.save(update_fields=['stock_quantity', 'updated_at'])

        return Response(ColorStockSerializer(color_stock).data)

    @action(
        detail=True,
        methods=['get', 'put'],
        url_path='recipe',
        permission_classes=[IsManagerOrAdmin],
    )
    def recipe(self, request, pk=None):
        product = self.get_object()
        if request.method == 'GET':
            lines = ProductIngredient.objects.filter(product=product).select_related('ingredient')
            return Response(ProductIngredientReadSerializer(lines, many=True).data)
        ser = RecipeReplaceSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        lines = ser.validated_data['lines']
        with transaction.atomic():
            ProductIngredient.objects.filter(product=product).delete()
            for line in lines:
                ing_id = line['ingredient_id']
                if ing_id == product.id:
                    return Response(
                        {'detail': 'Маҳсулот наметавонад компоненти худ бошад.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                try:
                    ing = Product.objects.get(pk=ing_id)
                except Product.DoesNotExist:
                    return Response(
                        {'detail': f'Маҳсулот #{ing_id} ёфт нашуд.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                ProductIngredient.objects.create(
                    product=product,
                    ingredient=ing,
                    quantity=line['quantity'],
                    unit=line.get('unit', 'гр'),
                )
        lines_qs = ProductIngredient.objects.filter(product=product).select_related('ingredient')
        return Response(ProductIngredientReadSerializer(lines_qs, many=True).data)

    @action(
        detail=False,
        methods=['post'],
        url_path='bulk-assign-ingredient',
        permission_classes=[IsManagerOrAdmin],
    )
    def bulk_assign_ingredient(self, request):
        """
        Як ингредиентро ба якчанд маҳсулот илова мекунад ё навсозӣ мекунад.
        Body: { ingredient_id, quantity, product_ids: [...] }
        """
        ingredient_id = request.data.get('ingredient_id')
        quantity      = request.data.get('quantity')
        product_ids   = request.data.get('product_ids', [])

        if not ingredient_id or not quantity or not product_ids:
            return Response({'detail': 'ingredient_id, quantity ва product_ids лозим аст.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            ingredient = Product.objects.get(pk=ingredient_id, is_ingredient=True)
        except Product.DoesNotExist:
            return Response({'detail': f'Ингредиент #{ingredient_id} ёфт нашуд.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            quantity = int(quantity)
            if quantity <= 0:
                raise ValueError
        except (ValueError, TypeError):
            return Response({'detail': 'Миқдор бояд адади мусбат бошад.'},
                            status=status.HTTP_400_BAD_REQUEST)

        updated = []
        skipped = []
        with transaction.atomic():
            for pid in product_ids:
                try:
                    product = Product.objects.get(pk=pid)
                except Product.DoesNotExist:
                    skipped.append(pid)
                    continue
                if product.id == ingredient.id:
                    skipped.append(pid)
                    continue
                obj, created = ProductIngredient.objects.update_or_create(
                    product=product,
                    ingredient=ingredient,
                    defaults={'quantity': quantity},
                )
                updated.append(product.id)

        return Response({
            'updated': updated,
            'skipped': skipped,
            'ingredient': ingredient.name,
            'quantity': quantity,
        })


# ── Modifier views ────────────────────────────────────────────────────────────

class ModifierGroupViewSet(viewsets.ModelViewSet):
    queryset = ModifierGroup.objects.prefetch_related('modifiers', 'products').all()
    serializer_class = ModifierGroupSerializer
    permission_classes = [IsManagerOrAdmin]

    @action(detail=True, methods=['post'], url_path='add-modifier')
    def add_modifier(self, request, pk=None):
        group = self.get_object()
        ser = ModifierSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        modifier = ser.save(group=group)
        return Response(ModifierSerializer(modifier).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='remove-modifier/(?P<mid>[^/.]+)')
    def remove_modifier(self, request, pk=None, mid=None):
        group = self.get_object()
        try:
            m = Modifier.objects.get(pk=mid, group=group)
            m.delete()
        except Modifier.DoesNotExist:
            return Response({'detail': 'Ёфт нашуд'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class WriteOffViewSet(viewsets.ModelViewSet):
    queryset = WriteOff.objects.select_related('product', 'created_by').all()
    serializer_class = WriteOffSerializer
    permission_classes = [IsManagerOrAdmin]
    http_method_names = ['get', 'post', 'head', 'options']


# ── Stocktake views ───────────────────────────────────────────────────────────

class StocktakeSessionViewSet(viewsets.ModelViewSet):
    queryset = StocktakeSession.objects.prefetch_related('lines__product').select_related('created_by').all()
    serializer_class = StocktakeSessionSerializer
    permission_classes = [IsManagerOrAdmin]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def create(self, request, *args, **kwargs):
        """Open a new stocktake session, snapshot current stock quantities."""
        note = request.data.get('note', '')
        with transaction.atomic():
            session = StocktakeSession.objects.create(created_by=request.user, note=note)
            products = Product.objects.filter(is_active=True)
            StocktakeLine.objects.bulk_create([
                StocktakeLine(session=session, product=p, system_qty=p.stock_quantity or 0)
                for p in products
            ])
        ser = StocktakeSessionSerializer(session)
        return Response(ser.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path='update-line/(?P<line_id>[^/.]+)')
    def update_line(self, request, pk=None, line_id=None):
        """Set actual_qty for a single line."""
        session = self.get_object()
        if session.status == 'closed':
            return Response({'detail': 'Сессия ёпиқ аст.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            line = StocktakeLine.objects.get(pk=line_id, session=session)
        except StocktakeLine.DoesNotExist:
            return Response({'detail': 'Ёфт нашуд'}, status=status.HTTP_404_NOT_FOUND)
        actual = request.data.get('actual_qty')
        if actual is None:
            return Response({'detail': 'actual_qty лозим аст.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            line.actual_qty = int(actual)
        except (ValueError, TypeError):
            return Response({'detail': 'Рақами нодуруст.'}, status=status.HTTP_400_BAD_REQUEST)
        line.save()
        return Response(StocktakeLineSerializer(line).data)

    @action(detail=True, methods=['post'], url_path='close')
    def close(self, request, pk=None):
        """Close session: apply actual_qty to product stock where actual_qty is set."""
        session = self.get_object()
        if session.status == 'closed':
            return Response({'detail': 'Аллакай ёпиқ аст.'}, status=status.HTTP_400_BAD_REQUEST)
        from django.utils import timezone
        apply = request.data.get('apply_adjustments', False)
        with transaction.atomic():
            if apply:
                for line in session.lines.select_related('product').filter(actual_qty__isnull=False):
                    p = Product.objects.select_for_update(of=('self',)).get(pk=line.product_id)
                    p.stock_quantity = line.actual_qty
                    p.save(update_fields=['stock_quantity', 'updated_at'])
            session.status = 'closed'
            session.closed_at = timezone.now()
            session.save()
        return Response(StocktakeSessionSerializer(session).data)


# ── System Settings view ──────────────────────────────────────────────────────

class SystemSettingsView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def get(self, request):
        obj = SystemSettings.get()
        return Response(SystemSettingsSerializer(obj).data)

    def post(self, request):
        obj = SystemSettings.get()
        ser = SystemSettingsSerializer(obj, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def telegram_test(request):
    """Паёми санҷишӣ ба Telegram мефиристад."""
    cfg = SystemSettings.get()
    if not cfg.telegram_bot_token or not cfg.telegram_chat_id:
        return Response({'detail': 'Bot Token ё Chat ID вуҷуд надорад.'}, status=400)
    send_telegram(
        cfg.telegram_bot_token,
        cfg.telegram_chat_id,
        '✅ <b>Санҷиш бомуваффақият!</b>\nUniPOS системаи фурӯш ба Telegram пайваст аст.'
    )
    return Response({'detail': 'Паём фиристода шуд.'})

