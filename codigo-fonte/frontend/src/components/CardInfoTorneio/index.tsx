import React from "react";
import { FiInfo, FiCalendar, FiClock, FiMapPin, FiUsers } from "react-icons/fi";
import { FaMoneyBillWave } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import styles from "./style.module.css";
import { verificarSessao } from "../../services/authServico";
import { buscarTorneioPorId } from "../../services/torneioServico";
import type { IUsuario } from "../../tipos/tipos";

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
  abaAtual?: "inscritos" | "andamento" | "historico";
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
  abaAtual = "inscritos", // valor padrão
}) => {
  const navigate = useNavigate();

  const handleClick = async () => {
    if (!tournamentId) return;

    try {
      const usuario: IUsuario = await verificarSessao();

      // Navegação baseada na ABA
      if (usuario.tipo === "JOGADOR") {
        // ABA "EM ANDAMENTO" => vai para MESA ATIVA
        if (abaAtual === "andamento") {
          const dadosTorneio = await buscarTorneioPorId(tournamentId);
          const rodadaId = (dadosTorneio as any)?.rodada_atual?.id;

          if (rodadaId) {
            navigate(`/mesa-ativa/${rodadaId}`);
          } else {
            navigate(`/intervalo/${tournamentId}`);
          }
          return;
        }

        // ABA "INSCRITOS" ou "HISTÓRICO" => vai para DETALHES DO TORNEIO
        if (abaAtual === "inscritos" || abaAtual === "historico") {
          if (abaAtual === "historico" && title === "Concluído") {
            navigate(`/torneios/${tournamentId}?preselect=result`);
          } else {
            navigate(`/torneios/${tournamentId}`);
          }
          return;
        }
      }

      // Fallback para Lojas ou casos não tratados
      navigate(`/torneios/${tournamentId}`);

    } catch (error) {
      console.error("Erro ao processar navegação:", error);
    }
  };

  return (
    <div
      className={`${styles.card} ${
        tournamentId ? styles.clickable : ""
      } ${className}`}
      onClick={handleClick}
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