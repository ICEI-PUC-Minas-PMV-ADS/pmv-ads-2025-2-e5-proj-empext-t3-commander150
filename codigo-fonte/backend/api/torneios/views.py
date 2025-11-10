from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from django_filters import rest_framework as filters
from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response

from django.utils import timezone

from django.db import transaction
from django.db.models import Sum, Count, Q, Case, When, Value, IntegerField
import random

from .models import Torneio, Inscricao, Rodada, Mesa, MesaJogador, RankingParcial
from usuarios.models import Usuario
from .permissoes import IsLojaOuAdmin, IsApenasLeitura, IsJogadorNaMesa
from .serializers import (
    TorneioSerializer, InscricaoSerializer, InscricaoCreateSerializer, InscricaoLojaSerializer, RodadaSerializer,
    MesaSerializer, MesaDetailSerializer, ReportarResultadoSerializer,
    EditarJogadoresMesaSerializer, VisualizacaoMesaJogadorSerializer, InscricaoResponseSerializer, IniciarRodadaSerializer
)
from .ranking_utils import calcular_e_salvar_ranking_parcial


# ViewSets fornecem uma implementação completa de CRUD (Create, Retrieve, Update, Destroy)
# com pouco código. A lógica de permissão define quem pode fazer o quê em cada endpoint.


class RodadaEmparelhamentoSerializer(serializers.Serializer):
    """Serializer para dados de emparelhamento da rodada"""
    jogadores_disponiveis = serializers.ListField(
        child=serializers.DictField(),
        help_text="Lista de jogadores disponíveis para emparelhar: [{'id': 1, 'username': 'João'}]"
    )
    mesas_criadas = serializers.ListField(
        child=serializers.DictField(),
        help_text="Lista de mesas já criadas com seus jogadores"
    )
    status_emparelhamento = serializers.CharField(help_text="Status atual do emparelhamento")


class EmparelhamentoAutomaticoSerializer(serializers.Serializer):
    """Serializer para configuração do emparelhamento automático"""
    tipo = serializers.ChoiceField(
        choices=['random', 'swiss'],
        default='swiss',
        help_text="Tipo de emparelhamento: random (aleatório) ou swiss (por pontuação)"
    )


class EditarEmparelhamentoSerializer(serializers.Serializer):
    """Serializer para editar emparelhamento manualmente"""
    acao = serializers.ChoiceField(
        choices=['mover_jogador_para_mesa', 'alterar_time_jogador'],
        help_text="Ação a ser realizada"
    )
    jogador_id = serializers.IntegerField(
        help_text="ID do jogador a ser movido"
    )
    nova_mesa_id = serializers.IntegerField(
        required=False,
        help_text="ID da nova mesa (apenas para mover_jogador_para_mesa)"
    )
    novo_time = serializers.ChoiceField(
        choices=[1, 2],
        required=False,
        help_text="Novo time para o jogador (apenas para alterar_time_jogador)"
    )

    def validate(self, data):
        acao = data.get('acao')

        if acao == 'mover_jogador_para_mesa' and not data.get('nova_mesa_id'):
            raise serializers.ValidationError("nova_mesa_id é obrigatório para mover_jogador_para_mesa")

        if acao == 'alterar_time_jogador' and not data.get('novo_time'):
            raise serializers.ValidationError("novo_time é obrigatório para alterar_time_jogador")

        return data

class TorneioFilter(filters.FilterSet):
    status = filters.CharFilter(method='filter_status')
    
    def filter_status(self, queryset, name, value):
        # Divide por vírgula e remove espaços extras
        status_list = [s.strip() for s in value.split(',')]
        return queryset.filter(status__in=status_list)
    
    class Meta:
        model = Torneio
        fields = ['status']
        
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

    filter_backends = [filters.DjangoFilterBackend]
    filterset_class = TorneioFilter  # Usa o filtro customizado para aceitar múltiplos status

    def get_queryset(self):
        """
        Retorna lista de torneios com filtros apropriados e ordenação híbrida.

        Ordenação:
        1. Por status (prioridade):
           - Em Andamento (prioridade 1)
           - Aberto (prioridade 2)
           - Outros status (prioridade 3)
        2. Por data de início (crescente)

        Filtros:
        - Admins: Veem todos os torneios
        - Lojas: Veem apenas seus próprios torneios
        - Outros: Veem todos (somente leitura)
        """
        # Define a ordenação híbrida por status e data
        queryset_base = Torneio.objects.annotate(
            prioridade=Case(
                When(status='Em Andamento', then=Value(1)),
                When(status='Aberto', then=Value(2)),
                default=Value(3),
                output_field=IntegerField()
            )
        ).order_by('prioridade', 'data_inicio')

        # Aplica filtro específico para lojas
        if self.request.user.is_authenticated and self.request.user.tipo == 'LOJA':
            return queryset_base.filter(id_loja=self.request.user)

        return queryset_base

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

    @swagger_auto_schema(
        method='post',
        responses={
            200: openapi.Response(
                description="Torneio cancelado com sucesso",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(type=openapi.TYPE_STRING),
                        'torneio': openapi.Schema(type=openapi.TYPE_OBJECT),
                    }
                )
            ),
            400: 'Erro de validação',
            403: 'Permissão negada'
        },
        operation_summary="Cancelar torneio",
        operation_description="""
        Cancela um torneio marcando seu status como 'Cancelado'.

        **Validações:**
        - Torneio deve estar com status 'Aberto'
        - Apenas o dono da loja ou admins podem cancelar

        **Ações:**
        - Muda o status do torneio para 'Cancelado'
        - Mantém todas as inscrições e dados para histórico
        """
    )
    @action(detail=True, methods=['post'], permission_classes=[IsLojaOuAdmin])
    def cancelar(self, request, pk=None):
        """
        Cancela um torneio marcando seu status como 'Cancelado'.
        Mantém histórico completo das inscrições e dados.
        """
        torneio = self.get_object()

        # Validação: Status deve ser 'Aberto'
        if torneio.status != 'Aberto':
            return Response(
                {"detail": f"Torneio deve estar com status 'Aberto'. Status atual: {torneio.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Confirmação de cancelamento (todos os dados serão mantidos)
        confirme_cancelamento = request.data.get('confirmacao', False)
        if not confirme_cancelamento:
            return Response(
                {"detail": "Envie confirmacao: true para confirmar o cancelamento"},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # Muda status do torneio para 'Cancelado'
            torneio.status = 'Cancelado'
            torneio.save(update_fields=['status'])

        return Response({
            'message': 'Torneio cancelado com sucesso. Todos os dados foram mantidos para histórico.',
            'torneio': TorneioSerializer(torneio).data
        }, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        method='post',
        responses={
            200: openapi.Response(
                description="Torneio iniciado com sucesso",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(type=openapi.TYPE_STRING),
                        'rodada': openapi.Schema(type=openapi.TYPE_OBJECT),
                        'mesas_criadas': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'total_jogadores': openapi.Schema(type=openapi.TYPE_INTEGER),
                    }
                )
            ),
            400: 'Erro de validação',
            403: 'Permissão negada'
        },
        operation_summary="Iniciar torneio",
        operation_description="""
        Inicia um torneio criando a primeira rodada e emparelhando jogadores.
        
        **Validações:**
        - Torneio deve estar com status 'Aberto'
        - Deve ter no mínimo 4 jogadores inscritos (para formar 2v2)
        
        **Ações:**
        - Valida número de inscritos
        - Muda status do torneio para 'Em Andamento'
        - Cria a Rodada 1
        - Emparelha jogadores aleatoriamente em mesas 2v2
        - Se número de jogadores for ímpar ou sobrar menos de 4, jogadores recebem bye
        """
    )
    @action(detail=True, methods=['post'], permission_classes=[IsLojaOuAdmin])
    def iniciar(self, request, pk=None):
        """
        Inicia o torneio criando a primeira rodada e emparelhando jogadores.
        """
        torneio = self.get_object()
        
        # Validação: Status deve ser 'Aberto'
        if torneio.status != 'Aberto':
            return Response(
                {"detail": f"Torneio deve estar com status 'Aberto'. Status atual: {torneio.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Busca inscrições ativas (não canceladas)
        inscricoes_ativas = Inscricao.objects.filter(
            id_torneio=torneio
        ).exclude(status='Cancelado')
        
        total_jogadores = inscricoes_ativas.count()
        
        # Validação: Mínimo 4 jogadores
        if total_jogadores < 4:
            return Response(
                {"detail": f"É necessário ter no mínimo 4 jogadores inscritos. Total atual: {total_jogadores}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Muda status do torneio para 'Em Andamento'
            torneio.status = 'Em Andamento'
            torneio.save(update_fields=['status'])
            
            # Cria Rodada 1
            rodada = Rodada.objects.create(
                id_torneio=torneio,
                numero_rodada=1,
                status='Em Andamento'
            )
            
            # Pega lista de jogadores e embaralha aleatoriamente
            jogadores = list(inscricoes_ativas.values_list('id_usuario_id', flat=True))
            random.shuffle(jogadores)
            
            # Calcula quantas mesas completas (4 jogadores) podem ser formadas
            num_mesas = len(jogadores) // 4
            mesas_criadas = 0
            
            # Cria mesas 2v2
            for i in range(num_mesas):
                mesa = Mesa.objects.create(
                    id_rodada=rodada,
                    numero_mesa=i + 1
                )
                
                # Pega 4 jogadores para esta mesa
                jogadores_mesa = jogadores[i * 4:(i + 1) * 4]
                
                # Distribui em times (2 primeiros no Time 1, 2 últimos no Time 2)
                for j, jogador_id in enumerate(jogadores_mesa):
                    time = 1 if j < 2 else 2
                    MesaJogador.objects.create(
                        id_mesa=mesa,
                        id_usuario_id=jogador_id,
                        time=time
                    )
                
                mesas_criadas += 1
            
            # Jogadores restantes (se houver) recebem bye implícito
            # (não jogam nesta rodada)
            jogadores_com_bye = len(jogadores) % 4
        
        message = f"Torneio iniciado com sucesso. {mesas_criadas} mesa(s) criada(s)."
        if jogadores_com_bye > 0:
            message += f" {jogadores_com_bye} jogador(es) recebeu(ram) bye nesta rodada."
        
        return Response({
            'message': message,
            'rodada': RodadaSerializer(rodada).data,
            'mesas_criadas': mesas_criadas,
            'total_jogadores': total_jogadores
        }, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        method='post',
        responses={
            200: openapi.Response(
                description="Nova rodada criada com sucesso",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(type=openapi.TYPE_STRING),
                        'rodada': openapi.Schema(type=openapi.TYPE_OBJECT),
                        'mesas_criadas': openapi.Schema(type=openapi.TYPE_INTEGER),
                    }
                )
            ),
            400: 'Erro de validação',
            403: 'Permissão negada'
        },
        operation_summary="Avançar para próxima rodada",
        operation_description="""
        Finaliza a rodada atual e cria a próxima rodada com emparelhamento Swiss.
        
        **Validações:**
        - Torneio deve estar 'Em Andamento'
        - Todas as mesas da rodada atual devem ter resultado reportado
        - Não pode exceder o número máximo de rodadas configurado
        
        **Ações:**
        - Finaliza rodada atual
        - Calcula pontuação de cada jogador
        - Ordena jogadores por pontuação (maior para menor)
        - Emparelha jogadores com pontuações similares (Swiss pairing)
        - Cria nova rodada
        """
    )
    @action(detail=True, methods=['post'], permission_classes=[IsLojaOuAdmin])
    def proxima_rodada(self, request, pk=None):
        """
        Avança para a próxima rodada do torneio.
        """
        torneio = self.get_object()
        
        # Validação: Status deve ser 'Em Andamento'
        if torneio.status != 'Em Andamento':
            return Response(
                {"detail": f"Torneio deve estar 'Em Andamento'. Status atual: {torneio.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Busca rodada atual
        try:
            rodada_atual = Rodada.objects.filter(id_torneio=torneio).order_by('-numero_rodada').first()
        except Rodada.DoesNotExist:
            return Response(
                {"detail": "Nenhuma rodada encontrada para este torneio."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validação: Rodada deve estar Em Andamento
        status_normalizado = rodada_atual.status.strip().lower().replace(' ', '_')
        if status_normalizado != 'em_andamento':
            return Response(
                {"detail": f"Rodada atual deve estar 'Em Andamento'. Status atual: {rodada_atual.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validação: Todas as mesas devem ter resultado reportado
        mesas_sem_resultado = Mesa.objects.filter(
            id_rodada=rodada_atual,
            time_vencedor__isnull=True
        ).count()

        if mesas_sem_resultado > 0:
            return Response(
                {"detail": f"Existem {mesas_sem_resultado} mesa(s) sem resultado reportado na rodada atual."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # # Validação: Não exceder número máximo de rodadas
        # if torneio.quantidade_rodadas and rodada_atual.numero_rodada >= torneio.quantidade_rodadas:
        #     return Response(
        #         {"detail": f"Número máximo de rodadas ({torneio.quantidade_rodadas}) atingido. Use o endpoint de finalizar torneio."},
        #         status=status.HTTP_400_BAD_REQUEST
        #     )
        
        with transaction.atomic():
            # Finaliza rodada atual
            rodada_atual.status = 'Finalizada'
            rodada_atual.save(update_fields=['status'])

            # Calcula e salva ranking da rodada que acabou de finalizar
            try:
                calcular_e_salvar_ranking_parcial(torneio, rodada_atual.numero_rodada)
            except Exception as e:
                # Log do erro mas não bloqueia a criação da próxima rodada
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Erro ao calcular ranking da rodada {rodada_atual.numero_rodada}: {str(e)}")

            # Cria nova rodada no status "Emparelhamento" e inicia emparelhamento automático
            nova_rodada = Rodada.objects.create(
                id_torneio=torneio,
                numero_rodada=rodada_atual.numero_rodada + 1,
                status='Emparelhamento'
            )

            # Executa emparelhamento automático imediatamente
            inscricoes_ativas = Inscricao.objects.filter(
                id_torneio=torneio
            ).exclude(status='Cancelado')

            total_jogadores = inscricoes_ativas.count()

            if total_jogadores >= 4:
                # Obtém lista de jogadores e embaralha aleatoriamente
                jogadores = list(inscricoes_ativas.values_list('id_usuario_id', flat=True))
                random.shuffle(jogadores)

                # Calcula quantas mesas completas (4 jogadores) podem ser formadas
                num_mesas = len(jogadores) // 4
                mesas_criadas = 0

                # Cria mesas 2v2 com emparelhamento automático Swiss
                jogadores_pontuacao = TorneioViewSet._calcular_pontuacao_jogadores(TorneioViewSet(), torneio)
                jogadores_ordenados = sorted(
                    jogadores_pontuacao.items(),
                    key=lambda x: x[1],
                    reverse=True
                )

                # Filtrar apenas jogadores que estão inscritos
                jogadores_ordenados = [(j_id, pontos) for j_id, pontos in jogadores_ordenados
                                      if j_id in jogadores]

                for i in range(num_mesas):
                    mesa = Mesa.objects.create(
                        id_rodada=nova_rodada,
                        numero_mesa=i + 1
                    )

                    # Pega 4 jogadores consecutivos do ranking
                    inicio = i * 4
                    jogadores_mesa = jogadores_ordenados[inicio:inicio + 4]

                    # Empareamento Swiss: 1º vs 4º, 2º vs 3º
                    order = [0, 3, 1, 2]  # 1º, 4º, 2º, 3º
                    for j, player_idx in enumerate(order):
                        jogador_id = jogadores_mesa[player_idx][0]
                        time = 1 if j < 2 else 2
                        MesaJogador.objects.create(
                            id_mesa=mesa,
                            id_usuario_id=jogador_id,
                            time=time
                        )

                    mesas_criadas += 1

                mesas_criadas_count = mesas_criadas
            else:
                mesas_criadas_count = 0

            # Atualiza a mensagem de resposta
            message = f"Rodada {rodada_atual.numero_rodada} finalizada. Nova rodada {nova_rodada.numero_rodada} criada com {mesas_criadas_count} mesa(s) emparelhada(s) automaticamente."

        return Response({
            'message': message,
            'rodada_anterior': RodadaSerializer(rodada_atual).data,
            'nova_rodada': RodadaSerializer(nova_rodada).data
        }, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        method='post',
        responses={
            200: openapi.Response(
                description="Torneio finalizado com sucesso",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(type=openapi.TYPE_STRING),
                        'ranking': openapi.Schema(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Schema(
                                type=openapi.TYPE_OBJECT,
                                properties={
                                    'posicao': openapi.Schema(type=openapi.TYPE_INTEGER),
                                    'jogador_id': openapi.Schema(type=openapi.TYPE_INTEGER),
                                    'jogador_nome': openapi.Schema(type=openapi.TYPE_STRING),
                                    'pontos': openapi.Schema(type=openapi.TYPE_INTEGER),
                                }
                            )
                        ),
                        'total_rodadas': openapi.Schema(type=openapi.TYPE_INTEGER),
                    }
                )
            ),
            400: 'Erro de validação',
            403: 'Permissão negada'
        },
        operation_summary="Finalizar torneio",
        operation_description="""
        Finaliza o torneio e gera o ranking final.
        
        **Validações:**
        - Torneio deve estar 'Em Andamento'
        - Todas as mesas da rodada atual devem ter resultado reportado
        
        **Ações:**
        - Finaliza rodada atual
        - Calcula pontuação final de todos os jogadores
        - Gera ranking ordenado por pontuação
        - Muda status do torneio para 'Finalizado'
        """
    )
    @action(detail=True, methods=['post'], permission_classes=[IsLojaOuAdmin])
    def finalizar(self, request, pk=None):
        """
        Finaliza o torneio e gera o ranking final.
        """
        torneio = self.get_object()
        
        # Validação: Status deve ser 'Em Andamento'
        if torneio.status != 'Em Andamento':
            return Response(
                {"detail": f"Torneio deve estar 'Em Andamento'. Status atual: {torneio.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Busca rodada atual
        try:
            rodada_atual = Rodada.objects.filter(id_torneio=torneio).order_by('-numero_rodada').first()
        except Rodada.DoesNotExist:
            return Response(
                {"detail": "Nenhuma rodada encontrada para este torneio."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validação: Todas as mesas devem ter resultado reportado
        mesas_sem_resultado = Mesa.objects.filter(
            id_rodada=rodada_atual,
            time_vencedor__isnull=True
        ).count()
        
        if mesas_sem_resultado > 0:
            return Response(
                {"detail": f"Existem {mesas_sem_resultado} mesa(s) sem resultado reportado na rodada atual."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Finaliza rodada atual
            rodada_atual.status = 'Finalizada'
            rodada_atual.save(update_fields=['status'])

            # Calcula e salva ranking final com todas as métricas
            ranking_calculado = calcular_e_salvar_ranking_parcial(torneio, rodada_atual.numero_rodada)

            # Busca ranking do cache para retornar com todas as informações
            ranking_cache = RankingParcial.objects.filter(
                id_torneio=torneio,
                rodada_numero=rodada_atual.numero_rodada
            ).select_related('id_usuario').order_by('posicao')

            # Formata ranking para resposta
            ranking = []
            for item in ranking_cache:
                ranking.append({
                    'posicao': item.posicao,
                    'jogador_id': item.id_usuario.id,
                    'jogador_nome': item.id_usuario.username,
                    'pontos': item.pontos_totais,
                    'mw_percentage': float(item.mw_percentage),
                    'omw_percentage': float(item.omw_percentage),
                    'pmw_percentage': float(item.pmw_percentage),
                    'balanco': float(item.balanco)
                })

            # Muda status do torneio para 'Finalizado'
            torneio.status = 'Finalizado'
            torneio.save(update_fields=['status'])

            total_rodadas = Rodada.objects.filter(id_torneio=torneio).count()

        return Response({
            'message': 'Torneio finalizado com sucesso',
            'ranking': ranking,
            'total_rodadas': total_rodadas
        }, status=status.HTTP_200_OK)

    def _calcular_pontuacao_jogadores(self, torneio):
        """
        Calcula a pontuação total de cada jogador no torneio.
        Retorna um dicionário {usuario_id: pontos}
        """
        pontuacao = {}
        
        # Busca todas as rodadas do torneio
        rodadas = Rodada.objects.filter(id_torneio=torneio)
        
        # Busca inscrições ativas
        inscricoes = Inscricao.objects.filter(
            id_torneio=torneio
        ).exclude(status='Cancelado')
        
        # Inicializa pontuação de todos os jogadores inscritos
        for inscricao in inscricoes:
            pontuacao[inscricao.id_usuario_id] = 0
        
        # Percorre todas as rodadas
        for rodada in rodadas:
            # Jogadores que jogaram nesta rodada
            jogadores_na_rodada = set()
            
            # Busca todas as mesas da rodada
            mesas = Mesa.objects.filter(id_rodada=rodada)
            
            for mesa in mesas:
                # Busca jogadores da mesa
                jogadores_mesa = MesaJogador.objects.filter(id_mesa=mesa).select_related('id_usuario')

                for jogador_mesa in jogadores_mesa:
                    jogador_id = jogador_mesa.id_usuario_id
                    jogadores_na_rodada.add(jogador_id)

                    # Só adiciona pontuação se o jogador ainda estiver ativo no torneio
                    if jogador_id in pontuacao:
                        # Calcula pontos baseado no resultado
                        if mesa.time_vencedor == 0:  # Empate
                            pontuacao[jogador_id] += torneio.pontuacao_empate
                        elif mesa.time_vencedor == jogador_mesa.time:  # Vitória
                            pontuacao[jogador_id] += torneio.pontuacao_vitoria
                        else:  # Derrota
                            pontuacao[jogador_id] += torneio.pontuacao_derrota
            
            # Jogadores que não jogaram nesta rodada recebem bye
            for jogador_id in pontuacao.keys():
                if jogador_id not in jogadores_na_rodada:
                    pontuacao[jogador_id] += torneio.pontuacao_bye
        
        return pontuacao

    @swagger_auto_schema(
        method='get',
        manual_parameters=[
            openapi.Parameter(
                'rodada_id',
                openapi.IN_QUERY,
                description='ID da rodada para calcular ranking até essa rodada',
                type=openapi.TYPE_INTEGER,
                required=True
            )
        ],
        responses={
            200: openapi.Response(
                description="Ranking de uma rodada específica",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'rodada_numero': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'ranking': openapi.Schema(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Schema(
                                type=openapi.TYPE_OBJECT,
                                properties={
                                    'posicao': openapi.Schema(type=openapi.TYPE_INTEGER),
                                    'jogador_id': openapi.Schema(type=openapi.TYPE_INTEGER),
                                    'jogador_nome': openapi.Schema(type=openapi.TYPE_STRING),
                                    'pontos': openapi.Schema(type=openapi.TYPE_INTEGER),
                                }
                            )
                        ),
                    }
                )
            ),
            400: 'Erro de validação',
            404: 'Rodada não encontrada'
        },
        operation_summary="Obter ranking parcial de uma rodada",
        operation_description="""
        Retorna o ranking dos jogadores até a rodada específica (acumulado).
        
        **Parâmetros Query:**
        - rodada_id: ID da rodada para calcular ranking até essa rodada
        """
    )
    @action(detail=True, methods=['get'], permission_classes=[IsLojaOuAdmin | IsApenasLeitura])
    def ranking_rodada(self, request, pk=None):
        """
        Retorna o ranking parcial até uma rodada específica.
        Usa cache de RankingParcial quando disponível, calcula sob demanda caso contrário.
        """
        torneio = self.get_object()
        rodada_id = request.query_params.get('rodada_id')

        if not rodada_id:
            return Response(
                {"detail": "Parâmetro 'rodada_id' é obrigatório"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            rodada_alvo = Rodada.objects.get(id=rodada_id, id_torneio=torneio)
        except Rodada.DoesNotExist:
            return Response(
                {"detail": "Rodada não encontrada neste torneio"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verifica se ranking está em cache
        ranking_cache = RankingParcial.objects.filter(
            id_torneio=torneio,
            rodada_numero=rodada_alvo.numero_rodada
        ).select_related('id_usuario').order_by('posicao')

        if ranking_cache.exists():
            # Usa cache existente (otimizado!)
            ranking = []
            for item in ranking_cache:
                ranking.append({
                    'posicao': item.posicao,
                    'jogador_id': item.id_usuario.id,
                    'jogador_nome': item.id_usuario.username,
                    'pontos': item.pontos_totais,
                    'mw_percentage': float(item.mw_percentage),
                    'omw_percentage': float(item.omw_percentage),
                    'pmw_percentage': float(item.pmw_percentage),
                    'balanco': float(item.balanco)
                })
        else:
            # Cache não existe - calcula sob demanda
            if rodada_alvo.status == 'Finalizada':
                # Rodada finalizada - calcula e salva no cache
                calcular_e_salvar_ranking_parcial(torneio, rodada_alvo.numero_rodada)

                # Busca do cache recém criado
                ranking_cache = RankingParcial.objects.filter(
                    id_torneio=torneio,
                    rodada_numero=rodada_alvo.numero_rodada
                ).select_related('id_usuario').order_by('posicao')

                ranking = []
                for item in ranking_cache:
                    ranking.append({
                        'posicao': item.posicao,
                        'jogador_id': item.id_usuario.id,
                        'jogador_nome': item.id_usuario.username,
                        'pontos': item.pontos_totais,
                        'mw_percentage': float(item.mw_percentage),
                        'omw_percentage': float(item.omw_percentage),
                        'pmw_percentage': float(item.pmw_percentage),
                        'balanco': float(item.balanco)
                    })
            else:
                # Rodada não finalizada - usa cálculo simples (fallback)
                pontuacao = {}
                inscricoes = Inscricao.objects.filter(
                    id_torneio=torneio
                ).exclude(status='Cancelado')

                for inscricao in inscricoes:
                    pontuacao[inscricao.id_usuario_id] = 0

                rodadas_até_alvo = Rodada.objects.filter(
                    id_torneio=torneio,
                    numero_rodada__lte=rodada_alvo.numero_rodada,
                    status='Finalizada'
                ).order_by('numero_rodada')

                for rodada in rodadas_até_alvo:
                    jogadores_na_rodada = set()
                    mesas = Mesa.objects.filter(id_rodada=rodada)

                    for mesa in mesas:
                        jogadores_mesa = MesaJogador.objects.filter(id_mesa=mesa).select_related('id_usuario')

                        for jogador_mesa in jogadores_mesa:
                            jogador_id = jogador_mesa.id_usuario_id
                            jogadores_na_rodada.add(jogador_id)

                            if jogador_id in pontuacao:
                                if mesa.time_vencedor == 0:
                                    pontuacao[jogador_id] += torneio.pontuacao_empate
                                elif mesa.time_vencedor == jogador_mesa.time:
                                    pontuacao[jogador_id] += torneio.pontuacao_vitoria
                                else:
                                    pontuacao[jogador_id] += torneio.pontuacao_derrota

                    for jogador_id in pontuacao.keys():
                        if jogador_id not in jogadores_na_rodada:
                            pontuacao[jogador_id] += torneio.pontuacao_bye

                ranking = []
                jogadores_ordenados = sorted(
                    pontuacao.items(),
                    key=lambda x: x[1],
                    reverse=True
                )

                for posicao, (usuario_id, pontos) in enumerate(jogadores_ordenados, start=1):
                    from usuarios.models import Usuario
                    usuario = Usuario.objects.get(id=usuario_id)
                    ranking.append({
                        'posicao': posicao,
                        'jogador_id': usuario_id,
                        'jogador_nome': usuario.username,
                        'pontos': pontos
                    })

        return Response({
            'rodada_numero': rodada_alvo.numero_rodada,
            'ranking': ranking
        }, status=status.HTTP_200_OK)

    def _criar_mesas_swiss(self, rodada, jogadores_ordenados, torneio):
        """
        Cria mesas usando sistema Swiss pairing.
        Emparelha jogadores com pontuações similares.
        Formato 2v2: primeiros vs últimos de cada grupo de 4.
        """
        mesas_criadas = 0
        jogadores_ids = [j[0] for j in jogadores_ordenados]  # Extrai apenas os IDs
        
        # Calcula quantas mesas completas (4 jogadores) podem ser formadas
        num_mesas = len(jogadores_ids) // 4
        
        for i in range(num_mesas):
            mesa = Mesa.objects.create(
                id_rodada=rodada,
                numero_mesa=i + 1
            )
            
            # Pega 4 jogadores consecutivos do ranking
            inicio = i * 4
            jogadores_mesa = jogadores_ids[inicio:inicio + 4]
            
            # Distribui em times: 1º e 4º vs 2º e 3º
            # Time 1: jogadores 0 e 3 (1º e 4º do grupo)
            # Time 2: jogadores 1 e 2 (2º e 3º do grupo)
            MesaJogador.objects.create(
                id_mesa=mesa,
                id_usuario_id=jogadores_mesa[0],
                time=1
            )
            MesaJogador.objects.create(
                id_mesa=mesa,
                id_usuario_id=jogadores_mesa[3],
                time=1
            )
            MesaJogador.objects.create(
                id_mesa=mesa,
                id_usuario_id=jogadores_mesa[1],
                time=2
            )
            MesaJogador.objects.create(
                id_mesa=mesa,
                id_usuario_id=jogadores_mesa[2],
                time=2
            )
            
            mesas_criadas += 1
        
        return mesas_criadas


class InscricaoViewSet(viewsets.ModelViewSet):
    """
    Endpoint da API para gerenciamento de inscrições em torneios.

    Regras de acesso:
    - GET (list/retrieve):
        • Jogadores: Veem apenas suas próprias inscrições
        • Lojas: Veem inscrições dos seus torneios
        • Admins: Veem todas as inscrições

    Query Parameters (GET):
    - id_torneio: Filtra inscrições por torneio específico (ex: ?id_torneio=1)

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
        Suporta filtro por id_torneio via query params.
        """
        queryset = Inscricao.objects.all()
        user = self.request.user

        # Filtro por torneio via query params
        torneio_id = self.request.query_params.get('id_torneio')
        if torneio_id:
            queryset = queryset.filter(id_torneio_id=torneio_id)

        # Filtros baseados no tipo de usuário
        if user.tipo == 'ADMIN':
            return queryset
        elif user.tipo == 'LOJA':
            return queryset.filter(id_torneio__id_loja=user)
        return queryset.filter(id_usuario=user)

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
        inscricao.data_saida = timezone.now()
        inscricao.save(update_fields=['status'])
        
        message = "Desinscrição realizada com sucesso."
        if rodada_ativa:
            message += " Sua pontuação até o momento foi mantida no histórico do torneio."
        
        return Response({
            "message": message,
            "inscricao": InscricaoSerializer(inscricao).data
        }, status=status.HTTP_200_OK)


    @action(detail=True, methods=['post'])
    def reativar(self, request, pk=None):
        """
        reativa (reinscreve) um jogador que estava com status 'Cancelado'. Pode ser chamado apenas pela loja ou administrador.
        """
        inscricao = self.get_object()

        # se já está ativo
        if inscricao.status == 'Inscrito':
            return Response(
                {"detail": "Esta inscrição já está ativa."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # bloqueia reativação se o torneio estiver finalizado
        if inscricao.id_torneio.status == 'Finalizado':
            return Response(
                {"detail": "Não é possível reativar inscrições de jogadores em torneios finalizados."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # atualiza a inscrição
        inscricao.status = 'Inscrito'
        inscricao.data_saida = None  # limpa p data de saída no soft delete
        inscricao.save(update_fields=['status', 'data_saida'])

        return Response({
            "message": "Inscrição reativada com sucesso.",
            "inscricao": InscricaoSerializer(inscricao).data
        }, status=status.HTTP_200_OK)


class RodadaViewSet(viewsets.ModelViewSet):
    """
    Endpoint para visualizar e gerenciar as rodadas de um torneio.
    """
    queryset = Rodada.objects.all()
    serializer_class = RodadaSerializer
    permission_classes = [IsLojaOuAdmin | IsApenasLeitura]

    @swagger_auto_schema(
        method='post',
        operation_summary="Alterar jogador em mesa (emparelhamento rápido)",
        operation_description="""Permite alterar jogadores diretamente em uma mesa durante fase de emparelhamento.

        **Parâmetros:**
        - jogador_id: ID do novo jogador (ou 0 para remover)
        - mesa_id: ID da mesa onde alterar jogador
        - time: Time para colocar o jogador (1 ou 2)

        **Lógica:**
        - Se jogador_id = 0: Remove qualquer jogador do time especificado na mesa
        - Caso contrário: Troca o jogador atual do time pelo novo jogador
        """,
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['mesa_id', 'time'],
            properties={
                'jogador_id': openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description='ID do jogador a colocar (0 para remover)',
                    default=0
                ),
                'mesa_id': openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description='ID da mesa onde alterar jogador'
                ),
                'time': openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description='Time onde colocar o jogador (1 ou 2)',
                    enum=[1, 2]
                ),
            }
        ),
        responses={
            200: openapi.Response(description="Alteração realizada com sucesso"),
            400: 'Erro de validação',
            403: 'Acesso negado'
        }
    )
    @action(detail=False, methods=['post'], permission_classes=[IsLojaOuAdmin])
    def alterar_jogador_mesa(self, request):
        """Permite alterar jogadores específicos em uma mesa durante emparelhamento"""
        mesa_id = request.data.get('mesa_id')
        jogador_id = request.data.get('jogador_id', 0)
        time = request.data.get('time')
        position = request.data.get('position', 1)  # 1 (primeiro jogador do time) ou 2 (segundo)

        # Validações básicas
        if not mesa_id or time not in [1, 2] or position not in [1, 2]:
            return Response({
                "detail": "mesa_id, time (1 ou 2) e position (1 ou 2) são obrigatórios"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            mesa = Mesa.objects.get(id=mesa_id)
            rodada = mesa.id_rodada
        except Mesa.DoesNotExist:
            return Response({"detail": "Mesa não encontrada"}, status=status.HTTP_404_NOT_FOUND)

        # Verifica se rodada permite edição
        if rodada.status != 'Emparelhamento':
            return Response({
                "detail": "Rodada deve estar em fase de emparelhamento para editar jogadores."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Verifica permissões
        if self.request.user.tipo != 'ADMIN' and rodada.id_torneio.id_loja != self.request.user:
            return Response({"detail": "Acesso negado a este torneio"}, status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            if jogador_id == 0:
                # Remover jogador da posição específica do time nesta mesa
                jogadores_time = MesaJogador.objects.filter(
                    id_mesa=mesa,
                    time=time
                ).order_by('id')  # Ordena por ID para ter order consistente

                if position <= len(jogadores_time):
                    jogador_para_remover = jogadores_time[position - 1]  # position 1 = primeiro, 2 = segundo
                    jogador_para_remover.delete()

                return Response({
                    "message": f"Jogador removido da posição {position} do Time {time}"
                }, status=status.HTTP_200_OK)

            else:
                # Verificar se jogador existe
                try:
                    usuario = Usuario.objects.get(id=jogador_id)
                except Usuario.DoesNotExist:
                    return Response({"detail": "Jogador não encontrado"}, status=status.HTTP_404_NOT_FOUND)

                # Verificar se jogador já está inscrito no torneio
                if not Inscricao.objects.filter(
                    id_torneio=rodada.id_torneio,
                    id_usuario=jogador_id,
                    status='Inscrito'
                ).exists():
                    return Response({"detail": "Jogador não inscrito neste torneio"}, status=status.HTTP_400_BAD_REQUEST)

                # 🔍 PASSO 1: Verificar se o jogador já está exatamente onde queremos (mesmo mesa, time, posição)
                jogadores_time = MesaJogador.objects.filter(
                    id_mesa=mesa,
                    time=time
                ).order_by('id')

                if len(jogadores_time) >= position and jogadores_time[position - 1].id_usuario_id == jogador_id:
                    return Response({
                        "message": f"Jogador {usuario.username} já está na posição {position} do Time {time} da Mesa {mesa.numero_mesa}"
                    }, status=status.HTTP_200_OK)

                # 🗑️ PASSO 2: Remover jogador de QUALQUER lugar nesta rodada (outra mesa ou mesma mesa/outro time)
                MesaJogador.objects.filter(
                    id_mesa__id_rodada=rodada,
                    id_usuario=jogador_id
                ).delete()

                # 🗑️ PASSO 3: Refazer query e remover qualquer jogador que já esteja na posição desejada nesta mesa/time
                jogadores_time = MesaJogador.objects.filter(
                    id_mesa=mesa,
                    time=time
                ).order_by('id')

                if len(jogadores_time) >= position:
                    jogador_na_posicao = jogadores_time[position - 1]
                    jogador_na_posicao.delete()

                # ➕ PASSO 4: Agora SIM criar o novo registro
                MesaJogador.objects.create(
                    id_mesa=mesa,
                    id_usuario_id=jogador_id,
                    time=time
                )

                return Response({
                    "message": f"Jogador {usuario.username} posicionado na posição {position} do Time {time} da Mesa {mesa.numero_mesa}"
                }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def mesas(self, request, pk=None):
        """Retorna todas as mesas de uma rodada específica"""
        rodada = self.get_object()
        mesas = Mesa.objects.filter(id_rodada=rodada).order_by('numero_mesa')
        serializer = MesaDetailSerializer(mesas, many=True)
        return Response(serializer.data)

    @swagger_auto_schema(
        operation_summary="Listar sobressalentes da rodada",
        operation_description="""
        Retorna a lista de jogadores que foram sobressalentes nesta rodada específica.

        Essa lista é recalculada e registrada automaticamente quando a rodada é criada,
        permitindo manter um histórico preciso de quem não jogou em cada rodada,
        mesmo que novos jogadores entrem ou saiam do torneio entre rodadas.

        **GET** `/api/v1/torneios/rodadas/{id}/sobressalentes/`

        **Resposta:**
        ```json
        [
            {
                "id": 4,
                "username": "RafaelJogador3",
                "email": "rafael.jogador3@gmail.com"
            }
        ]
        ```

        **Notas:**
        - Sobressalentes são jogadores inscritos ativos que não foram colocados em mesas
        - A lista é específica para cada rodada (histórico preservado)
        - Jogadores que saem aparecem na lista até a rodada da saída
        - Novos jogadores não aparecem como sobressalentes em rodadas anteriores
        """,
        responses={
            200: openapi.Response(
                description="Lista de sobressalentes",
                schema=openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            'id': openapi.Schema(type=openapi.TYPE_INTEGER, description="ID do usuário"),
                            'username': openapi.Schema(type=openapi.TYPE_STRING, description="Nome de usuário"),
                            'email': openapi.Schema(type=openapi.TYPE_STRING, description="Email do usuário"),
                        }
                    )
                )
            ),
            404: 'Rodada não encontrada',
            403: 'Acesso negado'
        }
    )
    @action(detail=True, methods=['get'], permission_classes=[IsLojaOuAdmin | IsApenasLeitura])
    def sobressalentes(self, request, pk=None):
        """
        Retorna lista calculada de jogadores que foram sobressalentes nesta rodada específica.
        Jogadores inscritos ativos que não foram colocados em nenhuma mesa da rodada.
        """
        rodada = self.get_object()

        # Busca todos os jogadores inscritos ATIVOS no torneio desta rodada
        jogadores_inscritos = set(
            Inscricao.objects.filter(
                id_torneio=rodada.id_torneio
            ).exclude(status='Cancelado').values_list('id_usuario_id', flat=True)
        )

        # Busca todos os jogadores que ESTÃO em mesas desta rodada
        jogadores_em_mesas = set(
            MesaJogador.objects.filter(
                id_mesa__id_rodada=rodada
            ).values_list('id_usuario_id', flat=True)
        )

        # Jogadores sobressalentes = inscritos ativos - jogadores que estão em mesas
        jogadores_sobressalentes_ids = jogadores_inscritos - jogadores_em_mesas

        # Busca dados dos usuários sobressalentes
        if jogadores_sobressalentes_ids:
            from usuarios.models import Usuario
            jogadores_sobressalentes = Usuario.objects.filter(
                id__in=jogadores_sobressalentes_ids
            ).values('id', 'username', 'email')
        else:
            jogadores_sobressalentes = []

        return Response(list(jogadores_sobressalentes), status=200)

    @swagger_auto_schema(
        method='get',
        responses={
            200: RodadaEmparelhamentoSerializer,
            403: 'Acesso negado',
            404: 'Rodada não encontrada'
        },
        operation_summary="Obter dados de emparelhamento da rodada",
        operation_description="""Retorna informações sobre jogadores disponíveis e mesas já criadas para emparelhamento."""
    )
    @action(detail=True, methods=['get'], permission_classes=[IsLojaOuAdmin])
    def emparelhamento(self, request, pk=None):
        """Retorna dados para interface de emparelhamento"""
        rodada = self.get_object()

        # Verifica se é o dono do torneio
        if self.request.user.tipo != 'ADMIN' and rodada.id_torneio.id_loja != self.request.user:
            return Response({"detail": "Acesso negado"}, status=status.HTTP_403_FORBIDDEN)

        # Jogadores ainda não emparelhados
        jogadores_inscritos = Inscricao.objects.filter(
            id_torneio=rodada.id_torneio,
            status='Inscrito'
        ).values_list('id_usuario', flat=True)

        jogadores_em_mesas = MesaJogador.objects.filter(
            id_mesa__id_rodada=rodada
        ).values_list('id_usuario', flat=True)

        jogadores_disponiveis = jogadores_inscritos.exclude(id__in=jogadores_em_mesas)

        # Dados dos jogadores disponíveis
        from usuarios.models import Usuario
        jogadores_disp_list = Usuario.objects.filter(
            id__in=jogadores_disponiveis
        ).values('id', 'username')

        # Mesas já criadas
        mesas = Mesa.objects.filter(id_rodada=rodada).prefetch_related('jogadores_na_mesa__id_usuario')
        mesas_list = []

        for mesa in mesas:
            jogadores_mesa = []
            for mj in mesa.jogadores_na_mesa.all():
                jogadores_mesa.append({
                    'id': mj.id_usuario.id,
                    'username': mj.id_usuario.username,
                    'time': mj.time
                })
            mesas_list.append({
                'id': mesa.id,
                'numero_mesa': mesa.numero_mesa,
                'jogadores': jogadores_mesa
            })

        return Response({
            'jogadores_disponiveis': list(jogadores_disp_list),
            'mesas_criadas': mesas_list,
            'status_emparelhamento': rodada.status
        }, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        method='post',
        request_body=EmparelhamentoAutomaticoSerializer,
        responses={
            200: openapi.Response(description="Emparelhamento realizado com sucesso"),
            400: 'Erro de validação',
            403: 'Acesso negado'
        },
        operation_summary="Emparelhar jogadores automaticamente",
        operation_description="""Realiza emparelhamento automático dos jogadores usando sistema Random ou Swiss."""
    )
    @action(detail=True, methods=['post'], permission_classes=[IsLojaOuAdmin])
    def emparelhar_automatico(self, request, pk=None):
        """Realiza emparelhamento automático dos jogadores"""
        rodada = self.get_object()
        serializer = EmparelhamentoAutomaticoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Verificações
        if rodada.id_torneio.id_loja != self.request.user and self.request.user.tipo != 'ADMIN':
            return Response({"detail": "Acesso negado"}, status=status.HTTP_403_FORBIDDEN)

        if rodada.status != 'Emparelhamento':
            return Response({"detail": "Rodada não está em fase de emparelhamento"}, status=status.HTTP_400_BAD_REQUEST)

        tipo = serializer.validated_data['tipo']

        with transaction.atomic():
            # Remove emparelhamentos existentes
            MesaJogador.objects.filter(id_mesa__id_rodada=rodada).delete()
            Mesa.objects.filter(id_rodada=rodada).delete()

            # Busca jogadores inscritos
            jogadores_inscritos = list(Inscricao.objects.filter(
                id_torneio=rodada.id_torneio,
                status='Inscrito'
            ).values_list('id_usuario', flat=True))

            if len(jogadores_inscritos) < 4:
                return Response({"detail": "São necessários pelo menos 4 jogadores"}, status=status.HTTP_400_BAD_REQUEST)

            # Realiza emparelhamento
            if tipo == 'random':
                random.shuffle(jogadores_inscritos)
                mesas_criadas = self._emparelhar_random(rodada, jogadores_inscritos)
            else:  # swiss
                jogadores_pontuacao = TorneioViewSet._calcular_pontuacao_jogadores(
                    TorneioViewSet(), rodada.id_torneio
                )
                jogadores_ordenados = sorted(
                    jogadores_pontuacao.items(),
                    key=lambda x: x[1],
                    reverse=True
                )
                mesas_criadas = self._emparelhar_swiss_novo(rodada, jogadores_ordenados, jogadores_inscritos)

            return Response({
                'message': f'Emparelhamento automático ({tipo}) realizado',
                'mesas_criadas': mesas_criadas,
                'total_jogadores': len(jogadores_inscritos)
            }, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        method='post',
        responses={
            200: openapi.Response(description="Emparelhamento resetado com sucesso"),
            400: 'Erro de validação',
            403: 'Acesso negado'
        },
        operation_summary="Re-emparelhar rodada",
        operation_description="""Reseta o emparelhamento atual permitindo novo emparelhamento automático."""
    )
    @action(detail=True, methods=['post'], permission_classes=[IsLojaOuAdmin])
    def reemparelhar(self, request, pk=None):
        """Reseta emparelhamento para permitir novo emparelhamento automático"""
        rodada = self.get_object()

        if rodada.id_torneio.id_loja != self.request.user and self.request.user.tipo != 'ADMIN':
            return Response({"detail": "Acesso negado"}, status=status.HTTP_403_FORBIDDEN)

        # Só permite re-emparelhar se rodada estiver em fase de emparelhamento
        if rodada.status != 'Emparelhamento':
            return Response({
                "detail": "Rodada deve estar em fase de emparelhamento."
            }, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Remove mesas existentes (mas mantém a rodada)
            Mesa.objects.filter(id_rodada=rodada).delete()
            MesaJogador.objects.filter(id_mesa__id_rodada=rodada).delete()

            # Aqui faz sentido resetar emparelhamento para permitir executar novamente automaticamente
            # Mas não voltamos ao status anterior já que agora temos apenas 'Emparelhamento'
            # Em vez disso, executamos novo emparelhamento automático imediatamente

            # Re-executa emparelhamento automático
            inscricoes_ativas = Inscricao.objects.filter(
                id_torneio=rodada.id_torneio
            ).exclude(status='Cancelado')

            if inscricoes_ativas.count() >= 4:
                # Obtém lista de jogadores e embaralha aleatoriamente
                jogadores = list(inscricoes_ativas.values_list('id_usuario_id', flat=True))
                random.shuffle(jogadores)

                # Calcula quantas mesas completas (4 jogadores) podem ser formadas
                num_mesas = len(jogadores) // 4
                mesas_criadas = 0

                # Cria mesas 2v2 com emparelhamento automático Swiss
                jogadores_pontuacao = TorneioViewSet._calcular_pontuacao_jogadores(TorneioViewSet(), rodada.id_torneio)
                jogadores_ordenados = sorted(
                    jogadores_pontuacao.items(),
                    key=lambda x: x[1],
                    reverse=True
                )

                # Filtrar apenas jogadores que estão inscritos
                jogadores_ordenados = [(j_id, pontos) for j_id, pontos in jogadores_ordenados
                                      if j_id in jogadores]

                for i in range(num_mesas):
                    mesa = Mesa.objects.create(
                        id_rodada=rodada,
                        numero_mesa=i + 1
                    )

                    # Pega 4 jogadores consecutivos do ranking
                    inicio = i * 4
                    jogadores_mesa = jogadores_ordenados[inicio:inicio + 4]

                    # Empareamento Swiss: 1º vs 4º, 2º vs 3º
                    order = [0, 3, 1, 2]  # 1º, 4º, 2º, 3º
                    for j, player_idx in enumerate(order):
                        jogador_id = jogadores_mesa[player_idx][0]
                        time = 1 if j < 2 else 2
                        MesaJogador.objects.create(
                            id_mesa=mesa,
                            id_usuario_id=jogador_id,
                            time=time
                        )

                    mesas_criadas += 1

                mesas_criadas_count = mesas_criadas
            else:
                mesas_criadas_count = 0

            return Response({
                'message': f'Emparelhamento resetado e re-executado automaticamente. {mesas_criadas_count} mesa(s) criada(s).',
                'rodada_id': rodada.id,
                'mesas_criadas': mesas_criadas_count
            }, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        method='post',
        request_body=EditarEmparelhamentoSerializer,
        responses={
            200: openapi.Response(description="Edição realizada com sucesso"),
            400: 'Erro de validação',
            403: 'Acesso negado'
        },
        operation_summary="Editar emparelhamento manualmente",
        operation_description="""Permite mover jogadores entre mesas ou alterar times dentro de mesas."""
    )
    @action(detail=True, methods=['post'], permission_classes=[IsLojaOuAdmin])
    def editar_emparelhamento(self, request, pk=None):
        """Edita emparelhamento manualmente"""
        rodada = self.get_object()
        serializer = EditarEmparelhamentoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if rodada.id_torneio.id_loja != self.request.user and self.request.user.tipo != 'ADMIN':
            return Response({"detail": "Acesso negado"}, status=status.HTTP_403_FORBIDDEN)

        if rodada.status != 'Emparelhamento':
            return Response({
                "detail": "Somente é possível editar emparelhamento durante fase de emparelhamento."
            }, status=status.HTTP_400_BAD_REQUEST)

        acao = serializer.validated_data['acao']
        jogador_id = serializer.validated_data['jogador_id']

        with transaction.atomic():
            if acao == 'mover_jogador_para_mesa':
                nova_mesa_id = serializer.validated_data['nova_mesa_id']
                sucesso = self._mover_jogador_para_mesa(rodada, jogador_id, nova_mesa_id)
                if not sucesso:
                    return Response({"detail": "Não foi possível mover jogador."}, status=status.HTTP_400_BAD_REQUEST)
            elif acao == 'alterar_time_jogador':
                novo_time = serializer.validated_data['novo_time']
                sucesso = self._alterar_time_jogador(rodada, jogador_id, novo_time)
                if not sucesso:
                    return Response({"detail": "Não foi possível alterar time do jogador."}, status=status.HTTP_400_BAD_REQUEST)



            return Response({
                'message': f'Ação {acao} realizada com sucesso',
                'jogador_id': jogador_id
            }, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        method='post',
        request_body=IniciarRodadaSerializer,
        responses={
            200: openapi.Response(description="Rodada iniciada com sucesso"),
            400: 'Erro de validação',
            403: 'Acesso negado'
        },
        operation_summary="Iniciar rodada emparelhada",
        operation_description="""Conclui fase de emparelhamento e inicia a rodada para jogos."""
    )
    @action(detail=True, methods=['post'], permission_classes=[IsLojaOuAdmin])
    def iniciar_rodada(self, request, pk=None):
        """Inicia a rodada emparelhada e permite que jogadores reportem resultados"""
        rodada = self.get_object()
        serializer = IniciarRodadaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if rodada.id_torneio.id_loja != self.request.user and self.request.user.tipo != 'ADMIN':
            return Response({"detail": "Acesso negado"}, status=status.HTTP_403_FORBIDDEN)

        if rodada.status != 'Emparelhamento':
            return Response({"detail": "Emparelhamento deve estar concluído antes de iniciar a rodada"}, status=status.HTTP_400_BAD_REQUEST)

        mesas = Mesa.objects.filter(id_rodada=rodada)
        forcar = serializer.validated_data.get('forcar_inicio', False)

        if not forcar:
            # Verifica se todas as mesas têm exatamente 4 jogadores
            for mesa in mesas:
                count_jogadores = MesaJogador.objects.filter(id_mesa=mesa).count()
                if count_jogadores != 4:
                    return Response({
                        "detail": f"Mesa {mesa.numero_mesa} tem {count_jogadores} jogadores. Use forcar_inicio=true ou ajuste emparelhamento."
                    }, status=status.HTTP_400_BAD_REQUEST)

        # CORREÇÃO: Muda o status para "Em Andamento" para permitir que jogadores reportem resultados
        rodada.status = 'Em Andamento'
        rodada.save()

        return Response({
            'message': 'Rodada iniciada com sucesso. Jogadores podem agora reportar resultados das mesas.',
            'mesas_criadas': mesas.count()
        }, status=status.HTTP_200_OK)

    def _emparelhar_random(self, rodada, jogadores):
        """Emparelhamento aleatório"""
        num_mesas = len(jogadores) // 4
        mesas_criadas = 0

        for i in range(num_mesas):
            mesa = Mesa.objects.create(id_rodada=rodada, numero_mesa=i + 1)
            jogadores_mesa = jogadores[i*4:(i+1)*4]

            for j, jogador_id in enumerate(jogadores_mesa):
                MesaJogador.objects.create(
                    id_mesa=mesa,
                    id_usuario_id=jogador_id,
                    time=1 if j < 2 else 2
                )
            mesas_criadas += 1

        return mesas_criadas

    def _emparelhar_swiss_novo(self, rodada, jogadores_ordenados, jogadores_inscritos):
        """Emparelhamento Swiss considerando apenas jogadores inscritos na rodada atual"""
        # Filtrar apenas jogadores que estão inscritos
        jogadores_ordenados = [(j_id, pontos) for j_id, pontos in jogadores_ordenados
                              if j_id in jogadores_inscritos]

        num_mesas = len(jogadores_ordenados) // 4
        mesas_criadas = 0

        for i in range(num_mesas):
            mesa = Mesa.objects.create(id_rodada=rodada, numero_mesa=i + 1)
            inicio = i * 4
            jogadores_mesa = jogadores_ordenados[inicio:inicio + 4]

            # Swiss pairing: 1º vs 4º, 2º vs 3º
            order = [0, 3, 1, 2]  # 1º, 4º, 2º, 3º
            for j, player_idx in enumerate(order):
                jogador_id = jogadores_mesa[player_idx][0]
                time = 1 if j < 2 else 2
                MesaJogador.objects.create(
                    id_mesa=mesa,
                    id_usuario_id=jogador_id,
                    time=time
                )
            mesas_criadas += 1

        return mesas_criadas

    def _mover_jogador_para_mesa(self, rodada, jogador_id, mesa_id):
        """Move jogador para uma mesa específica ou remove de mesa"""
        if mesa_id is None:
            # Remove jogador da mesa atual
            count = MesaJogador.objects.filter(
                id_mesa__id_rodada=rodada,
                id_usuario_id=jogador_id
            ).delete()
            return count[0] > 0  # Retorna True se removeu alguma linha
        else:
            # Remove de mesa atual se estiver em uma
            MesaJogador.objects.filter(
                id_mesa__id_rodada=rodada,
                id_usuario_id=jogador_id
            ).delete()

            # Adiciona à nova mesa
            MesaJogador.objects.create(
                id_mesa_id=mesa_id,
                id_usuario_id=jogador_id,
                time=1  # Por padrão Time 1
            )
            return True

    def _remover_mesa(self, rodada, mesa_id):
        """Remove mesa e seus jogadores"""
        MesaJogador.objects.filter(id_mesa_id=mesa_id).delete()
        Mesa.objects.filter(id=mesa_id).delete()

    def _adicionar_mesa_vazia(self, rodada):
        """Adiciona mesa vazia"""
        numero_mesa = Mesa.objects.filter(id_rodada=rodada).count() + 1
        Mesa.objects.create(id_rodada=rodada, numero_mesa=numero_mesa)

    def _alterar_time_jogador(self, rodada, jogador_id, novo_time):
        """Altera time do jogador"""
        count = MesaJogador.objects.filter(
            id_mesa__id_rodada=rodada,
            id_usuario_id=jogador_id
        ).update(time=novo_time)

        return count > 0

    @swagger_auto_schema(
        method='post',
        request_body=EditarEmparelhamentoSerializer,
        responses={
            200: openapi.Response(description="Edição realizada com sucesso"),
            400: 'Erro de validação',
            403: 'Acesso negado'
        },
        operation_summary="Editar emparelhamento manualmente",
        operation_description="""Permite mover jogadores entre mesas ou alterar times dentro de mesas."""
    )
    @action(detail=True, methods=['post'], permission_classes=[IsLojaOuAdmin])
    def editar_emparelhamento(self, request, pk=None):
        """Edita emparelhamento manualmente"""
        rodada = self.get_object()
        serializer = EditarEmparelhamentoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if rodada.id_torneio.id_loja != self.request.user and self.request.user.tipo != 'ADMIN':
            return Response({"detail": "Acesso negado"}, status=status.HTTP_403_FORBIDDEN)

        if rodada.status not in ['Emparelhamento_Em_Andamento', 'Pronto_Para_Iniciar']:
            return Response({
                "detail": "Somente é possível editar emparelhamento durante fase de emparelhamento."
            }, status=status.HTTP_400_BAD_REQUEST)

        acao = serializer.validated_data['acao']
        jogador_id = serializer.validated_data['jogador_id']

        with transaction.atomic():
            if acao == 'mover_jogador_para_mesa':
                nova_mesa_id = serializer.validated_data.get('nova_mesa_id')
                sucesso = self._mover_jogador_para_mesa(rodada, jogador_id, nova_mesa_id)
                if not sucesso:
                    return Response({"detail": "Não foi possível mover jogador."}, status=status.HTTP_400_BAD_REQUEST)
            elif acao == 'alterar_time_jogador':
                novo_time = serializer.validated_data.get('novo_time')
                sucesso = self._alterar_time_jogador(rodada, jogador_id, novo_time)
                if not sucesso:
                    return Response({"detail": "Não foi possível alterar time do jogador."}, status=status.HTTP_400_BAD_REQUEST)

            rodada.status = 'Emparelhamento_Em_Andamento'
            rodada.save()

            return Response({
                'message': f'Ação {acao} realizada com sucesso',
                'jogador_id': jogador_id
            }, status=status.HTTP_200_OK)

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
    Lista mesas filtradas por rodada_id com detalhes completos incluindo jogadores.
    """
    queryset = Mesa.objects.all()
    serializer_class = MesaSerializer
    permission_classes = [IsLojaOuAdmin | IsApenasLeitura]

    def get_queryset(self):
        """
        Filtra mesas por rodada_id quando parâmetro fornecido
        """
        queryset = Mesa.objects.all()
        rodada_id = self.request.query_params.get('rodada_id')

        if rodada_id:
            queryset = queryset.filter(id_rodada_id=rodada_id).prefetch_related(
                'jogadores_na_mesa',
                'jogadores_na_mesa__id_usuario'
            ).order_by('numero_mesa')

        return queryset

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
