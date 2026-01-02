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

  // REGRA DE NEGÓCIO: A disposição física da mesa é SEMPRE a mesma
  // Posição física FIXA baseada em Time 1 e Time 2 (não importa qual é "meu time"):
  //
  //     Time1[0]               Time2[0]
  //     ┌──────────────────────────────────┐
  //     │                                  │
  //     │           🎴 MESA                │
  //     │                                  │
  //     └──────────────────────────────────┘
  //     Time2[1]               Time1[1]
  //
  // - 1 e 3 estão À FRENTE (verticalmente opostos)
  // - 2 e 4 estão À FRENTE (verticalmente opostos)
  // - 1 e 2 estão AO LADO (horizontalmente)
  // - 3 e 4 estão AO LADO (horizontalmente)
  // - 1 e 4 são dupla Time 1 (DIAGONAL)
  // - 2 e 3 são dupla Time 2 (DIAGONAL)

  // Posições FÍSICAS fixas (sempre baseadas em time_1 e time_2)
  const jogadorPos1 = mesa.time_1[0] || { username: 'Time1-Melhor', id_usuario: 0 }; // Topo Esquerda
  const jogadorPos2 = mesa.time_2[0] || { username: 'Time2-Melhor', id_usuario: 0 }; // Topo Direita
  const jogadorPos3 = mesa.time_2[1] || { username: 'Time2-Pior', id_usuario: 0 };   // Base Esquerda
  const jogadorPos4 = mesa.time_1[1] || { username: 'Time1-Pior', id_usuario: 0 };   // Base Direita

  // Identificar qual é VOCÊ (qual posição você ocupa)
  const minhaPosicao =
    jogadorPos1.id_usuario === usuario?.id ? 1 :
    jogadorPos2.id_usuario === usuario?.id ? 2 :
    jogadorPos3.id_usuario === usuario?.id ? 3 :
    jogadorPos4.id_usuario === usuario?.id ? 4 : 1;

  // Identificar você e sua dupla baseado na sua posição
  const meuTime = mesa.meu_time === 1 ? mesa.time_1 : mesa.time_2;
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
            <p className={styles.statusPartida}>Disposição da Mesa por Ranking</p>
            <p className={styles.descricaoMesa}>
              {minhaPosicao === 1 && 'Você (Pos 1): Adversário à sua frente (Pos 2), adversário ao seu lado (Pos 3). Dupla na diagonal (Pos 4).'}
              {minhaPosicao === 2 && 'Você (Pos 2): Adversário à sua frente (Pos 1), adversário ao seu lado (Pos 4). Dupla na diagonal (Pos 3).'}
              {minhaPosicao === 3 && 'Você (Pos 3): Adversário ao seu lado (Pos 1), adversário à sua frente (Pos 4). Dupla na diagonal (Pos 2).'}
              {minhaPosicao === 4 && 'Você (Pos 4): Adversário à sua frente (Pos 3), adversário ao seu lado (Pos 2). Dupla na diagonal (Pos 1).'}
            </p>

            {/* Layout da Mesa - Disposição FIXA por Time 1 e Time 2 */}
            <div className={styles.mesaLayout}>
              {/* Posição 1: Topo Esquerda - Time 1 Melhor */}
              <div className={styles.posicaoTopoEsquerda}>
                <div className={`${styles.jogadorCard} ${jogadorPos1.id_usuario === usuario?.id ? styles.voce : (mesa.meu_time === 1 ? styles.dupla : styles.adversario)}`}>
                  <div className={styles.jogadorNome}>{jogadorPos1.username}</div>
                  <div className={styles.jogadorPosicao}>
                    {jogadorPos1.id_usuario === usuario?.id
                      ? 'Você'
                      : (minhaPosicao === 1 ? (mesa.meu_time === 1 ? 'Sua Dupla' : 'Adversário') :
                         minhaPosicao === 2 ? 'À sua frente' :
                         minhaPosicao === 3 ? 'Ao seu lado' :
                         minhaPosicao === 4 ? 'Diagonal' : (mesa.meu_time === 1 ? 'Sua Dupla' : 'Adversário'))}
                  </div>
                </div>
              </div>

              {/* Posição 2: Topo Direita - Time 2 Melhor */}
              <div className={styles.posicaoTopoDireita}>
                <div className={`${styles.jogadorCard} ${jogadorPos2.id_usuario === usuario?.id ? styles.voce : (mesa.meu_time === 2 ? styles.dupla : styles.adversario)}`}>
                  <div className={styles.jogadorNome}>{jogadorPos2.username}</div>
                  <div className={styles.jogadorPosicao}>
                    {jogadorPos2.id_usuario === usuario?.id
                      ? 'Você'
                      : (minhaPosicao === 1 ? 'À sua frente' :
                         minhaPosicao === 2 ? (mesa.meu_time === 2 ? 'Sua Dupla' : 'Adversário') :
                         minhaPosicao === 3 ? 'Diagonal' :
                         minhaPosicao === 4 ? 'Ao seu lado' : (mesa.meu_time === 2 ? 'Sua Dupla' : 'Adversário'))}
                  </div>
                </div>
              </div>

              {/* Centro da Mesa */}
              <div className={styles.centroMesa}>
                <div className={styles.mesaIcone}>🎴</div>
                <div className={styles.mesaTexto}>MESA</div>
              </div>

              {/* Posição 3: Base Esquerda - Time 2 Pior */}
              <div className={styles.posicaoBaseEsquerda}>
                <div className={`${styles.jogadorCard} ${jogadorPos3.id_usuario === usuario?.id ? styles.voce : (mesa.meu_time === 2 ? styles.dupla : styles.adversario)}`}>
                  <div className={styles.jogadorNome}>{jogadorPos3.username}</div>
                  <div className={styles.jogadorPosicao}>
                    {jogadorPos3.id_usuario === usuario?.id
                      ? 'Você'
                      : (minhaPosicao === 1 ? 'Ao seu lado' :
                         minhaPosicao === 2 ? 'Diagonal' :
                         minhaPosicao === 3 ? (mesa.meu_time === 2 ? 'Sua Dupla' : 'Adversário') :
                         minhaPosicao === 4 ? 'À sua frente' : (mesa.meu_time === 2 ? 'Sua Dupla' : 'Adversário'))}
                  </div>
                </div>
              </div>

              {/* Posição 4: Base Direita - Time 1 Pior */}
              <div className={styles.posicaoBaseDireita}>
                <div className={`${styles.jogadorCard} ${jogadorPos4.id_usuario === usuario?.id ? styles.voce : (mesa.meu_time === 1 ? styles.dupla : styles.adversario)}`}>
                  <div className={styles.jogadorNome}>{jogadorPos4.username}</div>
                  <div className={styles.jogadorPosicao}>
                    {jogadorPos4.id_usuario === usuario?.id
                      ? 'Você'
                      : (minhaPosicao === 1 ? 'Diagonal' :
                         minhaPosicao === 2 ? 'Ao seu lado' :
                         minhaPosicao === 3 ? 'À sua frente' :
                         minhaPosicao === 4 ? (mesa.meu_time === 1 ? 'Sua Dupla' : 'Adversário') : (mesa.meu_time === 1 ? 'Sua Dupla' : 'Adversário'))}
                  </div>
                </div>
              </div>
            </div>

            {/* Legenda das Duplas */}
            <div className={styles.legendaDuplas}>
              <div className={styles.legendaItem}>
                <span className={`${styles.legendaCor} ${styles.corVoce}`}></span>
                <span>Sua Dupla (Time {mesa.meu_time}): {voce.username} & {suaDupla.username}</span>
              </div>
              <div className={styles.legendaItem}>
                <span className={`${styles.legendaCor} ${styles.corAdversario}`}></span>
                <span>Adversários (Time {mesa.meu_time === 1 ? 2 : 1}): {mesa.meu_time === 1 ? `${jogadorPos2.username} & ${jogadorPos3.username}` : `${jogadorPos1.username} & ${jogadorPos4.username}`}</span>
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