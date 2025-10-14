from rest_framework import serializers

from .models import Usuario


class UsuarioSerializer(serializers.ModelSerializer):
    """
    Serializer padrão para o modelo Usuario.
    Usado para exibir os dados dos usuários. O campo 'password' não é incluído
    para garantir que a senha nunca seja exposta em respostas da API.
    """

    class Meta:
        model = Usuario
        # Campos a serem exibidos. 'password' é omitido intencionalmente.
        fields = ['id', 'email', 'username', 'tipo', 'status', 'date_joined']
        read_only_fields = ['id', 'date_joined', 'tipo']


class UsuarioCreateSerializer(serializers.ModelSerializer):
    """
    Serializer específico para a CRIAÇÃO de novos usuários.
    Sua única finalidade é garantir que a senha seja tratada corretamente
    durante o processo de cadastro.
    """

    class Meta:
        model = Usuario
        # Campos necessários para o cadastro.
        fields = ['id', 'email', 'username', 'tipo', 'password']
        # 'password' como 'write_only' significa que NUNCA será retornado em uma resposta da API (leitura).
        extra_kwargs = {
            'password': {'write_only': True},
            'id': {'read_only': True}
        }

    def create(self, validated_data):
        """
        Sobrescreve o método de criação padrão do serializer.
        Esta é a parte crucial: em vez de usar o método genérico de criação,
        chamamos o 'create_user' do nosso modelo de Usuario. Este método
        foi projetado pelo Django para lidar com a criação de usuários,
        e o mais importante: ele aplica o HASH na senha antes de salvá-la
        no banco de dados.
        """
        usuario = Usuario.objects.create_user(**validated_data)
        return usuario


class RequisitarTrocaSenhaSerializer(serializers.Serializer):
    email = serializers.EmailField()
    def validate_email(self, value):
        if not Usuario.objects.filter(email=value).exists():
            raise serializers.ValidationError("Usuário com este email não foi encontrado.")
        return value


class ValidarTokenRedefinirSenhaSerializer(serializers.Serializer):
    email = serializers.EmailField()
    token = serializers.CharField(max_length=16)

    def validate(self, data):
        email = data.get('email')
        token = data.get('token')
        usuario = Usuario.objects.filter(email=email).first()

        if not usuario:
            raise serializers.ValidationError("Usuário com este email não foi encontrado.")

        if not usuario.token_redefinir_senha == token:
            raise serializers.ValidationError("Token inválido ou expirado.")

        return data


class AlterarSenhaSerializer(serializers.Serializer):
    """
    Serializer para alteração de senha.
    Apenas valida que a nova senha não seja igual à antiga.
    """
    senha_antiga = serializers.CharField(write_only=True)
    nova_senha = serializers.CharField(write_only=True)

    def validate(self, data):
        """
        Valida apenas se a nova senha é diferente da antiga.
        Todas as outras validações são feitas no frontend.
        """
        if data['senha_antiga'] == data['nova_senha']:
            raise serializers.ValidationError("A nova senha não pode ser igual à senha antiga.")
        return data


class LoginSerializer(serializers.Serializer):
    """
    Utilizado somente para a documentação do Swagger para automatizar os campos na documentação.
    """
    email = serializers.EmailField()
    password = serializers.CharField()