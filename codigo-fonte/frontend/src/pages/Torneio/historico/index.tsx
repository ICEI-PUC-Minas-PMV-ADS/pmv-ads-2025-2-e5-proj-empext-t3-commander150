import React, { useEffect, useMemo, useState } from "react";
import { FiUser, FiStar, FiCalendar } from "react-icons/fi";
import styles from "./styles.module.css";
import { CardSuperior } from "../../../components/CardSuperior";
import CardInfoTorneio from "../../../components/CardInfoTorneio";
import { buscarAgrupadoPorAba } from "../../../services/torneioServico";

type Aba = "inscritos" | "andamento" | "historico";

// Componente de estado vazio > não consegui fazer funcionar ainda.
const EmptyState: React.FC<{ aba: Aba }> = ({ aba }) => {
    const messages = {
        inscritos: "Você não está inscrito em nenhum torneio no momento.",
        andamento: "Nenhum torneio em andamento.",
        historico: "Nenhum torneio no histórico.",
    };

    return <div className={styles.vazio}>{messages[aba]}</div>;
};

const HistoricoTorneios: React.FC = () => {
    const [aba, setAba] = useState<Aba>("inscritos");
    const [inscritos, setInscritos] = useState<any[]>([]);
    const [andamento, setAndamento] = useState<any[]>([]);
    const [historico, setHistorico] = useState<any[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            setCarregando(true);
            setErro(null);
            try {
                const { inscritos, andamento, historico } = await buscarAgrupadoPorAba();
                setInscritos(inscritos);
                setAndamento(andamento);
                setHistorico(historico);
            } catch (e: any) {
                setErro("Não foi possível carregar seus torneios.");
            } finally {
                setCarregando(false);
            }
        })();
    }, []);

    const estatisticas = useMemo(
        () => ({
            torneiosFuturos: inscritos.length,
            torneiosEmAndamento: andamento.length,
            torneiosHistorico: historico.length,
        }),
        [inscritos, andamento, historico]
    );

    const listaAtiva = useMemo(() => {
        if (aba === "inscritos") return inscritos;
        if (aba === "andamento") return andamento;
        return historico;
    }, [aba, inscritos, andamento, historico]);

    const mapToCardInfo = (t: any) => {
        const dt = t.data_inicio ? new Date(t.data_inicio) : null;
        return {
            title:
                t.status === "Em Andamento"
                    ? "Em andamento"
                    : t.status === "Finalizado"
                        ? "Concluído"
                        : "Inscrito",
            name: t.nome ?? "Torneio",
            date: dt ? dt.toLocaleDateString() : "",
            time: dt
                ? dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "",
            location: t.loja_nome ?? "",
            price: t.incricao_gratuita
                ? "Gratuita"
                : t.valor_incricao
                    ? `R$ ${String(t.valor_incricao).replace(".", ",")}`
                    : "—",
            players: 0,
        };
    };

    return (
        <div className={styles.container}>
            <div className={styles.conteudo}>
                <h1 className={styles.titulo}>Histórico de Torneios</h1>
                <p className={styles.subtitulo}>
                    Reviva os momentos épicos dos seus torneios passados
                </p>

                <div className={styles.cardsContainer} role="tablist">
                    <button
                        type="button"
                        className={styles.kpiBtn}
                        role="tab"
                        onClick={() => setAba("inscritos")}
                        aria-selected={aba === "inscritos"}
                    >
                        <CardSuperior
                            icon={FiUser}
                            count={estatisticas.torneiosFuturos}
                            label="Torneios Inscritos"
                            className={styles.card}
                            selected={aba === "inscritos"}
                        />
                    </button>

                    <button
                        type="button"
                        className={styles.kpiBtn}
                        role="tab"
                        onClick={() => setAba("andamento")}
                        aria-selected={aba === "andamento"}
                    >
                        <CardSuperior
                            icon={FiStar}
                            count={estatisticas.torneiosEmAndamento}
                            label="Em Andamento"
                            className={styles.card}
                            selected={aba === "andamento"}
                        />
                    </button>

                    <button
                        type="button"
                        className={styles.kpiBtn}
                        role="tab"
                        onClick={() => setAba("historico")}
                        aria-selected={aba === "historico"}
                    >
                        <CardSuperior
                            icon={FiCalendar}
                            count={estatisticas.torneiosHistorico}
                            label="Histórico"
                            className={styles.card}
                            selected={aba === "historico"}
                        />
                    </button>
                </div>

                {/* Lista dinâmica abaixo dos cards */}
                <section className={styles.secao} aria-live="polite">
                    <h2 className={styles.secaoTitulo}>
                        {aba === "inscritos"
                            ? "Torneios Inscritos"
                            : aba === "andamento"
                                ? "Em Andamento"
                                : "Histórico"}
                    </h2>

                    {carregando && <div className={styles.vazio}>Carregando…</div>}
                    {!carregando && erro && <div className={styles.vazio}>{erro}</div>}

                    {!carregando && !erro && (
                        listaAtiva.length === 0 ? (
                            <EmptyState aba={aba} />
                        ) : (
                            <div className={styles.lista}>
                                {listaAtiva.map((t: any) => (
                                    <CardInfoTorneio key={t.id} {...mapToCardInfo(t)} />
                                ))}
                            </div>
                        )
                    )}
                </section>
            </div>
        </div>
    );
};

export default HistoricoTorneios;
