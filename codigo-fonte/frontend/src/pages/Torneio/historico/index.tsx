import React, { useState } from "react";
import { FiUser, FiStar, FiCalendar } from "react-icons/fi";
import styles from "./styles.module.css";
import { CardSuperior } from "../../../components/CardSuperior";

const HistoricoTorneios: React.FC = () => {
    const [selectedCard, setSelectedCard] = useState<string | null>(null);

    const estatisticas = {
        torneiosFuturos: 5,
        torneiosEmAndamento: 2,
        torneiosHistorico: 12
    };

    const cards = [
        {
            id: 'futuros',
            icon: FiUser,
            count: estatisticas.torneiosFuturos,
            label: "Torneios Futuros"
        },
        {
            id: 'andamento',
            icon: FiStar,
            count: estatisticas.torneiosEmAndamento,
            label: "Em Andamento"
        },
        {
            id: 'historico',
            icon: FiCalendar,
            count: estatisticas.torneiosHistorico,
            label: "Histórico"
        }
    ];

    const handleCardClick = (cardId: string) => {
        setSelectedCard(cardId === selectedCard ? null : cardId);
    };

    return (
        <div className={styles.container}>
            <div className={styles.conteudo}>
                <h1 className={styles.titulo}>Histórico de Torneios</h1>
                <p className={styles.subtitulo}>Reviva os momentos épicos dos seus torneios passados</p>

                <div className={styles.cardsContainer}>
                    {cards.map((card) => (
                        <div 
                            key={card.id}
                            onClick={() => handleCardClick(card.id)}
                            className={`${styles.cardWrapper} ${selectedCard === card.id ? styles.selected : ''}`}
                        >
                            <CardSuperior
                                icon={card.icon}
                                count={card.count}
                                label={card.label}
                                className={`${styles.card} ${selectedCard === card.id ? styles.selectedCard : ''}`}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HistoricoTorneios;