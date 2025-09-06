from rest_framework.authentication import SessionAuthentication


class SessionAuthenticationSemCSRF(SessionAuthentication):
    """
    Feito somente para desativar a validação de CSRF
    """
    def enforce_csrf(self, request):
        # Desabilita a validação de CSRF
        return
