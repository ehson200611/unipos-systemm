from django.db import models
from django.conf import settings


class Expense(models.Model):
    CATEGORY_CHOICES = [
        ('salary',    'Маош'),
        ('rent',      'Иҷора'),
        ('utilities', 'Коммунал'),
        ('supplies',  'Маводҳо'),
        ('equipment', 'Таҷҳизот'),
        ('marketing', 'Реклама'),
        ('other',     'Дигар'),
    ]

    category    = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='other')
    title       = models.CharField(max_length=200)
    amount      = models.DecimalField(max_digits=12, decimal_places=2)
    note        = models.TextField(blank=True, default='')
    created_by  = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} — {self.amount}'
