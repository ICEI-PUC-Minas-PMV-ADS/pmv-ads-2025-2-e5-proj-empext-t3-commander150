/**
 * Serviço de Mesa
 *
 * Este arquivo contém funções para comunicação com endpoints da API
 * relacionados a mesas de jogo em torneios.
 */

import api from './api';
import type { IMesaAtiva } from '../tipos/tipos';

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
