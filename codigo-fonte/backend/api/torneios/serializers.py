from rest_framework import serializers

from .models import Torneio, Inscricao, Rodada, Mesa, MesaJogador


# Os serializers são responsáveis por converter os objetos do Django (models)
# em formatos que podem ser transmitidos pela web, como JSON.
# Eles também fazem o caminho inverso: validam e convertem JSON em objetos.

class TorneioSerializer(serializers.ModelSerializer):
    """Serializer para o modelo Torneio."""

    class Meta:
        model = Torneio
        fields = '__all__'


class InscricaoSerializer(serializers.ModelSerializer):
    """Serializer para o modelo Inscricao."""

    class Meta:
        model = Inscricao
        fields = '__all__'


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