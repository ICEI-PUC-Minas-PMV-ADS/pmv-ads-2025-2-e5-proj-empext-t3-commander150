import React from "react";
import { FiInfo, FiCalendar, FiClock, FiMapPin, FiUsers } from "react-icons/fi";
import { FaMoneyBillWave } from "react-icons/fa";
import styles from "./style.module.css";

interface CardInfoTorneioProps {
  title: string;
  name: string;
  date: string;
  time: string;
  location: string;
  price: string;
  players: number;
  className?: string;
  tournamentId?: number;
  action?: React.ReactNode;
  onClick?: () => void; // Nova prop para handle click
}

const CardInfoTorneio: React.FC<CardInfoTorneioProps> = ({
  title,
  name,
  date,
  time,
  location,
  price,
  players,
  className = "",
  tournamentId,
  action,
  onClick, // Recebe a função via prop
}) => {
  return (
    <div
      className={`${styles.card} ${
        tournamentId ? styles.clickable : ""
      } ${className}`}
      onClick={onClick} // Usa a função passada via prop
    >
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.tournamentName}>
        <FiInfo /> {name}
      </div>

      <div className={styles.tournamentInfo}>
        <div>
          <FiCalendar /> {date}
        </div>
        <div>
          <FiClock /> {time}
        </div>
        <div>
          <FiMapPin /> {location}
        </div>
        <div>
          <FaMoneyBillWave /> {price}
        </div>
        <div>
          <FiUsers /> {players} jogadores inscritos
        </div>
      </div>

      {action ? <div className={styles.actions}>{action}</div> : null}
    </div>
  );
};

export default CardInfoTorneio;