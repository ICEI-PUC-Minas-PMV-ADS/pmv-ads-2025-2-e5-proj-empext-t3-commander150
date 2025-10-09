import React, { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
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
}) => {
  const [vitoriasDupla1, setVitoriasDupla1] = useState("");
  const [vitoriasDupla2, setVitoriasDupla2] = useState("");
  const [confirmando, setConfirmando] = useState(false);

  // Atualizar valores quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      setVitoriasDupla1(pontuacaoInicial1.toString());
      setVitoriasDupla2(pontuacaoInicial2.toString());
    }
  }, [isOpen, pontuacaoInicial1, pontuacaoInicial2]);

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

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Mesa {numeroMesa}</h2>
          <div className={styles.headerRight}>
            <span className={styles.status}>{status}</span>
            <button className={styles.closeButton} onClick={onClose}>
              <FiX />
            </button>
          </div>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.partidaInfo}>
            <div className={styles.dupla}>
              <span className={styles.duplaText}>{dupla1}</span>
              <span className={styles.duplaLabel}>Dupla 1</span>
            </div>
            
            <div className={styles.vs}>VS</div>
            
            <div className={styles.dupla}>
              <span className={styles.duplaText}>{dupla2}</span>
              <span className={styles.duplaLabel}>Dupla 2</span>
            </div>
          </div>

          <h3 className={styles.resultadoTitle}>Informe o resultado da rodada</h3>

          <div className={styles.inputsContainer}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Vitórias da dupla 1</label>
              <input
                type="number"
                className={styles.input}
                placeholder="Qnt. de vitórias da dupla 1"
                value={vitoriasDupla1}
                onChange={(e) => setVitoriasDupla1(e.target.value)}
                disabled={confirmando}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Vitórias da dupla 2</label>
              <input
                type="number"
                className={styles.input}
                placeholder="Qnt. de vitórias da dupla 2"
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
        </div>
      </div>
    </div>
  );
};

export default Modal;