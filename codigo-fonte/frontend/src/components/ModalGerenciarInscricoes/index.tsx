import React, { useEffect, useState, useCallback } from "react";
import { FiX } from "react-icons/fi";
import Swal from "sweetalert2";
import styles from "../Modal/modal.module.css";
import {listarInscricoesDoTorneio, removerJogadorDoTorneioComoLoja,} from "../../services/torneioServico";

interface ModalGerenciarInscricoesProps {
    torneioId: number;
    onClose: () => void;
}

interface Inscrito {
    id: number;
    username: string;
    email: string;
    status: string;
}

const ModalGerenciarInscricoes: React.FC<ModalGerenciarInscricoesProps> = ({
                                                                               torneioId,
                                                                               onClose,
                                                                           }) => {
    const [carregando, setCarregando] = useState(true);
    const [inscritos, setInscritos] = useState<Inscrito[]>([]);
    const [atualizando, setAtualizando] = useState<Record<number, boolean>>({});

    // Carrega a lista de inscrições do torneio
    const carregarInscritos = useCallback(async () => {
        setCarregando(true);
        try {
            const lista = await listarInscricoesDoTorneio(torneioId);

            // normaliza dados que vêm da API
            setInscritos(
                lista.map((i: any) => ({
                    id: i.id,
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
     * handleToggleOff
     *
     * A loja só pode "desligar" (remover/cancelar) jogadores ativos.
     * Se já estiver cancelado, não faz nada.
     *
     * Fluxo:
     * 1. Pergunta confirmação
     * 2. Chama removerJogadorDoTorneioComoLoja(torneioId, inscricaoId)
     *    - Se torneio estiver "Aberto": hard delete
     *    - Se estiver "Em Andamento": soft delete (status -> Cancelado)
     * 3. Atualiza a UI localmente
     */
    const handleToggleOff = async (
        inscricaoId: number,
        ativoAgora: boolean,
        nomeJogador: string
    ) => {
        if (!ativoAgora) {
            // Já está desligado / cancelado. Ainda não suportamos "reativar".
            return;
        }

        const result = await Swal.fire({
            title: `Remover ${nomeJogador} deste torneio?`,
            text: "Essa ação vai remover o jogador das inscrições deste torneio.",
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

            // Duas possibilidades:
            // - torneio Aberto -> hard delete -> inscrição some
            // - torneio Em Andamento -> soft delete -> status vira "Cancelado"

            setInscritos((prev) => {
                const aindaExiste = prev.find((j) => j.id === inscricaoId);
                const filtrado = prev.filter((j) => j.id !== inscricaoId);

                if (filtrado.length < prev.length) {
                    // hard delete (torneio Aberto)
                    return filtrado;
                }

                // caso contrário, faz soft delete local (torneio Em Andamento)
                return prev.map((j) =>
                    j.id === inscricaoId ? { ...j, status: "Cancelado" } : j
                );
            });
        } catch (e: any) {
            Swal.fire({
                title: "Erro",
                text: "Não foi possível remover o jogador.",
                icon: "error",
                confirmButtonText: "OK",
            });
        } finally {
            setAtualizando((prev) => ({ ...prev, [inscricaoId]: false }));
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
                                                    handleToggleOff(
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
