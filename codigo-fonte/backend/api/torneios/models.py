from django.conf import settings
from django.db import models


# É a melhor prática usar 'settings.AUTH_USER_MODEL' para referenciar
# o modelo de usuário do projeto. Isso torna o app mais reutilizável.

class Torneio(models.Model):
    """
    Armazena as informações principais de um torneio.
    Cada torneio é criado e gerenciado por um usuário do tipo 'LOJA'.
    """
    id_loja = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='torneios_criados',
        help_text="Usuário (loja) que criou o torneio."
    )
    nome = models.CharField(max_length=255)
    status = models.CharField(max_length=50, default='Aberto', help_text="Ex: Aberto, Em Andamento, Finalizado")
    pontuacao_vitoria = models.IntegerField(default=3)
    pontuacao_empate = models.IntegerField(default=1)
    pontuacao_derrota = models.IntegerField(default=0)
    pontuacao_bye = models.IntegerField(default=3)
    quantidade_rodadas = models.IntegerField()
    data_inicio = models.DateTimeField(auto_now_add=True)
    data_fim = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.nome


class Inscricao(models.Model):
    """
    Representa a inscrição de um usuário em um torneio.
    """
    id_usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='inscricoes')
    id_torneio = models.ForeignKey(Torneio, on_delete=models.CASCADE, related_name='inscritos')
    decklist = models.TextField(blank=True, help_text="Lista de cartas do deck do jogador.")
    status = models.CharField(max_length=50, default='Inscrito')
    data_inscricao = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('id_usuario', 'id_torneio')

    def __str__(self):
        return f'{self.id_usuario.username} no {self.id_torneio.nome}'


class Rodada(models.Model):
    """
    Armazena os dados de uma rodada específica de um torneio.
    """
    id_torneio = models.ForeignKey(Torneio, on_delete=models.CASCADE, related_name='rodadas')
    numero_rodada = models.IntegerField()
    status = models.CharField(max_length=50, default='Pendente', help_text="Ex: Pendente, Em Andamento, Finalizada")

    class Meta:
        unique_together = ('id_torneio', 'numero_rodada')

    def __str__(self):
        return f'Rodada {self.numero_rodada} do {self.id_torneio.nome}'


class Mesa(models.Model):
    """
    Representa uma mesa de jogo em uma determinada rodada.
    """
    id_rodada = models.ForeignKey(Rodada, on_delete=models.CASCADE, related_name='mesas')
    numero_mesa = models.IntegerField()
    time_vencedor = models.IntegerField(null=True, blank=True, help_text="1=Time 1, 2=Time 2, 0=Empate")
    pontuacao_time_1 = models.IntegerField(default=0, help_text="Placar do time 1 (ex: 2 vitórias parciais)")
    pontuacao_time_2 = models.IntegerField(default=0, help_text="Placar do time 2 (ex: 1 vitória parcial)")

    def __str__(self):
        return f'Mesa {self.numero_mesa} da {self.id_rodada}'


class MesaJogador(models.Model):
    """
    Tabela de ligação que aloca um jogador a uma mesa e a um time.
    Esta é a peça central para saber quem jogou com quem e contra quem.
    """
    id_mesa = models.ForeignKey(Mesa, on_delete=models.CASCADE, related_name='jogadores_na_mesa')
    id_usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    time = models.IntegerField(help_text="1 ou 2, para definir a equipe do jogador na mesa.")

    class Meta:
        unique_together = ('id_mesa', 'id_usuario')

    def __str__(self):
        return f'{self.id_usuario.username} na {self.id_mesa} (Time {self.time})'
