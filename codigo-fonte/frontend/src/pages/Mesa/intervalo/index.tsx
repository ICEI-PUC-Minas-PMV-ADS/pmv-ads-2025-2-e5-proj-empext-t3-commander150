import { useNavigate, useLocation } from 'react-router-dom';
import styles from '../styles.module.css';
import CardInfoTorneio from '../../../components/CardInfoTorneio';
import RegrasPartida from '../../../components/CardRegrasPartida';
import CardRanking from '../../../components/CardRanking';
import { BsPauseCircle } from 'react-icons/bs';
import type { IMesaAtiva, ITorneio } from '../../../tipos/tipos';

// Dados mockados para futuro ranking
const rankingJogadores = [
  { id: '1', nome: 'Alexandre Shadows', position: 1, points: 12 },
  { id: '2', nome: 'Julia Frostmage', position: 2, points: 9 },
  { id: '3', nome: 'Marina Stormcaller', position: 3, points: 7 },
  { id: '4', nome: 'Pedro Flamecaster', position: 4, points: 6 },
];

const infoTorneioPadrao = {
  nome: 'Torneio Atual',
  data: '15/12/2024',
  hora: '19:00',
  local: 'Loja Central',
  preco: 'Gratuito',
  jogadores: 32,
  regras: 'Aguarde as regras do próximo torneio.'
};

export default function Intervalo() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const mesa = location.state?.mesa as IMesaAtiva | undefined;
  const torneio = location.state?.torneio as ITorneio | undefined;

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

  return (
    <div className={styles.container}>
      {/* CABEÇALHO */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>Intervalo</h1>
          <p className={styles.subtitulo}>
            {mesa?.nome_torneio || infoTorneioPadrao.nome}
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
            name={mesa?.nome_torneio || infoTorneioPadrao.nome}
            date={torneio ? formatarData(torneio.data_inicio) : infoTorneioPadrao.data}
            time={torneio ? formatarHora(torneio.data_inicio) : infoTorneioPadrao.hora}
            location={torneio?.loja_nome || infoTorneioPadrao.local}
            price={torneio ? formatarPreco(torneio.valor_incricao, torneio.incricao_gratuita) : infoTorneioPadrao.preco}
            players={torneio?.qnt_vagas || infoTorneioPadrao.jogadores}
          />

          <RegrasPartida 
            regras={torneio?.regras || infoTorneioPadrao.regras} 
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