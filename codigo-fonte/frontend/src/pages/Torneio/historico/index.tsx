import React, { useEffect, useMemo, useState } from "react";
import { FiUser, FiStar, FiCalendar } from "react-icons/fi";
import styles from "./styles.module.css";
import { CardSuperior } from "../../../components/CardSuperior";
import CardInfoTorneio from "../../../components/CardInfoTorneio";
import {buscarAgrupadoPorAba,buscarAgrupadoPorAbaLoja} from "../../../services/torneioServico";
import { useSessao } from "../../../contextos/AuthContexto";

type Aba = "inscritos" | "andamento" | "historico";
type PapelUsuario = "JOGADOR" | "LOJA";

// aqui é o estado vazio contextual
const EmptyState: React.FC<{ aba: Aba; papel: PapelUsuario }> = ({ aba, papel }) => {
    const msgsJogador = {
        inscritos: "Você não está inscrito em nenhum torneio no momento.",
        andamento: "Nenhum torneio em andamento.",
        historico: "Nenhum torneio no histórico.",
    };
    const msgsLoja = {
        inscritos: "Você ainda não tem torneios abertos.",
        andamento: "Nenhum torneio em andamento.",
        historico: "Nenhum torneio finalizado no histórico.",
    };
    const msg = papel === "LOJA" ? msgsLoja[aba] : msgsJogador[aba];
    return <div className={styles.vazio}>{msg}</div>;
};

const HistoricoTorneios: React.FC = () => {
    const { usuario } = useSessao();

    // aqui é o papel do usuário (padrão JOGADOR se não for informado)
    const papel: PapelUsuario = usuario?.tipo === "LOJA" ? "LOJA" : "JOGADOR";

    // aqui tenta-se extrair id da loja de formas comuns; se não existir no usuário, fica null
    const idLoja: number | null =
        (usuario as any)?.id_loja ??
        (usuario as any)?.loja?.id ??
        null;

    const [aba, setAba] = useState<Aba>("inscritos");

    // JOGADOR
    const [inscritos, setInscritos] = useState<any[]>([]);
    // Compartilhado
    const [andamento, setAndamento] = useState<any[]>([]);
    const [historico, setHistorico] = useState<any[]>([]);
    // LOJA > primeira aba “Seus Torneios”
    const [seus, setSeus] = useState<any[]>([]);

    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            setCarregando(true);
            setErro(null);
            try {
                if (papel === "LOJA") {
                    if (!idLoja) {
                        console.debug("[Historico] LOJA sem idLoja no usuário. Mostrando vazio.");
                        setSeus([]); setAndamento([]); setHistorico([]);
                    } else {
                        const { seus, andamento, historico } = await buscarAgrupadoPorAbaLoja(idLoja);
                        setSeus(seus || []);
                        setAndamento(andamento || []);
                        setHistorico(historico || []);
                    }
                } else {
                    const { inscritos, andamento, historico } = await buscarAgrupadoPorAba();
                    setInscritos(inscritos || []);
                    setAndamento(andamento || []);
                    setHistorico(historico || []);
                }
                setErro(null);
            } catch (e: any) {
                // eslint-disable-next-line no-console
                console.error("Erro ao carregar torneios:", e);
                setErro("Não foi possível carregar seus torneios.");
            } finally {
                setCarregando(false);
            }
        })();
    }, [papel, idLoja]);

    // aqui são as labels dos KPIs, que variam conforme o tipo de usuário
    const kpiLabelInscritos = papel === "LOJA" ? "Seus Torneios" : "Torneios Inscritos";

    const kpis = useMemo(() => {
        const k1 = papel === "LOJA" ? seus.length : inscritos.length;
        return { k1, k2: andamento.length, k3: historico.length };
    }, [papel, seus, inscritos, andamento, historico]);

    const tituloPagina = useMemo(() => {
        if (papel === "LOJA") {
            if (aba === "inscritos") return "Seus Torneios";
            if (aba === "andamento") return "Torneios em Andamento";
            return "Histórico";
        }
        if (aba === "inscritos") return "Torneios Inscritos";
        if (aba === "andamento") return "Torneios em Andamento";
        return "Histórico de Torneios";
    }, [papel, aba]);

    const subtituloPagina = useMemo(() => {
        if (papel === "LOJA") {
            if (aba === "inscritos") return "Acompanhe seus torneios e crie batalhas épicas!";
            if (aba === "andamento") return "Acompanhe seus torneios em andamento e as suas batalhas";
            return "Reviva os momentos épicos dos seus torneios passados";
        }
        if (aba === "inscritos")
            return "Acompanhe seus torneios inscritos e participe das batalhas épicas";
        if (aba === "andamento")
            return "Acompanhe seus torneios em andamento e as suas batalhas";
        return "Reviva os momentos épicos dos seus torneios passados";
    }, [papel, aba]);

    // abaixo, a lista ativa (torneios a renderizar)
    const listaAtiva = useMemo(() => {
        if (papel === "LOJA") {
            if (aba === "inscritos") return seus;
            if (aba === "andamento") return andamento;
            return historico;
        }
        if (aba === "inscritos") return inscritos;
        if (aba === "andamento") return andamento;
        return historico;
    }, [papel, aba, seus, inscritos, andamento, historico]);

    const mapToCardInfo = (t: any) => {
        const dt = t.data_inicio ? new Date(t.data_inicio) : null;
        return {
            title:
                t.status === "Em Andamento"
                    ? "Em andamento"
                    : t.status === "Finalizado"
                        ? "Concluído"
                        : papel === "LOJA"
                            ? "Aberto"
                            : "Inscrito",
            name: t.nome ?? "Torneio",
            date: dt ? dt.toLocaleDateString("pt-BR") : "",
            time: dt ? dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "",
            location: t.loja_nome ?? "",
            price: t.incricao_gratuita
                ? "Gratuita"
                : t.valor_incricao
                    ? `R$ ${String(t.valor_incricao).replace(".", ",")}`
                    : "—",
            players: 0,
        };
    };

    const IDS = {
        inscritos: "painel-inscritos",
        andamento: "painel-andamento",
        historico: "painel-historico",
    };

    const deveMostrarErro = !!erro && listaAtiva.length === 0;

    return (
        <div className={styles.container}>
            <div className={styles.conteudo}>
                <h1 className={styles.titulo}>{tituloPagina}</h1>
                <p className={styles.subtitulo}>{subtituloPagina}</p>

                {/* KPIs (são os cards superiores) */}
                <div className={styles.cardsContainer} role="tablist" aria-label="Seleção de categorias de torneio">
                    <button
                        type="button"
                        className={styles.kpiBtn}
                        role="tab"
                        aria-selected={aba === "inscritos"}
                        aria-controls={IDS.inscritos}
                        onClick={() => setAba("inscritos")}
                    >
                        <CardSuperior
                            icon={FiUser}
                            count={kpis.k1}
                            label={kpiLabelInscritos}
                            className={styles.card}
                            selected={aba === "inscritos"}
                        />
                    </button>

                    <button
                        type="button"
                        className={styles.kpiBtn}
                        role="tab"
                        aria-selected={aba === "andamento"}
                        aria-controls={IDS.andamento}
                        onClick={() => setAba("andamento")}
                    >
                        <CardSuperior
                            icon={FiStar}
                            count={kpis.k2}
                            label="Em Andamento"
                            className={styles.card}
                            selected={aba === "andamento"}
                        />
                    </button>

                    <button
                        type="button"
                        className={styles.kpiBtn}
                        role="tab"
                        aria-selected={aba === "historico"}
                        aria-controls={IDS.historico}
                        onClick={() => setAba("historico")}
                    >
                        <CardSuperior
                            icon={FiCalendar}
                            count={kpis.k3}
                            label="Histórico"
                            className={styles.card}
                            selected={aba === "historico"}
                        />
                    </button>
                </div>

                {/* lista dinâmica abaixo dos cards */}
                <section
                    id={
                        aba === "inscritos"
                            ? IDS.inscritos
                            : aba === "andamento"
                                ? IDS.andamento
                                : IDS.historico
                    }
                    className={styles.secao}
                    aria-live="polite"
                    role="tabpanel"
                >
                    <h2 className={styles.secaoTitulo}>
                        {papel === "LOJA"
                            ? aba === "inscritos"
                                ? "Seus Torneios"
                                : aba === "andamento"
                                    ? "Em Andamento"
                                    : "Histórico"
                            : aba === "inscritos"
                                ? "Torneios Inscritos"
                                : aba === "andamento"
                                    ? "Em Andamento"
                                    : "Histórico"}
                    </h2>

                    {carregando && <div className={styles.vazio}>Carregando…</div>}

                    {!carregando && deveMostrarErro && <div className={styles.vazio}>{erro}</div>}

                    {!carregando && !deveMostrarErro && (
                        listaAtiva.length === 0 ? (
                            <EmptyState aba={aba} papel={papel} />
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
