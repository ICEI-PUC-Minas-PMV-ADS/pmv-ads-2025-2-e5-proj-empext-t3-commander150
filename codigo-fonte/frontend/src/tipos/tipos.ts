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