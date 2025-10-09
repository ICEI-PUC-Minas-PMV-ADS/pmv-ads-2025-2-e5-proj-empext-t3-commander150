/**
 * Arquivo central para a definição de tipos e interfaces TypeScript.
 * Manter os tipos centralizados ajuda a garantir consistência e a
 * reutilização em toda a aplicação.
 */

// Para cadastro (requisição)
export interface IUsuarioCadastro {
  email: string;
  username: string;
  password: string;
  tipo: 'JOGADOR' | 'LOJA' | 'ADMIN';
}

// Para resposta (retorno da API)
export interface IUsuario {
  id: number;
  email: string;
  username: string;
  tipo: 'JOGADOR' | 'LOJA' | 'ADMIN';
  status: string;
}

// Define a estrutura das credenciais necessárias para o login.
export interface ILoginCredenciais {
  email: string;
  password?: string; // O nome do campo deve ser 'password' como esperado pelo backend
}

// ===== TIPOS PARA TORNEIO =====

// Para criação de torneio (requisição)
export interface ITorneioCriacao {
  nome: string;
  descricao?: string;
  status: string;
  regras: string;
  banner?: File;
  vagas_limitadas: boolean;
  qnt_vagas?: number;
  incricao_gratuita: boolean;
  valor_incricao?: number;
  pontuacao_vitoria: number;
  pontuacao_derrota: number;
  pontuacao_empate: number;
  pontuacao_bye: number;
  quantidade_rodadas?: number;
  data_inicio: string; // ISO 8601 format
  id_loja: number;
}

// Para atualização de torneio (requisição)
export interface ITorneioAtualizacao {
  nome: string;
  status: string;
  pontuacao_vitoria: number;
  pontuacao_empate: number;
  pontuacao_derrota: number;
  pontuacao_bye: number;
  quantidade_rodadas: number;
  data_fim: string; // ISO 8601 format
  id_loja: number;
}

// Para resposta da API (retorno)
export interface ITorneio {
  id: number;
  loja_nome: string;
  loja_email: string;
  loja_tipo: string;
  nome: string;
  descricao?: string | null;
  status: string;
  regras?: string | null;
  banner?: string | null;
  vagas_limitadas: boolean;
  qnt_vagas?: number | null;
  incricao_gratuita: boolean;
  valor_incricao?: number | null;
  pontuacao_vitoria: number;
  pontuacao_derrota: number;
  pontuacao_empate: number;
  pontuacao_bye: number;
  quantidade_rodadas?: number | null;
  data_inicio: string; // ISO 8601 format
  data_fim?: string | null; // ISO 8601 format
  id_loja: number;
  data_criacao?: string;
  data_atualizacao?: string;
}

// Para listagem de torneios (resposta da API)
export interface IListaTorneios {
  count: number;
  next: string | null;
  previous: string | null;
  results: ITorneio[];
}
// Para inscrições (inscrição do jogador em um torneio)
export interface IInscricao {
  id: number;
  id_torneio: number;
  nome_torneio?: string;
  status?: string;
  data_inscricao?: string;
}

// ===== TIPOS PARA MESA =====

// Jogador em um time
export interface IJogadorMesa {
  id: number;
  id_usuario: number;
  username: string;
  email: string;
  time: number;
}

// Mesa ativa do jogador (resposta da API)
export interface IMesaAtiva {
  id: number;
  numero_mesa: number;
  id_torneio: number;
  nome_torneio: string;
  numero_rodada: number;
  status_rodada: string;
  pontuacao_time_1: number;
  pontuacao_time_2: number;
  time_vencedor: number | null; // 0=Empate, 1=Time 1, 2=Time 2, null=Não definido
  time_1: IJogadorMesa[];
  time_2: IJogadorMesa[];
  meu_time?: number; // Adicionado pela view para indicar em qual time o jogador está
}

// ===== TIPOS PARA RODADA =====

// Rodada de torneio
export interface IRodada {
  id: number;
  numero_rodada: number;
  id_torneio: number;
  status: string; // "Aguardando", "Em andamento", "Finalizada"
  data_inicio?: string | null;
  data_fim?: string | null;
}

// Mesa de uma rodada (visão administrativa)
export interface IMesaRodada {
  id: number;
  numero_mesa: number;
  id_rodada: number;
  numero_rodada: number;
  nome_torneio: string;
  pontuacao_time_1: number;
  pontuacao_time_2: number;
  time_vencedor: number | null; // 0=Empate, 1=Time 1, 2=Time 2, null=Não definido
  jogadores: IJogadorMesa[];
}
