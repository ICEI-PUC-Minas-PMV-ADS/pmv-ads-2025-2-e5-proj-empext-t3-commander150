// src/App.tsx

import './App.css';

// Importa o hook 'useSessao' para acessar o "Placar Central" de autenticação.
import { useSessao } from './contextos/AuthContexto';

function App() {
  // Acessa as informações e funções do nosso contexto.
  // Agora, este componente não precisa mais saber como o login ou logout
  // funcionam, ele apenas consome os dados e funções que o
  // GerenciadorSessao fornece.
  const { usuario, carregandoSessao, login, logout } = useSessao();

  // Função para lidar com o clique no botão de login.
  const handleLogin = async () => {
    try {
      // Usa as credenciais de teste.
      const credenciais = {
        email: 'novo@email.com',
        password: 'senha123'
      };
      // Chama a função 'login' que vem do nosso contexto.
      // Toda a lógica de chamada da API e tratamento de erro
      // está encapsulada dentro do AuthContexto.
      await login(credenciais);
      console.log("SUCESSO: Login realizado através do contexto.");
    } catch (error) {
      // O contexto já exibe o alerta de erro (Swal), mas podemos
      // registrar o erro no console para fins de depuração.
      console.error("ERRO: Ocorreu um erro durante o login.", error);
    }
  };

  // Função para lidar com o clique no botão de logout.
  const handleLogout = async () => {
    // Chama a função 'logout' do contexto.
    await logout();
    console.log("SUCESSO: Logout realizado através do contexto.");
  };

  // Renderiza a tela de acordo com o estado do contexto.
  return (
    <>
      <h1>Teste do AuthContexto</h1>
      <p>Abra o console do navegador (F12) para ver os logs.</p>

      <div style={{ border: '1px solid #ccc', padding: '10px', marginTop: '20px' }}>
        <h2>Estado Atual do "Placar Central"</h2>
        {/*
          Enquanto a sessão inicial está sendo verificada, exibe uma mensagem
          de carregamento. Isso evita que o usuário veja a tela errada por
          uma fração de segundo ao recarregar a página.
        */}
        {carregandoSessao ? (
          <p>Verificando sessão...</p>
        ) : (
          // Quando o carregamento termina, exibe o status do usuário.
          <p>
            Usuário Logado: {usuario ? `${usuario.username} (${usuario.email})` : 'Nenhum'}
          </p>
        )}
      </div>

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