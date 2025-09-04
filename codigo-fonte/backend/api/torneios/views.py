from rest_framework import viewsets, permissions

from .models import Torneio, Inscricao, Rodada, Mesa
from .permissoes import IsLojaOuAdmin, IsApenasLeitura
from .serializers import (
    TorneioSerializer, InscricaoSerializer, RodadaSerializer,
    MesaSerializer
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
    Apenas Lojas e Admins podem criar ou modificar rodadas.
    """
    queryset = Rodada.objects.all()
    serializer_class = RodadaSerializer
    permission_classes = [IsLojaOuAdmin | IsApenasLeitura]


class MesaViewSet(viewsets.ModelViewSet):
    """
    Endpoint para visualizar e gerenciar as mesas de uma rodada.
    Lojas e Admins podem criar mesas e reportar resultados.
    """
    queryset = Mesa.objects.all()
    serializer_class = MesaSerializer
    permission_classes = [IsLojaOuAdmin | IsApenasLeitura]
