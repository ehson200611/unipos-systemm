from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import Sum, Count
from decimal import Decimal

from .models import Sale, SaleItem, Shift
from accounts.permissions import IsManagerOrAdmin


def shift_summary(shift):
    qs = Sale.objects.filter(
        created_at__gte=shift.opened_at,
        created_at__lte=(shift.closed_at or timezone.now()),
    ).exclude(status__in=['refunded', 'cancelled'])

    total_revenue = float(qs.aggregate(t=Sum('total_amount'))['t'] or 0)

    # Profit
    items = SaleItem.objects.filter(sale__in=qs)
    total_profit = 0.0
    for item in items:
        cp = float(item.cost_price or 0)
        total_profit += float((item.unit_price - Decimal(str(cp))) * item.quantity)

    by_payment = list(
        qs.values('payment_method')
        .annotate(total=Sum('total_amount'), count=Count('id'))
        .order_by('-total')
    )

    by_cashier = []
    for row in qs.values('cashier__id', 'cashier__first_name', 'cashier__last_name', 'cashier__username').annotate(
        total=Sum('total_amount'), count=Count('id')
    ).order_by('-total'):
        fn = row.get('cashier__first_name') or ''
        ln = row.get('cashier__last_name') or ''
        name = (fn + ' ' + ln).strip() or row.get('cashier__username') or '—'
        by_cashier.append({'name': name, 'total': float(row['total'] or 0), 'count': row['count']})

    top_products = list(
        SaleItem.objects.filter(sale__in=qs)
        .values('product_name')
        .annotate(qty=Sum('quantity'), revenue=Sum('line_total'))
        .order_by('-qty')[:5]
    )

    return {
        'sale_count': qs.count(),
        'total_revenue': total_revenue,
        'total_profit': round(total_profit, 2),
        'by_payment': [{'method': r['payment_method'], 'total': float(r['total'] or 0), 'count': r['count']} for r in by_payment],
        'by_cashier': by_cashier,
        'top_products': [{'name': p['product_name'], 'qty': p['qty'], 'revenue': float(p['revenue'] or 0)} for p in top_products],
    }


def serialize_shift(shift, include_summary=False):
    d = {
        'id': shift.id,
        'status': shift.status,
        'opened_at': shift.opened_at.isoformat(),
        'closed_at': shift.closed_at.isoformat() if shift.closed_at else None,
        'opened_by': shift.opened_by.get_full_name() or shift.opened_by.username if shift.opened_by else '—',
        'closed_by': shift.closed_by.get_full_name() or shift.closed_by.username if shift.closed_by else None,
        'note': shift.note,
    }
    if include_summary:
        d['summary'] = shift_summary(shift)
    return d


class CurrentShiftView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        shift = Shift.objects.filter(status='open').first()
        if not shift:
            return Response(None)
        return Response(serialize_shift(shift))


class OpenShiftView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if Shift.objects.filter(status='open').exists():
            return Response({'detail': 'Навбат аллакай кушода аст.'}, status=400)
        shift = Shift.objects.create(opened_by=request.user)
        return Response(serialize_shift(shift), status=201)


class CloseShiftView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        shift = Shift.objects.filter(status='open').first()
        if not shift:
            return Response({'detail': 'Навбати кушода ёфт нашуд.'}, status=400)
        shift.closed_by = request.user
        shift.closed_at = timezone.now()
        shift.status = 'closed'
        shift.note = request.data.get('note', '')
        shift.save()
        return Response(serialize_shift(shift, include_summary=True))


class ShiftListView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def get(self, request):
        shifts = Shift.objects.all()[:30]
        return Response([serialize_shift(s, include_summary=(s.status == 'closed')) for s in shifts])


class ShiftDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            shift = Shift.objects.get(pk=pk)
        except Shift.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)
        return Response(serialize_shift(shift, include_summary=True))
