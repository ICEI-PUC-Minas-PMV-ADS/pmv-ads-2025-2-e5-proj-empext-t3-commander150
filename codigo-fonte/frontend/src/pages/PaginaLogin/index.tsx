// src/pages/Login/index.tsx

/**
 * Página de Login
 *
 * O QUE É E POR QUE EXISTE?
 * Este componente renderiza o formulário de login e contém a lógica para
 * autenticar o utilizador. É a porta de entrada para as áreas protegidas
 * da aplicação.
 *
 * RESPONSABILIDADES:
 * 1. Manter o estado dos campos de email e senha.
 * 2. Utilizar o 'useSessao' para aceder à função de login do contexto.
 * 3. Após um login bem-sucedido, redirecionar o utilizador para a página
 * que ele tentou aceder originalmente ou para a página inicial.
 */

import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Importa o hook para aceder aos dados e funções da sessão.
import { useSessao } from '../../contextos/AuthContexto';

const PaginaLogin = () => {
  // Hooks do React para gerir o estado e a navegação.
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useSessao();

  // Estados locais para armazenar os valores dos campos do formulário.
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  // Tenta obter a rota de origem de onde o utilizador foi redirecionado.
  // O 'state' é passado pelo componente RotaSegura.
  const deOndeVeio = location.state?.from?.pathname || '/';

  // Função executada quando o formulário é submetido.
  const handleSubmit = async (evento: FormEvent) => {
    // Previne o comportamento padrão do formulário, que é recarregar a página.
    evento.preventDefault();

    // Validação simples para garantir que os campos não estão vazios.
    if (!email || !senha) {
      alert('Por favor, preencha o email e a senha.');
      return;
    }

    try {
      // Chama a função 'login' do nosso contexto com as credenciais.
      // O AuthContexto é quem lida com a chamada à API e com os alertas de erro.
      await login({ email, password: senha });

      // Se o login for bem-sucedido, redireciona o utilizador para a página
      // de onde ele veio (ex: /dashboard) ou para a página inicial.
      // 'replace: true' substitui a página de login no histórico do navegador.
      navigate(deOndeVeio, { replace: true });

    } catch (error) {
      // O AuthContexto já exibe um alerta de erro (Swal.fire).
      // Apenas registamos o erro no console para fins de depuração,
      // pois a função 'login' do contexto relança o erro.
      console.error("Falha na tentativa de login:", error);
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label htmlFor="senha">Senha:</label>
          <input
            type="password"
            id="senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>
        <button type="submit" style={{ marginTop: '20px' }}>
          Entrar
        </button>
      </form>
    </div>
  );
};

export default PaginaLogin;