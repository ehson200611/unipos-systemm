from django.db import models
from django.conf import settings
from products.models import Product


class Sale(models.Model):
    PAYMENT_METHODS = [
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('card_alif', 'Card Alif'),
        ('card_dc', 'Card DC'),
        ('mixed', 'Mixed'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('preparing', 'Preparing'),
        ('ready', 'Ready'),
        ('served', 'Served'),
        ('refunded', 'Refunded'),
        ('cancelled', 'Cancelled'),
    ]

    cashier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sales'
    )
    order_number = models.CharField(max_length=20, unique=True, blank=True, null=True)  # рақами фармоиш барои клиент
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    table_number = models.CharField(max_length=20, blank=True, default='')
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        cashier_name = self.cashier.get_full_name() if self.cashier else 'Unknown'
        return f"Sale #{self.id} — {cashier_name} — {self.total_amount}"

    @property
    def item_count(self):
        return sum(item.quantity for item in self.items.all())


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sale_items'
    )
    product_name = models.CharField(max_length=200)
    color = models.CharField(max_length=30, blank=True, default='')
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Нархи оптовӣ ҳангоми фурӯш")
    modifiers = models.JSONField(default=list, blank=True,
        help_text='[{"group": "Соусҳо", "name": "Кетчуп", "price": "2.00"}]')
    modifiers_price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    line_total = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ['id']

    def save(self, *args, **kwargs):
        from decimal import Decimal
        mod_unit = sum(Decimal(str(m.get('price', 0))) for m in (self.modifiers or []))
        self.modifiers_price = mod_unit * self.quantity
        self.line_total = (self.unit_price + mod_unit) * self.quantity
        if self.product and not self.product_name:
            self.product_name = self.product.name
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product_name} x{self.quantity} @ {self.unit_price}"



class Shift(models.Model):
    STATUS_CHOICES = [('open', 'Open'), ('closed', 'Closed')]
    opened_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='opened_shifts'
    )
    closed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='closed_shifts'
    )
    opened_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='open')
    note = models.TextField(blank=True)

    class Meta:
        ordering = ['-opened_at']

    def __str__(self):
        return f'Shift #{self.id} — {self.status} — {self.opened_at}'
