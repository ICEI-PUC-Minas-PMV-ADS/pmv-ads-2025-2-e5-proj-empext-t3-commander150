import { useParams } from 'react-router-dom';
import styles from '../styles.module.css';
import CardInfoTorneio from '../../../components/CardInfoTorneio';
import RegrasPartida from '../../../components/CardRegrasPartida';
import type { IMesaAtiva, IRodada, ITorneio } from '../../../tipos/tipos';
import { useEffect, useState } from 'react';
import { buscarJogadoresInscritos, buscarTorneioPorId, tratarErroTorneio } from '../../../services/torneioServico';
import { buscarMinhaMesaNaRodada, buscarRodadasDoTorneio } from '../../../services/mesaServico';
import DropdownRodadas from '../../../components/DropdownRodadas';
import CardRanking from '../../../components/CardRanking';

export default function Intervalo() {
  const { id } = useParams<{ id: string }>();
  const [torneio, setTorneio] = useState<ITorneio | null>(null);
  const [loading, setLoading] = useState(true);
  const [regras, setRegras] = useState<string>('');
  const [erro, setErro] = useState<string | null>(null);
  const [rodadaSelecionada, setRodadaSelecionada] = useState<IRodada | null>(null);
  const [resultadoFinalSelecionado, setResultadoFinalSelecionado] = useState(false);
  const [selectedMesa, setSelectedMesa] = useState<IMesaAtiva | null>(null);
  const [loadingMesa, setLoadingMesa] = useState(false);

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

  // Buscar dados do torneio - seguindo a lógica do primeiro arquivo
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

  // Busca a mesa quando muda a rodadaSelecionada
  useEffect(() => {
    const carregarMesa = async () => {
      if (!rodadaSelecionada && !resultadoFinalSelecionado) {
        setSelectedMesa(null);
        return;
      }

      if (!rodadaSelecionada) return;

      try {
        setLoadingMesa(true);
        const mesaData = await buscarMinhaMesaNaRodada(rodadaSelecionada.id);
        setSelectedMesa(mesaData);
      } catch (error) {
        console.error('Erro ao carregar mesa da rodada:', error);
        setSelectedMesa(null);
      } finally {
        setLoadingMesa(false);
      }
    };

    carregarMesa();
  }, [rodadaSelecionada, resultadoFinalSelecionado]);

  const handleSelecionarRodada = (rodada: IRodada) => {
    setRodadaSelecionada(rodada);
    setResultadoFinalSelecionado(false);
  };

  const handleSelecionarResultadoFinal = async () => {
    if (!torneio?.id) return;
    
    try {
      setLoadingMesa(true);
      const rodadas = await buscarRodadasDoTorneio(torneio.id);
      if (rodadas.length > 0) {
        const ultimaRodada = rodadas[rodadas.length - 1];
        const mesaData = await buscarMinhaMesaNaRodada(ultimaRodada.id);
        setSelectedMesa(mesaData);
      }
      setResultadoFinalSelecionado(true);
      setRodadaSelecionada(null);
    } catch (error) {
      console.error('Erro ao carregar mesa para resultado final:', error);
      setSelectedMesa(null);
      setResultadoFinalSelecionado(true);
      setRodadaSelecionada(null);
    } finally {
      setLoadingMesa(false);
    }
  };
  console.log('Selected Mesa:', selectedMesa);

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

      {/* CONTEÚDO PRINCIPAL */}
      <div className={styles.gridContainer}>
        {/* COLUNA ESQUERDA - Conteúdo principal baseado na seleção */}
        <div className={styles.colunaEsquerda}>
          {resultadoFinalSelecionado ? (
            /* RESULTADO FINAL - Ranking fica na esquerda */
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
              /* BYE */
              <div className={styles.intervaloCard}>
                <h2 className={styles.intervaloTitulo}> Bye </h2>
                <p className={styles.intervaloTexto}>
                Você recebeu um bye nesta rodada.
                </p>
              </div>
          ) : selectedMesa && selectedMesa.status_rodada.toLowerCase() === 'finalizada' ? (
            /* RESULTADO DE RODADA - Resultado da partida fica na esquerda */
            <div className={styles.intervaloCard}>
              <h2 className={styles.intervaloTitulo}>Resultado da Rodada {selectedMesa.numero_rodada}</h2>
              <p className={styles.intervaloTexto}>
                A rodada foi finalizada.
              </p>

              {/* Resultado da Partida */}
              <div className={styles.resultadoIntervalo}>
                <h3 className={styles.resultadoTitulo}>Resultado da Partida</h3>

                {selectedMesa.numero_mesa === 0 ? (
                  /* BYE */
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
            /* Rodada ainda ativa */
            <div className={styles.intervaloCard}>
              <h2 className={styles.intervaloTitulo}>Rodada {selectedMesa.numero_rodada} em Andamento</h2>
              <p className={styles.intervaloTexto}>
                A rodada ainda está em andamento.
              </p>
            </div>
          ) : (
            /* Nada selecionado */
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
          {/* Informações fixas do torneio */}
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

          {/* Conteúdo condicional da coluna direita */}
          {resultadoFinalSelecionado ? (
            /* Quando resultado final está selecionado, mostra informações adicionais ou vazio */
            <div className={styles.mensagem}>
              {/* Pode adicionar algum conteúdo adicional aqui se necessário */}
            </div>
          ) : rodadaSelecionada ? (
            /* Quando rodada está selecionada, mostra ranking da rodada na direita */
            <CardRanking
              tournamentId={torneio?.id}
              rodadaId={rodadaSelecionada.id}
              titulo={`🏆 Ranking - Rodada ${rodadaSelecionada.numero_rodada}`}
              limite={10}
              mostrarMetricasAvancadas={false}
            />
          ) : (
            /* Nada selecionado */
            <div className={styles.mensagem}>
              Selecione uma rodada para visualizar o ranking
            </div>
          )}
        </div>
      </div>
    </div>
  );
}