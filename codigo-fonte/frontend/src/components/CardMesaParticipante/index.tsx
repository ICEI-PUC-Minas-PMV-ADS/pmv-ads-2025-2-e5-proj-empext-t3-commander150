import React, { useState } from "react";
import { FiEdit } from "react-icons/fi";
import Modal from "../Modal";
import CardResultadoMesa from "../CardResultadoMesa";
import InputSelect from "../InputSelect";
import styles from "./mesaParticipante.module.css";
import modalStyles from "../Modal/modal.module.css";

interface IJogadorMesa {
  id: number;
  id_usuario: number;
  username: string;
  email: string;
  time: number;
}

interface MesaCardProps {
  mesaId: number;
  numeroMesa: number;
  time1: string;
  time2: string;
  status?: "Finalizado" | "Em andamento" | "Revisar dados";
  pontuacaoTime1: number;
  pontuacaoTime2: number;
  onEdit?: () => void;
  onConfirmarResultado?: (mesaId: number, pontuacaoTime1: number, pontuacaoTime2: number) => Promise<boolean>;
  onEditarEmparelhamento?: (mesaId: number, jogadorId?: number, novaMesaId?: number, novoTime?: 1 | 2) => void;
  jogadoresDaMesa?: IJogadorMesa[];
  jogadoresDisponiveis?: Array<{ id: number; username: string; }>;
  onAlterarJogador?: (timePosicao: 1 | 2 | 3 | 4, jogadorId: number | null) => void;
  showSelectsAlways?: boolean; // Nova propriedade para mostrar selects sempre
  rodadaSelecionada?: any; // informação da rodada selecionada
  onRecarregarMesas?: () => void; // callback para recarregar mesas
  isLoja?: boolean; // indica se o usuário atual é loja
}

const MesaCard: React.FC<MesaCardProps> = ({
  mesaId,
  numeroMesa,
  time1,
  time2,
  status,
  pontuacaoTime1,
  pontuacaoTime2,
  onEdit,
  onConfirmarResultado,
  // onEditarEmparelhamento,
  jogadoresDaMesa = [],
  jogadoresDisponiveis = [],
  // onAlterarJogador,
  showSelectsAlways = false,
  rodadaSelecionada,
  onRecarregarMesas,
  isLoja = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResultadoModalOpen, setIsResultadoModalOpen] = useState(false);

  const handleEditClick = () => {
    // Se for loja e rodada estiver em andamento, abrir modal de resultado
    if (isLoja && rodadaSelecionada?.status?.toLowerCase()?.includes("andamento")) {
      setIsResultadoModalOpen(true);
    } else {
      setIsModalOpen(true);
      if (onEdit) {
        onEdit();
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const closeResultadoModal = () => {
    setIsResultadoModalOpen(false);
  };

  const handleResultadoSubmit = async (pontuacaoTime1: number, pontuacaoTime2: number) => {
    if (onConfirmarResultado) {
      await onConfirmarResultado(mesaId, pontuacaoTime1, pontuacaoTime2);
      closeResultadoModal();
    }
  };

  // Verifica se está em fase de emparelhamento (onde selects podem ser editáveis)
  const statusRodadaLower = rodadaSelecionada?.status?.toLowerCase();
  const emFaseEmparelhamento = statusRodadaLower?.includes("aguardando") ||
                              statusRodadaLower?.includes("pronto") ||
                              statusRodadaLower?.includes("emparelhamento");

  // Determina se a rodada está em status que impede edição de emparelhamento
  const statusRodadaImpedeEdicao = statusRodadaLower?.includes("andamento") || statusRodadaLower?.includes("finalizad");

  const selectsReadOnly = statusRodadaImpedeEdicao || (!emFaseEmparelhamento && !showSelectsAlways && !isLoja);

  return (
    <>
      <div className={styles.mesaContainer}>
        <div className={styles.header}>
          <h3 className={styles.title}>Mesa {numeroMesa}</h3>
          {/* Botão de edição para loja informar resultados */}
          {(isLoja && statusRodadaLower?.includes("andamento") && !emFaseEmparelhamento) && (
            <button className={styles.editButton} onClick={handleEditClick}>
              <FiEdit />
            </button>
          )}
        </div>

        <div className={styles.teamsInfo}>
          {[1, 2].map((timePos) => {
            const jogadoresTime = jogadoresDaMesa.filter(j => j.time === timePos);
            const jogadorTime1 = jogadoresTime[0] || null;
            const jogadorTime2 = jogadoresTime[1] || null;

            return (
              <div key={`time-${timePos}`} className={styles.team}>
                <div className={styles.teamHeader}>
                  <span className={styles.teamLabel}>Time {timePos}:</span>
                </div>
                <div className={styles.teamPlayers}>
                  {/* Jogador 1 do time */}
                  <InputSelect
                    name={`jogador-time-${timePos}-1`}
                    value={jogadorTime1?.id_usuario || ""}
                  onChange={async (e) => {
                    const selectedValue = e.target.value;
                    const selectedId = parseInt(selectedValue);
                    const position = e.target.name === `jogador-time-${timePos}-1` ? 1 : 2; // Posição 1 ou 2 baseada no nome

                    try {
                      console.log(`Alterando jogador ${position} de time ${timePos}, mesa ${mesaId}, jogador ${selectedId}`);

                      // Chamar API usando a instância configurada do axios
                      const { default: api } = await import("../../services/api");
                      const response = await api.post('/torneios/rodadas/alterar_jogador_mesa/', {
                        mesa_id: mesaId,
                        jogador_id: selectedId,
                        time: timePos,
                        position: position // Enviar também a posição (1 ou 2)
                      });

                      console.log('Alteração realizada:', response.data);

                      // Recarregar mesas após alteração
                      await onRecarregarMesas?.();

                    } catch (error: any) {
                      console.error('Erro na alteração de jogador:', error);
                      const message = error.response?.data?.detail || error.message || 'Erro desconhecido';
                      alert(`Erro ao alterar jogador: ${message}`);
                    }
                  }}
                    options={jogadoresDisponiveis.length > 0 ?
                      jogadoresDisponiveis.map(j => ({ value: j.id, label: j.username })) :
                      [{ value: jogadorTime1?.id_usuario || "", label: jogadorTime1?.username || "" }]
                    }
                    disabled={!showSelectsAlways}
                    readOnly={selectsReadOnly} // ReadOnly quando rodada está Em andamento ou Finalizada
                  />
                </div>
                <div className={styles.teamPlayers}>
                  {/* Jogador 2 do time */}
                  <InputSelect
                    name={`jogador-time-${timePos}-2`}
                    value={jogadorTime2?.id_usuario || ""}
                    onChange={async (e) => {
                      const selectedValue = e.target.value;
                      const selectedId = parseInt(selectedValue);
                      const position = 2; // Sempre posição 2 para o segundo select

                      try {
                        console.log(`Alterando jogador ${position} de time ${timePos}, mesa ${mesaId}, jogador ${selectedId}`);

                        // Chamar API usando a instância configurada do axios
                        const { default: api } = await import("../../services/api");
                        const response = await api.post('/torneios/rodadas/alterar_jogador_mesa/', {
                          mesa_id: mesaId,
                          jogador_id: selectedId,
                          time: timePos,
                          position: position // Sempre posição 2
                        });

                        console.log('Alteração realizada:', response.data);

                        // Recarregar mesas após alteração
                        await onRecarregarMesas?.();

                      } catch (error: any) {
                        console.error('Erro na alteração de jogador:', error);
                        const message = error.response?.data?.detail || error.message || 'Erro desconhecido';
                        alert(`Erro ao alterar jogador: ${message}`);
                      }
                    }}
                    options={jogadoresDisponiveis.length > 0 ?
                      jogadoresDisponiveis.map(j => ({ value: j.id, label: j.username })) :
                      [{ value: jogadorTime2?.id_usuario || "", label: jogadorTime2?.username || "" }]
                    }
                    disabled={!showSelectsAlways}
                    readOnly={selectsReadOnly} // ReadOnly quando rodada está Em andamento ou Finalizada
                  />
                </div>
              </div>
            );
          })}

          {!emFaseEmparelhamento && (
            <div className={styles.statusContainer}>
              {status && (
                <span
                  className={`${styles.status} ${
                    styles[status.toLowerCase().replace(" ", "")]}
                  `}
                >
                  {status}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        mesaId={mesaId}
        numeroMesa={numeroMesa}
        dupla1={time1}
        dupla2={time2}
        status={status || ""}
        pontuacaoInicial1={pontuacaoTime1}
        pontuacaoInicial2={pontuacaoTime2}
        onConfirmarResultado={onConfirmarResultado}
      />

      {/* Modal de Resultado para Loja */}
      {isResultadoModalOpen && (
        <div className={modalStyles.modalOverlay} onClick={closeResultadoModal}>
          <div className={modalStyles.modalContent} onClick={(e) => e.stopPropagation()}>
            <CardResultadoMesa
              initialVictories={pontuacaoTime1}
              initialDraws={pontuacaoTime2}
              victoriesLabel="Vitórias do Time 1"
              drawsLabel="Vitórias do Time 2"
              title="Informar Resultado da Mesa"
              subtitle="Preencha as vitórias de cada time"
              onSubmit={handleResultadoSubmit}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default MesaCard;
