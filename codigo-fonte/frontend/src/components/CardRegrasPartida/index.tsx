import React from "react";
import styles from "./styles.module.css";
import Button from "../Button"; // reutiliza componente existente

export type TorneioStatus = "aberto" | "encerrado" | "lotado" | "em_breve";

export interface CardRegrasPartidaProps {
    /** Título principal do torneio */
    titulo: string;
    /** Subtítulo opcional (ex.: formato, edição) */
    subtitulo?: string;
    /** Data (string já formatada) */
    data?: string;
    /** Horário (string já formatada) */
    horario?: string;
    /** Local do evento/loja */
    local?: string;
    /** Taxa de inscrição (string já formatada) */
    taxa?: string;
    /** Vagas totais/ocupadas (ex.: "12/16") */
    vagas?: string;
    /** Status do torneio (p/ badge e estilo) */
    status?: TorneioStatus;
    /** URL de imagem/ilustração opcional do evento */
    imagemUrl?: string;
    /** Lista de badges (ex.: ["Commander", "Duplas"]) */
    badges?: string[];
    /** Ações primárias (botões) */
    acoes?: Array<{
        label: string;
        onClick?: () => void;
        tipo?: "primaria" | "secundaria" | "fantasma";
        disabled?: boolean;
    }>;
    /** Clique no cartão inteiro */
    onClick?: () => void;
    /** Desabilita interação no cartão */
    disabled?: boolean;
    /** Slot extra: por ex. preço promocional, contagem regressiva */
    extra?: React.ReactNode;
}

const statusLabel = {
    aberto: "Inscrições abertas",
    encerrado: "Encerrado",
    lotado: "Lotado",
    em_breve: "Em breve",
} as const;

export default function CardRegrasPartida({
  titulo,
  subtitulo,
  data,
  horario,
  local,
  taxa,
  vagas,
  status = "aberto",
  imagemUrl,
  badges = [],
  acoes = [],
  onClick,
  disabled,
  extra,
}: CardRegrasPartidaProps) {
    // Mapeia "tipo" para props do Button existente
    const mapTipoToButtonProps = (tipo: "primaria" | "secundaria" | "fantasma") => {
        switch (tipo) {
            case "primaria":
                return { backgroundColor: "#5b86ff", textColor: "#0b0f1a" };
            case "secundaria":
                return { backgroundColor: "#151b2b", textColor: "#c8d3f5" };
            default: // fantasma
                return { backgroundColor: "transparent", textColor: "#9ab0ff" };
        }
    };

    return (
        <article
            className={[
                styles.card,
                styles[`status_${status}`],
                disabled ? styles.desabilitado : "",
            ].join(" ")}
            onClick={disabled ? undefined : onClick}
            role={onClick ? "button" : undefined}
            aria-disabled={disabled}
            tabIndex={onClick && !disabled ? 0 : -1}
        >
            {imagemUrl && (
                <div className={styles.media}>
                    <img className={styles.imagem} src={imagemUrl} alt="Capa do torneio" />
                </div>
            )}

            <div className={styles.conteudo}>
                <header className={styles.header}>
                    <div className={styles.titulos}>
                        <h3 className={styles.titulo}>{titulo}</h3>
                        {subtitulo && <p className={styles.subtitulo}>{subtitulo}</p>}
                    </div>
                    <span className={[styles.badge, styles[`badge_${status}`]].join(" ")}>
            {statusLabel[status]}
          </span>
                </header>

                {(badges?.length ?? 0) > 0 && (
                    <ul className={styles.tags}>
                        {badges!.map((b) => (
                            <li key={b} className={styles.tag}>{b}</li>
                        ))}
                    </ul>
                )}

                <dl className={styles.meta}>
                    {data && (
                        <div className={styles.metaItem}>
                            <dt>Data</dt>
                            <dd>{data}</dd>
                        </div>
                    )}
                    {horario && (
                        <div className={styles.metaItem}>
                            <dt>Horário</dt>
                            <dd>{horario}</dd>
                        </div>
                    )}
                    {local && (
                        <div className={styles.metaItem}>
                            <dt>Local</dt>
                            <dd>{local}</dd>
                        </div>
                    )}
                    {taxa && (
                        <div className={styles.metaItem}>
                            <dt>Taxa</dt>
                            <dd>{taxa}</dd>
                        </div>
                    )}
                    {vagas && (
                        <div className={styles.metaItem}>
                            <dt>Vagas</dt>
                            <dd>{vagas}</dd>
                        </div>
                    )}
                </dl>

                {extra && <div className={styles.extra}>{extra}</div>}

                {acoes.length > 0 && (
                    <div className={styles.acoes}>
                        {acoes.map(({ label, onClick, tipo = "primaria", disabled }, i) => (
                            <Button
                                key={i}
                                type="button"
                                label={label}
                                onClick={onClick}
                                disabled={!!disabled}
                                {...mapTipoToButtonProps(tipo)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </article>
    );
}