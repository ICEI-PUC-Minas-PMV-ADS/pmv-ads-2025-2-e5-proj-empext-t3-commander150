from django.contrib.auth import authenticate, login
from django.contrib.auth import logout
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK, HTTP_401_UNAUTHORIZED
from rest_framework.status import HTTP_400_BAD_REQUEST
from rest_framework.views import APIView

from usuarios.serializers import UsuarioSerializer


class LoginView(APIView):
    """
    Endpoint para realizar o login na aplicação.
    """
    permission_classes = [AllowAny]

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
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Armazena a session id para debug (opcional)
        session_id = request.session.session_key

        # Realiza o logout
        logout(request)

        return Response({
            "message": "Logout realizado com sucesso",
            "sessionid_anterior": session_id
        }, status=HTTP_200_OK)
