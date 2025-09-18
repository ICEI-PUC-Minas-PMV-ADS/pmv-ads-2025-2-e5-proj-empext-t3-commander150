from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from drf_yasg.utils import swagger_auto_schema

from .models import Torneio, Inscricao, Rodada, Mesa, MesaJogador
from .permissoes import IsLojaOuAdmin, IsApenasLeitura, IsJogadorNaMesa
from .serializers import (
    TorneioSerializer, InscricaoSerializer, InscricaoCreateSerializer, InscricaoLojaSerializer, RodadaSerializer,
    MesaSerializer, MesaDetailSerializer, ReportarResultadoSerializer,
    MesaJogadorSerializer, EditarJogadoresMesaSerializer, VisualizacaoMesaJogadorSerializer,
    DesinscreverPayloadSerializer, GerenciarInscricaoPayloadSerializer, RemoverInscricaoPayloadSerializer,
    InscricaoResponseSerializer, DesinscricaoResponseSerializer, ListaInscricoesResponseSerializer
)


# ViewSets fornecem uma implementação completa de CRUD (Create, Retrieve, Update, Destroy)
# com pouco código. A lógica de permissão define quem pode fazer o quê em cada endpoint.


class TorneioViewSet(viewsets.ModelViewSet):
    """
    Endpoint da API para gerenciamento de torneios.

    Regras de acesso:
    - GET: Qualquer usuário pode visualizar
    - POST, PUT, DELETE: Apenas Lojas e Admins são permitidos
    """
    queryset = Torneio.objects.all()
    serializer_class = TorneioSerializer
    http_method_names = ['get', 'post', 'put', 'delete', 'head', 'options']
    permission_classes = [IsLojaOuAdmin | IsApenasLeitura]

    def get_queryset(self):
        """
        Retorna lista de torneios com filtros apropriados.
        - Admins: Veem todos os torneios
        - Lojas: Veem apenas seus próprios torneios
        - Outros: Veem todos (somente leitura)
        """
        if self.request.user.is_authenticated and self.request.user.tipo == 'LOJA':
            return Torneio.objects.filter(id_loja=self.request.user)
        return Torneio.objects.all()

    def post(self, serializer):
        """
        Ao criar torneio, define a loja automaticamente se for usuário tipo LOJA.
        Admins podem especificar a loja manualmente.
        """
        if self.request.user.tipo == 'LOJA':
            serializer.save(id_loja=self.request.user)
        else:
            serializer.save()

    def get_object(self):
        """
        Retorna um torneio específico após verificar permissões.
        Diferencia entre 404 (não existe) e 403 (sem permissão).
        """
        obj = super().get_object()
        if self.request.method not in permissions.SAFE_METHODS:
            self.check_object_permissions(self.request, obj)
        return obj


class InscricaoViewSet(viewsets.ModelViewSet):
    """
    Endpoint da API para gerenciamento de inscrições em torneios.

    Regras de acesso:
    - GET (list/retrieve): 
        • Jogadores: Veem apenas suas próprias inscrições
        • Lojas: Veem inscrições dos seus torneios
        • Admins: Veem todas as inscrições
    - POST (create): 
        • Jogadores: Podem se inscrever em torneios abertos
        • Lojas/Admins: Podem inscrever jogadores em seus torneios
    - PUT (update):
        • Jogadores: Podem atualizar suas próprias inscrições
        • Lojas: Podem atualizar inscrições de seus torneios
        • Admins: Podem atualizar qualquer inscrição
    - DELETE (destroy):
        • Jogadores: Podem remover suas próprias inscrições
        • Lojas: Podem remover inscrições de seus torneios
        • Admins: Podem remover qualquer inscrição
    """
    queryset = Inscricao.objects.all()
    serializer_class = InscricaoSerializer
    http_method_names = ['get', 'post', 'put', 'delete', 'head', 'options']  # remove patch
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Filtra as inscrições visíveis baseado no tipo do usuário.
        """
        user = self.request.user
        
        if user.tipo == 'ADMIN':
            return Inscricao.objects.all()
        elif user.tipo == 'LOJA':
            return Inscricao.objects.filter(id_torneio__id_loja=user)
        return Inscricao.objects.filter(id_usuario=user)
    
    def get_serializer_class(self):
        """
        Define serializer baseado na ação e tipo de usuário:
        - Create: InscricaoCreateSerializer (jogador) ou InscricaoLojaSerializer (loja/admin)
        - Outras ações: InscricaoSerializer padrão
        """
        if self.action == 'create':
            return InscricaoCreateSerializer if self.request.user.tipo == 'JOGADOR' else InscricaoLojaSerializer
        return InscricaoSerializer
    
    @swagger_auto_schema(
        request_body=InscricaoCreateSerializer,
        responses={
            201: InscricaoResponseSerializer,
            400: 'Erro de validação'
        },
        operation_summary="Criar inscrição em torneio",
        operation_description="Permite que jogadores se inscrevam em torneios abertos ou que lojas/admins inscrevam jogadores."
    )
    def perform_create(self, serializer):
        """
        Define o usuário da inscrição antes de salvar:
        - Para jogadores: usa o próprio usuário
        - Para loja/admin: usa o usuário especificado no payload
        """
        if self.request.user.tipo == 'JOGADOR':
            serializer.save(id_usuario=self.request.user)
        else:
            serializer.save()

    def create(self, request, *args, **kwargs):
        """
        Cria uma nova inscrição e retorna resposta padronizada.
        """
        response = super().create(request, *args, **kwargs)
        return Response({
            'message': 'Inscrição realizada com sucesso',
            'inscricao': response.data
        }, status=status.HTTP_201_CREATED)

    # Removidas implementações de put e delete pois a validação de rodada ativa
    # já está implementada no serializer InscricaoSerializer
    
    
class RodadaViewSet(viewsets.ModelViewSet):
    """
    Endpoint para visualizar e gerenciar as rodadas de um torneio.
    """
    queryset = Rodada.objects.all()
    serializer_class = RodadaSerializer
    permission_classes = [IsLojaOuAdmin | IsApenasLeitura]

    @action(detail=True, methods=['get'])
    def mesas(self, request, pk=None):
        """Retorna todas as mesas de uma rodada específica"""
        rodada = self.get_object()
        mesas = Mesa.objects.filter(id_rodada=rodada).order_by('numero_mesa')
        serializer = MesaDetailSerializer(mesas, many=True)
        return Response(serializer.data)

    def get_queryset(self):
        """
        Filtra as rodadas por torneio se o parâmetro for fornecido
        """
        queryset = Rodada.objects.all()
        torneio_id = self.request.query_params.get('torneio_id')

        if torneio_id:
            queryset = queryset.filter(id_torneio_id=torneio_id)

        return queryset.order_by('numero_rodada')


class MesaViewSet(viewsets.ModelViewSet):
    """
    Endpoint para visualizar e gerenciar as mesas de uma rodada.
    """
    queryset = Mesa.objects.all()
    serializer_class = MesaSerializer
    permission_classes = [IsLojaOuAdmin | IsApenasLeitura]

    def get_serializer_class(self):
        """Usa serializer detalhado para retrieve e list"""
        if self.action in ['retrieve', 'list']:
            return MesaDetailSerializer
        return MesaSerializer

    @action(detail=True, methods=['post'], permission_classes=[IsJogadorNaMesa])
    def reportar_resultado(self, request, pk=None):
        """Permite que jogadores reportem resultados da partida"""
        mesa = self.get_object()
        serializer = ReportarResultadoSerializer(data=request.data)

        if serializer.is_valid():
            mesa.pontuacao_time_1 = serializer.validated_data['pontuacao_time_1']
            mesa.pontuacao_time_2 = serializer.validated_data['pontuacao_time_2']
            mesa.time_vencedor = serializer.validated_data['time_vencedor']
            mesa.save()

            return Response({
                'message': 'Resultado reportado com sucesso',
                'mesa': MesaDetailSerializer(mesa).data
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'], permission_classes=[IsLojaOuAdmin])
    def editar_manual(self, request, pk=None):
        """Permite que lojas editem manualmente a mesa"""
        mesa = self.get_object()
        serializer = MesaSerializer(mesa, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Mesa editada manualmente com sucesso',
                'mesa': MesaDetailSerializer(mesa).data
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'],
            permission_classes=[IsLojaOuAdmin])
    def editar_jogadores(self, request, pk=None):
        """Permite que lojas editem os jogadores da mesa"""
        mesa = self.get_object()
        serializer = EditarJogadoresMesaSerializer(data=request.data)

        if serializer.is_valid():
            # Remove jogadores atuais
            MesaJogador.objects.filter(id_mesa=mesa).delete()

            # Adiciona novos jogadores
            for jogador_data in serializer.validated_data['jogadores']:
                MesaJogador.objects.create(
                    id_mesa=mesa,
                    id_usuario_id=jogador_data['id_usuario'],
                    time=jogador_data['time']
                )

            return Response({
                'message': 'Jogadores da mesa atualizados com sucesso',
                'mesa': MesaDetailSerializer(mesa).data
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'],
            permission_classes=[permissions.IsAuthenticated])
    def minha_mesa_na_rodada(self, request):
        """
        Endpoint para o jogador visualizar a mesa em que está inserido
        em uma rodada específica
        """
        rodada_id = request.query_params.get('rodada_id')

        if not rodada_id:
            return Response(
                {"error": "Parâmetro 'rodada_id' é obrigatório"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Encontra a mesa da RODADA ESPECÍFICA onde o jogador está
        try:
            mesa_jogador = MesaJogador.objects.select_related(
                'id_mesa__id_rodada__id_torneio',
                'id_mesa__id_rodada'
            ).get(
                id_usuario=request.user,
                id_mesa__id_rodada_id=rodada_id  # Busca pela rodada específica
            )
        except MesaJogador.DoesNotExist:
            return Response(
                {"error": "Jogador não está em nenhuma mesa desta rodada"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = VisualizacaoMesaJogadorSerializer(mesa_jogador.id_mesa)
        response_data = serializer.data
        response_data['meu_time'] = mesa_jogador.time  # Adiciona em qual time o jogador está

        return Response(response_data)