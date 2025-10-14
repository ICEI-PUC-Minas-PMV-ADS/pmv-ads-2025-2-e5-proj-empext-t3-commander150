from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from django.db import transaction

from .models import Torneio, Inscricao, Rodada, Mesa, MesaJogador
from .permissoes import IsLojaOuAdmin, IsApenasLeitura, IsJogadorNaMesa
from .serializers import (
    TorneioSerializer, InscricaoSerializer, InscricaoCreateSerializer, InscricaoLojaSerializer, RodadaSerializer,
    MesaSerializer, MesaDetailSerializer, ReportarResultadoSerializer,
    EditarJogadoresMesaSerializer, VisualizacaoMesaJogadorSerializer, InscricaoResponseSerializer
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

    @swagger_auto_schema(
        request_body=TorneioSerializer,
        responses={
            201: TorneioSerializer,
            400: 'Erro de validação'
        },
        operation_summary="Criar novo torneio",
        operation_description="""
        Cria um novo torneio com os seguintes campos:
        
        **Campos obrigatórios:**
        - nome (string): Nome do torneio
        - status (string): Status do torneio (ex: Aberto, Em Andamento, Finalizado)
        - regras (string): Regras específicas do torneio
        - vagas_limitadas (boolean): Se o torneio tem limite de vagas
        - incricao_gratuita (boolean): Se a inscrição é gratuita
        - pontuacao_vitoria (integer): Pontos por vitória
        - pontuacao_derrota (integer): Pontos por derrota
        - pontuacao_empate (integer): Pontos por empate
        - pontuacao_bye (integer): Pontos por bye
        - data (date): Data do torneio
        
        **Campos opcionais:**
        - descricao (string): Descrição detalhada do torneio
        - banner (file): Banner do torneio
        - qnt_vagas (integer): Quantidade de vagas disponíveis
        - valor_incricao (decimal): Valor da inscrição em reais
        - quantidade_rodadas (integer): Quantidade de rodadas do torneio
        
        **Observações:**
        - Para usuários tipo LOJA: o campo id_loja é definido automaticamente
        - Para usuários tipo ADMIN: pode especificar o id_loja manualmente
        """
    )
    def perform_create(self, serializer):
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

    @swagger_auto_schema(
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'id_torneio': openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description='ID do torneio para inscrição',
                    example=1
                ),
                'decklist': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Lista de cartas do deck do jogador (opcional)',
                    example='4x Lightning Bolt\n4x Counterspell\n...'
                ),
                'id_usuario': openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description='ID do usuário (apenas para loja/admin)',
                    example=2
                ),
                'status': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Status da inscrição (apenas para loja/admin)',
                    example='Inscrito'
                )
            },
            required=['id_torneio']
        ),
        responses={
            201: InscricaoResponseSerializer,
            400: 'Erro de validação',
            403: 'Permissão negada'
        },
        operation_summary="Criar inscrição em torneio",
        operation_description="""
        Cria uma nova inscrição em um torneio.
        
        **Para JOGADORES:**
        - Campos obrigatórios: `id_torneio`
        - Campos opcionais: `decklist`
        - O `id_usuario` é definido automaticamente como o usuário logado
        
        **Para LOJA/ADMIN:**
        - Campos obrigatórios: `id_torneio`, `id_usuario`
        - Campos opcionais: `decklist`, `status`
        
        **Validações:**
        - Torneio deve existir e estar com status 'Aberto'
        - Jogador não pode estar já inscrito no torneio
        - Usuário especificado deve ser do tipo 'JOGADOR'
        """
    )
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

    @action(detail=True, methods=['post'])
    def desinscrever(self, request, pk=None):
        """
        Desinscreve um jogador do torneio usando soft delete.
        Altera o status para 'Cancelado' mantendo histórico e pontuação.
        """
        inscricao = self.get_object()
        
        # Verificar se a inscrição já está cancelada
        if inscricao.status == 'Cancelado':
            return Response(
                {"detail": "Esta inscrição já foi cancelada."},
                status=status.HTTP_400_BAD_REQUEST
            )
                    
        # Bloqueia desinscrição apenas de torneios finalizados
        if inscricao.id_torneio.status == 'Finalizado':
            return Response(
                {"detail": "Não é possível desinscrever-se de um torneio finalizado."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verifica se há rodada ativa (não bloqueia, apenas avisa)
        rodada_ativa = Rodada.objects.filter(
            id_torneio=inscricao.id_torneio,
            status='Em Andamento'
        ).exists()
        
        # Soft delete: marca como cancelado
        inscricao.status = 'Cancelado'
        inscricao.save(update_fields=['status'])
        
        message = "Desinscrição realizada com sucesso."
        if rodada_ativa:
            message += " Sua pontuação até o momento foi mantida no histórico do torneio."
        
        return Response({
            "message": message,
            "inscricao": InscricaoSerializer(inscricao).data
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