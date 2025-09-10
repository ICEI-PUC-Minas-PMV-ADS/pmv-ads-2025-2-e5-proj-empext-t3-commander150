/**
 * Página de Login
 *
 * RESPONSABILIDADES:
 * 1. Renderizar a estrutura visual da página de Cadastro (fundo, card).
 * 2. Utilizar componentes reutilizáveis (Input, Botão) para construir o formulário.
 * 3. Manter o estado dos campos
 * 4. Chamar a função de cadastro do authServico ao submeter o formulário.
 * 5. Redirecionar o utilizador após um cadastro bem-sucedido.
 */

import { useState, type FormEvent } from 'react';
import { useNavigate, Link, data } from 'react-router-dom';
import { useSessao } from '../../contextos/AuthContexto';
import styles from './styles.module.css';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { cadastrarUsuario} from '../../services/authServico';
import Swal from 'sweetalert2';



const PaginaCadastrar = () => {
  // Hooks do React para gerir o estado e a navegação.
  const navigate = useNavigate();
  const { qtdCaracteresSenha } = useSessao();

  // Estados locais para armazenar os valores dos campos do formulário.
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [tipo, setTipo] = useState('');

  // Função executada quando o formulário é submetido.
  const handleSubmit = async (evento: FormEvent) => {
    evento.preventDefault();
    
    if (!email || !senha || !nome || !tipo) {
        Swal.fire(
            'Erro no Cadastro',
            'Prencha todos os campos.',
            'error'
            );
      return;
    }

    // Lógica de cadastro
    try {
      await cadastrarUsuario({
        email,
        username: nome,
        password: senha,
        tipo: tipo as 'JOGADOR' | 'LOJA' | 'ADMIN',
        });

        Swal.fire(
            'Sucesso no Cadastro',
            `Sucesso para registrar o usuário ${nome}. Agora faça o login.`,
            'success'
            );
        // Redireciona para a página de login após o cadastro.
        navigate('/login/');

    } catch (error) {
        Swal.fire("Erro no cadastro!", (error as Error).message, "error");
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h2 className={styles.title}>Cadastro</h2>
        <Input
          type="text"
          name="nome"
          label="Nome de Usuário"
          placeholder="Nome de Usuário"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
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
        <Input
          type="text"
          name="tipo"
          label="Tipo de Usuário"
          placeholder="Loja, Jogador ou Admin"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          required
        />
        <Button
          label="Cadastrar"
          type="submit"
        />

        <Link to="/recuperar-senha/" className={styles.link}>
          Esqueceu a senha?
        </Link>

        <Link to="/login/" className={styles.link}>
          Já possui cadastro? Faça seu login!
        </Link>
      
      </form> 
    </div>
  );
}

export default PaginaCadastrar;