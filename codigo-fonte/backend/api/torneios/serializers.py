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
    """Serializer para o modelo MesaJogador."""

    class Meta:
        model = MesaJogador
        fields = '__all__'
