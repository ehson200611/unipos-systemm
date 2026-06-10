from django.db import models

class AppSetting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField(blank=True, default='')

    class Meta:
        app_label = 'config'
