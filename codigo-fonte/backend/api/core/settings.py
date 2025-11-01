import os
from pathlib import Path

import environ

# Inicializa as variáveis de ambiente
env = environ.Env(
    DEBUG=(bool, False),
    SECRET_KEY=(str, 'default-secret-key'),
    DB_NAME=(str, 'commander150'),
    DB_USER=(str, 'postgres'),
    DB_PASSWORD=(str, 'password'),
    DB_HOST=(str, 'localhost'),
    EMAIL_PASSWORD=(str, None),
    EMAIL_USER=(str, None),
    CORS_ALLOWED_ORIGINS=(list, []),
    CSRF_TRUSTED_ORIGINS=(list, []),
    ALLOWED_HOSTS=(list, []),
)

# Carrega o arquivo .env, se ele existir
environ.Env.read_env()

# Caminho base do projeto
BASE_DIR = Path(__file__).resolve().parent.parent

# Configurações de segurança
SECRET_KEY = env('SECRET_KEY')
DEBUG = env('DEBUG')
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=[])

# Configuração do banco de dados
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('DB_NAME'),  # Nome do banco de dados
        'USER': env('DB_USER'),  # Usuário do PostgreSQL
        'PASSWORD': env('DB_PASSWORD'),  # Senha
        'HOST': env('DB_HOST'),  # Host
        'PORT': '5432',  # Porta padrão do PostgreSQL
    }
}

# Configuração do envio de emails
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = env('EMAIL_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_PASSWORD', default='')

# Configuração do CORS e CSRF
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[])
CORS_ALLOW_CREDENTIALS = True
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_HTTPONLY = False
CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS', default=[])

# Configurações de sessão
SESSION_COOKIE_PATH = '/api/v1/'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = True  # True em produção (HTTPS)
# Alterado o SESSION_COOKIE_SAMESITE para None, pois o Lax estava dando problemas por conta das origens
# das requisições. Já que estamos trabalhando com uma API e não um site, é aceitável.
SESSION_COOKIE_SAMESITE = 'None'
SESSION_COOKIE_AGE = 1209600  # 2 semanas em segundos (opcional)
SESSION_SAVE_EVERY_REQUEST = True  # Renova a sessão a cada request
SESSION_ENGINE = "django.contrib.sessions.backends.db"

# Configuração do modelo de usuário customizado
AUTH_USER_MODEL = 'usuarios.Usuario'

# Garantir que createsuperuser defina tipo=ADMIN
DJANGO_SUPERUSER_TIPO = 'ADMIN'

# Configuração do Django Rest Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "usuarios.authentication.SessionAuthenticationSemCSRF",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

# Aplicações instaladas
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'drf_yasg',
    'django_filters',
    'corsheaders',
    'torneios',
    'usuarios',
]

# Middlewares
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # Deve vir antes de CommonMiddleware
    'django.middleware.common.CommonMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Configuração de URLs
ROOT_URLCONF = 'core.urls'

# Configuração de templates
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# WSGI Application
WSGI_APPLICATION = 'core.wsgi.application'

# Validação de senha
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internacionalização
LANGUAGE_CODE = 'pt-BR'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True

# Configuração de arquivos estáticos
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Configuração do campo de ID padrão
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
