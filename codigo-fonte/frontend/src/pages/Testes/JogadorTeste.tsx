/**
 * Página de Testes
 */

// Importa o hook para acessar os dados da sessão
import { useSessao } from '../../contextos/AuthContexto';
import CardTorneio from '../../components/CardTorneio';

// Define o componente da página do Testes
const JogadorTeste = () => {
  // Obtém os dados e funções do contexto de autenticação
  const { usuario, logout } = useSessao();

  return (
    <div style={{ color: "#FFFFFF" }}>
      <h1>JOGADOR TESTES</h1>
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
    
    
      {/*Teste componente CardTorneio*/}
    <br />
    <br />
    <br />
    <div style={{ alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
      <CardTorneio
        imagem="./img_teste_card_torneio.jpg"
        titulo="Campeonato Teste Card Torneio"
        data="18.08.23"
        hora="19:00"
        tags={[
          { texto: "Futebol", corFundo: "#10B981" },
          { texto: "5v5", corFundo: "#3B82F6" },
          { texto: "Iniciante", corFundo: "#F59E0B" },
        ]}
      />
    </div>
    </div>
   
  );
};

export default JogadorTeste;