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
    nome = models.CharField(max_length=255, help_text="Nome do torneio")
    descricao = models.TextField(blank=True, null=True, help_text="Descrição detalhada do torneio")
    status = models.CharField(max_length=50, default='Aberto', help_text="Ex: Aberto, Em Andamento, Finalizado")
    regras = models.TextField(help_text="Regras específicas do torneio")
    banner = models.ImageField(upload_to='torneios/banners/', blank=True, null=True, help_text="Banner do torneio")
    vagas_limitadas = models.BooleanField(default=True, help_text="Se o torneio tem limite de vagas")
    qnt_vagas = models.PositiveIntegerField(blank=True, null=True, help_text="Quantidade de vagas disponíveis")
    incricao_gratuita = models.BooleanField(default=True, help_text="Se a inscrição é gratuita")
    valor_incricao = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="Valor da inscrição em reais")
    pontuacao_vitoria = models.PositiveIntegerField(default=3, help_text="Pontos por vitória")
    pontuacao_derrota = models.PositiveIntegerField(default=0, help_text="Pontos por derrota")
    pontuacao_empate = models.PositiveIntegerField(default=1, help_text="Pontos por empate")
    pontuacao_bye = models.PositiveIntegerField(default=3, help_text="Pontos por bye")
    quantidade_rodadas = models.PositiveIntegerField(blank=True, null=True, help_text="Quantidade de rodadas do torneio")
    data_inicio = models.DateTimeField(help_text="Data e hora de início do torneio")

    def __str__(self):
        return self.nome


class Inscricao(models.Model):
    """
    Representa a inscrição de um usuário em um torneio.
    """
    id_usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='inscricoes')
    id_torneio = models.ForeignKey(Torneio, on_delete=models.CASCADE, related_name='inscritos')
    decklist = models.TextField(blank=True, help_text="Lista de cartas do deck do jogador.")
    status = models.CharField(max_length=50, default='Inscrito', help_text="'Inscrito', 'Cancelado', ou 'Inativo'")
    data_inscricao = models.DateTimeField(auto_now_add=True, help_text="Data da primeira inscrição")
    data_saida = models.DateTimeField(null=True, blank=True, help_text="Data em que saiu ou foi removido")

    class Meta:
        unique_together = ('id_usuario', 'id_torneio')

    def __str__(self):
        return f'{self.id_usuario.username} no {self.id_torneio.nome}'

    def esta_ativo_na_data(self, data_referencia):
        """
        Verifica se a inscrição estava ativa em uma determinada data.
        Ativa se: não foi cancelada OU foi cancelada depois da data de referência.
        """
        if self.status == 'Cancelado':
            return self.data_saida is None or self.data_saida > data_referencia
        return self.data_inscricao <= data_referencia


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
        indexes = [
            models.Index(fields=['id_usuario', 'id_mesa'], name='jogador_mesa_idx'),
        ]

    def __str__(self):
        return f'{self.id_usuario.username} na {self.id_mesa} (Time {self.time})'


class RankingParcial(models.Model):
    """
    Cache de métricas de ranking calculadas após cada rodada.
    Armazena o ranking parcial de um jogador até uma rodada específica.
    """
    id_torneio = models.ForeignKey(Torneio, on_delete=models.CASCADE, related_name='rankings_parciais')
    id_usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='rankings')
    rodada_numero = models.IntegerField(help_text="Até qual rodada foi calculado")

    # Métricas calculadas
    pontos_totais = models.IntegerField(default=0, help_text="Pontos totais acumulados até a rodada")
    mw_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        help_text="Match Win Percentage (floor 33%)"
    )
    omw_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        help_text="Opponent Match Win Percentage - força dos oponentes"
    )
    pmw_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        help_text="Partner Match Win Percentage - força dos parceiros"
    )
    balanco = models.DecimalField(
        max_digits=6,
        decimal_places=4,
        help_text="OMW% - PMW% (pode ser negativo)"
    )

    posicao = models.IntegerField(help_text="Posição no ranking nesta rodada")

    # Metadados
    data_calculo = models.DateTimeField(auto_now=True, help_text="Data do último cálculo")

    class Meta:
        unique_together = ('id_torneio', 'id_usuario', 'rodada_numero')
        ordering = ['id_torneio', 'rodada_numero', 'posicao']
        indexes = [
            models.Index(fields=['id_torneio', 'rodada_numero'], name='torneio_rodada_idx'),
            models.Index(fields=['id_torneio', 'rodada_numero', 'posicao'], name='ranking_lookup_idx'),
        ]

    def __str__(self):
        return f'{self.id_usuario.username} - {self.posicao}º (Rodada {self.rodada_numero} - {self.id_torneio.nome})'
