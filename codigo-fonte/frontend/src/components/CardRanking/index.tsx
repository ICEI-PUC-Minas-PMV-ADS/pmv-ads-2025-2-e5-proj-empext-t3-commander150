import { useState, useEffect } from "react";
import { buscarRankingRodada } from "../../services/torneioServico";
import styles from './styles.module.css';
import { buscarRodadasDoTorneio } from "../../services/mesaServico";
import type { IRodada, IJogadorRanking } from "../../tipos/tipos";

interface RankingProps {
  tournamentId?: number;
  rodadaId?: number;
  isRankingFinal?: boolean;
  titulo?: string;
  subtitulo?: string;
  limite?: number;
  className?: string;
  mostrarMetricasAvancadas?: boolean; // Nova prop para mostrar métricas detalhadas
  compact?: boolean; // Modo compacto/minimalista para caber tudo na tela
  onRankingCarregado?: (ranking: IJogadorRanking[]) => void;
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
  mostrarMetricasAvancadas = false,
  compact = false,
  onRankingCarregado,
  onErro
}) => {
  const [ranking, setRanking] = useState<IJogadorRanking[]>([]);
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

  // Formata porcentagem para exibição
  const formatarPorcentagem = (valor?: number): string => {
    if (valor === undefined || valor === null) return '-';
    return `${(valor * 100).toFixed(1)}%`;
  };

  // Formata balanço com sinal
  const formatarBalanco = (valor?: number): string => {
    if (valor === undefined || valor === null) return '-';
    const formatado = (valor * 100).toFixed(1);
    return valor >= 0 ? `+${formatado}%` : `${formatado}%`;
  };

  // Retorna classe CSS baseada no balanço
  const getClasseBalanco = (balanco?: number) => {
    if (balanco === undefined || balanco === null) return '';
    if (balanco > 0.05) return styles.balancoPositivo;
    if (balanco < -0.05) return styles.balancoNegativo;
    return styles.balancoNeutro;
  };

  // Retorna ícone baseado no balanço
  const getIconeBalanco = (balanco?: number) => {
    if (balanco === undefined || balanco === null) return '';
    if (balanco > 0.05) return '↑';
    if (balanco < -0.05) return '↓';
    return '≈';
  };

  // Verifica se há métricas avançadas nos dados
  const temMetricasAvancadas = ranking.length > 0 && ranking[0].mw_percentage !== undefined;

  const containerClass = `${styles.container} ${className} ${
    isRankingFinal ? styles.rankingFinal : styles.rankingParcial
  } ${compact ? styles.compact : ''}`;

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
        <div className={`${styles.rankingContainer} ${compact ? styles.rankingContainerCompact : ''}`}>
          {rankingParaExibir.map((jogador) => {
            const emoji = getEmojiPosicao(jogador.posicao);
            const classePosicao = getClassePosicao(jogador.posicao);
            const classeBalanco = getClasseBalanco(jogador.balanco);
            const iconeBalanco = getIconeBalanco(jogador.balanco);

            return (
              <div key={jogador.jogador_id} className={`${styles.rankingItem} ${compact ? styles.rankingItemCompact : ''}`}>
                <div className={`${styles.rankingPosicao} ${classePosicao} ${compact ? styles.rankingPosicaoCompact : ''}`}>
                  {emoji || <span>{jogador.posicao}º</span>}
                </div>
                <div className={`${styles.rankingInfo} ${compact ? styles.rankingInfoCompact : ''}`}>
                  <div className={`${styles.rankingHeader} ${compact ? styles.rankingHeaderCompact : ''}`}>
                    <span className={`${styles.rankingNome} ${compact ? styles.rankingNomeCompact : ''}`}>{jogador.jogador_nome}</span>

                    {compact ? (
                      <>
                        {/* MOBILE - Formato antigo com badge */}
                        <div className={`${styles.rankingPontosWrapper} ${styles.rankingPontosWrapperCompactMobile}`}>
                          <span className={`${styles.rankingPontos} ${styles.rankingPontosCompact}`}>
                            {jogador.pontos} pts
                          </span>
                          {temMetricasAvancadas && jogador.balanco !== undefined && (
                            <span className={`${styles.balancoInlineMobile} ${classeBalanco}`}>
                              {iconeBalanco} {formatarBalanco(jogador.balanco)}
                            </span>
                          )}
                        </div>

                        {/* DESKTOP - Formato abreviado com todos os tiebreakers */}
                        <div className={`${styles.rankingPontosWrapper} ${styles.rankingPontosWrapperCompactDesktop}`}>
                          <span className={styles.tiebreaker}>
                            <span className={styles.tiebreakerLabel}>PTS:</span>
                            <span className={`${styles.tiebreakerValue} ${styles.tiebreakerPts}`}>{jogador.pontos}</span>
                          </span>
                          {temMetricasAvancadas && jogador.balanco !== undefined && (
                            <>
                              <span className={styles.tiebreaker}>
                                <span className={styles.tiebreakerLabel}>BLÇ:</span>
                                <span className={`${styles.tiebreakerValue} ${styles.tiebreakerBalanco} ${classeBalanco}`}>
                                  {formatarBalanco(jogador.balanco)}
                                </span>
                              </span>
                              <span className={styles.tiebreaker}>
                                <span className={styles.tiebreakerLabel}>OMW%:</span>
                                <span className={`${styles.tiebreakerValue} ${styles.tiebreakerOmw}`}>
                                  {formatarPorcentagem(jogador.omw_percentage)}
                                </span>
                              </span>
                              <span className={styles.tiebreaker}>
                                <span className={styles.tiebreakerLabel}>MW%:</span>
                                <span className={`${styles.tiebreakerValue} ${styles.tiebreakerMw}`}>
                                  {formatarPorcentagem(jogador.mw_percentage)}
                                </span>
                              </span>
                              <span className={styles.tiebreaker}>
                                <span className={styles.tiebreakerLabel}>PMW%:</span>
                                <span className={`${styles.tiebreakerValue} ${styles.tiebreakerPmw}`}>
                                  {formatarPorcentagem(jogador.pmw_percentage)}
                                </span>
                              </span>
                            </>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className={styles.rankingPontosWrapper}>
                        {/* Formato normal */}
                        <span className={styles.rankingPontos}>{jogador.pontos} pts</span>
                      </div>
                    )}
                  </div>

                  {/* Métricas avançadas - só mostra se estiver habilitado E tiver dados E não estiver no modo compact */}
                  {(mostrarMetricasAvancadas && temMetricasAvancadas && !compact) && jogador.mw_percentage !== undefined && (
                    <div className={styles.metricas}>
                      <div
                        className={`${styles.metricaItem} ${styles.metricaBalanco} ${classeBalanco}`}
                        title="Balanço (OMW% - PMW%) - Mérito individual. Positivo = venceu com parceiros fracos. Negativo = teve parceiros fortes."
                      >
                        <span className={styles.metricaLabel}>Balanço:</span>
                        <span className={styles.metricaValor}>
                          <span className={styles.iconeBalanco}>{iconeBalanco}</span>
                          {formatarBalanco(jogador.balanco)}
                        </span>
                      </div>

                      <div className={styles.metricaItem} title="Opponent Match Win % - Força dos seus oponentes">
                        <span className={styles.metricaLabel}>OMW%:</span>
                        <span className={styles.metricaValor}>{formatarPorcentagem(jogador.omw_percentage)}</span>
                      </div>

                      <div className={styles.metricaItem} title="Match Win % - Seu aproveitamento individual">
                        <span className={styles.metricaLabel}>MW%:</span>
                        <span className={styles.metricaValor}>{formatarPorcentagem(jogador.mw_percentage)}</span>
                      </div>

                      <div className={styles.metricaItem} title="Partner Match Win % - Força dos seus parceiros">
                        <span className={styles.metricaLabel}>PMW%:</span>
                        <span className={styles.metricaValor}>{formatarPorcentagem(jogador.pmw_percentage)}</span>
                      </div>
                    </div>
                  )}
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