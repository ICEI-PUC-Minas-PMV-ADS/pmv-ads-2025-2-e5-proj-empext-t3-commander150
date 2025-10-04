import React from "react";
import { FiUser, FiStar, FiCalendar } from "react-icons/fi";
import styles from "./styles.module.css";
import { CardSuperior } from "../../../components/CardSuperior";

const HistoricoTorneios: React.FC = () => {
    const estatisticas = {
        torneiosFuturos: 5,
        torneiosEmAndamento: 2,
        torneiosHistorico: 12
    };

    return (
        <div className={styles.container}>
            <div className={styles.conteudo}>
                <h1 className={styles.titulo}>Histórico de Torneios</h1>
                <p className={styles.subtitulo}>Reviva os momentos épicos dos seus torneios passados</p>

                <div className={styles.cardsContainer}>
                    <CardSuperior
                        icon={FiUser}
                        count={estatisticas.torneiosFuturos}
                        label="Torneios Futuros"
                        className={styles.card}
                    />
                    <CardSuperior
                        icon={FiStar}
                        count={estatisticas.torneiosEmAndamento}
                        label="Em Andamento"
                        className={styles.card}
                    />
                    <CardSuperior
                        icon={FiCalendar}
                        count={estatisticas.torneiosHistorico}
                        label="Histórico"
                        className={styles.card}
                    />
                </div>
            </div>
        </div>
    );
};

export default HistoricoTorneios;