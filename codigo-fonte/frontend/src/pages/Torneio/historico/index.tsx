import React, { useEffect, useMemo, useState, useCallback } from "react";
import { FiUser, FiStar, FiCalendar } from "react-icons/fi";
import styles from "./styles.module.css";
import { CardSuperior } from "../../../components/CardSuperior";
import CardInfoTorneio from "../../../components/CardInfoTorneio";
import Button from "../../../components/Button";
import ModalInscricaoJogador from "../../../components/ModalInscricaoJogador";
import {buscarAgrupadoPorAba, buscarAgrupadoPorAbaLoja, desinscreverDoTorneio,} from "../../../services/torneioServico";

import { useSessao } from "../../../contextos/AuthContexto";

type Aba = "inscritos" | "andamento" | "historico";

const EmptyState: React.FC<{ aba: Aba }> = ({ aba }) => {
    const messages = {
        inscritos: "Você não está inscrito em nenhum torneio no momento.",
        andamento: "Nenhum torneio em andamento.",
        historico: "Nenhum torneio no histórico.",
    };
    return <div className={styles.vazio}>{messages[aba]}</div>;
};

const HistoricoTorneios: React.FC = () => {

    const { usuario } = useSessao?.() ?? ({} as any);
    const tipoBruto =
        (usuario?.tipo ?? usuario?.perfil ?? usuario?.role ?? "").toString();
    const isLoja = tipoBruto.toUpperCase() === "LOJA";

    // Estado de página
    const [aba, setAba] = useState<Aba>("inscritos");
    const [inscritos, setInscritos] = useState<any[]>([]);
    const [andamento, setAndamento] = useState<any[]>([]);
    const [historico, setHistorico] = useState<any[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [loadingAcao, setLoadingAcao] = useState<Record<number, boolean>>({});

    // Estados para o modal de inscrição de jogador
    const [modalAberto, setModalAberto] = useState(false);
    const [torneioSelecionado, setTorneioSelecionado] = useState<{ id: number; nome: string } | null>(null);

    // Carregamento inicial conforme o tipo (JOGADOR ou LOJA)
    const carregar = useCallback(async () => {
        setCarregando(true);
        setErro(null);
        try {
            if (isLoja) {
                const { seus, andamento, historico } = await buscarAgrupadoPorAbaLoja();
                setInscritos(seus || []);
                setAndamento(andamento || []);
                setHistorico(historico || []);
            } else {
                const { inscritos, andamento, historico } = await buscarAgrupadoPorAba();
                setInscritos(inscritos || []);
                setAndamento(andamento || []);
                setHistorico(historico || []);
            }
        } catch (e: any) {
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
            if (aba === "andamento")
                return "Acompanhe seus torneios em andamento e as suas batalhas";
            return "Reviva os momentos épicos dos seus torneios passados";
        }
        if (aba === "inscritos")
            return "Acompanhe seus torneios inscritos e participe das batalhas épicas";
        if (aba === "andamento")
            return "Acompanhe seus torneios em andamento e as suas batalhas";
        return "Reviva os momentos épicos dos seus torneios passados";
    }, [aba, isLoja]);

    // KPIs
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

    // Ação: desinscrever (apenas JOGADOR na aba "inscritos")
    const onUnsubscribe = useCallback(async (torneioId: number) => {
        setLoadingAcao((p) => ({ ...p, [torneioId]: true }));
        try {
            await desinscreverDoTorneio(torneioId);
            setInscritos((prev) => prev.filter((t) => Number(t.id) !== Number(torneioId)));
        } catch (e: any) {
            console.error("desinscrever(): erro", e?.response?.data || e);
            setErro("Não foi possível desinscrever-se do torneio.");
        } finally {
            setLoadingAcao((p) => ({ ...p, [torneioId]: false }));
        }
    }, []);

    // Função para abrir modal de inscrição de jogador
    const handleAbrirModalInscricao = (torneioId: number, torneioNome: string) => {
        setTorneioSelecionado({ id: torneioId, nome: torneioNome });
        setModalAberto(true);
    };

    // Função para fechar modal
    const handleFecharModal = () => {
        setModalAberto(false);
        setTorneioSelecionado(null);
    };

    // Função para recarregar torneios após inscrição bem-sucedida
    const handleSucessoInscricao = () => {
        carregar();
    };

    // Aqui mapeia torneio -> props do CardInfoTorneio
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
            date: dt ? dt.toLocaleDateString() : "",
            time: dt ? dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
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

    // Slot de ação que injeta o Button do projeto
    const renderActionFor = (t: any) => {
        if (aba !== "inscritos") return null;
        
        const tid = Number(t.id);
        
        // Se for LOJA, mostrar botão de inscrever jogador
        if (isLoja) {
            return (
                <Button
                    label="+ Inscrever Jogador"
                    onClick={(e: any) => {
                        e.stopPropagation();
                        handleAbrirModalInscricao(tid, t.nome);
                    }}
                    backgroundColor="var(--var-cor-primaria)"
                    textColor="var(--var-cor-branca)"
                    borderColor="var(--var-cor-rosa)"
                    hoverColor="var(--var-cor-rosa)"
                    className={styles.btnInscrever}
                />
            );
        }
        
        // Se for JOGADOR, mostrar botão de desinscrever
        return (
            <Button
                label={loadingAcao[tid] ? "Desinscrevendo..." : "Desinscrever-se"}
                onClick={(e: any) => {
                    e.stopPropagation();
                    onUnsubscribe(tid);
                }}
                disabled={!!loadingAcao[tid]}
                backgroundColor="var(--var-cor-primaria)"
                textColor="var(--var-cor-branca)"
                borderColor="var(--var-cor-rosa)"
                hoverColor="var(--var-cor-rosa)"
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
                            <EmptyState aba={aba} />
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

            {/* Modal de inscrição de jogador */}
            {modalAberto && torneioSelecionado && (
                <ModalInscricaoJogador
                    torneioId={torneioSelecionado.id}
                    torneioNome={torneioSelecionado.nome}
                    onClose={handleFecharModal}
                    onSuccess={handleSucessoInscricao}
                />
            )}
        </div>
    );
};

export default HistoricoTorneios;
