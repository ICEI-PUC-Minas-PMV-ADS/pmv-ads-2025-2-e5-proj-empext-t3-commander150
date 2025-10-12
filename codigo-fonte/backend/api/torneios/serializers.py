from rest_framework import serializers
from django.utils import timezone

from .models import Torneio, Inscricao, Rodada, Mesa, MesaJogador


# Os serializers são responsáveis por converter os objetos do Django (models)
# em formatos que podem ser transmitidos pela web, como JSON.
# Eles também fazem o caminho inverso: validam e convertem JSON em objetos.

class TorneioSerializer(serializers.ModelSerializer):
    """Serializer para o modelo Torneio."""
    # Campos da loja para exibição
    loja_nome = serializers.CharField(source='id_loja.username', read_only=True)
    loja_email = serializers.CharField(source='id_loja.email', read_only=True)
    loja_tipo = serializers.CharField(source='id_loja.tipo', read_only=True)

    class Meta:
        model = Torneio
        fields = '__all__'


class InscricaoSerializer(serializers.ModelSerializer):
    """
    Serializer padrão para modelo Inscricao.
    Usado para operações de leitura e atualização.
    Inclui informações do usuário e do torneio.
    """
    username = serializers.CharField(source='id_usuario.username', read_only=True)
    email = serializers.CharField(source='id_usuario.email', read_only=True)
    nome_torneio = serializers.CharField(source='id_torneio.nome', read_only=True)

    class Meta:
        model = Inscricao
        fields = ['id', 'id_usuario', 'username', 'email', 'id_torneio', 'nome_torneio', 
                 'decklist', 'status', 'data_inscricao']
        read_only_fields = ['id', 'data_inscricao']

    def validate(self, data):
        """
        Validações gerais para atualização de inscrição:
        - Verifica se o torneio não está em rodada ativa
        """
        if self.instance:  # Validação apenas para atualização
            rodada_ativa = Rodada.objects.filter(
                id_torneio_id=self.instance.id_torneio_id,
                status='Em Andamento'
            ).exists()
            
            if rodada_ativa:
                raise serializers.ValidationError(
                    "Não é possível alterar inscrição durante uma rodada ativa."
                )
        
        return data


class InscricaoCreateSerializer(serializers.ModelSerializer):
    """
    Serializer específico para criação de inscrições por jogadores.
    Campos reduzidos e validações específicas para jogadores.
    """
    class Meta:
        model = Inscricao
        fields = ['id_torneio', 'decklist']
    
    def validate_id_torneio(self, value):
        """
        Validações específicas para torneio:
        - Torneio deve existir e estar aberto
        - Jogador não pode estar já inscrito
        - Data de início não pode ser posterior ao momento atual
        - Respeita limite de vagas quando aplicável
        """
        if not value:
            raise serializers.ValidationError("Torneio é obrigatório.")
        
        if value.status != 'Aberto':
            raise serializers.ValidationError(
                f"Jogadores só podem se inscrever em torneios abertos. Status atual: {value.status}"
            )

        # Verifica se o usuário já está inscrito
        if Inscricao.objects.filter(
            id_usuario=self.context['request'].user,
            id_torneio=value
        ).exists():
            raise serializers.ValidationError("Você já está inscrito neste torneio.")
        
        # Bloqueia inscrição se a data de início for posterior ao momento atual
        agora = timezone.now()
        if value.data_inicio and value.data_inicio > agora:
            raise serializers.ValidationError(
                "Não é possível se inscrever: a data de início do torneio ainda não chegou."
            )
        
        # Verifica limite de vagas quando aplicável
        if value.vagas_limitadas and value.qnt_vagas is not None:
            total_inscritos = Inscricao.objects.filter(id_torneio=value).count()
            if total_inscritos >= value.qnt_vagas:
                raise serializers.ValidationError(
                    f"Limite de vagas atingido. Este torneio aceita apenas {value.qnt_vagas} jogadores."
                )
        
        return value


class InscricaoLojaSerializer(serializers.ModelSerializer):
    """
    Serializer para loja/admin gerenciar inscrições.
    Inclui campos adicionais e validações específicas para gestão.
    """
    username = serializers.CharField(source='id_usuario.username', read_only=True)
    email = serializers.CharField(source='id_usuario.email', read_only=True)
    
    class Meta:
        model = Inscricao
        fields = ['id', 'id_usuario', 'username', 'email', 'id_torneio', 
                 'decklist', 'status', 'data_inscricao']
        read_only_fields = ['id', 'data_inscricao']
    
    def validate(self, data):
        """
        Validações para criação/atualização por loja/admin:
        - Usuário deve ser jogador
        - Torneio deve pertencer à loja (exceto admin)
        - Validações de status do torneio
        - Verificação de rodada ativa para atualizações
        """
        user = self.context['request'].user
        usuario = data.get('id_usuario')
        torneio = data.get('id_torneio')

        # Validação de tipo de usuário
        if usuario and usuario.tipo != 'JOGADOR':
            raise serializers.ValidationError(
                "Apenas jogadores podem ser inscritos em torneios."
            )

        # Validações específicas para loja (admin ignora estas validações)
        if user.tipo != 'ADMIN':
            if torneio.id_loja != user:
                raise serializers.ValidationError(
                    "Você só pode gerenciar inscrições dos seus próprios torneios."
                )
            
            if torneio.status not in ['Aberto', 'Em Andamento']:
                raise serializers.ValidationError(
                    f"Lojas só podem inscrever jogadores em torneios abertos ou em andamento. Status atual: {torneio.status}"
                )

        # Validação de rodada ativa para atualizações
        if self.instance:
            rodada_ativa = Rodada.objects.filter(
                id_torneio_id=self.instance.id_torneio_id,
                status='Em Andamento'
            ).exists()
            
            if rodada_ativa:
                raise serializers.ValidationError(
                    "Não é possível alterar inscrição durante uma rodada ativa."
                )
        
        # Validações adicionais para criação de novas inscrições
        if not self.instance and torneio:
            # Bloqueia inscrição se a data de início for posterior ao momento atual
            agora = timezone.now()
            if torneio.data_inicio and torneio.data_inicio > agora:
                raise serializers.ValidationError(
                    "Não é possível inscrever jogadores: a data de início do torneio ainda não chegou."
                )
            
            # Verifica limite de vagas quando aplicável
            if torneio.vagas_limitadas and torneio.qnt_vagas is not None:
                total_inscritos = Inscricao.objects.filter(id_torneio=torneio).count()
                if total_inscritos >= torneio.qnt_vagas:
                    raise serializers.ValidationError(
                        f"Limite de vagas atingido. Este torneio aceita apenas {torneio.qnt_vagas} jogadores."
                    )
        
        return data


class RodadaSerializer(serializers.ModelSerializer):
    """Serializer para o modelo Rodada."""

    class Meta:
        model = Rodada
        fields = '__all__'


class MesaSerializer(serializers.ModelSerializer):
    """Serializer para o modelo Mesa."""

    class Meta:
        model = Mesa
        fields = '__all__'


class MesaJogadorSerializer(serializers.ModelSerializer):
    """Serializer para jogadores na mesa com informações do usuário"""
    username = serializers.CharField(source='id_usuario.username', read_only=True)
    email = serializers.CharField(source='id_usuario.email', read_only=True)

    class Meta:
        model = MesaJogador
        fields = ['id', 'id_usuario', 'username', 'email', 'time']


class MesaDetailSerializer(serializers.ModelSerializer):
    """Serializer detalhado para mesas com jogadores e informações completas"""
    jogadores = MesaJogadorSerializer(source='jogadores_na_mesa', many=True, read_only=True)
    numero_rodada = serializers.IntegerField(source='id_rodada.numero_rodada', read_only=True)
    nome_torneio = serializers.CharField(source='id_rodada.id_torneio.nome', read_only=True)

    class Meta:
        model = Mesa
        fields = [
            'id', 'id_rodada', 'numero_rodada', 'nome_torneio',
            'numero_mesa', 'time_vencedor', 'pontuacao_time_1',
            'pontuacao_time_2', 'jogadores'
        ]

class ReportarResultadoSerializer(serializers.Serializer):
    """Serializer para reportar resultados de partida"""
    pontuacao_time_1 = serializers.IntegerField(min_value=0)
    pontuacao_time_2 = serializers.IntegerField(min_value=0)
    time_vencedor = serializers.IntegerField(
        min_value=0,
        max_value=2,
        help_text="0=Empate, 1=Time 1, 2=Time 2"
    )

    def validate(self, data):
        if data['time_vencedor'] == 1 and data['pontuacao_time_1'] <= data['pontuacao_time_2']:
            raise serializers.ValidationError(
                "Time 1 não pode ser o vencedor com pontuação menor ou igual ao Time 2"
            )
        if data['time_vencedor'] == 2 and data['pontuacao_time_2'] <= data['pontuacao_time_1']:
            raise serializers.ValidationError(
                "Time 2 não pode ser o vencedor com pontuação menor ou igual ao Time 1"
            )
        if data['time_vencedor'] == 0 and data['pontuacao_time_1'] != data['pontuacao_time_2']:
            raise serializers.ValidationError(
                "Para empate, as pontuações devem ser iguais"
            )
        return data

class EditarJogadoresMesaSerializer(serializers.Serializer):
    """Serializer para editar jogadores de uma mesa"""
    jogadores = serializers.ListField(
        child=serializers.DictField(),
        help_text="Lista de jogadores: [{'id_usuario': 1, 'time': 1}, {...}]"
    )

    def validate_jogadores(self, value):
        """Valida se os jogadores têm a estrutura correta"""
        for jogador in value:
            if 'id_usuario' not in jogador or 'time' not in jogador:
                raise serializers.ValidationError(
                    "Cada jogador deve ter 'id_usuario' e 'time'"
                )
            if jogador['time'] not in [1, 2]:
                raise serializers.ValidationError(
                    "Time deve ser 1 ou 2"
                )
        return value


class VisualizacaoMesaJogadorSerializer(serializers.ModelSerializer):
    """Serializer para visualização da mesa no formato 2x2"""
    id_torneio = serializers.IntegerField(source='id_rodada.id_torneio.id', read_only=True)
    nome_torneio = serializers.CharField(source='id_rodada.id_torneio.nome', read_only=True)
    numero_rodada = serializers.IntegerField(source='id_rodada.numero_rodada', read_only=True)
    status_rodada = serializers.CharField(source='id_rodada.status', read_only=True)

    # Times com 2 jogadores cada 
    time_1 = serializers.SerializerMethodField()
    time_2 = serializers.SerializerMethodField()

    class Meta:
        model = Mesa
        fields = [
            'id', 'numero_mesa', 'id_torneio', 'nome_torneio',
            'numero_rodada', 'status_rodada', 'pontuacao_time_1',
            'pontuacao_time_2', 'time_vencedor', 'time_1', 'time_2'
        ]

    def get_time_1(self, obj):
        """Retorna os 2 jogadores do time 1"""
        jogadores_time_1 = obj.jogadores_na_mesa.filter(time=1).order_by('id')
        return MesaJogadorSerializer(jogadores_time_1, many=True).data

    def get_time_2(self, obj):
        """Retorna os 2 jogadores do time 2"""
        jogadores_time_2 = obj.jogadores_na_mesa.filter(time=2).order_by('id')
        return MesaJogadorSerializer(jogadores_time_2, many=True).data


# Serializers para respostas padrão


class InscricaoResponseSerializer(serializers.Serializer):
    """Response padrão para operações de inscrição"""
    message = serializers.CharField(help_text="Mensagem de sucesso")
    inscricao = InscricaoSerializer(required=False, help_text="Dados da inscrição")


class DesinscricaoResponseSerializer(serializers.Serializer):
    """Response para desinscrição"""
    message = serializers.CharField(help_text="Mensagem de sucesso")


class ListaInscricoesResponseSerializer(serializers.Serializer):
    """Response para lista de inscrições de um torneio"""
    torneio = TorneioSerializer(help_text="Dados do torneio")
    inscricoes = InscricaoSerializer(many=True, help_text="Lista de inscrições")
    total_inscritos = serializers.IntegerField(help_text="Total de jogadores inscritos")