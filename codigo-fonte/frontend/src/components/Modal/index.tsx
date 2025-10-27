import React, { useState, useEffect } from "react";
import { FiX, FiEdit, FiUser, FiMove } from "react-icons/fi";
import Swal from "sweetalert2";
import styles from "./modal.module.css";

interface ResultadoPartidaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mesaId: number;
  numeroMesa: number;
  dupla1: string;
  dupla2: string;
  status: string;
  pontuacaoInicial1: number;
  pontuacaoInicial2: number;
  onConfirmarResultado?: (mesaId: number, pontuacaoTime1: number, pontuacaoTime2: number) => Promise<boolean>;
  rodadaStatus?: string;
  onEditarEmparelhamento?: (mesaId: number, jogadorId: number, novaMesaId?: number, novoTime?: 1 | 2) => void;
  jogadoresDaRodada?: Array<{
    id: number;
    username: string;
    mesa_id: number | null;
    time: number | null;
  }>;
  mesasDaRodada?: Array<{
    id: number;
    numero_mesa: number;
    time_1_jogadores: string[];
    time_2_jogadores: string[];
  }>;
}

const Modal: React.FC<ResultadoPartidaModalProps> = ({
  isOpen,
  onClose,
  mesaId,
  numeroMesa,
  dupla1,
  dupla2,
  status,
  pontuacaoInicial1,
  pontuacaoInicial2,
  onConfirmarResultado,
  rodadaStatus,
  onEditarEmparelhamento,
  jogadoresDaRodada,
  mesasDaRodada,
}) => {
  const [vitoriasDupla1, setVitoriasDupla1] = useState("");
  const [vitoriasDupla2, setVitoriasDupla2] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [modo, setModo] = useState<'resultado' | 'emparelhamento'>('resultado');

  // Determinar modo baseado no status da rodada
  useEffect(() => {
    if (!isOpen) return;

    // Se rodada está em emparelhamento, modo emparelhamento
    if (rodadaStatus && ['aguardando_emparelhamento', 'pronto_para_iniciar', 'emparelhamento_em_andamento'].includes(rodadaStatus.toLowerCase())) {
      setModo('emparelhamento');
    } else {
      setModo('resultado');
      setVitoriasDupla1(pontuacaoInicial1.toString());
      setVitoriasDupla2(pontuacaoInicial2.toString());
    }
  }, [isOpen, pontuacaoInicial1, pontuacaoInicial2, rodadaStatus]);

  const handleConfirmar = async () => {
    // Validar campos
    if (!vitoriasDupla1 || !vitoriasDupla2) {
      await Swal.fire('Atenção', 'Preencha todas as pontuações', 'warning');
      return;
    }

    const pontuacao1 = parseInt(vitoriasDupla1);
    const pontuacao2 = parseInt(vitoriasDupla2);

    if (isNaN(pontuacao1) || isNaN(pontuacao2)) {
      await Swal.fire('Atenção', 'Pontuações devem ser números válidos', 'warning');
      return;
    }

    if (pontuacao1 < 0 || pontuacao2 < 0) {
      await Swal.fire('Atenção', 'Pontuações não podem ser negativas', 'warning');
      return;
    }

    try {
      setConfirmando(true);

      if (onConfirmarResultado) {
        await onConfirmarResultado(mesaId, pontuacao1, pontuacao2);
        await Swal.fire('Sucesso', 'Resultado confirmado com sucesso!', 'success');
        onClose();
      } else {
        console.log("Resultado confirmado:", {
          mesaId,
          vitoriasDupla1: pontuacao1,
          vitoriasDupla2: pontuacao2,
        });
        onClose();
      }
    } catch (error) {
      console.error('Erro ao confirmar resultado:', error);
      await Swal.fire('Erro', 'Não foi possível confirmar o resultado. Tente novamente.', 'error');
    } finally {
      setConfirmando(false);
    }
  };

  const handleEditarEmparelhamento = async () => {
    if (!onEditarEmparelhamento) return;

    // Mostrar opções de edição
    const result = await Swal.fire({
      title: 'Editar Emparelhamento',
      html: `
        <div style="text-align: left;">
          <h3>Mesa ${numeroMesa}</h3>
          <p><strong>Time 1:</strong> ${dupla1}</p>
          <p><strong>Time 2:</strong> ${dupla2}</p>
          <br>
          <p>Escolha o tipo de edição:</p>
        </div>
      `,
      showCancelButton: true,
      showConfirmButton: true,
      confirmButtonText: 'Mover Jogador',
      cancelButtonText: 'Alterar Time',
      denyButtonText: 'Cancelar',
      showDenyButton: true,
      confirmButtonColor: '#9b80b6',
      cancelButtonColor: '#f39c12',
      denyButtonColor: '#6c757d',
    });

    let acao = '';

    if (result.isConfirmed) {
      // Mover jogador para outra mesa
      acao = 'mover';
    } else if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
      // Alterar time do jogador
      acao = 'alterar_time';
    } else {
      return; // Cancelado
    }

    if (acao === 'mover') {
      const jogadoresTime1 = dupla1.split(' & ');
      const jogadoresTime2 = dupla2.split(' & ');

      const jogadoresOptions = [
        ...jogadoresTime1.map((j, i) => ({ name: j, team: 1, index: i })),
        ...jogadoresTime2.map((j, i) => ({ name: j, team: 2, index: i }))
      ];

      const jogadorSelecionado = await Swal.fire({
        title: 'Selecionar Jogador',
        html: `
          <select id="jogador-select" class="swal2-input">
            ${jogadoresOptions.map(j => `<option value="${j.name}-team${j.team}">${j.name} (Time ${j.team})</option>`).join('')}
          </select>
        `,
        showCancelButton: true,
        confirmButtonText: 'Próximo',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
          const select = document.getElementById('jogador-select') as HTMLSelectElement;
          return select.value;
        }
      });

      if (jogadorSelecionado.isConfirmed) {
        const [jogadorNome] = jogadorSelecionado.value.split('-team');

        // Simulação de busca do ID do jogador (você pode ajustar isso)
        const jogadorId = 1; // TODO: Implementar busca real do ID

        const mesaDestino = await Swal.fire({
          title: 'Selecionar Mesa de Destino',
          input: 'number',
          inputPlaceholder: 'Digite o número da mesa',
          inputValidator: (value) => {
            if (!value) return 'Digite o número da mesa!';
            if (parseInt(value) === numeroMesa) return 'Selecione uma mesa diferente!';
            return null;
          },
          showCancelButton: true,
          confirmButtonText: 'Mover',
          cancelButtonText: 'Cancelar',
        });

        if (mesaDestino.isConfirmed) {
          try {
            await onEditarEmparelhamento(mesaId, jogadorId, parseInt(mesaDestino.value));
            await Swal.fire('Sucesso', 'Jogador movido com sucesso!', 'success');
          } catch (error) {
            await Swal.fire('Erro', 'Não foi possível mover o jogador.', 'error');
          }
        }
      }
    } else if (acao === 'alterar_time') {
      const jogadoresTime1 = dupla1.split(' & ');
      const jogadoresTime2 = dupla2.split(' & ');

      const jogadoresOptions = [
        ...jogadoresTime1.map((j, i) => ({ name: j, team: 1, newTeam: 2 })),
        ...jogadoresTime2.map((j, i) => ({ name: j, team: 2, newTeam: 1 }))
      ];

      const jogadorSelecionado = await Swal.fire({
        title: 'Selecionar Jogador',
        html: `
          <select id="jogador-select" class="swal2-input">
            ${jogadoresOptions.map(j => `<option value="${j.name}-team${j.team}-to${j.newTeam}">${j.name} (Time ${j.team} → Time ${j.newTeam})</option>`).join('')}
          </select>
        `,
        showCancelButton: true,
        confirmButtonText: 'Alterar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
          const select = document.getElementById('jogador-select') as HTMLSelectElement;
          return select.value;
        }
      });

      if (jogadorSelecionado.isConfirmed) {
        const [, teamInfo] = jogadorSelecionado.value.split('-team');
        const [oldTeam, newTeam] = teamInfo.split('-to');

        if (parseInt(oldTeam) === parseInt(newTeam)) {
          await Swal.fire('Atenção', 'Selecione um time diferente!', 'warning');
          return;
        }

        // Simulação de busca do ID do jogador (você pode ajustar isso)
        const jogadorId = 1; // TODO: Implementar busca real do ID

        try {
          await onEditarEmparelhamento(mesaId, jogadorId, undefined, parseInt(newTeam) as 1 | 2);
          await Swal.fire('Sucesso', 'Time do jogador alterado!', 'success');
        } catch (error) {
          await Swal.fire('Erro', 'Não foi possível alterar o time.', 'error');
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Mesa {numeroMesa}</h2>
          <div className={styles.headerRight}>
            <span className={styles.status}>{modo === 'emparelhamento' ? 'Emparelhamento' : status}</span>
            <button className={styles.closeButton} onClick={onClose}>
              <FiX />
            </button>
          </div>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.partidaInfo}>
            <div className={styles.dupla}>
              <span className={styles.duplaText}>{dupla1}</span>
              <span className={styles.duplaLabel}>Time 1</span>
            </div>

            <div className={styles.vs}>VS</div>

            <div className={styles.dupla}>
              <span className={styles.duplaText}>{dupla2}</span>
              <span className={styles.duplaLabel}>Time 2</span>
            </div>
          </div>

          {modo === 'resultado' ? (
            <>
              <h3 className={styles.resultadoTitle}>Informe o resultado da rodada</h3>

              <div className={styles.inputsContainer}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Vitórias do Time 1</label>
                  <input
                    type="number"
                    className={styles.input}
                    placeholder="Qnt. de vitórias do Time 1"
                    value={vitoriasDupla1}
                    onChange={(e) => setVitoriasDupla1(e.target.value)}
                    disabled={confirmando}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Vitórias do Time 2</label>
                  <input
                    type="number"
                    className={styles.input}
                    placeholder="Qnt. de vitórias do Time 2"
                    value={vitoriasDupla2}
                    onChange={(e) => setVitoriasDupla2(e.target.value)}
                    disabled={confirmando}
                  />
                </div>
              </div>

              <button
                className={styles.confirmarButton}
                onClick={handleConfirmar}
                disabled={confirmando}
              >
                {confirmando ? 'Confirmando...' : 'Confirmar Resultado'}
              </button>
            </>
          ) : (
            <>
              <h3 className={styles.resultadoTitle}>Editar Emparelhamento</h3>

              <div className={styles.edicaoContainer}>
                <p className={styles.edicaoDescription}>
                  Nesta fase você pode editar o emparelhamento da mesa.
                </p>

                <div className={styles.acoesContainer}>
                  <button
                    className={`${styles.acaoButton} ${styles.mover}`}
                    onClick={handleEditarEmparelhamento}
                  >
                    Mover Jogador ⟹
                  </button>

                  <button
                    className={`${styles.acaoButton} ${styles.alterarTime}`}
                    onClick={handleEditarEmparelhamento}
                  >
                    Alterar Time ↻
                  </button>
                </div>

                <div className={styles.dicasContainer}>
                  <h4>Dicas:</h4>
                  <ul>
                    <li><strong>Mover Jogador:</strong> Transfira um jogador para outra mesa</li>
                    <li><strong>Alterar Time:</strong> Troque um jogador entre Time 1 e Time 2 nesta mesa</li>
                    <li>Alterações são salvas automaticamente após confirmação</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
