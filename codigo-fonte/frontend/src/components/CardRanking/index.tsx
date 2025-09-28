import React from 'react';
import styles from './styles.module.css';

interface Player {
    id: string;
    nome: string;
    position: number;
    points: number;
    avatar?: string;
    isCurrentUser?: boolean;
}

interface CardRankingProps {
    players: Player[];
    title?: string;
    maxItems?: number;
    className?: string;
}

const CardRanking: React.FC<CardRankingProps> = ({
                                                     players,
                                                     title = "Ranking",
                                                     maxItems = 10,
                                                     className = ""
                                                 }) => {
    const displayedPlayers = players.slice(0, maxItems);

    const getPositionIcon = (position: number) => {
        switch (position) {
            case 1:
                return <span className={`${styles.positionIcon} ${styles.gold}`}>🥇</span>;
            case 2:
                return <span className={`${styles.positionIcon} ${styles.silver}`}>🥈</span>;
            case 3:
                return <span className={`${styles.positionIcon} ${styles.bronze}`}>🥉</span>;
            default:
                return <span className={styles.positionNumber}>#{position}</span>;
        }
    };

    const getPositionClass = (position: number) => {
        switch (position) {
            case 1:
                return styles.positionFirst;
            case 2:
                return styles.positionSecond;
            case 3:
                return styles.positionThird;
            default:
                return '';
        }
    };

    return (
        <div className={`${styles.cardRanking} ${className}`}>
            <div className={styles.cardRankingHeader}>
                <h2 className={styles.cardRankingTitle}>{title}</h2>
            </div>

            <div className={styles.cardRankingContent}>
                {displayedPlayers.map((player, index) => (
                    <div
                        key={player.id}
                        className={`${styles.rankingItem} ${getPositionClass(player.position)} ${
                            player.isCurrentUser ? styles.currentUser : ''
                        }`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        <div className={styles.rankingItemLeft}>
                            <div className={styles.positionContainer}>
                                {getPositionIcon(player.position)}
                            </div>

                            <div className={styles.playerInfo}>
                                <div className={styles.playerAvatarContainer}>
                                    {player.avatar ? (
                                        <img
                                            src={player.avatar}
                                            alt={player.nome}
                                            className={styles.playerAvatar}
                                        />
                                    ) : (
                                        <div className={styles.avatarPlaceholder}>
                                            {player.nome.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                <div className={styles.playerDetails}>
                                    <span className={styles.playerName}>{player.nome}</span>
                                    {player.isCurrentUser && (
                                        <span className={styles.currentUserBadge}>Você</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={styles.rankingItemRight}>
                            <span className={styles.playerPoints}>{player.points.toLocaleString()}</span>
                            <span className={styles.pointsLabel}>pts</span>
                        </div>
                    </div>
                ))}
            </div>

            {players.length > maxItems && (
                <div className={styles.cardRankingFooter}>
                    <button className={styles.showMoreButton}>
                        +{players.length - maxItems} jogadores
                    </button>
                </div>
            )}
        </div>
    );
};

export default CardRanking;