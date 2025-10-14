import React, { useState } from "react";
import estilos from "./styles.module.css";
import Input from "../Input";
import Button from "../Button";
import { cadastrarUsuario } from "../../services/authServico";
import { inscreverNoTorneio } from "../../services/torneioServico";
import Swal from 'sweetalert2';

interface ModalInscricaoJogadorProps {
  torneioId: number;
  torneioNome: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ModalInscricaoJogador: React.FC<ModalInscricaoJogadorProps> = ({
  torneioId,
  torneioNome,
  onClose,
  onSuccess
}) => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  const corLabelInputs = "#FFFFFF";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!email || !username || !senha) {
      Swal.fire('Erro', 'Preencha todos os campos obrigatórios.', 'error');
      return;
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Swal.fire('Erro', 'Digite um email válido.', 'error');
      return;
    }

    setCarregando(true);

    try {
      // 1. Cadastrar o usuário
      const novoUsuario = await cadastrarUsuario({
        email,
        username,
        password: senha,
        tipo: 'JOGADOR'
      });

      // 2. Inscrever o usuário no torneio
      await inscreverNoTorneio({
        id_torneio: torneioId,
        id_usuario: novoUsuario.id
      });

      // Sucesso
      Swal.fire({
        title: 'Sucesso!',
        text: `Jogador "${username}" cadastrado e inscrito no torneio "${torneioNome}" com sucesso!`,
        icon: 'success',
        confirmButtonText: 'OK'
      }).then(() => {
        onSuccess();
        onClose();
      });

    } catch (error: any) {
      console.error("Erro ao cadastrar e inscrever jogador:", error);
      
      const mensagemErro = error.message || 'Erro ao cadastrar e inscrever jogador. Tente novamente.';
      
      Swal.fire({
        title: 'Erro',
        text: mensagemErro,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className={estilos.modalOverlay} onClick={onClose}>
      <div className={estilos.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={estilos.modalHeader}>
          <h2 className={estilos.modalTitulo}>Inscrever Jogador</h2>
          <button className={estilos.btnFechar} onClick={onClose}>×</button>
        </div>

        <p className={estilos.modalSubtitulo}>
          Cadastre um novo jogador e inscreva-o no torneio <strong>{torneioNome}</strong>
        </p>

        <form onSubmit={handleSubmit} className={estilos.formulario}>
          <Input
            placeholder="Digite o email do jogador"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            name="email"
            label="Email*"
            labelColor={corLabelInputs}
            required
          />

          <Input
            placeholder="Digite o nome de usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            type="text"
            name="username"
            label="Nome de Usuário*"
            labelColor={corLabelInputs}
            required
          />

          <Input
            placeholder="Digite uma senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            type="password"
            name="senha"
            label="Senha*"
            labelColor={corLabelInputs}
            required
          />

          <div className={estilos.botoes}>
            <Button 
              label="Cancelar" 
              onClick={onClose}
              backgroundColor="var(--var-cor-terciaria)"
              disabled={carregando}
              type="button"
            />
            <Button 
              label={carregando ? "Cadastrando..." : "Cadastrar e Inscrever"}  
              onClick={() => {}} 
              backgroundColor="var(--var-cor-primaria)"
              disabled={carregando}
              type="submit"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalInscricaoJogador;
