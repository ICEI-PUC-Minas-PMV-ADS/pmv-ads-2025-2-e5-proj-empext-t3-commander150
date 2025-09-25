//import React from "react";
import styles from "./styles.module.css";

export interface RegrasPartidaProps {
    regras: string[];
}

export default function RegrasPartida({ regras }: RegrasPartidaProps) {
    return (
        <section className={styles.regras}>
            <h2 className={styles.titulo}>Regras da Partida</h2>
            <ul className={styles.lista}>
                {regras.map((regra, idx) => (
                    <li key={idx} className={styles.item}>
                        {regra}
                    </li>
                ))}
            </ul>
        </section>
    );
}
