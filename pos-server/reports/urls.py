from django.urls import path
from .views import DashboardView, DailyRevenueView, SalesSummaryView

urlpatterns = [
    path('dashboard/', DashboardView.as_view(), name='reports-dashboard'),
    path('daily/', DailyRevenueView.as_view(), name='reports-daily'),
    path('summary/', SalesSummaryView.as_view(), name='reports-summary'),
]

