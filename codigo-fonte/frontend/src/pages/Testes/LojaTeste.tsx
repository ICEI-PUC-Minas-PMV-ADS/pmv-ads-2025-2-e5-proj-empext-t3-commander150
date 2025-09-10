/**
 * Página de Testes
 */

// Importa o hook para acessar os dados da sessão
import { useSessao } from '../../contextos/AuthContexto';

// Define o componente da página do Testes
const LojaTeste = () => {
  // Obtém os dados e funções do contexto de autenticação
  const { usuario, logout } = useSessao();

  return (
    <div>
      <h1>LOJA TESTES</h1>
      {/* Exibe os dados do usuário se eles existirem */}
      {usuario && (
        <div style={{ border: '1px solid #ccc', padding: '10px', marginTop: '20px' }}>
          <h2>Dados do Usuário Logado:</h2>
          <p><strong>ID:</strong> {usuario.id}</p>
          <p><strong>Username:</strong> {usuario.username}</p>
          <p><strong>Email:</strong> {usuario.email}</p>
          <p><strong>Tipo:</strong> {usuario.tipo}</p>
        </div>
      )}

      {/* Botão para testar o fluxo de logout a partir de uma página protegida */}
      <button
        onClick={logout}
        style={{ marginTop: '20px', padding: '10px', cursor: 'pointer' }}
      >
        Sair (Logout)
      </button>
    </div>
  );
};

export default LojaTeste;