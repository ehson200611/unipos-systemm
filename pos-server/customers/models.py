from django.db import models


class Customer(models.Model):
    name         = models.CharField(max_length=200)
    phone        = models.CharField(max_length=20, unique=True)
    email        = models.EmailField(blank=True, default='')
    bonus_points = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_spent  = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    visit_count  = models.PositiveIntegerField(default=0)
    note         = models.TextField(blank=True, default='')
    is_active    = models.BooleanField(default=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.phone})'
