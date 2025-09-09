// src/App.tsx

/**
 *
 * Este componente foi modificado temporariamente para testar as funções
 * do serviço de autenticação (authServico.ts). Ele contém botões
 * para simular login e logout, e verifica a sessão ao ser carregado.
 *
 * O objetivo é usar as "Ferramentas do Desenvolvedor" do navegador para
 * observar as requisições de rede e as mensagens no console, garantindo
 * que nossa comunicação com o backend está funcionando como esperado.
 *
 * Após os testes, este código será descartado e substituído pelo
 * componente principal da aplicação.
 */

import { useEffect } from 'react';
import './App.css';

// Importar as funções que queremos testar do serviço.
import { efetuarLogin, efetuarLogout, verificarSessao } from './services/authServico';

function App() {

  // Teste 1: Verificar se existe uma sessão ativa ao carregar a página.
  useEffect(() => {
    console.log("APP MONTADO: Tentando verificar a sessão...");

    const checarSessao = async () => {
      try {
        // Chamamos a função do serviço.
        const usuario = await verificarSessao();
        // Se der certo, exibimos os dados do usuário no console.
        console.log("SUCESSO [verificarSessao]: Sessão válida. Usuário:", usuario);
      } catch (error) {
        // Se der errado (ex: cookie inválido ou expirado), a API retornará um erro (401).
        console.error("ERRO [verificarSessao]: Nenhuma sessão ativa ou sessão inválida.", error);
      }
    };

    checarSessao();
  }, []); // O array vazio [] garante que este efeito rode apenas uma vez, quando o componente é montado.


  // Teste 2: Função para simular o clique no botão de Login.
  const handleLogin = async () => {
    console.log("BOTÃO CLICADO: Tentando efetuar login...");
    try {
      // ATENÇÃO: Substitua com um email e senha de um usuário que REALMENTE
      // existe no seu banco de dados do backend para o teste funcionar.
      const credenciais = {
        email: 'novo@email.com',
        password: 'senha123'
      };

      // Chamamos a função de login do serviço.
      const usuarioLogado = await efetuarLogin(credenciais);

      // Se o login for bem-sucedido, exibimos os dados no console.
      console.log("SUCESSO [efetuarLogin]: Login realizado com sucesso! Usuário:", usuarioLogado);
    } catch (error) {
      // Se as credenciais estiverem erradas, a API retornará um erro (401).
      console.error("ERRO [efetuarLogin]: Falha no login. Verifique as credenciais.", error);
    }
  };


  // Teste 3: Função para simular o clique no botão de Logout.
  const handleLogout = async () => {
    console.log("BOTÃO CLICADO: Tentando efetuar logout...");
    try {
      // Chamamos a função de logout do serviço.
      await efetuarLogout();

      // Se o logout for bem-sucedido, exibimos uma mensagem no console.
      console.log("SUCESSO [efetuarLogout]: Logout realizado com sucesso!");
    } catch (error) {
      // Se ocorrer um erro na API, ele será exibido aqui.
      console.error("ERRO [efetuarLogout]: Falha ao fazer logout.", error);
    }
  };


  // A interface visual para os botões de teste.
  return (
    <>
      <h1>Testes - authServico</h1>
      <p>Abra o console do navegador (F12) para ver os resultados dos testes.</p>
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <button onClick={handleLogin}>
          Testar Login
        </button>
        <button onClick={handleLogout}>
          Testar Logout
        </button>
      </div>
    </>
  );
}

export default App;