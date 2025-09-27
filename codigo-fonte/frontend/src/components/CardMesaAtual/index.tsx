import React from "react";
import styles from "./style.module.css";

interface Dupla {
  jogadores: string[];
  tipo: "jogador" | "adversaria";
}

interface CardMesaAtualProps {
  mesa: number;
  status: string;
  duplaJogador: Dupla;
  duplaAdversaria: Dupla;
}

const CardMesaAtual: React.FC<CardMesaAtualProps> = ({
  mesa,
  status,
  duplaJogador,
  duplaAdversaria,
}) => {
  const renderDupla = (dupla: Dupla) => (
    <div className={styles.duplaBox}>
      <span className={styles.duplaNomes}>
        {dupla.jogadores.join(" & ")}
      </span>
      <span
        className={`${styles.duplaTag} ${
          dupla.tipo === "jogador" ? styles.jogador : styles.adversaria
        }`}
      >
        {dupla.tipo === "jogador" ? "Sua Dupla" : "Dupla Adversária"}
      </span>
    </div>
  );

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Sua Partida - Mesa {mesa}</h3>
      <p className={styles.subtitle}>{status}</p>

      {renderDupla(duplaJogador)}

      <div className={styles.vs}>VS</div>

      {renderDupla(duplaAdversaria)}
    </div>
  );
};

export default CardMesaAtual;
