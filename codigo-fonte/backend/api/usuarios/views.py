from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.crypto import get_random_string
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from drf_yasg.utils import swagger_auto_schema
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK, HTTP_401_UNAUTHORIZED, HTTP_400_BAD_REQUEST, HTTP_404_NOT_FOUND
from rest_framework.views import APIView

from torneios.permissoes import IsOwnerOrAdmin
from .authentication import SessionAuthenticationSemCSRF
from .models import Usuario
from .serializers import (RequisitarTrocaSenhaSerializer, ValidarTokenRedefinirSenhaSerializer,
                          UsuarioSerializer, UsuarioCreateSerializer, AlterarSenhaSerializer, LoginSerializer)


class LoginView(APIView):
    """
    Endpoint para realizar o login na aplicação.
    """
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        request_body=LoginSerializer,
        responses={200: UsuarioSerializer(many=False)}
    )
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({"error": "Email e senha são obrigatórios"}, status=HTTP_400_BAD_REQUEST)

        usuario = authenticate(request, username=email, password=password)

        if not usuario:
            return Response({"error": "Credenciais inválidas"}, status=HTTP_401_UNAUTHORIZED)

        if not usuario.is_active:
            return Response({"error": "Usuário inativo"}, status=HTTP_401_UNAUTHORIZED)

        login(request, usuario)

        return Response({
            "message": "Login realizado com sucesso",
            "sessionid": request.session.session_key,
            "dados": UsuarioSerializer(usuario).data
        }, status=HTTP_200_OK)


class LogoutView(APIView):
    """
    Endpoint para realizar o logout na aplicação.
    """
    authentication_classes = [SessionAuthenticationSemCSRF]
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        responses={200: 'Logout realizado com sucesso'}
    )
    def post(self, request):
        session_id = request.session.session_key

        logout(request)

        return Response({
            "message": "Logout realizado com sucesso",
            "sessionid_anterior": session_id
        }, status=HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class ValidarSessaoView(APIView):
    """
    Endpoint para validar sessão.

    Retorna os dados do usuário autenticado via sessão.
    O frontend usa este endpoint para verificar se o usuário já está logado
    quando a aplicação é carregada.
    A permissão IsAuthenticated já garante que, se esta view for
    # acessada com sucesso, o request.user é um usuário válido.
    """
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        responses={200: UsuarioSerializer(many=False)}
    )
    def get(self, request):
        """
        Retorna os dados serializados do usuário logado (request.user).
        """
        serializer = UsuarioSerializer(request.user)
        return Response(serializer.data, status=HTTP_200_OK)


class RequisitarTrocaSenhaView(APIView):
    """
    Endpoint para requisitar o Token.

    Em caso de sucesso, envia o Token de Recuperação de Senha para o email do usuário.
    """
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        request_body=RequisitarTrocaSenhaSerializer,
        responses={200: 'Token enviado com sucesso'}
    )
    def post(self, request):
        serializer = RequisitarTrocaSenhaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        usuario = Usuario.objects.get(email=email)

        # Gerar token simples
        token = get_random_string(length=16)
        usuario.token_redefinir_senha = token
        usuario.save()

        # Renderizar o HTML do email
        email_html = render_to_string(
            'emails/token_redefinir_senha.html',
            {'token': token, 'nome': usuario.username}
        )

        # Fallback em texto puro
        email_texto_puro = f'Seu token para redefinição de senha é: {token}'

        # Configurar email com HTML
        email_msg = EmailMultiAlternatives(
            subject='Redefinição de senha - Commander150',
            body=email_texto_puro,
            from_email=settings.EMAIL_HOST_USER,
            to=[email],
        )
        email_msg.attach_alternative(email_html, "text/html")
        email_msg.send()

        return Response({"message": f"Token enviado para o email {email} com sucesso."}, status=HTTP_200_OK)


class ValidarTokenRedefinirSenhaView(APIView):
    """
        Endpoint para requisitar a Nova Senha

        Utilizado após estar em posse do Token.
        Em caso de sucesso, envia o a Nova Senha para o email do usuário.
        """
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        request_body=ValidarTokenRedefinirSenhaSerializer,
        responses={200: 'Senha redefinida com sucesso'}
    )
    def post(self, request):
        serializer = ValidarTokenRedefinirSenhaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        token = serializer.validated_data['token']

        usuario = Usuario.objects.get(email=email, token_redefinir_senha=token)

        # Gerar nova senha
        nova_senha = get_random_string(length=8)
        usuario.set_password(nova_senha)
        usuario.token_redefinir_senha = None  # Limpar o token após uso
        usuario.save()

        # Renderizar o HTML do email
        email_html = render_to_string('emails/sucesso_redefinir_senha.html',
                                      {'nova_senha': nova_senha, 'nome': usuario.username})
        email_texto_puro = f'Sua nova senha é: {nova_senha}. Recomendamos alterá-la assim que possível.'

        # Configurar email com HTML
        email_msg = EmailMultiAlternatives(
            subject='Sua nova senha - Commander150',
            body=email_texto_puro,
            from_email=settings.EMAIL_HOST_USER,
            to=[email],
        )
        email_msg.attach_alternative(email_html, "text/html")
        email_msg.send()

        return Response(
            {"message": f"Senha redefinida com sucesso. Verifique seu email {email} para obter a nova senha."},
            status=HTTP_200_OK)


class AlterarSenhaView(APIView):
    """
    Endpoint para alteração de senha.

    Regras:
    - Usuário deve estar autenticado
    - Só pode alterar própria senha (ou admin altera qualquer uma)
    - Recebe email, senha antiga e nova senha
    - Valida apenas se nova senha ≠ senha antiga
    """
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    @swagger_auto_schema(
        request_body=AlterarSenhaSerializer,
        responses={200: 'Senha alterada com sucesso', 400: 'Erro de validação', 404: 'Usuário não encontrado'}
    )
    def post(self, request, user_id):
        """
        Altera a senha do usuário especificado.
        """
        # Busca o usuário - se não existir, retorna 404
        try:
            usuario = Usuario.objects.get(id=user_id)
        except Usuario.DoesNotExist:
            return Response(
                {"error": "Usuário não encontrado."},
                status=HTTP_404_NOT_FOUND
            )

        # Verifica permissões (IsOwnerOrAdmin garante que é o próprio ou admin)
        self.check_object_permissions(request, usuario)

        # Valida dados
        serializer = AlterarSenhaSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=HTTP_400_BAD_REQUEST)

        # Verifica se a senha antiga está correta
        if not usuario.check_password(serializer.validated_data['senha_antiga']):
            return Response(
                {"error": "Senha antiga incorreta."},
                status=HTTP_400_BAD_REQUEST
            )

        # Altera a senha
        usuario.set_password(serializer.validated_data['nova_senha'])
        usuario.save()

        return Response({
            "message": "Senha alterada com sucesso."
        }, status=HTTP_200_OK)


class UsuariosViewSet(viewsets.ModelViewSet):
    """
    Endpoint da API para gerenciamento de usuários.

    Regras de acesso:
    - Cadastro (create): Público, qualquer um pode criar usuário
    - Listagem (list):
        • Admins: veem todos os usuários
        • Outros: veem apenas seu próprio perfil na lista
    - Detalhes/Edição (retrieve/update/delete):
        • Acesso ao objeto é controlado pela permissão IsOwnerOrAdmin
        • Retorna 403 Forbidden se usuário não for owner ou admin
        • Retorna 404 Not Found se objeto não existir
    """
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

    def get_queryset(self):
        """
        Filtra os usuários visíveis baseado no tipo do usuário logado.
        IMPORTANTE: Para ações de listagem apenas, não afeta retrieve/update/delete.
        """
        user = self.request.user

        if not user.is_authenticated:
            return Usuario.objects.none()

        # Para ação de listagem, aplicamos filtro
        if self.action == 'list':
            if user.tipo == 'ADMIN':
                return Usuario.objects.all()
            return Usuario.objects.filter(id=user.id)

        # Para outras ações (retrieve/update/delete), retornamos todos
        # para que as permissões object-level possam ser verificadas
        return Usuario.objects.all()

    def get_object(self):
        """
        Obtém um usuário específico diferenciando entre:
        - 404 Not Found: Quando o usuário não existe
        - 403 Forbidden: Quando existe mas o usuário logado não tem permissão
        """
        try:
            # Busca o objeto normalmente a partir do queryset completo
            obj = super().get_object()

            # Verifica permissões no objeto - levanta 403 automaticamente se falhar
            self.check_object_permissions(self.request, obj)

            return obj

        except Usuario.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("Usuário não encontrado.")

    def get_serializer_class(self):
        """
        Define qual serializer usar baseado na ação:
        - Create: UsuarioCreateSerializer (com campo password)
        - Outras: UsuarioSerializer (sem password)
        """
        return UsuarioCreateSerializer if self.action == 'create' else UsuarioSerializer

    def get_permissions(self):
        """
        Configura as permissões para cada tipo de ação:
        - Create: Livre acesso (AllowAny)
        - Ações individuais: Requer autenticação + ser dono ou admin
        - Listagem: Apenas autenticação (filtro é feito no get_queryset)
        """
        if self.action == 'create':
            return [AllowAny()]
        elif self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsOwnerOrAdmin()]
        else:
            return [IsAuthenticated()]
