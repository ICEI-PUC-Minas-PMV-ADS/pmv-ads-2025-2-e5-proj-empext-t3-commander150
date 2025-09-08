# usuarios/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import LoginView, LogoutView, UsuariosViewSet, RequisitarTrocaSenhaView, ValidarTokenRedefinirSenhaView, \
    AlterarSenhaView

router = DefaultRouter()
router.register(r'usuarios', UsuariosViewSet, basename='usuario')

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('requisitar-troca-senha/', RequisitarTrocaSenhaView.as_view(), name='requisitar_troca_senha'),
    path('validar-token-redefinir-senha/', ValidarTokenRedefinirSenhaView.as_view(),
         name='validar_token_redefinir_senha'),
    path('alterar-senha/<int:user_id>/', AlterarSenhaView.as_view(), name='alterar_senha'),
    path('', include(router.urls)),
]
