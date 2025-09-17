from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from django.shortcuts import get_object_or_404
from django.db import transaction

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

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
    Endpoint da API que permite que torneios sejam visualizados ou editados.
    - Lojas/Admins: Podem criar, editar e deletar torneios.
    - Todos: Podem visualizar a lista de torneios.
    """
    queryset = Torneio.objects.all()
    serializer_class = TorneioSerializer
    permission_classes = [IsLojaOuAdmin | IsApenasLeitura]
    
    @action(detail=True, methods=['get'])
    @swagger_auto_schema(
        responses={
            200: ListaInscricoesResponseSerializer,
            403: 'Acesso negado'
        },
        operation_summary="Listar inscrições do torneio",
        operation_description="Retorna todas as inscrições de um torneio específico. Lojas veem apenas inscrições dos seus torneios, admins veem todas."
    )
    def inscricoes(self, request, pk=None):
        """
        Retorna todas as inscrições de um torneio específico.
        - Lojas: Veem apenas inscrições dos seus torneios
        - Admins: Veem inscrições de qualquer torneio
        - Outros: Não têm acesso
        """
        torneio = self.get_object()
        
        # Verifica permissões
        if request.user.tipo not in ['ADMIN', 'LOJA']:
            return Response(
                {"error": "Acesso negado"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Loja só vê inscrições dos seus torneios
        if request.user.tipo == 'LOJA' and torneio.id_loja != request.user:
            return Response(
                {"error": "Acesso negado"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        inscricoes = Inscricao.objects.filter(id_torneio=torneio).select_related('id_usuario')
        serializer = InscricaoSerializer(inscricoes, many=True)
        
        return Response({
            'torneio': TorneioSerializer(torneio).data,
            'inscricoes': serializer.data,
            'total_inscritos': inscricoes.count()
        }, status=status.HTTP_200_OK)


class InscricaoViewSet(viewsets.ModelViewSet):
    """
    Endpoint para gerenciar as inscrições nos torneios.
    - Jogadores: Podem se inscrever e desinscrever em torneios
    - Lojas/Admins: Podem gerenciar inscrições de jogadores
    """
    queryset = Inscricao.objects.all()
    serializer_class = InscricaoSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filtra as inscrições baseado no tipo de usuário."""
        user = self.request.user
        
        if user.tipo == 'ADMIN':
            return Inscricao.objects.all()
        elif user.tipo == 'LOJA':
            # Loja vê apenas inscrições dos seus torneios
            return Inscricao.objects.filter(id_torneio__id_loja=user)
        else:
            # Jogador vê apenas suas próprias inscrições
            return Inscricao.objects.filter(id_usuario=user)
    
    def get_serializer_class(self):
        """Define qual serializer usar baseado na ação e tipo de usuário."""
        if self.action == 'create':
            if self.request.user.tipo == 'JOGADOR':
                return InscricaoCreateSerializer
            else:
                return InscricaoLojaSerializer
        return InscricaoSerializer
    
    @swagger_auto_schema(
        request_body=InscricaoCreateSerializer,
        responses={
            201: InscricaoResponseSerializer,
            400: 'Erro de validação'
        },
        operation_summary="Inscrever-se em um torneio",
        operation_description="Permite que jogadores se inscrevam em torneios. Jogadores só podem se inscrever em torneios com status 'Aberto'."
    )
    def create(self, request, *args, **kwargs):
        """Cria uma nova inscrição."""
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        # Para jogadores, define automaticamente o usuário
        if request.user.tipo == 'JOGADOR':
            inscricao = serializer.save(id_usuario=request.user)
        else:
            inscricao = serializer.save()
        
        response_serializer = InscricaoSerializer(inscricao)
        return Response({
            'message': 'Inscrição realizada com sucesso',
            'inscricao': response_serializer.data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    @swagger_auto_schema(
        request_body=DesinscreverPayloadSerializer,
        responses={
            200: DesinscricaoResponseSerializer,
            400: 'Erro de validação - torneio_id obrigatório ou rodada ativa',
            404: 'Inscrição não encontrada'
        },
        operation_summary="Desinscrever-se de um torneio",
        operation_description="Permite que jogadores se desinscrevam de torneios. Não é possível desinscrever-se durante rodadas ativas, apenas entre rodadas."
    )
    def desinscrever(self, request):
        """
        Endpoint para jogador se desinscrever de um torneio.
        Permite desinscrição entre rodadas (não durante rodada ativa).
        Os pontos já conquistados permanecem no histórico do torneio.
        """
        torneio_id = request.data.get('torneio_id')
        
        if not torneio_id:
            return Response(
                {"error": "Parâmetro 'torneio_id' é obrigatório"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            inscricao = Inscricao.objects.get(
                id_usuario=request.user,
                id_torneio_id=torneio_id
            )
        except Inscricao.DoesNotExist:
            return Response(
                {"error": "Você não está inscrito neste torneio"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verifica se há alguma rodada em andamento (não permite desinscrição durante rodada ativa)
        rodada_ativa = Rodada.objects.filter(
            id_torneio_id=torneio_id,
            status='Em Andamento'
        ).exists()
        
        if rodada_ativa:
            return Response(
                {"error": "Não é possível se desinscrever durante uma rodada ativa. Aguarde o final da rodada."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Remove a inscrição - os pontos já conquistados permanecem no histórico
        inscricao.delete()
        
        return Response({
            "message": "Desinscrição realizada com sucesso. Seus pontos conquistados permanecem no histórico do torneio."
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'], permission_classes=[IsLojaOuAdmin])
    @swagger_auto_schema(
        request_body=GerenciarInscricaoPayloadSerializer,
        responses={
            200: InscricaoResponseSerializer,
            201: InscricaoResponseSerializer,
            400: 'Erro de validação'
        },
        operation_summary="Gerenciar inscrições de jogadores",
        operation_description="Permite que lojas e admins criem ou atualizem inscrições de jogadores. Lojas podem inscrever em torneios 'Aberto' ou 'Em Andamento'. Admins podem inscrever em qualquer status."
    )
    def gerenciar_inscricao(self, request):
        """
        Endpoint para loja/admins gerenciarem inscrições de jogadores.
        Pode criar ou atualizar inscrições.
        """
        serializer = InscricaoLojaSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        torneio = serializer.validated_data['id_torneio']
        usuario = serializer.validated_data['id_usuario']
        
        # Verifica se já existe inscrição
        inscricao_existente = Inscricao.objects.filter(
            id_usuario=usuario,
            id_torneio=torneio
        ).first()
        
        if inscricao_existente:
            # Atualiza inscrição existente
            inscricao_existente.decklist = serializer.validated_data.get('decklist', inscricao_existente.decklist)
            inscricao_existente.status = serializer.validated_data.get('status', inscricao_existente.status)
            inscricao_existente.save()
            
            response_serializer = InscricaoSerializer(inscricao_existente)
            return Response({
                'message': 'Inscrição atualizada com sucesso',
                'inscricao': response_serializer.data
            }, status=status.HTTP_200_OK)
        else:
            # Cria nova inscrição
            inscricao = serializer.save()
            response_serializer = InscricaoSerializer(inscricao)
            return Response({
                'message': 'Inscrição criada com sucesso',
                'inscricao': response_serializer.data
            }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'], permission_classes=[IsLojaOuAdmin])
    @swagger_auto_schema(
        request_body=RemoverInscricaoPayloadSerializer,
        responses={
            200: DesinscricaoResponseSerializer,
            400: 'Erro de validação - parâmetros obrigatórios ou rodada ativa',
            404: 'Inscrição não encontrada'
        },
        operation_summary="Remover inscrição de jogador",
        operation_description="Permite que lojas e admins removam inscrições de jogadores. Não é possível remover inscrições durante rodadas ativas."
    )
    def remover_inscricao(self, request):
        """
        Endpoint para loja/admins removerem inscrições de jogadores.
        Permite remoção entre rodadas (não durante rodada ativa).
        Os pontos já conquistados permanecem no histórico do torneio.
        """
        usuario_id = request.data.get('usuario_id')
        torneio_id = request.data.get('torneio_id')
        
        if not usuario_id or not torneio_id:
            return Response(
                {"error": "Parâmetros 'usuario_id' e 'torneio_id' são obrigatórios"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            inscricao = Inscricao.objects.get(
                id_usuario_id=usuario_id,
                id_torneio_id=torneio_id
            )
        except Inscricao.DoesNotExist:
            return Response(
                {"error": "Inscrição não encontrada"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verifica se há alguma rodada em andamento (não permite remoção durante rodada ativa)
        rodada_ativa = Rodada.objects.filter(
            id_torneio_id=torneio_id,
            status='Em Andamento'
        ).exists()
        
        if rodada_ativa:
            return Response(
                {"error": "Não é possível remover inscrição durante uma rodada ativa. Aguarde o final da rodada."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Remove a inscrição - os pontos já conquistados permanecem no histórico
        inscricao.delete()
        
        return Response({
            "message": "Inscrição removida com sucesso. Os pontos conquistados permanecem no histórico do torneio."
        }, status=status.HTTP_200_OK)


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

    @swagger_auto_schema(
        method="post",
        request_body=ReportarResultadoSerializer,
        responses={
            200: openapi.Response("Resultado registrado com sucesso", schema=MesaDetailSerializer),
            400: "Erro de validação (placar, composição 2v2, payload)",
            403: "A rodada não está 'Em Andamento' ou permissão negada",
            404: "Mesa não encontrada"
        },
        operation_summary="Reportar resultado da mesa (RF-012)",
        operation_description=(
                "Permite que o jogador da mesa reporte/edite o resultado da partida.\n\n"
                "Regras:\n"
                "- Rodada deve estar 'Em Andamento'.\n"
                "- Mesa deve estar completa no formato 2v2 (02 jogadores no Time 1 e 02 no Time 2).\n"
                "- Valida coerência entre pontuações e `time_vencedor`.\n\n"
                "Campos:\n"
                "- `pontuacao_time_1` (int ≥ 0)\n"
                "- `pontuacao_time_2` (int ≥ 0)\n"
                "- `time_vencedor` (0=Empate, 1=Time 1, 2=Time 2)"
        ),
    )

    @action(detail=True, methods=['post'], permission_classes=[IsJogadorNaMesa])
    def reportar_resultado(self, request, pk=None):
        # Aqui é um bloqueio transacional > evitar processamento de dois reports simultâneos
        with (transaction.atomic()):
            # lock pessimista na mesa
            # É um bloqueio exclusivo de linha feito pelo banco quando usamos select_for_update().
            # Enquanto uma transação está rodando (no bloco with transaction.atomic():),
            # a dada linha da tabela (neste caso, a mesa específica) fica bloqueada para escrita por outros usuários/processos.
            # impede que dois jogadores tentem reportar o resultado da mesma mesa, ao mesmo tempo, teríamos uma inconsistência.
            mesa = Mesa.objects.select_for_update().select_related('id_rodada').get(pk=pk)

            # para evitar um 500 se o pk não existir
            if not mesa:
                return Response({"detail": "Mesa não encontrada."}, status=status.HTTP_404_NOT_FOUND)

            # é necessário que Rodada precisa estar 'Em Andamento'
            if getattr(mesa.id_rodada, 'status', None) != 'Em Andamento':
                return Response(
                    {"detail": "Não é possível reportar resultado: a rodada não está 'Em Andamento'."},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Mesa precisa estar completa: 2v2
            jogadores = list(MesaJogador.objects.filter(id_mesa=mesa).only('time'))
            if len(jogadores) != 4 or sum(j.time == 1 for j in jogadores) != 2 or sum(j.time == 2 for j in jogadores) != 2:
                return Response(
                    {"detail": "Mesa inválida: é necessário haver 2 jogadores no Time 1 e 2 no Time 2 (2x2)."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # validacao de payload
            serializer = ReportarResultadoSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            # aplicacao de resultado
            mesa.pontuacao_time_1 = serializer.validated_data['pontuacao_time_1']
            mesa.pontuacao_time_2 = serializer.validated_data['pontuacao_time_2']
            mesa.time_vencedor    = serializer.validated_data['time_vencedor']
            mesa.save(update_fields=['pontuacao_time_1', 'pontuacao_time_2', 'time_vencedor'])

        # resposta
        return Response({
            'message': 'Resultado reportado com sucesso',
            'mesa': MesaDetailSerializer(mesa).data
        }, status=status.HTTP_200_OK)

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