import { useLocation, useParams } from 'react-router-dom';
import styles from '../styles.module.css';
import CardInfoTorneio from '../../../components/CardInfoTorneio';
import RegrasPartida from '../../../components/CardRegrasPartida';
import CardRanking from '../../../components/CardRanking';
import { BsPauseCircle } from 'react-icons/bs';
import type { IMesaAtiva, ITorneio } from '../../../tipos/tipos';
import { useEffect, useState } from 'react';
import { buscarJogadoresInscritos, buscarTorneioPorId, tratarErroTorneio } from '../../../services/torneioServico';

// Dados mockados para futuro ranking
const rankingJogadores = [
  { id: '1', nome: 'Alexandre Shadows', position: 1, points: 12 },
  { id: '2', nome: 'Julia Frostmage', position: 2, points: 9 },
  { id: '3', nome: 'Marina Stormcaller', position: 3, points: 7 },
  { id: '4', nome: 'Pedro Flamecaster', position: 4, points: 6 },
];


export default function Intervalo() {
  const { id } = useParams<{ id: string }>();
  const [torneio, setTorneio] = useState<ITorneio | null>(null);
  //const [mesa, setMesa] = useState<IMesaAtiva | null>(null);
  const [loading, setLoading] = useState(true);
  const [regras, setRegras] = useState<string>('');
  const [erro, setErro] = useState<string | null>(null);
  const location = useLocation();
    
  
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

  useEffect(() => {
    const carregarTorneio = async () => {
      try {
        setLoading(true);
        // const mesaData = await buscarMinhaMesaNaRodada(parseInt(rodadaId));
        // setMesa(mesaData);
        const torneioId = id ? parseInt(id) : 1;
        console.log('InformacaoTorneio - Buscando torneio ID:', torneioId);
        const [dadosTorneio] = await Promise.all([
          buscarTorneioPorId(torneioId),
          buscarJogadoresInscritos(torneioId)
        ]);
        setTorneio(dadosTorneio);
        setRegras(dadosTorneio.regras || "");
      } catch (e) {
        console.error('InformacaoTorneio - Erro ao carregar torneio:', e);
        setErro(tratarErroTorneio(e));
      } finally {
        setLoading(false);
      }
    };

    carregarTorneio();
  }, [id]);
  if (loading) return <p>Carregando...</p>;
  if (erro) return <p>{erro}</p>;
  const mesa = location.state?.mesa as IMesaAtiva | undefined;
  const torneio1 = location.state?.torneio as ITorneio | undefined;


  return (
    <div className={styles.container}>
      {/* CABEÇALHO */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>Intervalo</h1>
          <p className={styles.subtitulo}>
            {torneio?.nome || torneio1?.nome}
          </p>
        </div>
        {mesa && (
          <div className={styles.rodadaBadge}>
            <BsPauseCircle className={styles.statusIcon} />
            Rodada {mesa.numero_rodada} - Intervalo
          </div>
        )}
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className={styles.gridContainer}>
        <div className={styles.colunaEsquerda}>
          {mesa ? (
            /* VEIO DA MESA ATIVA - Mostra resultado específico */
            <div className={styles.intervaloCard}>
              <h2 className={styles.intervaloTitulo}>Estamos no Intervalo</h2>
              <p className={styles.intervaloTexto}>
                A rodada {mesa.numero_rodada} foi finalizada. Aguarde o início da próxima rodada.
              </p>

              {/* Resultado da Partida */}
              <div className={styles.resultadoIntervalo}>
                <h3 className={styles.resultadoTitulo}>Resultado da Partida</h3>

                <div className={styles.duplaResultado}>
                  <div className={styles.duplaResultadoHeader}>
                    <span className={styles.pontuacaoResultado}>
                      Pontuação: {mesa.meu_time === 1 ? mesa.pontuacao_time_1 : mesa.pontuacao_time_2}
                    </span>
                    {mesa.time_vencedor === mesa.meu_time && (
                      <span className={styles.vencedorTag}>Vencedor</span>
                    )}
                  </div>
                  <span className={styles.duplaResultadoNomes}>
                    {mesa.meu_time === 1 
                      ? mesa.time_1.map(j => j.username).join(' & ')
                      : mesa.time_2.map(j => j.username).join(' & ')
                    }
                  </span>
                </div>

                <div className={styles.vsResultado}>VS</div>

                <div className={styles.duplaResultado}>
                  <div className={styles.duplaResultadoHeader}>
                    <span className={styles.pontuacaoResultado}>
                      Pontuação: {mesa.meu_time === 1 ? mesa.pontuacao_time_2 : mesa.pontuacao_time_1}
                    </span>
                    {mesa.time_vencedor && mesa.time_vencedor !== mesa.meu_time && (
                      <span className={styles.vencedorTag}>Vencedor</span>
                    )}
                  </div>
                  <span className={styles.duplaResultadoNomes}>
                    {mesa.meu_time === 1 
                      ? mesa.time_2.map(j => j.username).join(' & ')
                      : mesa.time_1.map(j => j.username).join(' & ')
                    }
                  </span>
                </div>

                {mesa.time_vencedor === 0 && (
                  <div className={styles.empateTag}>Partida Empatada</div>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.intervaloCard}>
              <h2 className={styles.intervaloTitulo}>Modo Intervalo</h2>
              <p className={styles.intervaloTexto}>
                Aguarde o início da próxima rodada do torneio.
              </p>
            </div>
          )}
        </div>

        {/* COLUNA DIREITA - Informações do torneio */}
        <div className={styles.colunaDireita}>
          <CardInfoTorneio
            title="Informações do Torneio"
            name={torneio?.nome|| torneio1?.nome || ""}
            date={torneio ? formatarData(torneio.data_inicio) : formatarData(torneio1?.data_inicio)}
            time={torneio ? formatarHora(torneio.data_inicio) : formatarHora(torneio1?.data_inicio)}
            location={torneio?.loja_nome || ""}
            price={torneio ? formatarPreco(torneio.valor_incricao, torneio.incricao_gratuita) : formatarPreco(torneio1?.valor_incricao, torneio1?.incricao_gratuita)}
            players={torneio?.qnt_vagas || torneio1?.qnt_vagas || 0}
          />

          <RegrasPartida 
            regras={regras || torneio1?.regras ||"Erro ao carregar as regras."} 
          />

          <CardRanking
            players={rankingJogadores}
            title="Ranking Atual"
            maxItems={4}
          />
        </div>
      </div>
    </div>
  );
}