from django.contrib import admin
from config.settings_api import get_settings, update_settings
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from sales.shift_views import CurrentShiftView, OpenShiftView, CloseShiftView, ShiftListView, ShiftDetailView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('products.urls')),
    path('api/', include('sales.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/', include('customers.urls')),
    path('api/', include('suppliers.urls')),
    path('api/shifts/', ShiftListView.as_view()),
    path('api/shifts/current/', CurrentShiftView.as_view()),
    path('api/shifts/open/', OpenShiftView.as_view()),
    path('api/shifts/close/', CloseShiftView.as_view()),
    path('api/shifts/<int:pk>/', ShiftDetailView.as_view()),
    path('api/app-settings/', get_settings),
    path('api/app-settings/update/', update_settings),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

