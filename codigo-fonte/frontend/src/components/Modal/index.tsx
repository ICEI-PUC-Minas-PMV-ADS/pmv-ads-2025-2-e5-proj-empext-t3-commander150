import React, { useState } from "react";
import { FiX } from "react-icons/fi";
import styles from "./modal.module.css";

interface ResultadoPartidaModalProps {
  isOpen: boolean;
  onClose: () => void;
  numeroMesa: number;
  dupla1: string;
  dupla2: string;
  status: string;
}

const Modal: React.FC<ResultadoPartidaModalProps> = ({
  isOpen,
  onClose,
  numeroMesa,
  dupla1,
  dupla2,
  status,
}) => {
  const [vitoriasDupla1, setVitoriasDupla1] = useState("");
  const [vitoriasDupla2, setVitoriasDupla2] = useState("");

  const handleConfirmar = () => {
    // Lógica para confirmar o resultado
    console.log("Resultado confirmado:", {
      vitoriasDupla1,
      vitoriasDupla2,
    });
    onClose();
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
              />
            </div>
          </div>

          <button className={styles.confirmarButton} onClick={handleConfirmar}>
            Confirmar Resultado
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;