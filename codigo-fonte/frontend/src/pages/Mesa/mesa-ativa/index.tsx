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
// import { buscarMinhaMesaNaRodada, reportarResultadoMesa } from '../../../services/mesaServico';
import type { IMesaAtiva } from '../../../tipos/tipos';
import styles from './styles.module.css';
import Swal from 'sweetalert2';
import Button from '../../../components/Button';
import { CardSuperior } from '../../../components/CardSuperior';
import CardInfoTorneio from '../../../components/CardInfoTorneio';
import RegrasPartida from '../../../components/CardRegrasPartida';
import CardRanking from '../../../components/CardRanking';
import Input from '../../../components/Input';
import { BsGrid3X3Gap } from 'react-icons/bs';
import { GiPodium } from 'react-icons/gi';
import { FaDollarSign } from 'react-icons/fa';

const PaginaMesaAtiva = () => {
  const { rodadaId } = useParams<{ rodadaId: string }>();
  const navigate = useNavigate();

  // Dados mockados para visualização
  const dadosMockados: IMesaAtiva = {
    id: 1,
    numero_mesa: 3,
    id_torneio: 1,
    nome_torneio: 'Copa Mystical Arcanum',
    numero_rodada: 2,
    status_rodada: 'Em Andamento',
    pontuacao_time_1: 0,
    pontuacao_time_2: 0,
    time_vencedor: null,
    time_1: [
      { id: 1, username: 'Alexandre Shadows', email: 'alex@email.com' },
      { id: 2, username: 'Marina Stormcaller', email: 'marina@email.com' }
    ],
    time_2: [
      { id: 3, username: 'Pedro Flamecaster', email: 'pedro@email.com' },
      { id: 4, username: 'Julia Frostmage', email: 'julia@email.com' }
    ],
    meu_time: 1
  };

  const [mesa, setMesa] = useState<IMesaAtiva | null>(dadosMockados);
  const [reportandoResultado, setReportandoResultado] = useState(false);

  // Estados para o formulário de resultado
  const [vitoriasSuaDupla, setVitoriasSuaDupla] = useState('');
  const [vitoriasOponentes, setVitoriasOponentes] = useState('');

  // Dados mockados adicionais
  const regrasPartida = [
    'Formato Commander padrão',
    'Time limit: 50 minutos por partida',
    'Decks devem ter exatamente 100 cartas',
    'Banlist oficial da Wizards',
    'Vida inicial: 40 pontos por jogador',
    'Comportamento respeitoso e obrigatório'
  ];

  const rankingJogadores = [
    { id: '1', nome: 'Alexandre Shadows', position: 1, points: 12 },
    { id: '2', nome: 'Julia Frostmage', position: 2, points: 9 },
    { id: '3', nome: 'Marina Stormcaller', position: 3, points: 7 },
    { id: '4', nome: 'Pedro Flamecaster', position: 4, points: 6 },
  ];

  useEffect(() => {
    if (!rodadaId) {
      Swal.fire('Erro', 'ID da rodada não fornecido', 'error');
      navigate('/');
      return;
    }

    // COMENTADO: Requisição à API
    // const carregarMesa = async () => {
    //   try {
    //     setLoading(true);
    //     const mesaData = await buscarMinhaMesaNaRodada(parseInt(rodadaId));
    //     setMesa(mesaData);
    //     setVitoriasSuaDupla(mesaData.pontuacao_time_1.toString());
    //     setVitoriasOponentes(mesaData.pontuacao_time_2.toString());
    //   } catch (error) {
    //     console.error('Erro ao carregar mesa:', error);
    //     Swal.fire('Erro', 'Não foi possível carregar a mesa. Você pode não estar inscrito nesta rodada.', 'error');
    //     navigate('/');
    //   } finally {
    //     setLoading(false);
    //   }
    // };

    // carregarMesa();
  }, [rodadaId, navigate]);

  const handleReportarResultado = async () => {
    if (!mesa) return;

    if (!vitoriasSuaDupla || !vitoriasOponentes) {
      Swal.fire('Atenção', 'Preencha todas as pontuações', 'warning');
      return;
    }

    const pontuacaoTime1 = parseInt(vitoriasSuaDupla);
    const pontuacaoTime2 = parseInt(vitoriasOponentes);

    // Determina o vencedor baseado nas pontuações
    let timeVencedor: number;
    if (pontuacaoTime1 > pontuacaoTime2) {
      timeVencedor = mesa.meu_time || 1;
    } else if (pontuacaoTime2 > pontuacaoTime1) {
      timeVencedor = mesa.meu_time === 1 ? 2 : 1;
    } else {
      timeVencedor = 0; // Empate
    }

    // COMENTADO: Requisição à API
    // try {
    //   setReportandoResultado(true);
    //   const mesaAtualizada = await reportarResultadoMesa(
    //     mesa.id,
    //     pontuacaoTime1,
    //     pontuacaoTime2,
    //     timeVencedor
    //   );
    //   setMesa(mesaAtualizada);
    //   Swal.fire('Sucesso', 'Resultado reportado com sucesso!', 'success');
    // } catch (error) {
    //   console.error('Erro ao reportar resultado:', error);
    //   Swal.fire('Erro', 'Não foi possível reportar o resultado. Verifique se a rodada está em andamento.', 'error');
    // } finally {
    //   setReportandoResultado(false);
    // }

    // Mock: Apenas simula o resultado
    setReportandoResultado(true);
    setTimeout(() => {
      setMesa({
        ...mesa,
        pontuacao_time_1: pontuacaoTime1,
        pontuacao_time_2: pontuacaoTime2,
        time_vencedor: timeVencedor
      });
      setReportandoResultado(false);
      Swal.fire('Sucesso', 'Resultado reportado com sucesso! (Mock)', 'success');
    }, 500);
  };

  if (!mesa) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Mesa não encontrada</div>
      </div>
    );
  }

  const meuTime = mesa.meu_time === 1 ? mesa.time_1 : mesa.time_2;
  const timeAdversario = mesa.meu_time === 1 ? mesa.time_2 : mesa.time_1;

  return (
    <div className={styles.container}>
      {/* Cabeçalho */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>Mesa Ativa</h1>
          <p className={styles.subtitulo}>{mesa.nome_torneio}</p>
        </div>
        <div className={styles.rodadaBadge}>
          Rodada {mesa.numero_rodada}
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
            isActive={false}
          />
          <CardSuperior
            count={mesa.numero_rodada}
            label="Rodadas"
            icon={GiPodium}
            isActive={false}
          />
        </div>

        {/* Cards Superiores Direita */}
        <div className={styles.cardsDireita}>
          <CardSuperior
            count={160}
            label="Premiação"
            icon={FaDollarSign}
            isActive={false}
          />
        </div>
      </div>

      {/* Layout em Grid - Conteúdo Principal */}
      <div className={styles.gridContainer}>
        {/* Coluna Esquerda */}
        <div className={styles.colunaEsquerda}>
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
        </div>

        {/* Coluna Direita */}
        <div className={styles.colunaDireita}>
          {/* Informações do Torneio */}
          <CardInfoTorneio
            title="Informações do Torneio"
            name={mesa.nome_torneio}
            date="05/05/2023"
            time="14:00"
            location="Loja Cards & Dragons"
            price="R$ 25,00"
            players={12}
          />

          {/* Regras da Partida */}
          <RegrasPartida regras={regrasPartida} />

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
