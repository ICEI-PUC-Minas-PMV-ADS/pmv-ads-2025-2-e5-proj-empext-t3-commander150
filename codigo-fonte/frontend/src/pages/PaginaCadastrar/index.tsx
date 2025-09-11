// src/pages/PaginaCadastrar/index.tsx

/**
 * Página de Cadastro
 *
 * RESPONSABILIDADES:
 * 1. Renderizar a estrutura visual da página de Cadastro (fundo, card).
 * 2. Utilizar componentes reutilizáveis (Input, Botão, Radio) para construir o formulário.
 * 3. Manter o estado dos campos do formulário.
 * 4. Chamar a função de cadastro do authServico ao submeter o formulário.
 * 5. Redirecionar o utilizador após um cadastro bem-sucedido.
 */

import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './styles.module.css';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Radio from '../../components/Radio';
import { cadastrarUsuario } from '../../services/authServico';
import Swal from 'sweetalert2';
import { useSessao } from '../../contextos/AuthContexto';


// 2. Define as opções para o nosso grupo de rádio.
// Manter isto como uma constante fora do componente evita que seja recriado a cada renderização.
const opcoesTipoUsuario = [
  { valor: 'JOGADOR', rotulo: 'Sou um Jogador' },
  { valor: 'LOJA', rotulo: 'Sou uma Loja' },
];

const PaginaCadastrar = () => {
  const navigate = useNavigate();
    const { login } = useSessao();

  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  // O estado 'tipo' agora será controlado pelo componente de Rádio.
  const [tipo, setTipo] = useState('');
  const [loading, setLoading] = useState(false); 


  const handleSubmit = async (evento: FormEvent) => {
    evento.preventDefault();

    if (!email || !senha || !nome || !tipo) {
      Swal.fire('Erro no Cadastro', 'Preencha todos os campos.', 'error');
      return;
    }

    try {
      setLoading(true);

      // 1. Cadastra o usuário
      await cadastrarUsuario({
        email,
        username: nome,
        password: senha,
        tipo: tipo as 'JOGADOR' | 'LOJA',
      });

      // 2. Faz login automático
      await login({ email, password: senha });

      // 3. Exibe sucesso e redireciona para página inicial (ou dashboard)
      Swal.fire(
        'Cadastro e Login Realizados!',
        `Bem-vindo, ${nome}!`,
        'success'
      ).then(() => {
        // Redireciona para a página de acordo com o tipo de usuário
        navigate('/');
      });

    } catch (error) {
      Swal.fire("Erro no cadastro!", (error as Error).message, "error");
    } finally {
      setLoading(false);
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
        />

        {/* 3. Substitui o Input de texto pelo componente Radio. */}
        <Radio
          labelPrincipal="Tipo de Usuário"
          name="tipo"
          opcoes={opcoesTipoUsuario}
          valorSelecionado={tipo}
          onChange={(e) => setTipo(e.target.value)}
        />

        <Button
          label="Cadastrar"
          type="submit"
          disabled={loading}
        />

        <Link to="/login/" className={styles.link}>
          Já possui cadastro? Faça seu login!
        </Link>

      </form>
    </div>
  );
}

export default PaginaCadastrar;