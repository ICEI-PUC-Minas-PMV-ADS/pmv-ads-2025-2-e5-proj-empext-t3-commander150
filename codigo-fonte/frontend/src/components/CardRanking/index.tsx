import { useState, useEffect } from "react";
import { buscarRankingRodada } from "../../services/torneioServico";
import styles from './styles.module.css';
import { buscarRodadasDoTorneio } from "../../services/mesaServico";
import type { IRodada } from "../../tipos/tipos";

interface JogadorRanking {
  posicao: number;
  jogador_id: number;
  jogador_nome: string;
  pontos: number;
}

interface RankingProps {
  tournamentId?: number;
  rodadaId?: number;
  isRankingFinal?: boolean;
  titulo?: string;
  subtitulo?: string;
  limite?: number;
  className?: string;
  onRankingCarregado?: (ranking: JogadorRanking[]) => void;
  onErro?: (erro: string) => void;
}

const CardRanking: React.FC<RankingProps> = ({
  tournamentId,
  rodadaId,
  isRankingFinal = false,
  titulo = "🏆 Ranking",
  subtitulo,
  limite,
  className = '',
  onRankingCarregado,
  onErro
}) => {
  const [ranking, setRanking] = useState<JogadorRanking[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ultimaRodadaId, setUltimaRodadaId] = useState<number | null>(null);

  // Buscar a última rodada para ranking final
  const buscarUltimaRodada = async () => {
    if (!tournamentId) return null;

    try {
      const rodadas = await buscarRodadasDoTorneio(tournamentId) as IRodada[];
      if (rodadas.length > 0) {
        const ultimaRodada = rodadas[rodadas.length - 1];
        setUltimaRodadaId(ultimaRodada.id);
        return ultimaRodada.id;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar última rodada:', error);
      return null;
    }
  };

  const carregarRanking = async () => {
    if (!tournamentId) {
      setRanking([]);
      return;
    }

    try {
      setCarregando(true);
      setErro(null);
      
      let rodadaIdParaBuscar = rodadaId;

      // Se é ranking final, buscar a última rodada
      if (isRankingFinal && !rodadaId) {
        const ultimaRodadaId = await buscarUltimaRodada();
        rodadaIdParaBuscar = ultimaRodadaId || undefined;
      }

      if (!rodadaIdParaBuscar) {
        setRanking([]);
        return;
      }

      const response = await buscarRankingRodada(tournamentId, rodadaIdParaBuscar);
      const dadosRanking = response.ranking || [];
      setRanking(dadosRanking);
      
      // Callback para notificar o componente pai
      if (onRankingCarregado) {
        onRankingCarregado(dadosRanking);
      }
    } catch (error: any) {
      console.error('Erro ao carregar ranking:', error);
      const mensagemErro = 'Erro ao carregar ranking';
      setErro(mensagemErro);
      if (onErro) {
        onErro(mensagemErro);
      }
      setRanking([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarRanking();
  }, [tournamentId, rodadaId, isRankingFinal]);

  const getClassePosicao = (posicao: number) => {
    if (posicao === 1) return styles.medalhaOuro;
    if (posicao === 2) return styles.medalhaPrata;
    if (posicao === 3) return styles.medalhaBronze;
    return '';
  };

  const getEmojiPosicao = (posicao: number) => {
    if (posicao === 1) return '🥇';
    if (posicao === 2) return '🥈';
    if (posicao === 3) return '🥉';
    return null;
  };

  const containerClass = `${styles.container} ${className} ${
    isRankingFinal ? styles.rankingFinal : styles.rankingParcial
  }`;

  // Se não há limite definido, mostrar todos para ranking final
  const rankingParaExibir = limite ? ranking.slice(0, limite) : ranking;

  return (
    <div className={containerClass}>
      <h2 className={styles.titulo}>{titulo}</h2>
      
      {subtitulo && <div className={styles.subtitulo}>{subtitulo}</div>}
      
      {!subtitulo && !isRankingFinal && rodadaId && (
        <div className={styles.subtitulo}>
          Pontuação acumulada
        </div>
      )}

      {!subtitulo && isRankingFinal && (
        <div className={styles.subtitulo}>
          Classificação final do torneio
        </div>
      )}

      {carregando ? (
        <div className={styles.loading}>Carregando ranking...</div>
      ) : erro ? (
        <div className={styles.erro}>{erro}</div>
      ) : rankingParaExibir.length > 0 ? (
        <div className={styles.rankingContainer}>
          {rankingParaExibir.map((jogador) => {
            const emoji = getEmojiPosicao(jogador.posicao);
            const classePosicao = getClassePosicao(jogador.posicao);
            
            return (
              <div key={jogador.jogador_id} className={styles.rankingItem}>
                <div className={`${styles.rankingPosicao} ${classePosicao}`}>
                  {emoji || <span>{jogador.posicao}º</span>}
                </div>
                <div className={styles.rankingInfo}>
                  <span className={styles.rankingNome}>{jogador.jogador_nome}</span>
                  <span className={styles.rankingPontos}>{jogador.pontos} pontos</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.mensagemVazia}>
          {tournamentId && (rodadaId || isRankingFinal)
            ? 'Nenhum ranking disponível.' 
            : 'Selecione uma rodada para visualizar o ranking'
          }
        </div>
      )}
    </div>
  );
};

export default CardRanking;