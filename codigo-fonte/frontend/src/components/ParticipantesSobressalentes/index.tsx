import React from "react";
import styles from "./participantes.module.css";

interface ParticipantesSobressalentesProps {
  participantes?: string[];
}

const ParticipantesSobressalentes: React.FC<ParticipantesSobressalentesProps> = ({
  participantes,
}) => {
    
  const participantesPadrao = [
    "Alexandre Shadows",
    "Julia Frostmage", 
    "Marina Stormcaller"
  ];

  const listaParticipantes = participantes || participantesPadrao;

  return (
    <div className={styles.participantsContainer}>
      <h3 className={styles.title}>Participantes sobressalentes</h3>
      <div className={styles.participantsList}>
        {listaParticipantes.map((nome, index) => (
          <div key={index} className={styles.participantItem}>
            {nome}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParticipantesSobressalentes;