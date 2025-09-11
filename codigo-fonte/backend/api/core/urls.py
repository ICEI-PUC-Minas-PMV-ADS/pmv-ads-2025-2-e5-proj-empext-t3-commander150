from django.contrib import admin
from django.urls import path, include
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions

# Exemplos:
# http://localhost:8000/api/v1/auth/login/      # POST - Login
# http://localhost:8000/api/v1/auth/logout/     # POST - Logout
# http://localhost:8000/api/v1/auth/usuarios/   # POST - Criar novos usuários
# http://localhost:8000/api/v1/auth/usuarios/   # GET - Listar usuários
# http://localhost:8000/api/v1/auth/usuarios/{id}/  # GET - Listar detalhes usuário
# http://localhost:8000/api/v1/torneios/...     # Endpoints de torneios
# http://localhost:8000/admin/                  # Admin Django
# http://localhost:8000/api-auth/...            # DRF browser auth

# Swagger UI (interativo, bonito, permite testar requests):: http://localhost:8000/swagger/
# Redoc (visualização alternativa, mais limpa): http://localhost:8000/redoc/
# JSON da OpenAPI (raw): http://localhost:8000/swagger.json

schema_view = get_schema_view(
    openapi.Info(
        title="Commander150 API",
        default_version='v1',
        description="Documentação da API Commander150",
        terms_of_service="https://www.seusite.com/termos/",
        contact=openapi.Contact(email="contato@seusite.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,  # Permite acesso público à documentação
    permission_classes=[permissions.AllowAny],  # Lista correta
)

urlpatterns = [
    # URL para o painel de administração padrão do Django.
    path('admin/', admin.site.urls),

    # API Versionada - v1
    path('api/v1/torneios/', include('torneios.urls')),
    path('api/v1/auth/', include('usuarios.urls')),

    # Endpoint para autenticação via navegador do DRF (login, logout).
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),

    # Swagger UI
    path(r'swagger(<format>\.json|\.yaml)', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]
