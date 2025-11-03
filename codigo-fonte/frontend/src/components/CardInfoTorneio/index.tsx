import React from "react";
import { FiInfo, FiCalendar, FiClock, FiMapPin, FiUsers } from "react-icons/fi";
import { FaMoneyBillWave } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import styles from "./style.module.css";
import { verificarSessao } from "../../services/authServico";
import { buscarTorneioPorId } from "../../services/torneioServico";
import type { IUsuario } from "../../tipos/tipos";
import { buscarRodadasDoTorneio } from "../../services/mesaServico";

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
  abaAtual?: "inscritos" | "abertos" | "andamento" | "historico";
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
  abaAtual = "inscritos", 
}) => {
  const navigate = useNavigate();

  const handleClick = async () => {
    if (!tournamentId) return;

    try {
      const usuario: IUsuario = await verificarSessao();

      // Navegação baseada na ABA
      if (usuario.tipo === "JOGADOR") {
        // ABA "EM ANDAMENTO" => verifica se deve ir para MESA ATIVA ou INTERVALO
        if (abaAtual === "andamento") {
          const dadosTorneio = await buscarRodadasDoTorneio(tournamentId);
          
          // Encontrar a rodada ativa (não finalizada)
          const rodadaAtiva = dadosTorneio.find(rodada => 
            rodada.status.toLowerCase() !== 'finalizada'
          );
          const rodadaId = rodadaAtiva ? rodadaAtiva.id : null;

          if (rodadaId && rodadaAtiva) {
            const statusRodada = rodadaAtiva.status?.toLowerCase() || '';~
            console.log('Rodada ativa encontrada:', statusRodada);
            const statusComMesaAtiva = ['ativa', 'em andamento', 'iniciada', 'bye'];
            const statusEmPreparacao = ['emparelhamento', 'aguardando início', 'preparação', 'sortendo mesas'];
            
            if (statusComMesaAtiva.includes(statusRodada)) {
              // Rodada ativa - navegar para mesa ativa
              navigate(`/mesa-ativa/${rodadaId}`, {
                state: { 
                  tournamentId: tournamentId
                }
              });
            } else if (statusEmPreparacao.includes(statusRodada)) {
              // Rodada em preparação - navegar para intervalo
              navigate(`/intervalo/${tournamentId}`);
            } else {
              // Status não reconhecido - fallback para intervalo
              navigate(`/intervalo/${tournamentId}`);
            }
          } else {
            // Nenhuma rodada ativa encontrada - ir para intervalo
            navigate(`/intervalo/${tournamentId}`);
          }
          return;
        }
        
        // ABA "HISTÓRICO" => vai para Intervalo onde tem o resultado final
        if (abaAtual === "historico") {
          navigate(`/intervalo/${tournamentId}`);
          return;
        }
        
        // ABA "Abertos" => vai para DETALHES DO TORNEIO
        if (abaAtual === "abertos"){
          navigate(`/torneios/${tournamentId}`);
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