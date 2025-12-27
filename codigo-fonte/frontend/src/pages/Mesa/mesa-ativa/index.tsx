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

  // Identificar você e sua dupla
  const meuTime = mesa.meu_time === 1 ? mesa.time_1 : mesa.time_2;
  const timeAdversario = mesa.meu_time === 1 ? mesa.time_2 : mesa.time_1;

  // Separar você da sua dupla baseado no id_usuario do usuário logado
  const voce = meuTime.find(j => j.id_usuario === usuario?.id) || meuTime[0];
  const suaDupla = meuTime.find(j => j.id_usuario !== usuario?.id) || meuTime[1];

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
            <p className={styles.statusPartida}>Disposição da Mesa</p>
            <p className={styles.descricaoMesa}>Você está sentado em frente ao adversário e na diagonal da sua dupla</p>

            {/* Layout da Mesa */}
            <div className={styles.mesaLayout}>
              {/* Linha Superior: VOCÊ e ADV1 */}
              <div className={styles.posicaoTopoEsquerda}>
                <div className={`${styles.jogadorCard} ${styles.voce}`}>
                  <div className={styles.jogadorNome}>{voce?.username || 'Você'}</div>
                  <div className={styles.jogadorPosicao}>Você</div>
                </div>
              </div>

              <div className={styles.posicaoTopoDireita}>
                <div className={`${styles.jogadorCard} ${styles.adversario}`}>
                  <div className={styles.jogadorNome}>{timeAdversario[0]?.username || 'Adversário'}</div>
                  <div className={styles.jogadorPosicao}>À sua frente</div>
                </div>
              </div>

              {/* Centro da Mesa */}
              <div className={styles.centroMesa}>
                <div className={styles.mesaIcone}>🎴</div>
                <div className={styles.mesaTexto}>MESA</div>
              </div>

              {/* Linha Inferior: ADV2 e SUA DUPLA */}
              <div className={styles.posicaoBaseEsquerda}>
                <div className={`${styles.jogadorCard} ${styles.adversario}`}>
                  <div className={styles.jogadorNome}>{timeAdversario[1]?.username || 'Adversário'}</div>
                  <div className={styles.jogadorPosicao}>Ao seu lado</div>
                </div>
              </div>

              <div className={styles.posicaoBaseDireita}>
                <div className={`${styles.jogadorCard} ${styles.dupla}`}>
                  <div className={styles.jogadorNome}>{suaDupla?.username || 'Sua Dupla'}</div>
                  <div className={styles.jogadorPosicao}>Sua Dupla</div>
                </div>
              </div>
            </div>

            {/* Legenda das Duplas */}
            <div className={styles.legendaDuplas}>
              <div className={styles.legendaItem}>
                <span className={`${styles.legendaCor} ${styles.corVoce}`}></span>
                <span>Sua Dupla: {voce?.username} & {suaDupla?.username}</span>
              </div>
              <div className={styles.legendaItem}>
                <span className={`${styles.legendaCor} ${styles.corAdversario}`}></span>
                <span>Adversários: {timeAdversario.map(j => j.username).join(' & ')}</span>
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