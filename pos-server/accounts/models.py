from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import UserManager as DjangoUserManager
from django.db import models


class UserManager(DjangoUserManager):
    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("role", "admin")
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return super().create_superuser(username, email, password, **extra_fields)


class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('cashier', 'Cashier'),
        ('chef', 'Chef'),
        ('assembler', 'Assembler'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='cashier')
    objects = UserManager()
    phone = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    chef_categories = models.ManyToManyField(
        'products.Category',
        blank=True,
        related_name='chefs',
    )

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']

    @property
    def is_admin_role(self):
        return self.role == 'admin'

    @property
    def is_manager_role(self):
        return self.role in ['admin', 'manager']

    def __str__(self):
        full_name = self.get_full_name()
        return f"{full_name or self.username} ({self.get_role_display()})"

