import React, { useEffect, useMemo, useState, useCallback } from "react";
import { FiUser, FiStar, FiCalendar } from "react-icons/fi";
import styles from "./styles.module.css";
import { CardSuperior } from "../../../components/CardSuperior";
import CardInfoTorneio from "../../../components/CardInfoTorneio";
import { buscarAgrupadoPorAba, buscarAgrupadoPorAbaLoja, contarInscritosTorneio } from "../../../services/torneioServico";
import { useSessao } from "../../../contextos/AuthContexto";

type Aba = "inscritos" | "andamento" | "historico";
type PapelUsuario = "JOGADOR" | "LOJA";

// Estado vazio contextual
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

    // Papel do usuário (padrão JOGADOR se não informado)
    const papel: PapelUsuario = usuario?.tipo === "LOJA" ? "LOJA" : "JOGADOR";

    const [aba, setAba] = useState<Aba>("inscritos");

    // Estados dos torneios
    const [inscritos, setInscritos] = useState<any[]>([]);
    const [andamento, setAndamento] = useState<any[]>([]);
    const [historico, setHistorico] = useState<any[]>([]);
    const [seus, setSeus] = useState<any[]>([]);
    const [contadores, setContadores] = useState<Record<number, number>>({});

    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    // Helper para obter lista atual - useCallback para evitar re-render
    const getListaAtual = useCallback(() => {
        if (papel === "LOJA") {
            return aba === "inscritos" ? seus :
                aba === "andamento" ? andamento :
                    historico;
        }
        return aba === "inscritos" ? inscritos :
            aba === "andamento" ? andamento :
                historico;
    }, [papel, aba, seus, inscritos, andamento, historico]);

    // Buscar dados principais - APENAS UMA VEZ por mudança de papel
    useEffect(() => {
        (async () => {
            setCarregando(true);
            setErro(null);
            setContadores({}); // Reset contadores ao recarregar

            try {
                let resultado;
                if (papel === "LOJA") {
                    resultado = await buscarAgrupadoPorAbaLoja();
                    setSeus(resultado.seus || []);
                    setAndamento(resultado.andamento || []);
                    setHistorico(resultado.historico || []);
                } else {
                    resultado = await buscarAgrupadoPorAba();
                    setInscritos(resultado.inscritos || []);
                    setAndamento(resultado.andamento || []);
                    setHistorico(resultado.historico || []);
                }
            } catch (e: any) {
                console.error("Erro ao carregar torneios:", e);
                setErro("Não foi possível carregar seus torneios.");
            } finally {
                setCarregando(false);
            }
        })();
    }, [papel]);

    // Carregar contadores de inscritos - OTIMIZADO
    useEffect(() => {
        const carregarContadores = async () => {
            const listaAtual = getListaAtual();
            if (listaAtual.length === 0) return;

            const idsParaCarregar = listaAtual
                .filter(t => contadores[t.id] === undefined)
                .map(t => t.id);

            if (idsParaCarregar.length === 0) return;

            const promises = idsParaCarregar.map(async (id) => {
                try {
                    const qtd = await contarInscritosTorneio(id);
                    return { id, qtd };
                } catch (error) {
                    return { id, qtd: 0 };
                }
            });

            try {
                const resultados = await Promise.all(promises);
                setContadores(prev => {
                    const novosContadores = { ...prev };
                    resultados.forEach(({ id, qtd }) => {
                        novosContadores[id] = qtd;
                    });
                    return novosContadores;
                });
            } catch (error) {
                console.error("Erro ao carregar contadores:", error);
            }
        };

        // Só carrega contadores quando não está carregando e há torneios
        if (!carregando) {
            carregarContadores();
        }
    }, [carregando, getListaAtual]); // Dependências mínimas

    // KPIs - useMemo para evitar recálculos desnecessários
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

    // Helper functions para mapeamento
    const getStatusTorneio = useCallback((status: string, papelUsuario: PapelUsuario) => {
        const statusLower = status?.toLowerCase() || "";
        if (statusLower.includes("andamento")) return "Em andamento";
        if (statusLower.includes("finalizado")) return "Concluído";
        return papelUsuario === "LOJA" ? "Aberto" : "Inscrito";
    }, []);

    const formatarPreco = useCallback((gratuita: boolean, valor: number) => {
        if (gratuita) return "Gratuita";
        if (valor) return `R$ ${String(valor).replace(".", ",")}`;
        return "—";
    }, []);

    // Lista ativa - useMemo para evitar recálculos
    const listaAtiva = useMemo(() => getListaAtual(), [getListaAtual]);

    // Mapper para CardInfoTorneio - useCallback para evitar re-render
    const mapToCardInfo = useCallback((t: any) => {
        const dt = t.data_inicio ? new Date(t.data_inicio) : null;
        const qtdInscritos = contadores[t.id] !== undefined ? contadores[t.id] : 0;

        return {
            title: getStatusTorneio(t.status, papel),
            name: t.nome ?? "Torneio",
            date: dt ? dt.toLocaleDateString("pt-BR") : "",
            time: dt ? dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "",
            location: t.loja_nome ?? "",
            price: formatarPreco(t.incricao_gratuita, t.valor_incricao),
            players: qtdInscritos,
        };
    }, [contadores, getStatusTorneio, papel, formatarPreco]);

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

                {/* KPIs */}
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

                {/* Lista dinâmica */}
                <section
                    id={IDS[aba]}
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
                                    <CardInfoTorneio
                                        key={t.id}
                                        {...mapToCardInfo(t)}
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