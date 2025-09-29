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
  nome: string;
  status: string;
  pontuacao_vitoria: number;
  pontuacao_empate: number;
  pontuacao_derrota: number;
  pontuacao_bye: number;
  quantidade_rodadas: number;
  data_fim: string;
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