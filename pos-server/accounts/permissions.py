from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """Only users with 'admin' role can access."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'admin'
        )


class IsManagerOrAdmin(BasePermission):
    """Managers and admins can access."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in ['admin', 'manager']
        )


class IsManagerOrAdminOrReadOnly(BasePermission):
    """Managers and admins can write; others can read."""
    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return bool(request.user and request.user.is_authenticated)
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in ['admin', 'manager']
        )

