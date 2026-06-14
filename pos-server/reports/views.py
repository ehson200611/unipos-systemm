from rest_framework.views import APIView
from rest_framework import viewsets, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, F
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from django.utils import timezone
from datetime import timedelta, date

from sales.models import Sale, SaleItem
from accounts.models import User
from accounts.permissions import IsManagerOrAdmin
from .models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Expense
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at']


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset           = Expense.objects.all()
    serializer_class   = ExpenseSerializer
    permission_classes = [IsManagerOrAdmin]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class FinancialReportView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def get(self, request):
        days  = int(request.query_params.get('days', 30))
        since = timezone.localtime().date() - timedelta(days=days)

        sales  = Sale.objects.filter(created_at__date__gte=since).exclude(status__in=['refunded', 'cancelled'])
        revenue = float(sales.aggregate(t=Sum('total_amount'))['t'] or 0)

        profit = 0
        for item in SaleItem.objects.filter(sale__in=sales):
            if item.cost_price is not None:
                profit += float((item.unit_price - item.cost_price) * item.quantity)
            else:
                profit += float(item.line_total)

        expenses = Expense.objects.filter(created_at__date__gte=since)
        total_expenses = float(expenses.aggregate(t=Sum('amount'))['t'] or 0)
        net_profit = profit - total_expenses

        by_category = list(
            expenses.values('category')
            .annotate(total=Sum('amount'), count=Count('id'))
            .order_by('-total')
        )

        daily = (
            Sale.objects.filter(created_at__date__gte=since)
            .exclude(status__in=['refunded', 'cancelled'])
            .annotate(day=TruncDate('created_at'))
            .values('day')
            .annotate(revenue=Sum('total_amount'), count=Count('id'))
            .order_by('day')
        )
        daily_expenses = (
            Expense.objects.filter(created_at__date__gte=since)
            .annotate(day=TruncDate('created_at'))
            .values('day')
            .annotate(expenses=Sum('amount'))
        )
        exp_map = {str(e['day']): float(e['expenses'] or 0) for e in daily_expenses}

        chart = [
            {
                'date':     str(d['day'])[-5:],
                'revenue':  float(d['revenue'] or 0),
                'expenses': exp_map.get(str(d['day']), 0),
            }
            for d in daily
        ]

        return Response({
            'revenue':       revenue,
            'profit':        profit,
            'expenses':      total_expenses,
            'net_profit':    net_profit,
            'by_category':   by_category,
            'chart':         chart,
            'expense_list':  ExpenseSerializer(expenses.order_by('-created_at')[:20], many=True).data,
        })


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localtime().date()
        month_start = today.replace(day=1)
        week_start = today - timedelta(days=today.weekday())

        # Today's stats
        today_sales = Sale.objects.filter(created_at__date=today)
        today_total = today_sales.aggregate(total=Sum('total_amount'))['total'] or 0
        today_count = today_sales.count()

        # This week stats
        week_sales = Sale.objects.filter(created_at__date__gte=week_start)
        week_total = week_sales.aggregate(total=Sum('total_amount'))['total'] or 0

        # This month stats
        month_sales = Sale.objects.filter(created_at__date__gte=month_start)
        month_total = month_sales.aggregate(total=Sum('total_amount'))['total'] or 0

        # Profit calculations (unit_price - cost_price) * quantity
        def calc_profit(sales_qs):
            total_p = 0
            for item in SaleItem.objects.filter(sale__in=sales_qs):
                if item.cost_price is not None:
                    total_p += float((item.unit_price - item.cost_price) * item.quantity)
                else:
                    total_p += float(item.line_total)
            return total_p

        today_profit = calc_profit(today_sales)
        week_profit = calc_profit(week_sales)
        month_profit = calc_profit(month_sales)

        # Top selling products (last 30 days)
        thirty_days_ago = today - timedelta(days=30)
        top_products = (
            SaleItem.objects
            .filter(sale__created_at__date__gte=thirty_days_ago)
            .values('product_name')
            .annotate(
                total_qty=Sum('quantity'),
                total_revenue=Sum('line_total')
            )
            .order_by('-total_qty')[:10]
        )

        # Sales by payment method (last 30 days)
        payment_stats = (
            Sale.objects
            .filter(created_at__date=today).exclude(status__in=["refunded","cancelled"])
            .values('payment_method')
            .annotate(count=Count('id'), total=Sum('total_amount'))
        )

        # Sales by cashier (last 30 days)
        cashier_stats = (
            Sale.objects
            .filter(created_at__date=today).exclude(status__in=["refunded","cancelled"])
            .values('cashier__id', 'cashier__username', 'cashier__first_name', 'cashier__last_name')
            .annotate(count=Count('id'), total=Sum('total_amount'))
            .order_by('-total')
        )
        cashier_data = [
            {
                'id': s['cashier__id'],
                'name': f"{s['cashier__first_name']} {s['cashier__last_name']}".strip() or s['cashier__username'],
                'count': s['count'],
                'total': float(s['total'] or 0),
            }
            for s in cashier_stats
        ]

        return Response({
            'today': {
                'total': float(today_total),
                'profit': today_profit,
                'count': today_count,
            },
            'week': {
                'total': float(week_total),
                'profit': week_profit,
                'count': week_sales.count(),
            },
            'month': {
                'total': float(month_total),
                'profit': month_profit,
                'count': month_sales.count(),
            },
            'top_products': list(top_products),
            'payment_stats': list(payment_stats),
            'cashier_stats': cashier_data,
        })


class DailyRevenueView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get('days', 30))
        since = timezone.localtime().date() - timedelta(days=days)

        daily = (
            Sale.objects
            .filter(created_at__date__gte=since)
            .annotate(day=TruncDate('created_at'))
            .values('day')
            .annotate(total=Sum('total_amount'), count=Count('id'))
            .order_by('day')
        )

        return Response({
            'days': days,
            'data': [
                {
                    'date': str(d['day']),
                    'total': float(d['total'] or 0),
                    'count': d['count'],
                }
                for d in daily
            ]
        })


class SalesSummaryView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def get(self, request):
        period = request.query_params.get('period', 'daily')
        days = int(request.query_params.get('days', 30))
        since = timezone.localtime().date() - timedelta(days=days)

        if period == 'weekly':
            trunc = TruncWeek('created_at')
        elif period == 'monthly':
            trunc = TruncMonth('created_at')
        else:
            trunc = TruncDate('created_at')

        data = (
            Sale.objects
            .filter(created_at__date__gte=since)
            .annotate(period=trunc)
            .values('period')
            .annotate(total=Sum('total_amount'), count=Count('id'))
            .order_by('period')
        )

        return Response({
            'period': period,
            'data': [
                {
                    'period': str(d['period']),
                    'total': float(d['total'] or 0),
                    'count': d['count'],
                }
                for d in data
            ]
        })

