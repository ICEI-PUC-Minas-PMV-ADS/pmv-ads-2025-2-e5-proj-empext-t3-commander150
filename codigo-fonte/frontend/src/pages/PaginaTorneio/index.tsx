import { useState } from 'react';
import BaseTorneio from '../../components/BaseTorneio';
import styles from './styles.module.css';

// Componente temporário para premiação
const PrizeComponent = () => (
  <div className={styles.prizeSection}>
    <div className={styles.prizeIcon}>🎁</div>
    <h3>R$ 160</h3>
    <p>Premiação</p>
  </div>
);

// Componente temporário para informações do torneio
const TournamentInfo = () => (
  <div className={styles.infoSection}>
    <h3>Informações do Torneio</h3>
    <div className={styles.infoItem}>
      <span>Copa Mystical Arcanum</span>
    </div>
    <div className={styles.infoItem}>
      <span>05/04/2023</span>
      <span>14:00</span>
    </div>
    <div className={styles.infoItem}>
      <span>Loja Cards & Dragons</span>
      <span>R$ 25,00</span>
    </div>
    <div className={styles.infoItem}>
      <span>12 jogadores inscritos</span>
    </div>
  </div>
);

// Componente temporário para regras
const RulesComponent = () => (
  <div className={styles.rulesSection}>
    <h3>Regras da Partida</h3>
    <ul className={styles.rulesList}>
      <li>Formato: Commander público</li>
      <li>Mesa aleatória em todas as partidas</li>
      <li>Deck com no mínimo 100 cartas</li>
      <li>Banlist oficial da Wizards</li>
      <li>Vida inicial: 40 pontos por jogador</li>
      <li>Comportamento respeitoso é obrigatório</li>
    </ul>
  </div>
);

// Componente temporário para ranking
const RankingComponent = () => (
  <div className={styles.rankingSection}>
    <h3>Ranking</h3>
    <ol className={styles.rankingList}>
      <li>Alexandre Shadows</li>
      <li>Julia Frostmage</li>
      <li>Marina Stormcaller</li>
      <li>Pedro Flamecaster</li>
    </ol>
  </div>
);

// Componente temporário para intervalo
const IntervalComponent = () => (
  <div className={styles.intervalSection}>
    <h2>Estamos no intervalo</h2>
    <p>Aproveite para tomar uma água enquanto empareiramos as times para a próxima rodada.</p>
  </div>
);

// Componente principal da página do torneio
const PaginaTorneio = () => {
  const [currentState] = useState<'interval' | 'active' | 'finished'>('interval');

  return (
    <BaseTorneio
      title="Intervalo"
      subtitle="Copa Mystical Arcanum"
      rightComponents={{
        prizeComponent: <PrizeComponent />,
        tournamentInfoComponent: <TournamentInfo />,
        rulesComponent: <RulesComponent />,
        rankingComponent: <RankingComponent />
      }}
      leftContent={
        <div>
          {currentState === 'interval' && <IntervalComponent />}
          {/* Adicione outros estados aqui quando necessário */}
        </div>
      }
    />
  );
};

export default PaginaTorneio;