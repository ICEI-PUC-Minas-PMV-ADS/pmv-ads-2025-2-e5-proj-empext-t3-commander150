import React, { useState } from "react";
import estilos from "./styles.module.css";
import Input from "../Input";
import Button from "../Button";
import { cadastrarUsuario } from "../../services/authServico";
import { inscreverNoTorneio } from "../../services/torneioServico";
import Swal from 'sweetalert2';

// Adicionar tipo de inscrição
type TipoInscricao = 'novo' | 'existente';

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
  const [tipoInscricao, setTipoInscricao] = useState<TipoInscricao>('novo');
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  const corLabelInputs = "#FFFFFF";

  // Função para mudar tipo de inscrição e limpar campos
  const handleMudarTipoInscricao = (tipo: TipoInscricao) => {
    setTipoInscricao(tipo);
    setEmail("");
    setUsername("");
    setSenha("");
  };

  const handleSubmitNovo = async (e: React.FormEvent) => {
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

  const handleSubmitExistente = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!email) {
      Swal.fire('Erro', 'Preencha o email do jogador.', 'error');
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
      // Inscrever jogador existente por email
      const { inscreverJogadorPorEmail } = await import("../../services/torneioServico");
      await inscreverJogadorPorEmail({
        torneio_id: torneioId,
        email: email
      });

      // Limpar campos
      setEmail("");

      // Sucesso
      Swal.fire({
        title: 'Sucesso!',
        text: `Jogador inscrito no torneio "${torneioNome}" com sucesso!`,
        icon: 'success',
        confirmButtonText: 'OK'
      }).then(() => {
        onSuccess();
        onClose();
      });

    } catch (error: any) {
      console.error("Erro ao inscrever jogador:", error);

      // Extrai o "detail" do backend se existir
      const detail = error.response?.data?.detail;
      const mensagemErro = detail || 'Serviço indisponível, tente novamente mais tarde.';

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

  const handleSubmit = (e: React.FormEvent) => {
    if (tipoInscricao === 'novo') {
      handleSubmitNovo(e);
    } else {
      handleSubmitExistente(e);
    }
  };

  return (
    <div className={estilos.modalOverlay} onClick={onClose}>
      <div className={estilos.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={estilos.modalHeader}>
          <h2 className={estilos.modalTitulo}>Inscrever Jogador</h2>
          <button className={estilos.btnFechar} onClick={onClose}>×</button>
        </div>

        {/* Abas de seleção do tipo de inscrição */}
        <div className={estilos.abasContainer}>
          <button
            type="button"
            className={`${estilos.aba} ${tipoInscricao === 'novo' ? estilos.abaAtiva : ''}`}
            onClick={() => handleMudarTipoInscricao('novo')}
          >
            Cadastrar Novo Jogador
          </button>
          <button
            type="button"
            className={`${estilos.aba} ${tipoInscricao === 'existente' ? estilos.abaAtiva : ''}`}
            onClick={() => handleMudarTipoInscricao('existente')}
          >
            Jogador Existente
          </button>
        </div>

        <form onSubmit={handleSubmit} className={estilos.formulario}>
          {tipoInscricao === 'novo' ? (
            <p className={estilos.modalSubtitulo}>
              Cadastre um novo jogador e inscreva-o no torneio <strong>{torneioNome}</strong>
            </p>
          ) : (
            <p className={estilos.modalSubtitulo}>
              Informe o email do jogador existente para inscrevê-lo no torneio <strong>{torneioNome}</strong>
            </p>
          )}

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

          {tipoInscricao === 'novo' && (
            <>
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
            </>
          )}

          <div className={estilos.botoes}>
            <Button
              label="Cancelar"
              onClick={onClose}
              backgroundColor="var(--var-cor-terciaria)"
              disabled={carregando}
              type="button"
            />
            <Button
              label={
                carregando
                  ? (tipoInscricao === 'novo' ? "Cadastrando..." : "Inscrevendo...")
                  : (tipoInscricao === 'novo' ? "Cadastrar e Inscrever" : "Inscrever Jogador")
              }
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
