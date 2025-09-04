from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    """
    Permite acesso apenas a usuários com tipo 'ADMIN'.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.tipo == 'ADMIN')


class IsLoja(BasePermission):
    """
    Permite acesso apenas a usuários com tipo 'LOJA'.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.tipo == 'LOJA')


class IsJogador(BasePermission):
    """
    Permite acesso apenas a usuários com tipo 'JOGADOR'.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.tipo == 'JOGADOR')


class IsLojaOuAdmin(BasePermission):
    """
    Permite acesso a usuários do tipo 'LOJA' ou 'ADMIN'.
    Ideal para ações de gerenciamento de torneios.
    """

    def has_permission(self, request, view):
        is_loja = request.user.tipo == 'LOJA'
        is_admin = request.user.tipo == 'ADMIN'
        return bool(request.user and request.user.is_authenticated and (is_loja or is_admin))


class IsApenasLeitura(BasePermission):
    """
    Permite acesso irrestrito, mas apenas para métodos de leitura seguros
    (GET, HEAD, OPTIONS). Usado para que todos possam ver os dados públicos.
    """

    def has_permission(self, request, view):
        return request.method in SAFE_METHODS
