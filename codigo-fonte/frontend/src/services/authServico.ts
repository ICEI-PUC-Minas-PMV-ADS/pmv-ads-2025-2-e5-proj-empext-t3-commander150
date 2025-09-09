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
import type { ILoginCredenciais, IUsuario } from '../tipos/tipos';

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