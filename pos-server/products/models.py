from django.db import models


class SystemSettings(models.Model):
    """Танзимоти умумии система — як сатр (singleton)."""
    telegram_bot_token = models.CharField(max_length=300, blank=True, default='')
    telegram_chat_id   = models.CharField(max_length=100, blank=True, default='')
    telegram_enabled   = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Танзимоти система'

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return 'Танзимоти система'


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.FloatField(default=0)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products'
    )
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    sku = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    is_ingredient = models.BooleanField(default=False, help_text='Агар True бошад — маҳсулот дар склад нигоҳ дошта мешавад')
    description = models.TextField(blank=True, default='')
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Нархи оптовӣ")
    ingredients_text = models.JSONField(default=list, blank=True, help_text='[{"name": "...", "amount": "..."}]')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category__name', 'name']

    def __str__(self):
        return f"{self.name} ({self.price})"


IPHONE_COLORS = [
    ('orange',   'Норанҷӣ (Orange)'),
    ('black',    'Чорранг (Black)'),
    ('white',    'Сафед (White)'),
    ('blue',     'Кабуд (Blue)'),
    ('purple',   'Бунафш (Purple)'),
    ('red',      'Сурх (Red)'),
    ('gold',     'Тиллоӣ (Gold)'),
    ('yellow',   'Зард (Yellow)'),
    ('pink',     'Гулобӣ (Pink)'),
    ('titanium', 'Титаниум (Titanium)'),
    ('green',    'Сабз (Green)'),
    ('teal',     'Феруза (Teal)'),
    ('ultramarine', 'Ултрамарин (Ultramarine)'),
]


class ProductColorStock(models.Model):
    """Миқдори маҳсулот бар асоси ранг."""
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='color_stocks',
    )
    color = models.CharField(max_length=30, choices=IPHONE_COLORS)
    quantity = models.IntegerField(default=0)

    class Meta:
        unique_together = [('product', 'color')]
        ordering = ['product', 'color']

    def __str__(self):
        return f"{self.product.name} — {self.color}: {self.quantity} дона"


class ModifierGroup(models.Model):
    """Гурӯҳи модификаторҳо — масалан "Соусҳо", "Андоза", "Иловаҳо"."""
    name = models.CharField(max_length=100)
    products = models.ManyToManyField('Product', related_name='modifier_groups', blank=True)
    required = models.BooleanField(default=False)
    max_select = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Modifier(models.Model):
    """Як вариант — масалан "Кетчуп +2 сом" ё "Бе пиёз"."""
    group = models.ForeignKey(ModifierGroup, on_delete=models.CASCADE, related_name='modifiers')
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    is_available = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)
    recipe_multiplier = models.FloatField(default=1.0, help_text='Зарбкунандаи рецепт: 0.7мл = 1.4, 0.5мл = 1.0')

    class Meta:
        ordering = ['sort_order', 'name']

    def __str__(self):
        return f'{self.group.name} → {self.name}'


class WriteOff(models.Model):
    """Списание — вайрон шуд, рехт, мӯҳлат гузашт."""
    REASON_CHOICES = [
        ('spoiled',  'Вайрон шуд'),
        ('broken',   'Шикаст'),
        ('expired',  'Мӯҳлат гузашт'),
        ('training', 'Омӯзиш / санҷиш'),
        ('other',    'Дигар'),
    ]
    product = models.ForeignKey('Product', on_delete=models.CASCADE, related_name='writeoffs')
    quantity = models.IntegerField()
    reason = models.CharField(max_length=20, choices=REASON_CHOICES, default='other')
    note = models.TextField(blank=True)
    created_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, related_name='writeoffs'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Списание #{self.id}: {self.product.name} — {self.quantity} дона'


class StocktakeSession(models.Model):
    """Инвентаризатсия — санҷиши воқеии склад."""
    STATUS_CHOICES = [('open', 'Кушода'), ('closed', 'Баста')]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='open')
    note = models.TextField(blank=True)
    created_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, related_name='stocktake_sessions'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Инвентаризатсия #{self.id} — {self.get_status_display()}'


class StocktakeLine(models.Model):
    """Як сатр дар инвентаризатсия — маҳсулот + системавӣ + воқеӣ."""
    session = models.ForeignKey(StocktakeSession, on_delete=models.CASCADE, related_name='lines')
    product = models.ForeignKey('Product', on_delete=models.CASCADE, related_name='stocktake_lines')
    system_qty = models.IntegerField()
    actual_qty = models.IntegerField(null=True, blank=True)

    class Meta:
        unique_together = [('session', 'product')]
        ordering = ['product__name']

    @property
    def diff(self):
        if self.actual_qty is None:
            return None
        return self.actual_qty - self.system_qty

    def __str__(self):
        return f'#{self.session_id}: {self.product.name} sys={self.system_qty} act={self.actual_qty}'


UNIT_CHOICES = [
    ('гр',   'Грамм (гр)'),
    ('кг',   'Килограмм (кг)'),
    ('мл',   'Миллилитр (мл)'),
    ('л',    'Литр (л)'),
    ('дона', 'Дона (шт)'),
]

UNIT_TO_BASE = {
    'гр':   ('кг',   0.001),
    'кг':   ('кг',   1.0),
    'мл':   ('л',    0.001),
    'л':    ('л',    1.0),
    'дона': ('дона', 1.0),
}

def convert_units(amount, from_unit, to_unit):
    """Конвертация воҳидҳо: масалан 200 гр → 0.2 кг"""
    if from_unit == to_unit:
        return amount
    conversions = {
        ('гр', 'кг'): 0.001, ('кг', 'гр'): 1000,
        ('мл', 'л'): 0.001,  ('л', 'мл'): 1000,
        ('гр', 'мл'): 1.0,   ('мл', 'гр'): 1.0,  # приблизительно
    }
    return amount * conversions.get((from_unit, to_unit), 1.0)


class ProductIngredient(models.Model):
    """Граммовка: аз як маҳсулот чанд воҳид аз компонент меравад (склад)."""
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='recipe_lines',
        help_text='Маҳсулоти натиҷа',
    )
    ingredient = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='used_as_ingredient_in',
        help_text='Компонент / хоммаҳсулот',
    )
    quantity = models.FloatField(default=1)
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES, default='гр', help_text='Воҳиди андозагирӣ дар рецепт')

    class Meta:
        ordering = ['product_id', 'ingredient_id']
        constraints = [
            models.UniqueConstraint(
                fields=['product', 'ingredient'],
                name='uniq_product_ingredient',
            ),
            models.CheckConstraint(
                check=models.Q(quantity__gt=0),
                name='quantity_positive',
            ),
        ]

    def __str__(self):
        return f"{self.product.name} ← {self.quantity}дона {self.ingredient.name}"

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.product_id and self.ingredient_id and self.product_id == self.ingredient_id:
            raise ValidationError('Маҳсулот наметавонад компоненти худ бошад.')
