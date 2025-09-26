import React from "react";
import styles from "./styles.module.css";

export type Variacao = "up" | "down" | "none";

export interface CardRankingProps {
    posicao: number;
    nome: string;
    pontos: number;
    loja?: string;
    avatarUrl?: string;
    vitorias?: number;
    empates?: number;
    derrotas?: number;
    variacao?: Variacao;
    onClick?: () => void;
    compacto?: boolean;
    rightSlot?: React.ReactNode;
}

const medalhaClasse = (posicao: number) => {
    if (posicao === 1) return styles.medalhaOuro;
    if (posicao === 2) return styles.medalhaPrata;
    if (posicao === 3) return styles.medalhaBronze;
    return styles.medalhaDefault;
};

export default function CardRanking({
    posicao,
    nome,
    pontos,
    loja,
    avatarUrl,
    vitorias,
    empates,
    derrotas,
    variacao = "none",
    onClick,
    compacto,
    rightSlot,
         }: CardRankingProps) {
    const record = (
        typeof vitorias === "number" || typeof empates === "number" || typeof derrotas === "number"
    )
        ? `${vitorias ?? 0}/${empates ?? 0}/${derrotas ?? 0}`
        : undefined;


    return (
        <article
            className={[styles.card, compacto ? styles.compacto : ""].join(" ")}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : -1}
            aria-label={`Ranking ${nome}, posição ${posicao}`}
        >
            <div className={[styles.posicao, medalhaClasse(posicao)].join(" ")}>{posicao}</div>


            <div className={styles.avatarWrap}>
                {avatarUrl ? (
                    <img src={avatarUrl} alt={`Avatar de ${nome}`} className={styles.avatar} />
                ) : (
                    <div className={styles.avatarPlaceholder}>{nome.slice(0, 1).toUpperCase()}</div>
                )}
            </div>


            <div className={styles.info}>
                <div className={styles.topLine}>
                    <span className={styles.nome}>{nome}</span>
                    <span className={styles.pontos}>{pontos} pts</span>
                </div>
                <div className={styles.bottomLine}>
                    {loja && <span className={styles.loja}>{loja}</span>}
                    {record && <span className={styles.record}>{record} (V/E/D)</span>}
                    {variacao !== "none" && (
                        <span
                            className={[
                                styles.variacao,
                                variacao === "up" ? styles.up : styles.down,
                            ].join(" ")}
                            aria-label={variacao === "up" ? "Subiu no ranking" : "Caiu no ranking"}
                        >
{variacao === "up" ? "▲" : "▼"}
</span>
                    )}
                </div>
            </div>


            {rightSlot && <div className={styles.rightSlot}>{rightSlot}</div>}
        </article>
    );
}