/**
 * Página de Mesa Ativa
 *
 * RESPONSABILIDADES:
 * 1. Receber o ID da rodada via parâmetro da URL
 * 2. Buscar os dados da mesa onde o jogador está alocado
 * 3. Exibir informações da mesa: torneio, rodada, times, pontuação
 * 4. Permitir que o jogador reporte o resultado da partida
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { buscarMinhaMesaNaRodada, reportarResultadoMesa } from '../../../services/mesaServico';
import { buscarTorneioPorId } from '../../../services/torneioServico';
import type { IMesaAtiva, ITorneio } from '../../../tipos/tipos';
import styles from './styles.module.css';
import Swal from 'sweetalert2';
import Button from '../../../components/Button';
import { CardSuperior } from '../../../components/CardSuperior';
import CardInfoTorneio from '../../../components/CardInfoTorneio';
import RegrasPartida from '../../../components/CardRegrasPartida';
import CardRanking from '../../../components/CardRanking';
import Input from '../../../components/Input';
import { BsGrid3X3Gap, BsCheckCircle, BsPauseCircle } from 'react-icons/bs';
import { GiPodium } from 'react-icons/gi';
import { FaDollarSign } from 'react-icons/fa';

const PaginaMesaAtiva = () => {
  const { rodadaId } = useParams<{ rodadaId: string }>();
  const navigate = useNavigate();
  const [mesa, setMesa] = useState<IMesaAtiva | null>(null);
  const [torneio, setTorneio] = useState<ITorneio | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportandoResultado, setReportandoResultado] = useState(false);
  const [regras, setRegras] = useState<string>('');

  const [vitoriasSuaDupla, setVitoriasSuaDupla] = useState('');
  const [vitoriasOponentes, setVitoriasOponentes] = useState('');

  const rankingJogadores = [
    { id: '1', nome: 'Alexandre Shadows', position: 1, points: 12 },
    { id: '2', nome: 'Julia Frostmage', position: 2, points: 9 },
    { id: '3', nome: 'Marina Stormcaller', position: 3, points: 7 },
    { id: '4', nome: 'Pedro Flamecaster', position: 4, points: 6 },
  ];

  const formatarData = (dataISO?: string) => {
    if (!dataISO) return 'N/A';
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
  };

  const formatarHora = (dataISO?: string) => {
    if (!dataISO) return 'N/A';
    const data = new Date(dataISO);
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatarPreco = (valor?: number | null, gratuito?: boolean) => {
    if (gratuito) return 'Gratuito';
    if (!valor) return 'R$ 0,00';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  useEffect(() => {
    if (!rodadaId) {
      Swal.fire('Erro', 'ID da rodada não fornecido', 'error');
      navigate('/');
      return;
    }

    const carregarMesa = async () => {
      try {
        setLoading(true);
        const mesaData = await buscarMinhaMesaNaRodada(parseInt(rodadaId));
        setMesa(mesaData);

        // Define os valores iniciais baseados nos dados da API
        if (mesaData.meu_time === 1) {
          setVitoriasSuaDupla(mesaData.pontuacao_time_1.toString());
          setVitoriasOponentes(mesaData.pontuacao_time_2.toString());
        } else {
          setVitoriasSuaDupla(mesaData.pontuacao_time_2.toString());
          setVitoriasOponentes(mesaData.pontuacao_time_1.toString());
        }

        // Buscar detalhes do torneio
        try {
          const torneioData = await buscarTorneioPorId(mesaData.id_torneio);
          setTorneio(torneioData);
          setRegras(torneioData.regras || "");
        } catch (error) {
          console.error('Erro ao carregar torneio:', error);
          // Não bloqueia a exibição da mesa se falhar ao buscar o torneio
        }
      } catch (error) {
        console.error('Erro ao carregar mesa:', error);
        Swal.fire('Erro', 'Não foi possível carregar a mesa. Você pode não estar inscrito nesta rodada.', 'error');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    carregarMesa();
  }, [rodadaId, navigate]);

  const handleReportarResultado = async () => {
    if (!mesa) return;

    if (!vitoriasSuaDupla || !vitoriasOponentes) {
      Swal.fire('Atenção', 'Preencha todas as pontuações', 'warning');
      return;
    }

    // Ajusta as pontuações baseado no time do jogador
    let pontuacaoTime1: number;
    let pontuacaoTime2: number;

    if (mesa.meu_time === 1) {
      pontuacaoTime1 = parseInt(vitoriasSuaDupla);
      pontuacaoTime2 = parseInt(vitoriasOponentes);
    } else {
      pontuacaoTime1 = parseInt(vitoriasOponentes);
      pontuacaoTime2 = parseInt(vitoriasSuaDupla);
    }

    // Determina o vencedor baseado nas pontuações
    let timeVencedor: number;
    if (pontuacaoTime1 > pontuacaoTime2) {
      timeVencedor = 1;
    } else if (pontuacaoTime2 > pontuacaoTime1) {
      timeVencedor = 2;
    } else {
      timeVencedor = 0; // Empate
    }

    try {
      setReportandoResultado(true);
      await reportarResultadoMesa(
        mesa.id,
        pontuacaoTime1,
        pontuacaoTime2,
        timeVencedor
      );

      // Atualiza apenas as pontuações localmente, mantendo os dados dos times
      setMesa({
        ...mesa,
        pontuacao_time_1: pontuacaoTime1,
        pontuacao_time_2: pontuacaoTime2,
        time_vencedor: timeVencedor,
        status_rodada: 'Finalizada' // Assume que a rodada foi finalizada
      });

      await Swal.fire('Sucesso', 'Resultado reportado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao reportar resultado:', error);
      Swal.fire('Erro', 'Não foi possível reportar o resultado. Verifique se a rodada está em andamento.', 'error');
    } finally {
      setReportandoResultado(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando mesa...</div>
      </div>
    );
  }

  if (!mesa) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Mesa não encontrada</div>
      </div>
    );
  }

  const meuTime = mesa.meu_time === 1 ? mesa.time_1 : mesa.time_2;
  const timeAdversario = mesa.meu_time === 1 ? mesa.time_2 : mesa.time_1;

  // Verificação de segurança
  if (!meuTime || !timeAdversario) {
    console.error('Times não encontrados na mesa:', mesa);
    return (
      <div className={styles.container}>
        <div className={styles.error}>Erro ao carregar dados da mesa</div>
      </div>
    );
  }

  // Verificar se recebeu um bye (mesa 0)
  if (mesa.numero_mesa === 0) {
    return (
      <div className={styles.container}>
        {/* Cabeçalho */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.titulo}>Você recebeu um bye!</h1>
            <p className={styles.subtitulo}>{mesa.nome_torneio}</p>
          </div>
          <div className={styles.rodadaBadge}>
            <BsCheckCircle className={styles.statusIcon} />
            Rodada {mesa.numero_rodada} - Ativo (Bye)
          </div>
        </div>

        {/* Layout em Grid */}
        <div className={styles.gridContainer}>
          {/* Cards Superiores Esquerda */}
          <div className={styles.cardsEsquerda}>
            <CardSuperior
              count="BYE"
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

          {/* Cards Superiores Direita */}
          <div className={styles.cardsDireita}>
            <CardSuperior
              count={torneio?.valor_incricao || 0}
              label="Premiação"
              icon={FaDollarSign}
              selected={false}
            />
          </div>
        </div>

        {/* Layout em Grid - Conteúdo Principal */}
        <div className={styles.gridContainer}>
          {/* Coluna Esquerda */}
          <div className={styles.colunaEsquerda}>
            <div className={styles.intervaloCard}>
              <h2 className={styles.intervaloTitulo}>Você recebeu um bye!</h2>
              <p className={styles.intervaloTexto}>
                Aproveite para tomar uma água enquanto aguarda a próxima rodada.
              </p>
            </div>
          </div>

          {/* Coluna Direita */}
          <div className={styles.colunaDireita}>
            {/* Informações do Torneio */}
            <CardInfoTorneio
              title="Informações do Torneio"
              name={mesa.nome_torneio}
              date={formatarData(torneio?.data_inicio)}
              time={formatarHora(torneio?.data_inicio)}
              location={torneio?.loja_nome || 'Loja não especificada'}
              price={formatarPreco(torneio?.valor_incricao, torneio?.incricao_gratuita)}
              players={torneio?.qnt_vagas || 0}
            />

            {/* Regras da Partida */}
            <RegrasPartida regras={regras} />

            {/* Ranking */}
            <CardRanking
              players={rankingJogadores}
              title="Ranking"
              maxItems={4}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Cabeçalho */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>
            {mesa.status_rodada.toLowerCase() === 'finalizada' ? 'Intervalo' : 'Mesa Ativa'}
          </h1>
          <p className={styles.subtitulo}>{mesa.nome_torneio}</p>
        </div>
        <div className={styles.rodadaBadge}>
          {mesa.status_rodada.toLowerCase() === 'finalizada' ? (
            <>
              <BsPauseCircle className={styles.statusIcon} />
              Rodada {mesa.numero_rodada} - Intervalo
            </>
          ) : (
            <>
              <BsCheckCircle className={styles.statusIcon} />
              Rodada {mesa.numero_rodada} - Ativo
            </>
          )}
        </div>
      </div>

      {/* Layout em Grid */}
      <div className={styles.gridContainer}>
        {/* Cards Superiores Esquerda */}
        <div className={styles.cardsEsquerda}>
          <CardSuperior
            count={mesa.numero_mesa}
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

        {/* Cards Superiores Direita */}
        <div className={styles.cardsDireita}>
          <CardSuperior
            count={torneio?.valor_incricao || 0}
            label="Premiação"
            icon={FaDollarSign}
            selected={false}
          />
        </div>
      </div>

      {/* Layout em Grid - Conteúdo Principal */}
      <div className={styles.gridContainer}>
        {/* Coluna Esquerda */}
        <div className={styles.colunaEsquerda}>
          {mesa.status_rodada.toLowerCase() === 'finalizada' ? (
            /* Mensagem de Intervalo */
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
                    {meuTime.map(j => j.username).join(' & ')}
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
                    {timeAdversario.map(j => j.username).join(' & ')}
                  </span>
                </div>

                {mesa.time_vencedor === 0 && (
                  <div className={styles.empateTag}>Partida Empatada</div>
                )}
              </div>
            </div>
          ) : (
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

        {/* Coluna Direita */}
        <div className={styles.colunaDireita}>
          {/* Informações do Torneio */}
          <CardInfoTorneio
            title="Informações do Torneio"
            name={mesa.nome_torneio}
            date={formatarData(torneio?.data_inicio)}
            time={formatarHora(torneio?.data_inicio)}
            location={torneio?.loja_nome || 'Loja não especificada'}
            price={formatarPreco(torneio?.valor_incricao, torneio?.incricao_gratuita)}
            players={torneio?.qnt_vagas || 0}
          />

          {/* Regras da Partida */}
          <RegrasPartida regras={regras} />

          {/* Ranking */}
          <CardRanking
            players={rankingJogadores}
            title="Ranking"
            maxItems={4}
          />
        </div>
      </div>
    </div>
  );
};

export default PaginaMesaAtiva;
