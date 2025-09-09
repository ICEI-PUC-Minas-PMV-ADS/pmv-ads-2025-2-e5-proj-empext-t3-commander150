/**
 * Configuração central da instância do Axios.
 *
 * Este arquivo é o único responsável por criar e configurar a comunicação
 * com a nossa API backend. Ele define a URL base e, mais importante,
 * habilita o envio de cookies de autenticação em todas as requisições.
 *
 * Qualquer outro serviço que precise fazer uma chamada à API (como o
 * authServico) deverá importar esta instância 'api' já configurada.
 */

import axios from 'axios';

// Cria uma instância do Axios com configurações padrão.
const api = axios.create({
  /**
   * Define a URL base para todas as requisições.
   * Usamos uma variável de ambiente (VITE_API_BASE_URL) para que a URL
   * possa ser facilmente alterada entre os ambientes de desenvolvimento e produção.
   * Ex: http://localhost:8000/api/v1
   */
  baseURL: import.meta.env.VITE_API_BASE_URL,

  /**
   * 'withCredentials: true' instrui o Axios a incluir automaticamente
   * os cookies (como o 'sessionid' que o Django nos envia) em todas
   * as requisições feitas ao backend. Isso elimina a necessidade de
   * gerenciar tokens ou session IDs manualmente.
   */
  withCredentials: true,
});

// Exporta a instância configurada para ser usada em outras partes da aplicação.
export default api;