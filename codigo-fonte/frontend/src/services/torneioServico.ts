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
  IListaTorneios,
  IInscricao,
  IUsuario
} from '../tipos/tipos';
import { AxiosError } from "axios";
import type { AxiosResponse } from "axios";

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
 * Busca os jogadores inscritos em um torneio específico.
 *
 * @param idTorneio - ID do torneio
 * @returns Lista de nomes dos jogadores inscritos
 */
export const buscarJogadoresInscritos = async (idTorneio: number): Promise<string[]> => {
  const resposta = await api.get('/torneios/inscricoes/', {
    params: {
      id_torneio: idTorneio
    }
  });
  const inscricoes = resposta.data.results || resposta.data;
  return inscricoes.map((inscricao: any) => inscricao.username);
};

/**
 * Busca todas as inscrições ativas de um torneio específico.
 *
 * @param idTorneio
 * @returns
 */
export const buscarInscricoesAtivasCompletas = async (idTorneio: number): Promise<{
  id: number;
  id_usuario: number;
  username: string;
  email: string;
  id_torneio: number;
  nome_torneio: string;
  decklist?: string;
  status: string;
  data_inscricao: string;
}[]> => {
  const resposta = await api.get('/torneios/inscricoes/', {
    params: {
      id_torneio: idTorneio,
      page_size: 200
    }
  });
  const inscricoes = resposta.data.results || resposta.data;

  // Filtrar apenas inscrições ativas
  return inscricoes.filter((inscricao: any) => inscricao.status !== 'Cancelado');
};
export async function contarInscritosTorneio(idTorneio: number): Promise<number> {
  try {
    const lista = await buscarJogadoresInscritos(idTorneio);
    return Array.isArray(lista) ? lista.length : 0;
  } catch {
    return 0;
  }
}


/**
 * Inicia um torneio.
 * 
 * @param id - ID do torneio a ser iniciado
 * @returns Resposta da API com informações da rodada criada
 */
export const iniciarTorneio = async (id: number): Promise<{
  message: string;
  rodada: any;
  mesas_criadas: number;
  total_jogadores: number;
}> => {
  const resposta = await api.post(`/torneios/torneios/${id}/iniciar/`);
  return resposta.data;
};

/**
 * Avança para a próxima rodada do torneio.
 * 
 * @param id - ID do torneio
 * @returns Resposta da API com informações da nova rodada criada
 */
export const proximaRodadaTorneio = async (id: number): Promise<{
  message: string;
  rodada: any;
  mesas_criadas: number;
}> => {
  const resposta = await api.post(`/torneios/torneios/${id}/proxima_rodada/`);
  return resposta.data;
};

/**
 * Finaliza um torneio.
 * 
 * @param id - ID do torneio a ser finalizado
 * @returns Resposta da API com ranking final
 */
export const finalizarTorneio = async (id: number): Promise<{
  message: string;
  ranking: Array<{
    posicao: number;
    jogador_id: number;
    jogador_nome: string;
    pontos: number;
  }>;
  total_rodadas: number;
}> => {
  const resposta = await api.post(`/torneios/torneios/${id}/finalizar/`);
  return resposta.data;
};

/**
 * Busca jogadores sobressalentes de uma rodada específica.
 */
export async function buscarSobressalentes(rodadaId: number): Promise<{
  id: number;
  username: string;
  email: string;
}[]> {
  try {
    const resposta = await api.get(`/torneios/rodadas/${rodadaId}/sobressalentes/`);
    return resposta.data;
  } catch (error) {
    console.error('Erro ao buscar sobressalentes:', error);
    throw error;
  }
}

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

/** Busca TODAS as inscrições do jogador autenticado (via sessão). */
export async function buscarInscricoes(): Promise<IInscricao[]> {
  const { data } = await api.get("/torneios/inscricoes/");
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

/** Busca TODOS os torneios.
export async function buscarTorneios(): Promise<ITorneio[]> {
  const { data } = await api.get("/torneios/torneios/");
  return Array.isArray(data) ? data : [];
}
*/

/**
 * Utilitário: agrupa em Inscritos / Em Andamento / Histórico
 * cruzando as inscrições do jogador com a lista de torneios.
 */
export async function buscarAgrupadoPorAba() {
  const [inscricoes, torneiosResponse] = await Promise.all([
    buscarInscricoes(),
    buscarTorneios(), // <- retorna IListaTorneios
  ]);

  const torneios: ITorneio[] = Array.isArray((torneiosResponse as any)?.results)
      ? (torneiosResponse as any).results
      : (Array.isArray(torneiosResponse as any) ? (torneiosResponse as any) : []);

  const idsInscritos = new Set(inscricoes.map((i) => i.id_torneio));
  const inscritos = torneios.filter((t) => idsInscritos.has(t.id));

  const norm = (s?: string) => (s ?? "").toString().trim().toLowerCase();
  const andamento = inscritos.filter((t) => norm(t.status) === "em andamento");
  const historico  = inscritos.filter((t) => norm(t.status) === "finalizado");

  return { inscritos, andamento, historico };
}

/** Helper DRF: varre todas as páginas usando `next` (paginado ou array simples) */
async function fetchAllPaginated<T>(path: string): Promise<T[]> {
  let url: string | null = path;
  let acc: T[] = [];
  let opts: any = undefined;

  while (url) {
    const resp: AxiosResponse<any> = await api.get(url, opts);
    const payload = resp.data;

    if (Array.isArray(payload)) {
      acc = acc.concat(payload as T[]);
      break;
    }

    const results: T[] = Array.isArray(payload?.results) ? payload.results : [];
    acc = acc.concat(results);

    url = payload?.next ?? null;
    // após a primeira página o `next` já embute os params
    opts = undefined;
  }

  return acc;
}

/** (LOJA) Busca TODOS os torneios visíveis para a loja autenticada.
 *  O backend já restringe por loja logada em get_queryset, então não precisamos de ?id_loja=
 */
export async function buscarTodosTorneiosDaLoja(): Promise<ITorneio[]> {
  return fetchAllPaginated<ITorneio>("/torneios/torneios/");
}

/** (LOJA) Agrupa: “Seus Torneios” (abertos), “Em Andamento”, “Histórico” (finalizados) */
export async function buscarAgrupadoPorAbaLoja() {
  const torneios = await buscarTodosTorneiosDaLoja();
  const norm = (s?: string) => (s ?? "").toString().trim().toLowerCase();

  // tolera pequenas variações de texto vindas do backend
  const isAberto     = (s?: string) => ["aberto", "em aberto", "open"].includes(norm(s));
  const isAndamento  = (s?: string) => ["em andamento", "andamento", "running"].includes(norm(s));
  const isFinalizado = (s?: string) => ["finalizado", "encerrado", "closed"].includes(norm(s));

  const seus      = torneios.filter(t => isAberto(t.status));
  const andamento = torneios.filter(t => isAndamento(t.status));
  const historico = torneios.filter(t => isFinalizado(t.status));

  return { seus, andamento, historico };
}

/** Extrai id do torneio a partir de várias formas de payload de inscrição. */
function getTorneioIdFromInscricao(it: any): number | null {
  if (!it) return null;
  if (it.id_torneio) return Number(it.id_torneio);
  if (it.torneio_id) return Number(it.torneio_id);
  if (typeof it.torneio === "number") return Number(it.torneio);
  if (it.torneio?.id) return Number(it.torneio.id);
  return null;
}

/** Retorna TRUE se o usuário ainda está ativo no torneio. */
async function isInscricaoAtivaPara(torneioId: number): Promise<boolean> {
  const { data } = await api.get("/torneios/inscricoes/", {
    params: { id_torneio: torneioId, page: 1, page_size: 50 },
    withCredentials: true,
  });
  const lista = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
  return lista.some((it: any) => {
    const tid = getTorneioIdFromInscricao(it);
    const ativo = it?.ativo !== false;
    return Number(tid) === Number(torneioId) && ativo;
  });
}

/** Localiza a inscrição do usuário logado PARA aquele torneio. */
async function getMinhaInscricaoId(torneioId: number): Promise<number> {
  const { data } = await api.get("/torneios/inscricoes/", {
    params: { id_torneio: torneioId, page: 1, page_size: 50 },
    withCredentials: true,
  });
  const lista = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
  const cand = lista.find((it: any) => {
    const tid = getTorneioIdFromInscricao(it);
    const ativo = it?.ativo !== false;
    return Number(tid) === Number(torneioId) && ativo;
  });
  if (!cand?.id) throw new Error("Não foi possível localizar sua inscrição ativa.");
  return Number(cand.id);
}

/**
 * Desinscreve o jogador do torneio:
 * 1) Tenta action /inscricoes/{id}/desinscrever/
 * 2) Se falhar, checa se já ficou inativo (alguns backends respondem 500 mas aplicam a mudança)
 * 3) Se ainda ativo, tenta DELETE /inscricoes/{id}/
 * 4) Trata 404/410 no DELETE como sucesso (já removido)
 */
export async function desinscreverDoTorneio(torneioId: number): Promise<void> {
  const inscricaoId = await getMinhaInscricaoId(torneioId);

  try {
    await api.post(`/torneios/inscricoes/${inscricaoId}/desinscrever/`, {}, { withCredentials: true });
    return;
  } catch (err: any) {
    console.warn("desinscrever(): action falhou", {
      status: err?.response?.status,
      data: err?.response?.data,
    });
  }

  try {
    const ativo = await isInscricaoAtivaPara(torneioId);
    if (!ativo) return; // consideramos sucesso
  } catch (_) {
  }

  //fallback DELETE
  try {
    await api.delete(`/torneios/inscricoes/${inscricaoId}/`, { withCredentials: true });
    return;
  } catch (err2: any) {
    const st = err2?.response?.status;
    if (st === 404 || st === 410) return; // já removido/inativo -> sucesso
    console.error("desinscrever(): DELETE falhou", { status: st, data: err2?.response?.data });
    throw err2;
  }
}
