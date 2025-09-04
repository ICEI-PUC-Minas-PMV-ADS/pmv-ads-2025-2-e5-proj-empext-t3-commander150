from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # URL para o painel de administração padrão do Django.
    path('admin/', admin.site.urls),

    # Inclui as URLs do nosso app de torneios sob o prefixo 'api/'.
    # Ex: http://localhost:8000/api/torneios/
    path('api/', include('torneios.urls')),

    # Endpoint para autenticação via navegador do DRF (login, logout).
    # Útil para testar a API durante o desenvolvimento.
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
]
