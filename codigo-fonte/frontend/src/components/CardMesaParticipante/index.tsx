import React, { useState } from "react";
import { FiEdit } from "react-icons/fi";
import Modal from "../Modal";
import styles from "./mesaParticipante.module.css";

interface MesaCardProps {
  numeroMesa: number;
  time1: string;
  time2: string;
  status: "Finalizado" | "Em andamento" | "Revisar dados";
  onEdit?: () => void;
}

const MesaCard: React.FC<MesaCardProps> = ({
  numeroMesa,
  time1,
  time2,
  status,
  onEdit,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEditClick = () => {
    setIsModalOpen(true);
    if (onEdit) {
      onEdit();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className={styles.mesaContainer}>
        <div className={styles.header}>
          <h3 className={styles.title}>Mesa {numeroMesa}</h3>
          <button className={styles.editButton} onClick={handleEditClick}>
            <FiEdit />
          </button>
        </div>

        <div className={styles.teamsInfo}>
          <div className={styles.team}>Time 1: {time1}</div>
          <div className={styles.team}>Time 2: {time2}</div>
        </div>

        <div className={styles.statusContainer}>
          <span
            className={`${styles.status} ${
              styles[status.toLowerCase().replace(" ", "")]
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        numeroMesa={numeroMesa}
        dupla1={time1}
        dupla2={time2}
        status={status}
      />
    </>
  );
};

export default MesaCard;
