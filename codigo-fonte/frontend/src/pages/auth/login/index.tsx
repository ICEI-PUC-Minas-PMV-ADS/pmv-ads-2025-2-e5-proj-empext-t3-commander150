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

import { useState, useEffect, type FormEvent } from 'react';
import { useLocation, useNavigate, Link} from 'react-router-dom';
import { useSessao } from '../../../contextos/AuthContexto';
import styles from './styles.module.css';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import Swal from 'sweetalert2';


const PaginaLogin = () => {
  // Hooks do React para gerir o estado e a navegação.
  const navigate = useNavigate();
  const location = useLocation();
  const { login, usuario, qtdCaracteresSenha } = useSessao();

  // Estados locais para armazenar os valores dos campos do formulário.
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false); 
  const corTextInputs = "var(--cor-texto-principal)";
  const corBackgroundInputs = "#FFFFFF";


  // Tenta obter a rota de origem de onde o utilizador foi redirecionado.
  const deOndeVeio = location.state?.from?.pathname || '/';

  // Redireciona o utilizador assim que o estado 'usuario' é atualizado.
  useEffect(() => {
  if (usuario) {
    const redirecionarUsuario = () => {
        navigate("/");
      // switch (tipo) {
      //   case "LOJA":
      //     navigate("/loja");
      //     break;
      //   case "JOGADOR":
      //     navigate("/jogador");
      //     break;
      //   case "ADMIN":
      //     navigate("/admin");
      //     break;
      //   default:
      //     navigate("/");
      // }
    };

    // Verificar se há redirecionamento salvo no localStorage
    const redirectAfterLogin = localStorage.getItem('redirectAfterLogin');
    
    if (redirectAfterLogin) {
      // Limpar o redirecionamento do localStorage
      localStorage.removeItem('redirectAfterLogin');
      // Redirecionar para a página de inscrição
      navigate(redirectAfterLogin, { replace: true });
    } else if (!deOndeVeio || deOndeVeio === "/") {
      redirecionarUsuario();
    } else {
      navigate(deOndeVeio, { replace: true });
    }
  }
}, [usuario, deOndeVeio, navigate]);

  
  // Função executada quando o formulário é submetido.
  const handleSubmit = async (evento: FormEvent) => {
    evento.preventDefault();
    
    if (!email || !senha) {
      Swal.fire(
                  'Erro no Login',
                  'Prencha todos os campos.',
                  'error'
                  );
      return;
    }

    try {
      setLoading(true);
      await login({ email, password: senha });
    } catch (error) {
      console.error("Falha na tentativa de login:", error);
    } finally {
        setLoading(false);
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
          backgroundColor={corBackgroundInputs}
          textColor={corTextInputs}
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
          backgroundColor={corBackgroundInputs}
          textColor={corTextInputs}

        />
        
        <Button
          label="Entrar"
          type="submit"
          disabled={loading}
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