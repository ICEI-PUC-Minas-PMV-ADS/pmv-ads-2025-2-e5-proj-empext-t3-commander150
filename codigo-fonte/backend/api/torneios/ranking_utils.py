"""
Utilitários para cálculo de ranking de torneios 2v2 com duplas aleatórias.

Este módulo implementa o algoritmo de desempate avançado documentado em
ALGORITMO_PAREAMENTO_2V2.md, com otimizações de performance.

Critérios de desempate (em cascata):
1. Pontuação Total (Match Points)
2. Balanço (OMW% - PMW%) - Métrica principal para duplas aleatórias
3. OMW% (Opponent Match Win %) - Força dos oponentes
4. MW% (Match Win %) - Porcentagem de vitórias individual

Otimizações implementadas:
- Memoization de MW% ajustado (evita cálculos repetidos)
- MW% base pré-calculado
- Índices no banco de dados
- select_related para evitar N+1 queries
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Set, Optional, List, Tuple
from django.db import transaction

from .models import Torneio, Rodada, Mesa, MesaJogador, Inscricao, RankingParcial


# Constante para arredondamento decimal
QUATRO_CASAS = Decimal('0.0001')
FLOOR_MW = Decimal('0.3300')  # 33% floor (padrão Magic)


def construir_historico_ate_rodada(torneio: Torneio, rodada_numero: int) -> Dict:
    """
    Busca todas as rodadas finalizadas até rodada_numero e constrói
    estruturas em memória para cálculos eficientes.

    Retorna:
        dict com:
        - pontos_por_rodada: {jogador_id: {rodada: pontos}}
        - parceiros: {jogador_id: {rodada: parceiro_id}}
        - oponentes: {jogador_id: {rodada: [op1_id, op2_id]}}
        - mw_base: {jogador_id: pontos_totais}  # Otimização
        - num_rodadas_jogadas: {jogador_id: count}  # Otimização
    """
    # 1 query otimizada com prefetch_related
    rodadas = Rodada.objects.filter(
        id_torneio=torneio,
        numero_rodada__lte=rodada_numero,
        status='Finalizada'
    ).prefetch_related(
        'mesas__jogadores_na_mesa__id_usuario'
    ).order_by('numero_rodada')

    # Estruturas em memória
    pontos_por_rodada = {}
    parceiros = {}
    oponentes = {}

    # Processar todas as mesas
    for rodada in rodadas:
        for mesa in rodada.mesas.all():
            jogadores_time_1 = []
            jogadores_time_2 = []

            # Separar por time
            for jogador_mesa in mesa.jogadores_na_mesa.all():
                if jogador_mesa.time == 1:
                    jogadores_time_1.append(jogador_mesa.id_usuario_id)
                else:
                    jogadores_time_2.append(jogador_mesa.id_usuario_id)

            # Determinar pontos por resultado
            if mesa.time_vencedor == 0:  # Empate
                pontos_time_1 = torneio.pontuacao_empate
                pontos_time_2 = torneio.pontuacao_empate
            elif mesa.time_vencedor == 1:
                pontos_time_1 = torneio.pontuacao_vitoria
                pontos_time_2 = torneio.pontuacao_derrota
            else:  # time_vencedor == 2
                pontos_time_1 = torneio.pontuacao_derrota
                pontos_time_2 = torneio.pontuacao_vitoria

            # Registrar para Time 1
            if len(jogadores_time_1) == 2:
                j1, j2 = jogadores_time_1

                # Inicializar dicts se necessário
                for jid in [j1, j2]:
                    if jid not in pontos_por_rodada:
                        pontos_por_rodada[jid] = {}
                        parceiros[jid] = {}
                        oponentes[jid] = {}

                # Pontos
                pontos_por_rodada[j1][rodada.numero_rodada] = pontos_time_1
                pontos_por_rodada[j2][rodada.numero_rodada] = pontos_time_1

                # Parceiros
                parceiros[j1][rodada.numero_rodada] = j2
                parceiros[j2][rodada.numero_rodada] = j1

                # Oponentes
                oponentes[j1][rodada.numero_rodada] = jogadores_time_2
                oponentes[j2][rodada.numero_rodada] = jogadores_time_2

            # Registrar para Time 2
            if len(jogadores_time_2) == 2:
                j1, j2 = jogadores_time_2

                for jid in [j1, j2]:
                    if jid not in pontos_por_rodada:
                        pontos_por_rodada[jid] = {}
                        parceiros[jid] = {}
                        oponentes[jid] = {}

                pontos_por_rodada[j1][rodada.numero_rodada] = pontos_time_2
                pontos_por_rodada[j2][rodada.numero_rodada] = pontos_time_2

                parceiros[j1][rodada.numero_rodada] = j2
                parceiros[j2][rodada.numero_rodada] = j1

                oponentes[j1][rodada.numero_rodada] = jogadores_time_1
                oponentes[j2][rodada.numero_rodada] = jogadores_time_1

    # Adicionar jogadores com bye (não estão em nenhuma mesa)
    jogadores_ativos = Inscricao.objects.filter(
        id_torneio=torneio,
        status='Inscrito'
    ).values_list('id_usuario_id', flat=True)

    for jogador_id in jogadores_ativos:
        if jogador_id not in pontos_por_rodada:
            pontos_por_rodada[jogador_id] = {}
            parceiros[jogador_id] = {}
            oponentes[jogador_id] = {}

        # Adicionar byes
        for r in range(1, rodada_numero + 1):
            if r not in pontos_por_rodada[jogador_id]:
                # Jogador teve bye nesta rodada
                pontos_por_rodada[jogador_id][r] = torneio.pontuacao_bye
                parceiros[jogador_id][r] = None
                oponentes[jogador_id][r] = []

    # Otimização 2: Pré-calcular MW% base
    mw_base = {}
    num_rodadas_jogadas = {}

    for jogador_id in pontos_por_rodada:
        total_pontos = sum(pontos_por_rodada[jogador_id].values())
        num_rodadas = len([r for r in range(1, rodada_numero + 1)
                          if r in pontos_por_rodada[jogador_id]])

        mw_base[jogador_id] = total_pontos
        num_rodadas_jogadas[jogador_id] = num_rodadas

    return {
        'pontos_por_rodada': pontos_por_rodada,
        'parceiros': parceiros,
        'oponentes': oponentes,
        'mw_base': mw_base,
        'num_rodadas_jogadas': num_rodadas_jogadas
    }


def calcular_mw_ajustado(
    jogador_alvo: int,
    jogador_ref: int,
    rodada_numero: int,
    dados: Dict,
    torneio: Torneio
) -> Optional[float]:
    """
    Calcula MW% do jogador_alvo até rodada_numero,
    EXCLUINDO rodadas onde jogou com/contra jogador_ref.

    Args:
        jogador_alvo: ID do jogador cuja força queremos calcular
        jogador_ref: ID do jogador de referência (excluir rodadas compartilhadas)
        rodada_numero: Até qual rodada calcular
        dados: Dados retornados por construir_historico_ate_rodada()
        torneio: Instância do torneio

    Returns:
        float: MW% ajustado (com floor de 33%)
        None: Se não houver rodadas válidas (ignorar do cálculo)
    """
    pontos_validos = 0
    rodadas_validas = 0

    for r in range(1, rodada_numero + 1):
        # Verificar se jogaram juntos nesta rodada
        foi_parceiro = (
            r in dados['parceiros'][jogador_ref] and
            dados['parceiros'][jogador_ref][r] == jogador_alvo
        )
        foi_oponente = (
            r in dados['oponentes'][jogador_ref] and
            jogador_alvo in dados['oponentes'][jogador_ref][r]
        )

        if not (foi_parceiro or foi_oponente):
            # Rodada válida - incluir pontos
            pontos_validos += dados['pontos_por_rodada'][jogador_alvo].get(r, 0)
            rodadas_validas += 1

    if rodadas_validas == 0:
        return None  # Ignorar este jogador do cálculo

    pontos_maximos = rodadas_validas * torneio.pontuacao_vitoria
    mw = pontos_validos / pontos_maximos if pontos_maximos > 0 else 0
    return max(mw, 0.33)  # Aplicar floor


def calcular_metricas_jogador(
    jogador_id: int,
    rodada_numero: int,
    dados: Dict,
    torneio: Torneio,
    cache_mw_ajustado: Dict[Tuple[int, int], Optional[float]]
) -> Dict:
    """
    Calcula todas as métricas de um jogador até a rodada especificada.

    Args:
        jogador_id: ID do jogador
        rodada_numero: Até qual rodada calcular
        dados: Dados retornados por construir_historico_ate_rodada()
        torneio: Instância do torneio
        cache_mw_ajustado: Cache compartilhado para memoization

    Returns:
        dict com: jogador_id, pontos, mw, omw, pmw, balanco
    """
    pontos_por_rodada = dados['pontos_por_rodada'][jogador_id]
    parceiros_hist = dados['parceiros'][jogador_id]
    oponentes_hist = dados['oponentes'][jogador_id]

    # 1. Pontos Totais (usando pré-calculado)
    pontos_totais = dados['mw_base'][jogador_id]

    # 2. MW%
    num_rodadas = dados['num_rodadas_jogadas'][jogador_id]
    pontos_maximos = num_rodadas * torneio.pontuacao_vitoria
    mw = pontos_totais / pontos_maximos if pontos_maximos > 0 else 0
    mw = max(mw, 0.33)  # Floor

    # 3. Coletar oponentes e parceiros únicos
    oponentes_unicos = set()
    parceiros_unicos = set()

    for r in range(1, rodada_numero + 1):
        if r in parceiros_hist and parceiros_hist[r]:  # Não é bye
            parceiros_unicos.add(parceiros_hist[r])
        if r in oponentes_hist:
            oponentes_unicos.update(oponentes_hist[r])

    # Função auxiliar para usar cache (Otimização 1: Memoization)
    def get_mw_ajustado_cached(alvo, ref):
        key = (alvo, ref)
        if key not in cache_mw_ajustado:
            cache_mw_ajustado[key] = calcular_mw_ajustado(
                alvo, ref, rodada_numero, dados, torneio
            )
        return cache_mw_ajustado[key]

    # 4. OMW% (força dos oponentes)
    omw_soma = 0
    omw_count = 0

    for oponente_id in oponentes_unicos:
        mw_ajustado = get_mw_ajustado_cached(oponente_id, jogador_id)
        if mw_ajustado is not None:  # Ignorar se 0 rodadas válidas
            omw_soma += mw_ajustado
            omw_count += 1

    omw = omw_soma / omw_count if omw_count > 0 else 0.33

    # 5. PMW% (força dos parceiros)
    pmw_soma = 0
    pmw_count = 0

    for parceiro_id in parceiros_unicos:
        mw_ajustado = get_mw_ajustado_cached(parceiro_id, jogador_id)
        if mw_ajustado is not None:
            pmw_soma += mw_ajustado
            pmw_count += 1

    pmw = pmw_soma / pmw_count if pmw_count > 0 else 0.33

    # 6. Balanço
    balanco = omw - pmw

    # Otimização 5: Usar quantize() uma vez no final
    return {
        'jogador_id': jogador_id,
        'pontos': pontos_totais,
        'mw': Decimal(str(mw)).quantize(QUATRO_CASAS, rounding=ROUND_HALF_UP),
        'omw': Decimal(str(omw)).quantize(QUATRO_CASAS, rounding=ROUND_HALF_UP),
        'pmw': Decimal(str(pmw)).quantize(QUATRO_CASAS, rounding=ROUND_HALF_UP),
        'balanco': Decimal(str(balanco)).quantize(QUATRO_CASAS, rounding=ROUND_HALF_UP)
    }


@transaction.atomic
def calcular_e_salvar_ranking_parcial(torneio: Torneio, rodada_numero: int) -> List[Dict]:
    """
    Calcula ranking considerando rodadas 1 até rodada_numero.
    Salva na tabela RankingParcial.

    Args:
        torneio: Instância do torneio
        rodada_numero: Até qual rodada calcular

    Returns:
        list: Ranking ordenado com todas as métricas
    """
    # 1. Buscar dados necessários (1 query otimizada)
    dados = construir_historico_ate_rodada(torneio, rodada_numero)

    # 2. Obter jogadores ativos
    jogadores_ativos = list(dados['pontos_por_rodada'].keys())

    # Otimização 1: Cache de MW% ajustado (evita cálculos repetidos)
    cache_mw_ajustado = {}

    # 3. Calcular métricas para cada jogador
    ranking = []
    for jogador_id in jogadores_ativos:
        metricas = calcular_metricas_jogador(
            jogador_id,
            rodada_numero,
            dados,
            torneio,
            cache_mw_ajustado
        )
        ranking.append(metricas)

    # 4. Ordenar por critérios em cascata
    ranking_ordenado = sorted(
        ranking,
        key=lambda x: (
            x['pontos'],      # 1º critério: Pontuação total
            x['balanco'],     # 2º critério: Balanço (OMW% - PMW%)
            x['omw'],         # 3º critério: OMW%
            x['mw']           # 4º critério: MW%
        ),
        reverse=True
    )

    # 5. Salvar no banco (bulk insert)
    # Deletar registros antigos desta rodada
    RankingParcial.objects.filter(
        id_torneio=torneio,
        rodada_numero=rodada_numero
    ).delete()

    # Criar novos registros
    objetos = []
    for idx, metricas in enumerate(ranking_ordenado):
        objetos.append(RankingParcial(
            id_torneio=torneio,
            id_usuario_id=metricas['jogador_id'],
            rodada_numero=rodada_numero,
            pontos_totais=metricas['pontos'],
            mw_percentage=metricas['mw'],
            omw_percentage=metricas['omw'],
            pmw_percentage=metricas['pmw'],
            balanco=metricas['balanco'],
            posicao=idx + 1
        ))

    RankingParcial.objects.bulk_create(objetos)

    return ranking_ordenado


def obter_jogadores_ativos(torneio: Torneio) -> List[int]:
    """
    Retorna lista de IDs de jogadores ativos (inscritos) no torneio.

    Args:
        torneio: Instância do torneio

    Returns:
        list: IDs dos jogadores ativos
    """
    return list(
        Inscricao.objects.filter(
            id_torneio=torneio,
            status='Inscrito'
        ).values_list('id_usuario_id', flat=True)
    )
