import React, { useEffect, useMemo, useState, useCallback } from "react";
import { FiUser, FiStar, FiCalendar } from "react-icons/fi";
import styles from "./styles.module.css";
import { CardSuperior } from "../../../components/CardSuperior";
import CardInfoTorneio from "../../../components/CardInfoTorneio";
import Button from "../../../components/Button";
import { buscarAgrupadoPorAba, buscarAgrupadoPorAbaLoja, desinscreverDoTorneio } from "../../../services/torneioServico";
import { useSessao } from "../../../contextos/AuthContexto";

type Aba = "inscritos" | "andamento" | "historico";

const EmptyState: React.FC<{ aba: Aba; isLoja: boolean }> = ({ aba, isLoja }) => {
    const messages = isLoja ? {
        inscritos: "Você ainda não tem torneios abertos.",
        andamento: "Nenhum torneio em andamento.",
        historico: "Nenhum torneio finalizado no histórico.",
    } : {
        inscritos: "Você não está inscrito em nenhum torneio no momento.",
        andamento: "Nenhum torneio em andamento.",
        historico: "Nenhum torneio no histórico.",
    };
    return <div className={styles.vazio}>{messages[aba]}</div>;
};

const HistoricoTorneios: React.FC = () => {
    const { usuario } = useSessao?.() ?? ({} as any);
    const tipoBruto = (usuario?.tipo ?? usuario?.perfil ?? usuario?.role ?? "").toString();
    const isLoja = tipoBruto.toUpperCase() === "LOJA";

    // Estado de página > estados separados para LOJA e JOGADOR
    const [aba, setAba] = useState<Aba>("inscritos");
    const [seusTorneios, setSeusTorneios] = useState<any[]>([]); // Apenas para LOJA - torneios abertos
    const [inscritos, setInscritos] = useState<any[]>([]); // Apenas para JOGADOR - torneios inscritos
    const [andamento, setAndamento] = useState<any[]>([]);
    const [historico, setHistorico] = useState<any[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [loadingAcao, setLoadingAcao] = useState<Record<number, boolean>>({});

    const carregar = useCallback(async () => {
        setCarregando(true);
        setErro(null);
        try {
            if (isLoja) {
                // LOJA: busca torneios da loja (seus = abertos, andamento, historico)
                const resultado = await buscarAgrupadoPorAbaLoja();
                setSeusTorneios(resultado.seus || []);
                setAndamento(resultado.andamento || []);
                setHistorico(resultado.historico || []);
                setInscritos([]); // Limpa estado de inscritos para LOJA
            } else {
                // JOGADOR: busca torneios do jogador (inscritos, andamento, historico)
                const resultado = await buscarAgrupadoPorAba();
                setInscritos(resultado.inscritos || []);
                setAndamento(resultado.andamento || []);
                setHistorico(resultado.historico || []);
                setSeusTorneios([]); // Limpa estado de seus torneios para JOGADOR
            }
        } catch (e: any) {
            console.error("Erro ao carregar torneios:", e);
            setErro("Não foi possível carregar seus torneios.");
        } finally {
            setCarregando(false);
        }
    }, [isLoja]);

    useEffect(() => {
        carregar();
    }, [carregar]);

    // Cabeçalho dinâmico
    const tituloPagina = useMemo(() => {
        if (isLoja) {
            if (aba === "inscritos") return "Seus Torneios";
            if (aba === "andamento") return "Torneios em Andamento";
            return "Histórico";
        }
        if (aba === "inscritos") return "Torneios Inscritos";
        if (aba === "andamento") return "Torneios em Andamento";
        return "Histórico de Torneios";
    }, [aba, isLoja]);

    const subtituloPagina = useMemo(() => {
        if (isLoja) {
            if (aba === "inscritos") return "Acompanhe seus torneios e crie batalhas épicas!";
            if (aba === "andamento") return "Acompanhe seus torneios em andamento e as suas batalhas";
            return "Reviva os momentos épicos dos seus torneios passados";
        }
        if (aba === "inscritos") return "Acompanhe seus torneios inscritos e participe das batalhas épicas";
        if (aba === "andamento") return "Acompanhe seus torneios em andamento e as suas batalhas";
        return "Reviva os momentos épicos dos seus torneios passados";
    }, [aba, isLoja]);

    // KPIs
    const estatisticas = useMemo(() => ({
        torneiosFuturos: isLoja ? seusTorneios.length : inscritos.length,
        torneiosEmAndamento: andamento.length,
        torneiosHistorico: historico.length,
    }), [isLoja, seusTorneios, inscritos, andamento, historico]);

    // LISTA ATIVA
    const listaAtiva = useMemo(() => {
        if (isLoja) {
            // LOJA: "inscritos" mostra torneios abertos (seus), "andamento" e "historico" normais
            if (aba === "inscritos") return seusTorneios;
            if (aba === "andamento") return andamento;
            return historico;
        } else {
            // JOGADOR: "inscritos" mostra torneios inscritos, "andamento" e "historico" normais
            if (aba === "inscritos") return inscritos;
            if (aba === "andamento") return andamento;
            return historico;
        }
    }, [aba, isLoja, seusTorneios, inscritos, andamento, historico]);

    // Ação: desinscrever (apenas JOGADOR na aba "inscritos")
    const onUnsubscribe = useCallback(async (torneioId: number) => {
        setLoadingAcao((p) => ({ ...p, [torneioId]: true }));
        try {
            await desinscreverDoTorneio(torneioId);
            // Remove apenas do estado de inscritos (JOGADOR)
            setInscritos((prev) => prev.filter((t) => Number(t.id) !== Number(torneioId)));
        } catch (e: any) {
            console.error("desinscrever(): erro", e?.response?.data || e);
            setErro("Não foi possível desinscrever-se do torneio.");
        } finally {
            setLoadingAcao((p) => ({ ...p, [torneioId]: false }));
        }
    }, []);

    // aqui mapeia torneio -> props do CardInfoTorneio
    const mapToCardInfo = (t: any) => {
        const dt = t.data_inicio ? new Date(t.data_inicio) : null;
        return {
            title:
                t.status === "Em Andamento"
                    ? "Em andamento"
                    : t.status === "Finalizado"
                        ? "Concluído"
                        : isLoja
                            ? "Aberto"
                            : "Inscrito",
            name: t.nome ?? "Torneio",
            date: dt ? dt.toLocaleDateString("pt-BR") : "",
            time: dt ? dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "",
            location: t.loja_nome ?? "loja",
            price: t.incricao_gratuita
                ? "Gratuita"
                : t.valor_incricao
                    ? `R$ ${String(t.valor_incricao).replace(".", ",")}`
                    : "—",
            players: Number(t.qnt_inscritos ?? t.inscritos ?? 0),
            tournamentId: t.id,
        };
    };

    // aqui um slot de ação que injeta o Button do projeto - APENAS PARA JOGADOR NA ABA INSCRITOS
    const renderActionFor = (t: any) => {
        if (isLoja) return null;
        if (aba !== "inscritos") return null;
        const tid = Number(t.id);
        return (
            <Button
                label={loadingAcao[tid] ? "Desinscrevendo..." : "Desinscrever-se"}
                onClick={() => {
                    onUnsubscribe(tid);
                }}
                disabled={!!loadingAcao[tid]}
                className={styles.btnDesinscrever}
            />
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.conteudo}>
                <h1 className={styles.titulo}>{tituloPagina}</h1>
                <p className={styles.subtitulo}>{subtituloPagina}</p>

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
                            label={isLoja ? "Seus Torneios" : "Torneios Inscritos"}
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

                <section className={styles.secao} aria-live="polite">
                    <h2 className={styles.secaoTitulo}>
                        {aba === "inscritos"
                            ? isLoja
                                ? "Seus Torneios"
                                : "Torneios Inscritos"
                            : aba === "andamento"
                                ? "Em Andamento"
                                : "Histórico"}
                    </h2>

                    {carregando && <div className={styles.vazio}>Carregando…</div>}
                    {!carregando && erro && <div className={styles.vazio}>{erro}</div>}

                    {!carregando && !erro && (
                        listaAtiva.length === 0 ? (
                            <EmptyState aba={aba} isLoja={isLoja} />
                        ) : (
                            <div className={styles.lista}>
                                {listaAtiva.map((t: any) => (
                                    <CardInfoTorneio
                                        key={t.id}
                                        {...mapToCardInfo(t)}
                                        action={renderActionFor(t)}
                                    />
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