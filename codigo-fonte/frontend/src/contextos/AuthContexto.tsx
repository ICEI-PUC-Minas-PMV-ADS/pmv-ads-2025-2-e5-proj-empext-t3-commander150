/**
 * AuthContexto (Contexto de Autenticação)
 *
 * O QUE É E POR QUE EXISTE?
 * Este arquivo cria um Contexto React, que funciona como um "estado global"
 * para a autenticação. Ele resolve o problema de compartilhar informações
 * (como os dados do usuário logado) entre diferentes componentes da
 * aplicação sem a necessidade de passar 'props' por múltiplos níveis.
 *
 * RESPONSABILIDADES:
 * 1. Manter o estado do usuário (logado ou não) e um estado de carregamento inicial.
 * 2. Expor as funções de 'login' e 'logout' para serem usadas por qualquer componente.
 * 3. Chamar o 'authServico' para verificar a validade da sessão quando a
 * aplicação é iniciada.
 *
 * COMO USAR:
 * 1. O componente 'GerenciadorSessao' deve envolver a árvore de componentes
 * que precisa de acesso ao estado de autenticação (geralmente no main.tsx).
 * 2. Em qualquer componente filho, use o hook 'useSessao()' para acessar os
 * dados e as funções.
 *
 * Exemplo de uso em um componente:
 *
 * import { useSessao } from '../contextos/AuthContexto';
 *
 * function MinhaNavbar() {
 * const { usuario, logout } = useSessao();
 *
 * return (
 * <nav>
 * {usuario ? `Olá, ${usuario.username}` : 'Você não está logado'}
 * <button onClick={logout}>Sair</button>
 * </nav>
 * );
 * }
 */

import { createContext, useState, useEffect, useContext, type ReactNode } from 'react';
import { AxiosError } from 'axios';
import Swal from 'sweetalert2';

import { efetuarLogin, efetuarLogout, verificarSessao } from '../services/authServico';
import type { IUsuario, ILoginCredenciais } from '../tipos/tipos';

// Define a "planta baixa" do contexto, especificando quais
// informações e funções ele irá fornecer.
interface IAuthContexto {
  usuario: IUsuario | null;
  carregandoSessao: boolean;
  qtdCaracteresSenha: number;
  login: (credenciais: ILoginCredenciais) => Promise<void>;
  logout: () => Promise<void>;
}

// Cria o Contexto React. O valor inicial é 'undefined', pois só será
// populado pelo componente 'GerenciadorSessao'.
const AuthContexto = createContext<IAuthContexto | undefined>(undefined);

interface GerenciadorSessaoProps {
  children: ReactNode;
}

// Componente Provedor que gerencia o estado e a lógica da autenticação.
export const GerenciadorSessao = ({ children }: GerenciadorSessaoProps) => {

  const [usuario, setUsuario] = useState<IUsuario | null>(null);
  // O estado de carregamento é crucial para a experiência do usuário,
  // evitando que a tela "pisque" ou mostre conteúdo indevido enquanto
  // a sessão inicial está sendo verificada.
  const [carregandoSessao, setCarregandoSessao] = useState(true);

  // Efeito que executa apenas uma vez na inicialização do componente
  // para verificar se já existe uma sessão de usuário válida.
  useEffect(() => {
    const checarSessaoAoCarregar = async () => {
      try {
        const usuarioLogado = await verificarSessao();
        setUsuario(usuarioLogado);
      } catch {
        // Um erro aqui é um comportamento esperado caso não haja sessão.
        // Garante que o estado de usuário comece como nulo.
        setUsuario(null);
      } finally {
        // Finaliza o estado de carregamento inicial, independentemente do resultado.
        setCarregandoSessao(false);
      }
    };

    checarSessaoAoCarregar();
  }, []);
  
  // Define a quantidade mínima de caracteres para a senha.
  const qtdCaracteresSenha = 4;

  // Função para realizar o login do usuário.
  const login = async (credenciais: ILoginCredenciais) => {
    try {
      const usuarioLogado = await efetuarLogin(credenciais);
      setUsuario(usuarioLogado);
    } catch (error) {
      // Captura o erro do Axios e exibe uma mensagem amigável.
      const axiosError = error as AxiosError<{ error: string }>;
      const mensagemErro = axiosError.response?.data?.error || "Ocorreu um erro desconhecido.";
      Swal.fire('Erro no Login', mensagemErro, 'error');
      // Garante que o estado de erro seja relançado para que o componente
      // que chamou a função saiba que o login falhou.
      throw error;
    }
  };

  // Função para realizar o logout do usuário.
  const logout = async () => {
    try {
      await efetuarLogout();
      setUsuario(null);
    } catch {
      // O 'error' foi removido do catch pois não estava sendo utilizado,
      // resolvendo o aviso do ESLint.
      Swal.fire('Erro no Logout', 'Não foi possível encerrar a sessão.', 'error');
    }
  };

  // Agrupa todos os valores e funções que serão fornecidos pelo contexto.
  const valor = {
    usuario,
    carregandoSessao,
    qtdCaracteresSenha,
    login,
    logout,
  };

  // O componente Provedor que disponibiliza o 'valor' para todos os seus 'filhos'.
  return (
    <AuthContexto.Provider value={valor}>
      {children}
    </AuthContexto.Provider>
  );
};

// Hook customizado que simplifica o uso do contexto nos componentes.
// eslint-disable-next-line react-refresh/only-export-components
export const useSessao = (): IAuthContexto => {
  const contexto = useContext(AuthContexto);

  if (contexto === undefined) {
    throw new Error('useSessao deve ser usado dentro de um GerenciadorSessao');
  }

  return contexto;
};