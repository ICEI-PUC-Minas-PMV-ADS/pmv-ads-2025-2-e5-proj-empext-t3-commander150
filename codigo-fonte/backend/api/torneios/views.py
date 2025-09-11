from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Torneio, Inscricao, Rodada, Mesa, MesaJogador
from .permissoes import IsLojaOuAdmin, IsApenasLeitura, IsJogadorNaMesa
from .serializers import (
    TorneioSerializer, InscricaoSerializer, RodadaSerializer,
    MesaSerializer, MesaDetailSerializer, ReportarResultadoSerializer,
    MesaJogadorSerializer, EditarJogadoresMesaSerializer, VisualizacaoMesaJogadorSerializer
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


class InscricaoViewSet(viewsets.ModelViewSet):
    """
    Endpoint para gerenciar as inscrições nos torneios.
    A lógica de permissão aqui pode ser refinada futuramente.
    """
    queryset = Inscricao.objects.all()
    serializer_class = InscricaoSerializer
    permission_classes = [permissions.IsAuthenticated]


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


