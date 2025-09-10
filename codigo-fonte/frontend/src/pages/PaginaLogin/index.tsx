/**
 * Página de Login
 *
 * RESPONSABILIDADES:
 * 1. Renderizar a estrutura visual da página de login (fundo, card).
 * 2. Utilizar componentes reutilizáveis (Input, Botão) para construir o formulário.
 * 3. Manter o estado dos campos de email e senha.
 * 4. Chamar a função de login do AuthContexto ao submeter o formulário.
 * 5. Redirecionar o utilizador após um login bem-sucedido.
 */

import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useSessao } from '../../contextos/AuthContexto';
import styles from './styles.module.css';
import Input from '../../components/Input';
import Button from '../../components/Button';

const PaginaLogin = () => {
  // Hooks do React para gerir o estado e a navegação.
  const navigate = useNavigate();
  const location = useLocation();
  const { login, usuario, qtdCaracteresSenha } = useSessao();

  // Estados locais para armazenar os valores dos campos do formulário.
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  // Tenta obter a rota de origem de onde o utilizador foi redirecionado.
  const deOndeVeio = location.state?.from?.pathname || '/';

  // Função para redireciorionar o utilizador após o login.
  const redirecionarUsuario = (tipo: string) => {
    switch (tipo) {
      case "LOJA":
        navigate("/loja");
        break;
      case "JOGADOR":
        navigate("/jogador");
        break;
      case "ADMIN":
        navigate("/admin");
        break;
      default:
        navigate("/");
    }
  };

  // Função executada quando o formulário é submetido.
  const handleSubmit = async (evento: FormEvent) => {
    evento.preventDefault();
    
    if (!email || !senha) {
      alert('Por favor, preencha o email e a senha.');
      return;
    }

    try {
      await login({ email, password: senha });
      
      // Redireciona o utilizador para a  para a página padrão ou para a página de origem
      console.log(deOndeVeio)
      if (!deOndeVeio || deOndeVeio === "/") {
        redirecionarUsuario(usuario?.tipo ?? 'JOGADOR');
      } else {
        navigate(deOndeVeio, { replace: true });
      }
    } catch (error) {
      console.error("Falha na tentativa de login:", error);
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h2 className={styles.title}>Login</h2>

        <Input
          type="email"
          name="email"
          label="Email"
          placeholder="exemplo@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          type="password"
          name="senha"
          label="Senha"
          placeholder="**********"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          minLength={qtdCaracteresSenha}
        />
        
        <Button
          label="Entrar"
          type="submit"
        />

        <Link to="/recuperar-senha/" className={styles.link}>
          Esqueceu a senha?
        </Link>

        <Link to="/cadastrar/" className={styles.link}>
          Ainda não possui conta? Cadastre-se
        </Link>
      
      </form> 
    </div>
  );
}

export default PaginaLogin;