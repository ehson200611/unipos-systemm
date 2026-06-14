from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SupplierViewSet, PurchaseViewSet

router = DefaultRouter()
router.register('suppliers', SupplierViewSet)
router.register('purchases', PurchaseViewSet)

urlpatterns = [path('', include(router.urls))]
