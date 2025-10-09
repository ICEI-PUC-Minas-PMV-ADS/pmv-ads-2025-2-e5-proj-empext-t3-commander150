/**
 * Serviço de Mesa
 *
 * Este arquivo contém funções para comunicação com endpoints da API
 * relacionados a mesas de jogo em torneios.
 */

import api from './api';
import type { IMesaAtiva, IRodada, IMesaRodada } from '../tipos/tipos';

/**
 * Busca a mesa ativa do jogador em uma rodada específica.
 *
 * @param rodadaId - ID da rodada
 * @returns Os dados da mesa onde o jogador está alocado
 */
export const buscarMinhaMesaNaRodada = async (rodadaId: number): Promise<IMesaAtiva> => {
  const resposta = await api.get(`/torneios/mesas/minha_mesa_na_rodada/`, {
    params: { rodada_id: rodadaId }
  });
  return resposta.data;
};

/**
 * Reporta o resultado de uma mesa.
 *
 * @param mesaId - ID da mesa
 * @param pontuacaoTime1 - Pontuação do time 1
 * @param pontuacaoTime2 - Pontuação do time 2
 * @param timeVencedor - Time vencedor (0=Empate, 1=Time 1, 2=Time 2)
 * @returns Os dados da mesa atualizada
 */
export const reportarResultadoMesa = async (
  mesaId: number,
  pontuacaoTime1: number,
  pontuacaoTime2: number,
  timeVencedor: number
): Promise<IMesaAtiva> => {
  const resposta = await api.post(`/torneios/mesas/${mesaId}/reportar_resultado/`, {
    pontuacao_time_1: pontuacaoTime1,
    pontuacao_time_2: pontuacaoTime2,
    time_vencedor: timeVencedor
  });
  return resposta.data.mesa;
};

/**
 * Busca todas as rodadas de um torneio.
 *
 * @param torneioId - ID do torneio
 * @returns Lista de rodadas do torneio
 */
export const buscarRodadasDoTorneio = async (torneioId: number): Promise<IRodada[]> => {
  const resposta = await api.get('/torneios/rodadas/', {
    params: { torneio_id: torneioId }
  });
  return resposta.data.results || resposta.data;
};

/**
 * Busca todas as mesas de uma rodada específica.
 *
 * @param rodadaId - ID da rodada
 * @returns Lista de mesas da rodada
 */
export const buscarMesasDaRodada = async (rodadaId: number): Promise<IMesaRodada[]> => {
  const resposta = await api.get('/torneios/mesas/', {
    params: { rodada_id: rodadaId }
  });
  return resposta.data.results || resposta.data;
};

/**
 * Atualiza o resultado de uma mesa (usado pela LOJA).
 * Diferente de reportarResultadoMesa, este endpoint usa editar_manual e é exclusivo para loja/admin.
 *
 * @param mesaId - ID da mesa
 * @param pontuacaoTime1 - Pontuação do time 1
 * @param pontuacaoTime2 - Pontuação do time 2
 * @param timeVencedor - Time vencedor (0=Empate, 1=Time 1, 2=Time 2)
 * @returns Os dados da mesa atualizada
 */
export const atualizarResultadoMesa = async (
  mesaId: number,
  pontuacaoTime1: number,
  pontuacaoTime2: number,
  timeVencedor: number
): Promise<IMesaRodada> => {
  const resposta = await api.patch(`/torneios/mesas/${mesaId}/editar_manual/`, {
    pontuacao_time_1: pontuacaoTime1,
    pontuacao_time_2: pontuacaoTime2,
    time_vencedor: timeVencedor
  });
  return resposta.data.mesa;
};
