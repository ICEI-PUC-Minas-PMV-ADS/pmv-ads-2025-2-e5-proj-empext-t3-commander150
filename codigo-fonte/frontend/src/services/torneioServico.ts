/**
 * Serviço de Torneio.
 *
 * Este arquivo funciona como o "motor" da nossa comunicação com torneios.
 * Ele contém todas as funções que fazem a comunicação direta com os endpoints
 * da API relacionados a torneios (CRUD completo).
 *
 * A principal característica deste serviço é que ele é "burro": ele não
 * sabe nada sobre o estado da aplicação, alertas ou gerenciamento de dados.
 * Sua única responsabilidade é fazer a requisição, e retornar os dados em
 * caso de sucesso ou um erro em caso de falha, que será tratado por quem o
 * chamou (componentes ou contextos).
 */

import api from './api';
import type { 
  ITorneio, 
  ITorneioCriacao, 
  ITorneioAtualizacao, 
  IListaTorneios 
} from '../tipos/tipos';
import { AxiosError } from "axios";

/**
 * Busca todos os torneios com paginação.
 * 
 * @param pagina - Número da página (opcional, padrão: 1)
 * @param limite - Quantidade de itens por página (opcional, padrão: 10)
 * @returns Lista paginada de torneios
 */
export const buscarTorneios = async (
  pagina: number = 1, 
  limite: number = 10
): Promise<IListaTorneios> => {
  const resposta = await api.get('/torneios/torneios/', {
    params: {
      page: pagina,
      page_size: limite
    }
  });
  return resposta.data;
};

/**
 * Busca um torneio específico pelo ID.
 * 
 * @param id - ID do torneio
 * @returns Dados do torneio
 */
export const buscarTorneioPorId = async (id: number): Promise<ITorneio> => {
  const resposta = await api.get(`/torneios/torneios/${id}/`);
  return resposta.data;
};

/**
 * Cria um novo torneio.
 * 
 * @param dadosTorneio - Dados do torneio a ser criado
 * @returns Dados do torneio criado
 */
export const criarTorneio = async (dadosTorneio: ITorneioCriacao): Promise<ITorneio> => {
  // Se há um arquivo de banner, usar FormData
  if (dadosTorneio.banner) {
    const formData = new FormData();
    
    // Adicionar todos os campos ao FormData
    formData.append('nome', dadosTorneio.nome);
    if (dadosTorneio.descricao) formData.append('descricao', dadosTorneio.descricao);
    formData.append('status', dadosTorneio.status);
    formData.append('regras', dadosTorneio.regras);
    formData.append('banner', dadosTorneio.banner);
    formData.append('vagas_limitadas', dadosTorneio.vagas_limitadas.toString());
    if (dadosTorneio.qnt_vagas) formData.append('qnt_vagas', dadosTorneio.qnt_vagas.toString());
    formData.append('incricao_gratuita', dadosTorneio.incricao_gratuita.toString());
    if (dadosTorneio.valor_incricao) formData.append('valor_incricao', dadosTorneio.valor_incricao.toString());
    formData.append('pontuacao_vitoria', dadosTorneio.pontuacao_vitoria.toString());
    formData.append('pontuacao_derrota', dadosTorneio.pontuacao_derrota.toString());
    formData.append('pontuacao_empate', dadosTorneio.pontuacao_empate.toString());
    formData.append('pontuacao_bye', dadosTorneio.pontuacao_bye.toString());
    if (dadosTorneio.quantidade_rodadas) formData.append('quantidade_rodadas', dadosTorneio.quantidade_rodadas.toString());
    formData.append('data_inicio', dadosTorneio.data_inicio);
    formData.append('id_loja', dadosTorneio.id_loja.toString());

    const resposta = await api.post('/torneios/torneios/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return resposta.data;
  } else {
    // Se não há arquivo, enviar como JSON normal
    const resposta = await api.post('/torneios/torneios/', dadosTorneio);
    return resposta.data;
  }
};

/**
 * Atualiza um torneio existente.
 * 
 * @param id - ID do torneio a ser atualizado
 * @param dadosTorneio - Novos dados do torneio
 * @returns Dados do torneio atualizado
 */
export const atualizarTorneio = async (
  id: number, 
  dadosTorneio: ITorneioAtualizacao
): Promise<ITorneio> => {
  const resposta = await api.put(`/torneios/torneios/${id}/`, dadosTorneio);
  return resposta.data;
};

/**
 * Atualiza parcialmente um torneio existente (PATCH).
 * 
 * @param id - ID do torneio a ser atualizado
 * @param dadosTorneio - Dados parciais do torneio
 * @returns Dados do torneio atualizado
 */
export const atualizarTorneioParcial = async (
  id: number, 
  dadosTorneio: Partial<ITorneioAtualizacao>
): Promise<ITorneio> => {
  const resposta = await api.patch(`/torneios/torneios/${id}/`, dadosTorneio);
  return resposta.data;
};

/**
 * Remove um torneio.
 * 
 * @param id - ID do torneio a ser removido
 * @returns Confirmação da remoção
 */
export const removerTorneio = async (id: number): Promise<void> => {
  await api.delete(`/torneios/torneios/${id}/`);
};

/**
 * Busca torneios por status.
 * 
 * @param status - Status dos torneios a buscar
 * @param pagina - Número da página (opcional, padrão: 1)
 * @param limite - Quantidade de itens por página (opcional, padrão: 10)
 * @returns Lista paginada de torneios com o status especificado
 */
export const buscarTorneiosPorStatus = async (
  status: string,
  pagina: number = 1, 
  limite: number = 10
): Promise<IListaTorneios> => {
  const resposta = await api.get('/torneios/torneios/', {
    params: {
      status: status,
      page: pagina,
      page_size: limite
    }
  });
  return resposta.data;
};

/**
 * Busca torneios por loja.
 * 
 * @param idLoja - ID da loja
 * @param pagina - Número da página (opcional, padrão: 1)
 * @param limite - Quantidade de itens por página (opcional, padrão: 10)
 * @returns Lista paginada de torneios da loja
 */
export const buscarTorneiosPorLoja = async (
  idLoja: number,
  pagina: number = 1, 
  limite: number = 10
): Promise<IListaTorneios> => {
  const resposta = await api.get('/torneios/torneios/', {
    params: {
      id_loja: idLoja,
      page: pagina,
      page_size: limite
    }
  });
  return resposta.data;
};

/**
 * Busca torneios com filtros combinados.
 * 
 * @param filtros - Objeto com filtros opcionais
 * @param pagina - Número da página (opcional, padrão: 1)
 * @param limite - Quantidade de itens por página (opcional, padrão: 10)
 * @returns Lista paginada de torneios filtrados
 */
export const buscarTorneiosComFiltros = async (
  filtros: {
    status?: string;
    id_loja?: number;
    data_inicio?: string;
    data_fim?: string;
    nome?: string;
  },
  pagina: number = 1, 
  limite: number = 10
): Promise<IListaTorneios> => {
  const resposta = await api.get('/torneios/torneios/', {
    params: {
      ...filtros,
      page: pagina,
      page_size: limite
    }
  });
  return resposta.data;
};

/**
 * Inscreve um usuário em um torneio.
 * 
 * @param dadosInscricao - Dados da inscrição
 * @returns Confirmação da inscrição
 */
export const inscreverNoTorneio = async (dadosInscricao: {
  id_torneio: number;
  decklist?: string;
  id_usuario?: number;
}): Promise<{ message: string }> => {
  const resposta = await api.post('/torneios/inscricoes/', dadosInscricao);
  return resposta.data;
};

/**
 * Utilitário para tratar erros de torneio de forma consistente.
 * 
 * @param erro - Erro do Axios
 * @returns Mensagem de erro amigável
 */
export const tratarErroTorneio = (erro: unknown): string => {
  if (erro instanceof AxiosError) {
    if (erro.response?.status === 404) {
      return 'Torneio não encontrado.';
    }
    if (erro.response?.status === 400) {
      return 'Dados inválidos. Verifique as informações enviadas.';
    }
    if (erro.response?.status === 403) {
      return 'Você não tem permissão para realizar esta ação.';
    }
    if (erro.response?.status === 500) {
      return 'Erro interno do servidor. Tente novamente mais tarde.';
    }
    return erro.response?.data?.message || 'Erro desconhecido ao processar torneio.';
  }
  return 'Erro inesperado ao processar torneio.';
};

