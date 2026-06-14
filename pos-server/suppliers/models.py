from django.db import models


class Supplier(models.Model):
    name       = models.CharField(max_length=200)
    phone      = models.CharField(max_length=20, blank=True, default='')
    address    = models.TextField(blank=True, default='')
    debt       = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    note       = models.TextField(blank=True, default='')
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Purchase(models.Model):
    supplier    = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='purchases')
    amount      = models.DecimalField(max_digits=12, decimal_places=2)
    paid        = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    description = models.TextField(blank=True, default='')
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def remaining(self):
        return self.amount - self.paid
