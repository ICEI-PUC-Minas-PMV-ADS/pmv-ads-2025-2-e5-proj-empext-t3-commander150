import { useState, useEffect } from 'react';
import Input from '../Input';
import Button from '../Button';
import styles from './styles.module.css';

    interface CardResultadoMesaProps {
    onSubmit: (victories: number, draws: number) => void;
    initialVictories?: number;
    initialDraws?: number;
    victoriesLabel?: string;
    drawsLabel?: string;
    title?: string;
    subtitle?: string;
    }

    const CardResultadoMesa = ({
        onSubmit,
        initialVictories = 0,
        initialDraws = 0,
        victoriesLabel = "Vitórias da sua dupla",
        drawsLabel = "Empates",
        title = "Informar Resultado da Rodada",
        subtitle = "Informe a quantas vitórias e empates sua dupla teve ao final da partida"
    }: CardResultadoMesaProps) => {
    const [victories, setVictories] = useState(initialVictories.toString());
    const [draws, setDraws] = useState(initialDraws.toString());

    useEffect(() => {
        setVictories(initialVictories.toString());
        setDraws(initialDraws.toString());
    }, [initialVictories, initialDraws]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(Number(victories), Number(draws));
    };

    return (
        <div className={styles.container}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.subtitle}>{subtitle}</p>

        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputsContainer}>
            <div className={styles.inputWrapper}>
                <Input
                type="text"
                name="victories"
                label={victoriesLabel}
                value={victories}
                onChange={(e) => setVictories(e.target.value)}
                backgroundColor="#1A2025"
                textColor="#fff"
                labelColor="#fff"
                />
            </div>

            <div className={styles.inputWrapper}>
                <Input
                type="text"
                name="draws"
                label={drawsLabel}
                value={draws}
                onChange={(e) => setDraws(e.target.value)}
                backgroundColor="#1A2025"
                textColor="#fff"
                labelColor="#fff"
                />
            </div>
            </div>

            <Button
            label="Confirmar Resultado"
            type="submit"
            width="100%"
            backgroundColor="#003A70"
            textColor="#fff"
            fontSize="16px"
            fontWeight={500}
            borderRadius="4px"
            />
        </form>
        </div>
    );
    };

    export default CardResultadoMesa;
