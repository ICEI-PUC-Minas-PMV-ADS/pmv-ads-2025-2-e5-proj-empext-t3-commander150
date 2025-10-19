from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from django.db import transaction
from django.db.models import Sum, Count, Q
import random

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
        
        # Validação: Não exceder número máximo de rodadas
        if torneio.quantidade_rodadas and rodada_atual.numero_rodada >= torneio.quantidade_rodadas:
            return Response(
                {"detail": f"Número máximo de rodadas ({torneio.quantidade_rodadas}) atingido. Use o endpoint de finalizar torneio."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Finaliza rodada atual
            rodada_atual.status = 'Finalizada'
            rodada_atual.save(update_fields=['status'])
            
            # Calcula pontuação de cada jogador
            jogadores_pontuacao = self._calcular_pontuacao_jogadores(torneio)
            
            # Ordena por pontuação (maior para menor)
            jogadores_ordenados = sorted(
                jogadores_pontuacao.items(),
                key=lambda x: x[1],
                reverse=True
            )
            
            # Cria nova rodada
            nova_rodada = Rodada.objects.create(
                id_torneio=torneio,
                numero_rodada=rodada_atual.numero_rodada + 1,
                status='Em Andamento'
            )
            
            # Cria mesas com Swiss pairing
            mesas_criadas = self._criar_mesas_swiss(nova_rodada, jogadores_ordenados, torneio)
        
        return Response({
            'message': f'Rodada {nova_rodada.numero_rodada} criada com sucesso',
            'rodada': RodadaSerializer(nova_rodada).data,
            'mesas_criadas': mesas_criadas
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
            
            # Calcula pontuação final de todos os jogadores
            jogadores_pontuacao = self._calcular_pontuacao_jogadores(torneio)
            
            # Gera ranking ordenado
            ranking = []
            jogadores_ordenados = sorted(
                jogadores_pontuacao.items(),
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
