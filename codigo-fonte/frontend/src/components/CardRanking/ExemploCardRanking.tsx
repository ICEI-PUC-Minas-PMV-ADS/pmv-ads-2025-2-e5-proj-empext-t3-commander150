import React from 'react';
import CardRanking from './index';

const App: React.FC = () => {
    // Exemplo de uso do CardRanking
    // Este é apenas um arquivo de exemplo e não usa props "players", "title", "maxItems"
    // O componente real CardRanking usa tournamentId e rodadaId
    return (
        <div style={{
            background: 'var(--var-cor-secundaria)',
            minHeight: '100vh',
            padding: '20px'
        }}>
            <CardRanking
                tournamentId={1}
                rodadaId={1}
                titulo="Ranking Geral"
                limite={5}
            />
        </div>
    );
};

export default App;