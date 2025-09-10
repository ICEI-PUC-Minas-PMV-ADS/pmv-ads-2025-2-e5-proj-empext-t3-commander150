// src/services/authServico.ts

/**
 * Serviço de Autenticação.
 *
 * Este arquivo funciona como o "motor" da nossa autenticação. Ele contém
 * todas as funções que fazem a comunicação direta com os endpoints da API
 * relacionados a usuários e autenticação (login, logout, etc.).
 *
 * A principal característica deste serviço é que ele é "burro": ele não
 * sabe nada sobre o estado da aplicação, alertas ou gerenciamento de sessão.
 * Sua única responsabilidade é fazer a requisição, e retornar os dados em
 * caso de sucesso ou um erro em caso de falha, que será tratado por quem o
 * chamou (o nosso futuro AuthContexto).
 */

import api from './api';
import type { ILoginCredenciais, IUsuarioCadastro, IUsuario } from '../tipos/tipos';
import { AxiosError } from "axios";
/**
 * Envia as credenciais para a API para tentar autenticar o usuário.
 * A função é direta: se a chamada da API for bem-sucedida, retorna os dados.
 * Se falhar, o erro do Axios será propagado automaticamente para ser tratado.
 *
 * @param credenciais - Um objeto contendo o email e a senha do usuário.
 * @returns Os dados do usuário autenticado.
 */
export const efetuarLogin = async (credenciais: ILoginCredenciais): Promise<IUsuario> => {
  const resposta = await api.post('/auth/login/', credenciais);
  // A API de login retorna um objeto com uma chave "dados" que contém o usuário.
  return resposta.data.dados;
};

/**
 * Informa a API que o usuário deseja encerrar sua sessão.
 * Se a chamada falhar, o erro será propagado para ser tratado.
 */
export const efetuarLogout = async (): Promise<void> => {
  await api.post('/auth/logout/');
};

/**
 * Verifica com a API se existe uma sessão de usuário ativa,
 * buscando os dados do usuário logado através do cookie de sessão.
 * O endpoint /auth/validar-sessao/ foi criado especificamente para isso.
 *
 * @returns Os dados do usuário se a sessão for válida.
 */
export const verificarSessao = async (): Promise<IUsuario> => {
  const resposta = await api.get('/auth/validar-sessao/');
  return resposta.data;
};

/**
 * Solicita a API o token de recuperação de senha do usuário
 * Se der certo, envia o token para o email do usuário.
 * Se a chamada falhar, o erro será propagado para ser tratado.
 */
export const solicitarTokenRecuperacaoSenha = async (email: string): Promise<boolean> => {
    const resposta = await api.post("/auth/requisitar-troca-senha/", { email });
    
    if (resposta.status === 200) {
    return true;
    } else {
    return false;
    }
}


/**
 * Envia para a API o token de recuperação para validação.
 * Se der certo, envia a nova senha para o email do usuário.
 * Se a chamada falhar, o erro será propagado para ser tratado.
 */
export const validarTokenRecuperacao = async (email: string, token: string): Promise<boolean> => {
  const resposta = await api.post('/auth/validar-token-redefinir-senha/', {"email": email, "token": token});
  // A API de login retorna um objeto com uma chave "dados" que contém o usuário.
  if (resposta.status === 200) {
    return true;
    } else {
    return false;
    }
};

/**
 * Solicita a API um cadastro de usuário.
 * Se der certo, retorna os dados do usuário cadastrado.
 * Se a chamada falhar, identifica o erro.
 */
// services/authServico.ts
export const cadastrarUsuario = async (
  usuario: IUsuarioCadastro
): Promise<IUsuario> => {
  try {
    const resposta = await api.post("/auth/usuarios/", usuario);
    return resposta.data;
  } catch (erro) {
    const axiosErro = erro as AxiosError<any>;

    if (axiosErro.response && axiosErro.response.data) {
      const data = axiosErro.response.data;

      // Monta uma lista com "campo: mensagem"
      const mensagens: string[] = [];

      Object.keys(data).forEach((campo) => {
        const mensagensCampo = data[campo];
        if (Array.isArray(mensagensCampo)) {
          mensagensCampo.forEach((msg: string) => {
            mensagens.push(`${campo}: ${msg}`);
          });
        } else if (typeof mensagensCampo === "string") {
          mensagens.push(`${campo}: ${mensagensCampo}`);
        }
      });

      // Se conseguiu extrair mensagens, lança todas unidas
      if (mensagens.length > 0) {
        throw new Error(mensagens.join("\n"));
      }
    }

    throw new Error("Erro ao cadastrar usuário. Tente novamente.");
  }
};
