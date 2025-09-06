from rest_framework import serializers

from .models import Usuario


class UsuarioSerializer(serializers.ModelSerializer):
    """Serializer para o modelo Usuario."""

    class Meta:
        model = Usuario
        fields = ['id', 'email', 'username', 'tipo', 'status', 'date_joined']
        read_only_fields = ['id', 'date_joined']
