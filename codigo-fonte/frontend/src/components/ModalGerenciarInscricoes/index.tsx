import React, { useEffect, useState, useCallback } from "react";
import { FiX } from "react-icons/fi";
import Swal from "sweetalert2";
import styles from "../Modal/modal.module.css";
import {listarInscricoesDoTorneio, removerJogadorDoTorneioComoLoja, reativarJogadorNoTorneioComoLoja} from "../../services/torneioServico";

interface ModalGerenciarInscricoesProps {
    torneioId: number;
    torneioStatus: string;
    onClose: () => void;
}

interface Inscrito {
    id: number;
    id_usuario: number;
    username: string;
    email: string;
    status: string;
}

interface ModalGerenciarInscricoesProps {
    torneioId: number;
    torneioStatus: string;
    onClose: () => void;
}

const ModalGerenciarInscricoes: React.FC<ModalGerenciarInscricoesProps> = ({
                                                                               torneioId,
                                                                               onClose,
                                                                           }) => {
    const [carregando, setCarregando] = useState(true);
    const [inscritos, setInscritos] = useState<Inscrito[]>([]);
    const [atualizando, setAtualizando] = useState<Record<number, boolean>>({});

    // carrega a lista de inscrições do torneio
    const carregarInscritos = useCallback(async () => {
        setCarregando(true);
        try {
            const lista = await listarInscricoesDoTorneio(torneioId);

            // normaliza dados que vêm da API
            setInscritos(
                lista.map((i: any) => ({
                    id: i.id,
                    id_usuario: i.id_usuario,
                    username: i.username || i.email || "Jogador",
                    email: i.email,
                    status: i.status, // "Inscrito" ou "Cancelado"
                }))
            );

        } catch (e) {
            Swal.fire({
                title: "Erro",
                text: "Não foi possível carregar as inscrições.",
                icon: "error",
                confirmButtonText: "OK",
            });
        } finally {
            setCarregando(false);
        }
    }, [torneioId]);

    useEffect(() => {
        carregarInscritos();
    }, [carregarInscritos]);

    /**
     * handleToggleChange
     *
     * A loja só pode "desligar" (remover/cancelar) jogadores ativos.
     * Se já estiver cancelado, não faz nada.
     *
     * 1. Pergunta confirmação
     * 2. Chama removerJogadorDoTorneioComoLoja(torneioId, inscricaoId)
     *   Torneio > "Em Andamento": soft delete (status -> Cancelado)
     * 3. Atualiza a UI localmente
     */
    const handleToggleChange = async (
        inscricaoId: number,
        ativoAgora: boolean,
        nomeJogador: string
    ) => {

        // se o jogador está ativo e o toggle foi DESLIGADO → SOFT DELETE
        if (ativoAgora) {
            const result = await Swal.fire({
                title: `Remover ${nomeJogador} deste torneio?`,
                text: "Essa ação vai cancelar a inscrição deste jogador.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Sim",
                cancelButtonText: "Não",
                reverseButtons: true,
                confirmButtonColor: "#DC2626",
                cancelButtonColor: "#6c757d",
                focusCancel: true,
            });

            if (!result.isConfirmed) return;

            setAtualizando((prev) => ({ ...prev, [inscricaoId]: true }));
            try {
                await removerJogadorDoTorneioComoLoja(torneioId, inscricaoId);

                // Atualiza localmente para status "Cancelado"
                setInscritos((prev) =>
                    prev.map((j) =>
                        j.id === inscricaoId ? { ...j, status: "Cancelado" } : j
                    )
                );
            } catch {
                Swal.fire({
                    title: "Erro",
                    text: "Não foi possível remover o jogador.",
                    icon: "error",
                    confirmButtonText: "OK",
                });
            } finally {
                setAtualizando((prev) => ({ ...prev, [inscricaoId]: false }));
            }
        }

        // se o jogador está inativo e o toggle foi LIGADO → REINSCRIÇÃO (reativar)
        else {
            const result = await Swal.fire({
                title: `Reinscrever ${nomeJogador}?`,
                text: "Isso vai reativar a inscrição deste jogador no torneio.",
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Sim",
                cancelButtonText: "Não",
                reverseButtons: true,
                confirmButtonColor: "#46AF87",
                cancelButtonColor: "#6c757d",
                focusCancel: true,
            });

            if (!result.isConfirmed) return;

            setAtualizando((prev) => ({ ...prev, [inscricaoId]: true }));
            try {
                await reativarJogadorNoTorneioComoLoja(torneioId, inscricaoId);

                // atualiza localmente para status "Inscrito"
                setInscritos((prev) =>
                    prev.map((j) =>
                        j.id === inscricaoId ? { ...j, status: "Inscrito" } : j
                    )
                );
            } catch {
                Swal.fire({
                    title: "Erro",
                    text: "Não foi possível reinscrever o jogador.",
                    icon: "error",
                    confirmButtonText: "OK",
                });
            } finally {
                setAtualizando((prev) => ({ ...prev, [inscricaoId]: false }));
            }
        }
    };



    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                {/* Cabeçalho do modal */}
                <div className={styles.headerRow}>
                    <h2 className={styles.modalTitulo}>Gerenciar Inscrições</h2>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label="Fechar"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Corpo do modal */}
                <div className={styles.scrollArea}>
                    {carregando ? (
                        <div className={styles.infoText}>Carregando jogadores…</div>
                    ) : inscritos.length === 0 ? (
                        <div className={styles.infoText}>Nenhum jogador inscrito.</div>
                    ) : (
                        <ul className={styles.listaWrapper}>
                            {inscritos.map((jogador) => {
                                const ativo = jogador.status.toLowerCase() !== "cancelado";

                                return (
                                    <li key={jogador.id} className={styles.linhaJogador}>
                    <span className={styles.nomeJogador}>
                      {jogador.username}
                        {jogador.email ? ` (${jogador.email})` : ""}
                    </span>

                                        <label className={styles.switchWrapper}>
                                            <input
                                                type="checkbox"
                                                checked={ativo}
                                                disabled={atualizando[jogador.id]}
                                                onChange={() =>
                                                    handleToggleChange(
                                                        jogador.id,
                                                        ativo,
                                                        jogador.username || jogador.email || "Jogador"
                                                    )
                                                }
                                            />

                                            <span className={styles.slider} />
                                        </label>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* Rodapé */}
                <div className={styles.footerRow}>
                    <button className={styles.actionSecondary} onClick={onClose}>
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalGerenciarInscricoes;
