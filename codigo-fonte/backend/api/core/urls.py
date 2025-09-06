from django.contrib import admin
from django.urls import path, include

# http://localhost:8000/api/v1/auth/login/      # POST - Login
# http://localhost:8000/api/v1/auth/logout/     # POST - Logout
# http://localhost:8000/api/v1/torneios/...     # Endpoints de torneios
# http://localhost:8000/admin/                  # Admin Django
# http://localhost:8000/api-auth/...            # DRF browser auth

urlpatterns = [
    # URL para o painel de administração padrão do Django.
    path('admin/', admin.site.urls),

    # API Versionada - v1
    path('api/v1/torneios/', include('torneios.urls')),
    path('api/v1/auth/', include('usuarios.urls')),

    # Endpoint para autenticação via navegador do DRF (login, logout).
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
]
