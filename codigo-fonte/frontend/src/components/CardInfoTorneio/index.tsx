import React from "react";
import { FiInfo, FiCalendar, FiClock, FiMapPin, FiUsers } from "react-icons/fi";
import { FaMoneyBillWave } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
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
  tournamentId?: string | number;
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
  tournamentId
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (tournamentId) {
      navigate(`/torneios/${tournamentId}`);
    }
  };

  return (
    <div 
      className={`${styles.card} ${tournamentId ? styles.clickable : ''} ${className}`}
      onClick={handleClick}
    >
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.tournamentName}><FiInfo /> {name}</div>
      <div className={styles.tournamentInfo}>
        <div><FiCalendar /> {date}</div>
        <div><FiClock /> {time}</div>
        <div><FiMapPin /> {location}</div>
        <div><FaMoneyBillWave /> {price}</div>
        <div><FiUsers /> {players} jogadores inscritos</div>
      </div>
    </div>
  );
};

export default CardInfoTorneio;