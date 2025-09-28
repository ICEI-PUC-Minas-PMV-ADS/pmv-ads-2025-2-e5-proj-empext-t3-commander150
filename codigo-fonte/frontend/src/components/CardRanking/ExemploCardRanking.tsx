import React from 'react';
import CardRanking from './index';

const App: React.FC = () => {
    const players = [
        {
            id: '1',
            nome: 'Gabriela Franklin',
            position: 1,
            points: 2500,
        },
        {
            id: '2',
            nome: 'Guilherme Matsumura',
            position: 2,
            points: 2300,
        },
        {
            id: '3',
            nome: 'Lucas Abreu',
            position: 3,
            points: 2100
        },
        {
            id: '4',
            nome: 'Rafael Souza',
            position: 4,
            points: 1950
        },
        {
            id: '5',
            nome: 'Willams Lima',
            position: 5,
            points: 1800,
            isCurrentUser: true
        }
    ];

    return (
        <div style={{
            background: 'var(--var-cor-secundaria)',
            minHeight: '100vh',
            padding: '20px'
        }}>
            <CardRanking
                players={players}
                title="Ranking Geral"
                maxItems={5}
            />
        </div>
    );
};

export default App;