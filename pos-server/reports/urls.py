from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DashboardView, DailyRevenueView, SalesSummaryView, ExpenseViewSet, FinancialReportView

router = DefaultRouter()
router.register('expenses', ExpenseViewSet)

urlpatterns = [
    path('dashboard/',  DashboardView.as_view(),       name='reports-dashboard'),
    path('daily/',      DailyRevenueView.as_view(),    name='reports-daily'),
    path('summary/',    SalesSummaryView.as_view(),    name='reports-summary'),
    path('financial/',  FinancialReportView.as_view(), name='reports-financial'),
    path('',            include(router.urls)),
]

