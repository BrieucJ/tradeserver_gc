from rest_framework import permissions

class IsAuthenticatedOrWriteOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method == 'POST' or (request.user and request.auth):
            return True
        return False
