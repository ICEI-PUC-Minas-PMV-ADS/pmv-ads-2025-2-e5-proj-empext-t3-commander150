/**
 * Página de Login
 *
 * RESPONSABILIDADES:
 * 1. Renderizar a estrutura visual da página de Alteração de senha (fundo, card).
 * 2. Utilizar componentes reutilizáveis (Input, Botão) para construir o formulário.
 * 3. Manter o estado dos campos
 * 4. Chamar a função de Alteração do authServico ao submeter o formulário.
 * 5. Redirecionar o utilizador após um cadastro bem-sucedido.
 */

import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessao } from '../../contextos/AuthContexto';
import styles from './styles.module.css';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { alterarSenhaUsuario} from '../../services/authServico';
import Swal from "sweetalert2";


const PaginaAlterarSenha = () => {
  // Hooks do React para gerir o estado e a navegação.
  const navigate = useNavigate();
  const { qtdCaracteresSenha, usuario } = useSessao();

  // Estados locais para armazenar os valores dos campos do formulário.
  const [senhaAntiga, setSenhaAntiga] = useState('');
  const [novaSenha, setNovaSenha] = useState('');

  // Função executada quando o formulário é submetido.
  const handleSubmit = async (evento: FormEvent) => {
    evento.preventDefault();
    
    if (!senhaAntiga || !novaSenha) {
        Swal.fire(
            'Erro na alteração',
            'Prencha todos os campos.',
            'error'
            );
      return;
    }

    // Lógica de alteração de senha
    if (!usuario) {
      Swal.fire({
      icon: "error",
      title: "Erro na alteração",
      text: "Usuário não autenticado. Faça login novamente.",
      confirmButtonText: "Tentar novamente"
    })
      navigate("/login/");
      return;
    }

    const resultado = await alterarSenhaUsuario(
    usuario.id, // vem do contexto do usuário autenticado
    senhaAntiga,
    novaSenha
  );

  if (resultado.success) {
    Swal.fire({
      icon: "success",
      title: "Senha alterada com sucesso!",
      text:  "Faça login novamente para autenticar.",
      confirmButtonText: "Ok"
    }).then(() => {
      navigate("/login/");
    });
  } else {
    Swal.fire({
      icon: "error",
      title: "Erro",
      text: resultado.message,
      confirmButtonText: "Tentar novamente"
    });
  }
  };

  return (
    <div className={styles.container}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h2 className={styles.title}>Alterar Senha</h2>
        <Input
          type="password"
          name="senha-antiga"
          label="Senha Atual"
          placeholder="**********"
          value={senhaAntiga}
          onChange={(e) => setSenhaAntiga(e.target.value)}
          required
          minLength={qtdCaracteresSenha}
        />
        <Input
          type="password"
          name="nova-senha"
          label="Nova Senha"
          placeholder="**********"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          required
          minLength={qtdCaracteresSenha}
        />
        
        <Button
          label="Alterar Senha"
          type="submit"
        />
        <Button
          label="Cancelar"
          type="submit"
          onClick={() => navigate(-1)}
        />
      
      </form> 
    </div>
  );
}

export default PaginaAlterarSenha;