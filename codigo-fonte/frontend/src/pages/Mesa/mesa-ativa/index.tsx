import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { buscarMinhaMesaNaRodada, reportarResultadoMesa } from '../../../services/mesaServico';
import { buscarTorneioPorId } from '../../../services/torneioServico';
import type { IMesaAtiva, IRodada, ITorneio } from '../../../tipos/tipos';
import styles from '../styles.module.css';
import Swal from 'sweetalert2';
import { CardSuperior } from '../../../components/CardSuperior';
import CardInfoTorneio from '../../../components/CardInfoTorneio';
import RegrasPartida from '../../../components/CardRegrasPartida';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import { BsGrid3X3Gap } from 'react-icons/bs';
import { GiPodium } from 'react-icons/gi';
import { FaDollarSign } from 'react-icons/fa';
import DropdownRodadas from '../../../components/DropdownRodadas';
import CardRanking from '../../../components/CardRanking';

export default function MesaAtiva() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mesa, setMesa] = useState<IMesaAtiva | null>(null);
  const [torneio, setTorneio] = useState<ITorneio | null>(null);
  const [torneioId, setTorneioId] = useState(Number);
  const [loading, setLoading] = useState(true);
  const [reportandoResultado, setReportandoResultado] = useState(false);
  const [regras, setRegras] = useState<string>('');
  const [vitoriasSuaDupla, setVitoriasSuaDupla] = useState('');
  const [vitoriasOponentes, setVitoriasOponentes] = useState('');
  const [rodadaSelecionada, setRodadaSelecionada] = useState<IRodada | null>(null);
  const [resultadoFinalSelecionado, setResultadoFinalSelecionado] = useState(false);
  
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

  // Lógica para carregar mesa
  useEffect(() => {
    if (!id) {
      navigate(`/intervalo/${torneioId}`); // Vai para intervalo
      return;
    }

    const carregarMesa = async () => {
      try {
        setLoading(true);
        const mesaData = await buscarMinhaMesaNaRodada(parseInt(id));
        setMesa(mesaData);

        try {
          const torneioData = await buscarTorneioPorId(mesaData.id_torneio);
          setTorneio(torneioData);
          setRegras(torneioData.regras || "");
          setTorneioId( torneioData.id);
          
        } catch (error) {
          console.error('Erro ao carregar torneio:', error);
        }
        // Se a rodada já terminou, vai para intervalo
        if (mesaData.status_rodada.toLowerCase() === 'finalizada') {
           navigate(`/intervalo/${torneioId}`, {
            state: { mesa: mesaData } // Passa a mesa para o intervalo
          });
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

        // Buscar torneio
        
      } catch (error) {
        console.error('Erro ao carregar mesa:', error);
        Swal.fire('Erro', 'Não foi possível carregar a mesa.', 'error');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    carregarMesa();
  }, [id, navigate]);

  const handleReportarResultado = async () => {
    if (!mesa) return;

    if (!vitoriasSuaDupla || !vitoriasOponentes) {
      Swal.fire('Atenção', 'Preencha todas as pontuações', 'warning');
      return;
    }

    // Sua lógica de reportar resultado (mantém a mesma)
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
      navigate(`/intervalo/${torneioId}`, {
        state: {
          mesa: mesaAtualizada,
          torneio: torneio
        }
      });
    } catch (error) {
      console.error('Erro ao reportar resultado:', error);
      Swal.fire('Erro', 'Não foi possível reportar o resultado.', 'error');
    } finally {
      setReportandoResultado(false);
    }
  };

  const handleSelecionarRodada = (rodada: any) => {
    setRodadaSelecionada(rodada);
    setResultadoFinalSelecionado(false);
  };

  const handleSelecionarResultadoFinal = async () => {
    setResultadoFinalSelecionado(true);
    setRodadaSelecionada(null);
  };

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>Carregando...</div></div>;
  }

  if (!mesa) {
    return <div className={styles.container}><div className={styles.error}>Mesa não encontrada</div></div>;
  }

  const meuTime = mesa.meu_time === 1 ? mesa.time_1 : mesa.time_2;
  const timeAdversario = mesa.meu_time === 1 ? mesa.time_2 : mesa.time_1;

  //  Bye OU Mesa Ativa
  return (
    <div className={styles.container}>
      {/* CABEÇALHO (igual para ambos) */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>
            {mesa.numero_mesa === 0 ? 'Você recebeu um bye!' : 'Mesa Ativa'}
          </h1>
          <p className={styles.subtitulo}>{mesa.nome_torneio}</p>
        </div>
        <div className={styles.rodadaBadge}>
          {/* Dropdown de Rodadas */}
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

      {/* CARDS SUPERIORES (igual para ambos) */}
      <div className={styles.gridContainer}>
        <div className={styles.cardsEsquerda}>
          <CardSuperior
            count={mesa.numero_mesa === 0 ? "BYE" : mesa.numero_mesa}
            label="Sua Mesa"
            icon={BsGrid3X3Gap}
            selected={false}
          />
          <CardSuperior
            count={mesa.numero_rodada}
            secondaryCount={torneio?.quantidade_rodadas || undefined}
            label="Rodada"
            icon={GiPodium}
            selected={false}
          />
        </div>
        <div className={styles.cardsDireita}>
          <CardSuperior
            count={torneio?.valor_incricao || 0}
            label="Premiação"
            icon={FaDollarSign}
            selected={false}
          />
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className={styles.gridContainer}>
        {/* COLUNA ESQUERDA - Conteúdo específico */}
        <div className={styles.colunaEsquerda}>
          {mesa.numero_mesa === 0 ? (
            /* === TELA BYE === */
            <div className={styles.intervaloCard}>
              <h2 className={styles.intervaloTitulo}>Você recebeu um bye!</h2>
              <p className={styles.intervaloTexto}>
                Aproveite para tomar uma água enquanto aguarda a próxima rodada.
              </p>
            </div>
          ) : (
            /* === TELA MESA ATIVA === */
            <>
              {/* Sua Partida */}
              <div className={styles.partidaCard}>
                <h2 className={styles.cardTitulo}>Sua Partida - Mesa {mesa.numero_mesa}</h2>
                <p className={styles.statusPartida}>Partida em andamento</p>

                <div className={styles.dupla}>
                  <div className={styles.duplaHeader}>
                    <span className={styles.duplaNomes}>
                      {meuTime.map(j => j.username).join(' & ')}
                    </span>
                    <span className={styles.duplaTag}>Sua Dupla</span>
                  </div>
                </div>

                <div className={styles.vs}>VS</div>

                <div className={styles.dupla}>
                  <div className={styles.duplaHeader}>
                    <span className={styles.duplaNomes}>
                      {timeAdversario.map(j => j.username).join(' & ')}
                    </span>
                    <span className={styles.duplaTagAdversario}>Dupla Adversária</span>
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
              </div>
            </>
          )}
        </div>

        {/* COLUNA DIREITA - Informações do torneio (igual para ambos) */}
        <div className={styles.colunaDireita}>
          <CardInfoTorneio
            title="Informações do Torneio"
            name={mesa.nome_torneio}
            date={formatarData(torneio?.data_inicio)}
            time={formatarHora(torneio?.data_inicio)}
            location={torneio?.loja_nome || 'Loja não especificada'}
            price={formatarPreco(torneio?.valor_incricao, torneio?.incricao_gratuita)}
            players={torneio?.qnt_vagas || 0}
          />

          <RegrasPartida regras={regras} />

          {resultadoFinalSelecionado ? (
          <CardRanking
            tournamentId={torneio?.id}
            isRankingFinal={true}
            titulo="🏆 Ranking Final do Torneio"
          />
        ) : rodadaSelecionada ? (
          <CardRanking
            tournamentId={torneio?.id}
            rodadaId={rodadaSelecionada.id}
            titulo={`🏆 Ranking - Rodada ${rodadaSelecionada.numero_rodada}`}
            limite={10}
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