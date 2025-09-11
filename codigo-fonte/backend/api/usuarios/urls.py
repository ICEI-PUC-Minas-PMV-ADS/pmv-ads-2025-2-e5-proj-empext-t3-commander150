# usuarios/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import LoginView, LogoutView, UsuariosViewSet, RequisitarTrocaSenhaView, ValidarTokenRedefinirSenhaView, \
    AlterarSenhaView, ValidarSessaoView

router = DefaultRouter()
router.register(r'usuarios', UsuariosViewSet, basename='usuario')

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('requisitar-troca-senha/', RequisitarTrocaSenhaView.as_view(), name='requisitar_troca_senha'),
    path('validar-token-redefinir-senha/', ValidarTokenRedefinirSenhaView.as_view(),
         name='validar_token_redefinir_senha'),
    path('alterar-senha/<int:user_id>/', AlterarSenhaView.as_view(), name='alterar_senha'),
    path('validar-sessao/', ValidarSessaoView.as_view(), name='validar-sessao'),
    path('', include(router.urls)),  # Inclui automaticamente os endpoints do ViewSet Usuarios
]
