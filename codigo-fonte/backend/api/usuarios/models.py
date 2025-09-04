from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    """
    Modelo de usuário customizado que estende o usuário padrão do Django.

    Esta abordagem é a forma recomendada pelo Django para adicionar campos
    extras ao modelo de usuário, como o nosso campo 'tipo'. Ela cria uma única
    tabela no banco de dados para os usuários, evitando a complexidade de
    modelos de 'Profile' separados ou do sistema de Grupos do Django, que podem
    causar dores de cabeça com migrations.
    """

    class TipoUsuario(models.TextChoices):
        """
        Define as opções para o campo 'tipo' de usuário.
        Isso garante que apenas valores válidos possam ser salvos no banco.
        """
        JOGADOR = 'JOGADOR', 'Jogador'
        LOJA = 'LOJA', 'Loja'
        ADMIN = 'ADMIN', 'Admin'

    tipo = models.CharField(
        max_length=10,
        choices=TipoUsuario.choices,
        default=TipoUsuario.JOGADOR,
        help_text="Define o nível de permissão do usuário na plataforma."
    )

    status = models.CharField(
        max_length=100,
        default="ativo",
        help_text="Status do usuário (ex: ativo, inativo, banido)."
    )

    def __str__(self):
        """
        Define a representação em string do objeto, facilitando a
        visualização no painel de administração do Django.
        """
        return self.username
