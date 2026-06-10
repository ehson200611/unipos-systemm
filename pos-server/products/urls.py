from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .views import (
    CategoryViewSet, ProductViewSet,
    public_menu_products, public_menu_categories,
    ModifierGroupViewSet, WriteOffViewSet, StocktakeSessionViewSet,
    SystemSettingsView, telegram_test,
)
from .models import IPHONE_COLORS

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'modifier-groups', ModifierGroupViewSet, basename='modifier-group')
router.register(r'writeoffs', WriteOffViewSet, basename='writeoff')
router.register(r'stocktake', StocktakeSessionViewSet, basename='stocktake')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def colors_list(request):
    return Response([{'value': c[0], 'label': c[1]} for c in IPHONE_COLORS])


urlpatterns = [
    path('', include(router.urls)),
    path('colors/', colors_list, name='colors-list'),
    path('menu/', public_menu_products, name='public-menu-products'),
    path('menu/categories/', public_menu_categories, name='public-menu-categories'),
    path('system-settings/', SystemSettingsView.as_view(), name='system-settings'),
    path('system-settings/telegram-test/', telegram_test, name='telegram-test'),
]

