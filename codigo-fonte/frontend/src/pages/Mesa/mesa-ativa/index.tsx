// components/MesaAtivaComponent.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buscarMinhaMesaNaRodada, reportarResultadoMesa } from '../../../services/mesaServico';
import { buscarTorneioPorId } from '../../../services/torneioServico';
import type { IMesaAtiva, ITorneio } from '../../../tipos/tipos';
import { useSessao } from '../../../contextos/AuthContexto';
import styles from '../styles.module.css';
import Swal from 'sweetalert2';
import { CardSuperior } from '../../../components/CardSuperior';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import CardRanking from '../../../components/CardRanking';
import RegrasPartida from '../../../components/CardRegrasPartida';
import { BsGrid3X3Gap } from 'react-icons/bs';
import { GiPodium } from 'react-icons/gi';

interface MesaAtivaProps {
  rodadaId: number;
  torneioId: number;
  onMesaFinalizada?: (mesa: IMesaAtiva) => void;
  onVoltarParaIntervalo?: () => void;
}

export default function MesaAtivaComponent({
  rodadaId,
  torneioId,
  onMesaFinalizada,
  onVoltarParaIntervalo
}: MesaAtivaProps) {
  const navigate = useNavigate();
  const { usuario } = useSessao();
  const [mesa, setMesa] = useState<IMesaAtiva | null>(null);
  const [torneio, setTorneio] = useState<ITorneio | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportandoResultado, setReportandoResultado] = useState(false);
  const [regras, setRegras] = useState<string>('');
  const [vitoriasSuaDupla, setVitoriasSuaDupla] = useState('');
  const [vitoriasOponentes, setVitoriasOponentes] = useState('');
  const [ultimoStatus, setUltimoStatus] = useState<string>('');

  // Função para verificar status (igual da sua implementação)
  const verificarStatus = async () => {
    try {
      const mesaData = await buscarMinhaMesaNaRodada(rodadaId);
      
      if (mesaData) {
        const statusAtual = `${mesaData.status_rodada}-${mesaData.time_vencedor}`;
        
        if (statusAtual !== ultimoStatus && ultimoStatus !== '') {
          setMesa(mesaData);
          setUltimoStatus(statusAtual);
          
          if (mesaData.status_rodada.toLowerCase() === 'finalizada') {
            Swal.fire({
              title: '🏁 Rodada Finalizada!',
              text: 'A rodada foi finalizada pelo organizador',
              icon: 'info',
              confirmButtonText: 'Ver Resultado',
              timer: 5000
            }).then(() => {
              onMesaFinalizada?.(mesaData);
            });
          } else {
            Swal.fire({
              title: '🔄 Status Atualizado!',
              text: 'Houve uma atualização na sua mesa',
              icon: 'success',
              confirmButtonText: 'OK',
              timer: 3000,
              toast: true,
              position: 'top-end',
              showConfirmButton: false
            });
          }
        }
        
        setUltimoStatus(statusAtual);
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  // Webhook simplificado
  useEffect(() => {
    const interval = setInterval(verificarStatus, 30000);
    return () => clearInterval(interval);
  }, [rodadaId, ultimoStatus]);

  // Carregar mesa
  useEffect(() => {
    const carregarMesa = async () => {
      try {
        setLoading(true);
        const mesaData = await buscarMinhaMesaNaRodada(rodadaId);

        // Se estiver no bye, chama callback para voltar ao intervalo
        if (!mesaData) {
          onVoltarParaIntervalo?.();
          return;
        }

        setMesa(mesaData);
        setUltimoStatus(`${mesaData.status_rodada}-${mesaData.time_vencedor}`);

        try {
          const torneioData = await buscarTorneioPorId(torneioId);
          setTorneio(torneioData);
          setRegras(torneioData.regras || "");
        } catch (error) {
          console.error('Erro ao carregar torneio:', error);
        }

        // Se a mesa já está finalizada, chama callback
        if (mesaData?.status_rodada.toLowerCase() === 'finalizada') {
          onMesaFinalizada?.(mesaData);
          return;
        }

        // Valores iniciais dos inputs
        if (mesaData.meu_time === 1) {
          setVitoriasSuaDupla(mesaData.pontuacao_time_1.toString());
          setVitoriasOponentes(mesaData.pontuacao_time_2.toString());
        } else {
          setVitoriasSuaDupla(mesaData.pontuacao_time_2.toString());
          setVitoriasOponentes(mesaData.pontuacao_time_1.toString());
        }
        
      } catch (error) {
        console.error('Erro ao carregar mesa:', error);
        Swal.fire('Erro', 'Não foi possível carregar a mesa.', 'error');
        onVoltarParaIntervalo?.();
      } finally {
        setLoading(false);
      }
    };

    carregarMesa();
  }, [rodadaId, torneioId, onMesaFinalizada, onVoltarParaIntervalo]);

  const handleReportarResultado = async () => {
    if (!mesa) return;

    if (!vitoriasSuaDupla || !vitoriasOponentes) {
      Swal.fire('Atenção', 'Preencha todas as pontuações', 'warning');
      return;
    }

    let pontuacaoTime1: number;
    let pontuacaoTime2: number;

    if (mesa.meu_time === 1) {
      pontuacaoTime1 = parseInt(vitoriasSuaDupla);
      pontuacaoTime2 = parseInt(vitoriasOponentes);
    } else {
      pontuacaoTime1 = parseInt(vitoriasOponentes);
      pontuacaoTime2 = parseInt(vitoriasSuaDupla);
    }

    let timeVencedor: number;
    if (pontuacaoTime1 > pontuacaoTime2) {
      timeVencedor = 1;
    } else if (pontuacaoTime2 > pontuacaoTime1) {
      timeVencedor = 2;
    } else {
      timeVencedor = 0;
    }

    try {
      setReportandoResultado(true);
      const mesaAtualizada = await reportarResultadoMesa(mesa.id, pontuacaoTime1, pontuacaoTime2, timeVencedor);

      setMesa({
        ...mesa,
        pontuacao_time_1: pontuacaoTime1,
        pontuacao_time_2: pontuacaoTime2,
        time_vencedor: timeVencedor,
        status_rodada: 'Finalizada'
      });

      await Swal.fire('Sucesso', 'Resultado reportado com sucesso!', 'success');
      onMesaFinalizada?.(mesaAtualizada);
    } catch (error) {
      console.error('Erro ao reportar resultado:', error);
      Swal.fire('Erro', 'Não foi possível reportar o resultado.', 'error');
    } finally {
      setReportandoResultado(false);
    }
  };

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>Carregando...</div></div>;
  }

  if (!mesa) {
    return <div className={styles.container}><div className={styles.error}>Mesa não encontrada</div></div>;
  }

  // Identificar times baseado em qual time o jogador está
  const meuTime = mesa.meu_time === 1 ? mesa.time_1 : mesa.time_2;
  const timeAdversario = mesa.meu_time === 1 ? mesa.time_2 : mesa.time_1;

  // Regra de negócio: Posições baseadas em RANKING
  // meuTime[0] = Melhor ranqueado do meu time (sempre na posição superior)
  // meuTime[1] = Pior ranqueado do meu time (sempre na posição inferior)
  // timeAdversario[0] = Melhor ranqueado adversário (frente ao melhor do meu time)
  // timeAdversario[1] = Pior ranqueado adversário (ao lado do melhor do meu time)

  const melhorDoMeuTime = meuTime[0] || { username: 'Jogador 1', id_usuario: 0 };
  const piorDoMeuTime = meuTime[1] || { username: 'Jogador 2', id_usuario: 0 };
  const melhorAdversario = timeAdversario[0] || { username: 'Adversário 1', id_usuario: 0 };
  const piorAdversario = timeAdversario[1] || { username: 'Adversário 2', id_usuario: 0 };

  // Verificar se você é o melhor ou pior ranqueado do seu time
  const voceEhMelhor = melhorDoMeuTime.id_usuario === usuario?.id;

  // Identificar você e sua dupla
  const voce = voceEhMelhor ? melhorDoMeuTime : piorDoMeuTime;
  const suaDupla = voceEhMelhor ? piorDoMeuTime : melhorDoMeuTime;

  return (
    <div className={styles.container}>
      {/* CABEÇALHO */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>
            {mesa.numero_mesa === 0 ? 'Você recebeu um bye!' : 'Mesa Ativa'}
          </h1>
          <p className={styles.subtitulo}>
            {mesa.nome_torneio}
          </p>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className={styles.gridContainer}>
        <div className={styles.colunaEsquerda}>
          {/* Cards Superiores */}
          <div className={styles.cardsEsquerda}>
            <CardSuperior
              count={mesa.numero_mesa === 0 ? "BYE" : mesa.numero_mesa}
              label="Sua Mesa"
              icon={BsGrid3X3Gap}
              selected={false}
            />
            <CardSuperior
              count={mesa.numero_rodada}
              label="Rodada"
              icon={GiPodium}
              selected={false}
            />
          </div>

          {/* Sua Partida */}
          <div className={styles.partidaCard}>
            <h2 className={styles.cardTitulo}>Sua Partida - Mesa {mesa.numero_mesa}</h2>
            <p className={styles.statusPartida}>Disposição da Mesa por Ranking</p>
            <p className={styles.descricaoMesa}>
              {voceEhMelhor
                ? 'Você é o melhor ranqueado da sua dupla. Adversário à sua frente, parceiro na diagonal.'
                : 'Adversário à sua frente, parceiro na diagonal (melhor ranqueado da dupla).'}
            </p>

            {/* Layout da Mesa - Disposição por RANKING */}
            <div className={styles.mesaLayout}>
              {/* Linha Superior: Melhor do Meu Time (Esq) vs Melhor Adversário (Dir) */}
              <div className={styles.posicaoTopoEsquerda}>
                <div className={`${styles.jogadorCard} ${melhorDoMeuTime.id_usuario === usuario?.id ? styles.voce : styles.dupla}`}>
                  <div className={styles.jogadorNome}>{melhorDoMeuTime.username}</div>
                  <div className={styles.jogadorPosicao}>
                    {melhorDoMeuTime.id_usuario === usuario?.id ? 'Você' : 'Sua Dupla'}
                  </div>
                </div>
              </div>

              <div className={styles.posicaoTopoDireita}>
                <div className={`${styles.jogadorCard} ${styles.adversario}`}>
                  <div className={styles.jogadorNome}>{melhorAdversario.username}</div>
                  <div className={styles.jogadorPosicao}>
                    {melhorDoMeuTime.id_usuario === usuario?.id ? 'À sua frente' : 'Diagonal'}
                  </div>
                </div>
              </div>

              {/* Centro da Mesa */}
              <div className={styles.centroMesa}>
                <div className={styles.mesaIcone}>🎴</div>
                <div className={styles.mesaTexto}>MESA</div>
              </div>

              {/* Linha Inferior: Pior Adversário (Esq) vs Pior do Meu Time (Dir) */}
              <div className={styles.posicaoBaseEsquerda}>
                <div className={`${styles.jogadorCard} ${styles.adversario}`}>
                  <div className={styles.jogadorNome}>{piorAdversario.username}</div>
                  <div className={styles.jogadorPosicao}>
                    {melhorDoMeuTime.id_usuario === usuario?.id ? 'Ao seu lado' : 'À sua frente'}
                  </div>
                </div>
              </div>

              <div className={styles.posicaoBaseDireita}>
                <div className={`${styles.jogadorCard} ${piorDoMeuTime.id_usuario === usuario?.id ? styles.voce : styles.dupla}`}>
                  <div className={styles.jogadorNome}>{piorDoMeuTime.username}</div>
                  <div className={styles.jogadorPosicao}>
                    {piorDoMeuTime.id_usuario === usuario?.id ? 'Você' : 'Sua Dupla'}
                  </div>
                </div>
              </div>
            </div>

            {/* Legenda das Duplas */}
            <div className={styles.legendaDuplas}>
              <div className={styles.legendaItem}>
                <span className={`${styles.legendaCor} ${styles.corVoce}`}></span>
                <span>Sua Dupla: {melhorDoMeuTime.username} & {piorDoMeuTime.username}</span>
              </div>
              <div className={styles.legendaItem}>
                <span className={`${styles.legendaCor} ${styles.corAdversario}`}></span>
                <span>Adversários: {melhorAdversario.username} & {piorAdversario.username}</span>
              </div>
            </div>
          </div>

          {/* Informar Resultado */}
          <div className={styles.resultadoCard}>
            <h2 className={styles.cardTitulo}>Informar Resultado da Rodada</h2>
            <p className={styles.instrucao}>
              Informe a quantas vitórias e empates sua dupla teve ao final da partida
            </p>

            <div className={styles.inputsResultado}>
              <div className={styles.inputGroup}>
                <p className={styles.inputLabel}>Sua Dupla</p>
                <Input
                  type="numero"
                  name="vitorias_sua_dupla"
                  label="Vitórias"
                  value={vitoriasSuaDupla}
                  onChange={(e) => setVitoriasSuaDupla(e.target.value)}
                  backgroundColor="var(--var-cor-azul-fundo-section)"
                  textColor="var(--var-cor-branca)"
                  labelColor="var(--var-cor-branca)"
                />
              </div>
              <div className={styles.inputGroup}>
                <p className={styles.inputLabel}>Dupla Adversária</p>
                <Input
                  type="numero"
                  name="vitorias_oponentes"
                  label="Vitórias"
                  value={vitoriasOponentes}
                  onChange={(e) => setVitoriasOponentes(e.target.value)}
                  backgroundColor="var(--var-cor-azul-fundo-section)"
                  textColor="var(--var-cor-branca)"
                  labelColor="var(--var-cor-branca)"
                />
              </div>
            </div>

            <Button
              label="Confirmar Resultado"
              type="button"
              onClick={handleReportarResultado}
              disabled={reportandoResultado}
            />

            {/* Botão para voltar ao intervalo */}
            <Button
              label="Voltar"
              type="button"
              onClick={onVoltarParaIntervalo}
              backgroundColor="var(--var-cor-secundaria)"
            />
          </div>
        </div>

        {/* COLUNA DIREITA - Ranking e Regras */}
        <div className={styles.colunaDireita}>
          {/* Ranking da Rodada */}
          <CardRanking
            tournamentId={torneioId}
            rodadaId={rodadaId}
            titulo={`🏆 Ranking - Rodada ${mesa.numero_rodada}`}
            subtitulo="Pontuação acumulada com métricas avançadas"
            mostrarMetricasAvancadas={true}
          />

          {/* Regras da Partida */}
          {regras && (
            <RegrasPartida regras={regras} />
          )}
        </div>
      </div>
    </div>
  );
}