import { useNavigate, useParams } from 'react-router-dom';
import styles from '../styles.module.css';
import CardInfoTorneio from '../../../components/CardInfoTorneio';
import RegrasPartida from '../../../components/CardRegrasPartida';
import type { IMesaAtiva, IRodada, ITorneio } from '../../../tipos/tipos';
import { useEffect, useState } from 'react';
import { buscarJogadoresInscritos, buscarTorneioPorId, tratarErroTorneio } from '../../../services/torneioServico';
import { buscarMinhaMesaNaRodada, buscarRodadasDoTorneio } from '../../../services/mesaServico';
import DropdownRodadas from '../../../components/DropdownRodadas';
import CardRanking from '../../../components/CardRanking';
import Swal from 'sweetalert2';

export default function Intervalo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [torneio, setTorneio] = useState<ITorneio | null>(null);
  const [loading, setLoading] = useState(true);
  const [regras, setRegras] = useState<string>('');
  const [erro, setErro] = useState<string | null>(null);
  const [rodadaSelecionada, setRodadaSelecionada] = useState<IRodada | null>(null);
  const [resultadoFinalSelecionado, setResultadoFinalSelecionado] = useState(false);
  const [selectedMesa, setSelectedMesa] = useState<IMesaAtiva | null>(null);
  const [loadingMesa, setLoadingMesa] = useState(false);
  const [ultimoStatus, setUltimoStatus] = useState<string>('');

  const formatarData = (dataISO?: string) => {
    if (!dataISO) return 'N/A';
    return new Date(dataISO).toLocaleDateString('pt-BR');
  };

  const formatarHora = (dataISO?: string) => {
    if (!dataISO) return 'N/A';
    return new Date(dataISO).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatarPreco = (valor?: number | null, gratuito?: boolean) => {
    if (gratuito) return 'Gratuito';
    if (!valor) return 'R$ 0,00';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Verificar status
  const verificarStatus = async () => {
    if (!rodadaSelecionada && !resultadoFinalSelecionado) return;

    try {
      let mesaData: IMesaAtiva | null = null;
      
      if (resultadoFinalSelecionado && torneio?.id) {
        const rodadas = await buscarRodadasDoTorneio(torneio.id);
        if (rodadas.length > 0) {
          const ultimaRodada = rodadas[rodadas.length - 1];
          mesaData = await buscarMinhaMesaNaRodada(ultimaRodada.id);
        }
      } else if (rodadaSelecionada) {
        mesaData = await buscarMinhaMesaNaRodada(rodadaSelecionada.id);
      }

      if (mesaData) {
        const statusAtual = `${mesaData.status_rodada}-${mesaData.time_vencedor}`;
        
        // Se mudou o status, atualiza e mostra alerta
        if (statusAtual !== ultimoStatus && ultimoStatus !== '') {
          setSelectedMesa(mesaData);
          setUltimoStatus(statusAtual);
          
          Swal.fire({
            title: '🎉 Status Atualizado!',
            text: 'O status da sua partida foi atualizado',
            icon: 'success',
            confirmButtonText: 'OK',
            timer: 3000,
            toast: true,
            position: 'top-end',
            showConfirmButton: false
          });
        
        navigate("/historico/");
        }

        setUltimoStatus(statusAtual);
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  // Webhook simplificado - polling a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(verificarStatus, 30000);
    return () => clearInterval(interval);
  }, [rodadaSelecionada, resultadoFinalSelecionado, torneio?.id, ultimoStatus]);

  // Buscar dados do torneio
  useEffect(() => {
    const carregarTorneio = async () => {
      try {
        setLoading(true);
        const torneioId = id ? parseInt(id) : 1;
        
        const [dadosTorneio] = await Promise.all([
          buscarTorneioPorId(torneioId),
          buscarJogadoresInscritos(torneioId),
        ]);
        
        setTorneio(dadosTorneio);
        setRegras(dadosTorneio.regras || "");

      } catch (e) {
        console.error('Intervalo - Erro ao carregar torneio:', e);
        setErro(tratarErroTorneio(e));
      } finally {
        setLoading(false);
      }
    };

    carregarTorneio();
  }, [id]);

  // Buscar dados mesa
  useEffect(() => {
    const carregarMesa = async () => {
      if (!rodadaSelecionada && !resultadoFinalSelecionado) {
        setSelectedMesa(null);
        return;
      }

      try {
        setLoadingMesa(true);
        let mesaData: IMesaAtiva | null = null;
        
        if (resultadoFinalSelecionado && torneio?.id) {
          const rodadas = await buscarRodadasDoTorneio(torneio.id);
          if (rodadas.length > 0) {
            const ultimaRodada = rodadas[rodadas.length - 1];
            mesaData = await buscarMinhaMesaNaRodada(ultimaRodada.id);
          }
        } else if (rodadaSelecionada) {
          mesaData = await buscarMinhaMesaNaRodada(rodadaSelecionada.id);
        }

        setSelectedMesa(mesaData);
        
        // Define status inicial
        if (mesaData) {
          setUltimoStatus(`${mesaData.status_rodada}-${mesaData.time_vencedor}`);
        }
      } catch (error) {
        console.error('Erro ao carregar mesa:', error);
        setSelectedMesa(null);
      } finally {
        setLoadingMesa(false);
      }
    };

    carregarMesa();
  }, [rodadaSelecionada, resultadoFinalSelecionado, torneio?.id]);

  const handleSelecionarRodada = (rodada: IRodada) => {
    setRodadaSelecionada(rodada);
    setResultadoFinalSelecionado(false);
    setUltimoStatus(''); // Reseta para não notificar na primeira carga
  };

  const handleSelecionarResultadoFinal = () => {
    setResultadoFinalSelecionado(true);
    setRodadaSelecionada(null);
    setUltimoStatus(''); // Reseta para não notificar na primeira carga
  };

  if (loading) return <p>Carregando...</p>;
  if (erro) return <p>{erro}</p>;

  return (
    <div className={styles.container}>
      {/* CABEÇALHO */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>Intervalo</h1>
          <p className={styles.subtitulo}>
            {torneio?.nome}
          </p>
        </div>
        <div className={styles.rodadaBadge}>
          <DropdownRodadas
            tournamentId={torneio?.id}
            rodadaSelecionada={rodadaSelecionada}
            onSelecionarRodada={handleSelecionarRodada}
            onSelecionarResultadoFinal={handleSelecionarResultadoFinal}
            resultadoFinalSelecionado={resultadoFinalSelecionado}
            tournamentStatus={torneio?.status}
          />
        </div>
      </div>
      <div className={styles.gridContainer}>
        {/* COLUNA ESQUERDA - Conteúdo principal baseado na seleção */}
        <div className={styles.colunaEsquerda}>
          {resultadoFinalSelecionado ? (
            <CardRanking
              tournamentId={torneio?.id}
              isRankingFinal={true}
              titulo="🏆 Ranking Final do Torneio"
              mostrarMetricasAvancadas={true}
            />
          ) : loadingMesa ? (
            <div className={styles.intervaloTexto}>
              <p>Carregando resultado...</p>
            </div>
          ) : !selectedMesa ? (
            <div className={styles.intervaloCard}>
              <h2 className={styles.intervaloTitulo}> Você recebeu um bye nesta rodada. </h2>
              <p className={styles.intervaloTexto}>
                Aproveite para tomar uma água enquanto aguarda a próxima rodada.
              </p>
            </div>
          ) : selectedMesa && selectedMesa.status_rodada.toLowerCase() === 'finalizada' ? (
            <div className={styles.intervaloCard}>
              <h2 className={styles.intervaloTitulo}>Resultado da Rodada {selectedMesa.numero_rodada}</h2>
              <p className={styles.intervaloTexto}>
                A rodada foi finalizada.
              </p>

              <div className={styles.resultadoIntervalo}>
                <h3 className={styles.resultadoTitulo}>Resultado da Partida</h3>

                {selectedMesa.numero_mesa === 0 ? (
                  <div className={styles.byeResultado}>
                    Você recebeu um bye nesta rodada.
                  </div>
                ) : (
                  <>
                    <div className={styles.duplaResultado}>
                      <div className={styles.duplaResultadoHeader}>
                        <span className={styles.pontuacaoResultado}>
                          Meu time: {selectedMesa.meu_time === 1 ? selectedMesa.pontuacao_time_1 : selectedMesa.pontuacao_time_2}
                        </span>
                        {selectedMesa.time_vencedor === selectedMesa.meu_time && (
                          <span className={styles.vencedorTag}>Vencedor</span>
                        )}
                      </div>
                    </div>
                    <div className={styles.vsResultado}>VS</div>
                    <div className={styles.duplaResultado}>
                      <div className={styles.duplaResultadoHeader}>
                        <span className={styles.pontuacaoResultado}>
                          Time adversário: {selectedMesa.meu_time === 1 ? selectedMesa.pontuacao_time_2 : selectedMesa.pontuacao_time_1}
                        </span>
                        {selectedMesa.time_vencedor && selectedMesa.time_vencedor !== selectedMesa.meu_time && (
                          <span className={styles.vencedorTag}>Vencedor</span>
                        )}
                      </div>
                    </div>

                    {selectedMesa.time_vencedor === 0 && (
                      <div className={styles.empateTag}>Partida Empatada</div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : selectedMesa && selectedMesa.status_rodada.toLowerCase() !== 'finalizada' ? (
            <div className={styles.intervaloCard}>
              <h2 className={styles.intervaloTitulo}>Rodada {selectedMesa.numero_rodada} em Andamento</h2>
              <p className={styles.intervaloTexto}>
                A rodada ainda está em andamento.
              </p>
            </div>
          ) : (
            <div className={styles.intervaloCard}>
              <h2 className={styles.intervaloTitulo}>Modo Intervalo</h2>
              <p className={styles.intervaloTexto}>
                Selecione uma rodada para visualizar o resultado da sua partida.
              </p>
            </div>
          )}
        </div>

        {/* COLUNA DIREITA - Informações fixas do torneio + conteúdo condicional */}
        <div className={styles.colunaDireita}>
          <CardInfoTorneio
            title="Informações do Torneio"
            name={torneio?.nome || ""}
            date={torneio ? formatarData(torneio?.data_inicio) : ""}
            time={torneio ? formatarHora(torneio?.data_inicio) : ""}
            location={torneio?.loja_nome || ""}
            price={torneio ? formatarPreco(torneio.valor_incricao, torneio.incricao_gratuita) : ""}
            players={torneio?.qnt_vagas || 0}
          />

          <RegrasPartida 
            regras={regras || "Erro ao carregar as regras."} 
          />

          {resultadoFinalSelecionado ? (
            <div className={styles.mensagem}>
              {/* Quando resultado final está selecionado, mostra informações adicionais ou vazio  */}
            </div>
          ) : rodadaSelecionada ? (
            <CardRanking
              tournamentId={torneio?.id}
              rodadaId={rodadaSelecionada.id}
              titulo={`🏆 Ranking - Rodada ${rodadaSelecionada.numero_rodada}`}
              limite={10}
              mostrarMetricasAvancadas={false}
            />
          ) : (
            <div className={styles.mensagem}>
              Selecione uma rodada para visualizar o ranking
            </div>
          )}
        </div>
      </div>
    </div>
  );
}