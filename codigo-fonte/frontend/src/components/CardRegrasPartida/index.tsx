import React from "react";
import { FiCheckCircle } from "react-icons/fi";
import styles from "./styles.module.css";

export interface RegrasPartidaProps {
    regras: string;
    className?: string;
}

export default function RegrasPartida({ regras, className = "" }: RegrasPartidaProps) {
    // Divide a string em array usando quebra de linha
    const regrasArray = regras.split('\n').filter(regra => regra.trim() !== '');

    return (
        <div className={`${styles.card} ${className}`}>
            <h3 className={styles.title}>Regras da Partida</h3>
            <div className={styles.rulesContainer}>
                {regrasArray.map((regra, idx) => (
                    <div key={idx} className={styles.ruleItem}>
                        <FiCheckCircle className={styles.icon} />
                        <span>{regra}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}