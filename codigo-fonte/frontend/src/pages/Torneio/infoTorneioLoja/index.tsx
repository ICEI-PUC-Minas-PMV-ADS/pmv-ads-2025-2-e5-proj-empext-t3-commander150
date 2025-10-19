/**
 * Página de Informações do Torneio - Visão da Loja
 *
 * Esta é a visualização específica para usuários do tipo LOJA,
 * que inclui funcionalidades administrativas como:
 * - Visualizar todas as mesas participantes
 * - Gerenciar participantes sobressalentes (mesa 0 - bye)
 * - Editar informações do torneio
 */

import { useEffect, useState } from "react";
import type { ITorneio, IRodada, IMesaRodada } from "../../../tipos/tipos";
import { buscarJogadoresInscritos, buscarTorneioPorId, tratarErroTorneio, iniciarTorneio, proximaRodadaTorneio, finalizarTorneio } from "../../../services/torneioServico";
import { buscarRodadasDoTorneio, buscarMesasDaRodada } from "../../../services/mesaServico";
import styles from "./styles.module.css";
import { CardSuperior } from "../../../components/CardSuperior";
import { FiGift, FiChevronDown, FiPlay, FiSkipForward, FiCheckCircle } from "react-icons/fi";
import CardInfoTorneio from "../../../components/CardInfoTorneio";
import RegrasPartida from "../../../components/CardRegrasPartida";
import MesaCard from "../../../components/CardMesaParticipante";
import { useParams } from "react-router-dom";
import Button from "../../../components/Button";
import Swal from 'sweetalert2';

interface Mesa {
  id: number;
  numero_mesa: number;
  time1: string;
  time2: string;
  status: "Finalizado" | "Em andamento" | "Revisar dados";
  pontuacao_time_1: number;
  pontuacao_time_2: number;
}

interface Participante {
  id: number;
  nome: string;
}

const InformacaoTorneioLoja: React.FC = () => {
  const [tournament, setTournament] = useState<ITorneio | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [jogadoresInscritos, setJogadoresInscritos] = useState<string[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [sobressalentes, setSobressalentes] = useState<Participante[]>([]);
  const [rodadas, setRodadas] = useState<IRodada[]>([]);
  const [rodadaSelecionada, setRodadaSelecionada] = useState<IRodada | null>(null);
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [carregandoMesas, setCarregandoMesas] = useState(false);
  const [iniciandoTorneio, setIniciandoTorneio] = useState(false);
  const [avancandoRodada, setAvancandoRodada] = useState(false);
  const [finalizandoTorneio, setFinalizandoTorneio] = useState(false);

  const { id } = useParams<{ id: string }>();

  // Recuperar mesas confirmadas do localStorage
  const getStorageKey = () => `mesasConfirmadas_torneio_${id}`;

  const carregarMesasConfirmadas = (): Set<number> => {
    try {
      const stored = localStorage.getItem(getStorageKey());
      if (stored) {
        const array = JSON.parse(stored);
        return new Set(array);
      }
    } catch (error) {
      console.error('Erro ao carregar mesas confirmadas:', error);
    }
    return new Set();
  };

  const [mesasConfirmadas, setMesasConfirmadas] = useState<Set<number>>(carregarMesasConfirmadas());

  // Salvar mesas confirmadas no localStorage sempre que mudar
  useEffect(() => {
    try {
      const array = Array.from(mesasConfirmadas);
      localStorage.setItem(getStorageKey(), JSON.stringify(array));
    } catch (error) {
      console.error('Erro ao salvar mesas confirmadas:', error);
    }
  }, [mesasConfirmadas, id]);

  // Processar mesas da API para o formato do componente
  const processarMesasDaAPI = (mesasAPI: IMesaRodada[], confirmadas: Set<number>, statusRodada?: string): Mesa[] => {
    const mesasProcessadas = mesasAPI.map(mesa => {
      // Separar jogadores por time
      const jogadoresTime1 = mesa.jogadores.filter(j => j.time === 1);
      const jogadoresTime2 = mesa.jogadores.filter(j => j.time === 2);

      // Formatar nomes dos times
      const time1 = jogadoresTime1.length > 0
        ? jogadoresTime1.map(j => j.username).join(' & ')
        : 'Aguardando jogadores';

      const time2 = jogadoresTime2.length > 0
        ? jogadoresTime2.map(j => j.username).join(' & ')
        : 'Aguardando jogadores';

      // Nova lógica de status
      let status: "Finalizado" | "Em andamento" | "Revisar dados";

      // Se a rodada está finalizada, todas as mesas ficam finalizadas
      if (statusRodada?.toLowerCase() === 'finalizada') {
        status = "Finalizado";
      } else if (confirmadas.has(mesa.id)) {
        // Mesa confirmada pela loja
        status = "Finalizado";
      } else if (mesa.time_vencedor === null && (mesa.pontuacao_time_1 || 0) === 0 && (mesa.pontuacao_time_2 || 0) === 0) {
        // Não tem vencedor E pontuações são 0
        status = "Em andamento";
      } else {
        // Tem vencedor OU tem pontuações diferentes de 0
        status = "Revisar dados";
      }

      return {
        id: mesa.id,
        numero_mesa: mesa.numero_mesa,
        time1,
        time2,
        status,
        pontuacao_time_1: mesa.pontuacao_time_1 || 0,
        pontuacao_time_2: mesa.pontuacao_time_2 || 0
      };
    });

    // Ordenar por número da mesa (crescente)
    return mesasProcessadas.sort((a, b) => a.numero_mesa - b.numero_mesa);
  };

  // Carregar mesas de uma rodada específica
  const carregarMesasDaRodada = async (rodada: IRodada, mesasConfirmadasTemp?: Set<number>) => {
    try {
      setCarregandoMesas(true);
      setErro(null);

      const mesasAPI = await buscarMesasDaRodada(rodada.id);

      // Filtrar apenas mesas da rodada selecionada
      const mesasDaRodada = mesasAPI.filter(m => m.id_rodada === rodada.id);

      // Verificar se há mesas
      if (!mesasDaRodada || mesasDaRodada.length === 0) {
        setMesas([]);
        setSobressalentes([]);
        return;
      }

      // Usar o set temporário se fornecido, caso contrário usar o estado
      const confirmadas = mesasConfirmadasTemp || mesasConfirmadas;
      const mesasProcessadas = processarMesasDaAPI(mesasDaRodada, confirmadas, rodada.status);
      setMesas(mesasProcessadas);

      // Calcular participantes sobressalentes (jogadores inscritos que não estão em nenhuma mesa da rodada)
      if (tournament) {
        const torneioId = tournament.id;
        
        // IDs de jogadores que estão em mesas da rodada
        const jogadoresEmMesas = new Set<number>();
        mesasDaRodada.forEach(mesa => {
          mesa.jogadores.forEach(j => {
            jogadoresEmMesas.add(j.id_usuario);
          });
        });

        // Buscar todos os inscritos
        try {
          const inscricoesResponse = await buscarJogadoresInscritos(torneioId);
          
          // NOTA: A função buscarJogadoresInscritos retorna apenas os nomes (strings),
          // não os IDs dos jogadores. Para identificar corretamente os sobressalentes,
          // seria necessário ter acesso aos IDs dos jogadores inscritos.
          
          const mesasBye = mesasDaRodada.filter(m => m.numero_mesa === 0);
          if (mesasBye.length > 0) {
            const mesaBye = mesasBye[0];
            const jogadoresBye = mesaBye.jogadores.map(j => j.username);
            setSobressalentes(jogadoresBye.map((nome, idx) => ({ id: idx, nome })));
          } else {
            setSobressalentes([]);
          }
        } catch (error) {
          console.error('Erro ao buscar inscritos para calcular sobressalentes:', error);
          setSobressalentes([]);
        }
      } else {
        setSobressalentes([]);
      }

    } catch (e: any) {
      console.error('Erro ao carregar mesas:', e);
      setErro(`Erro ao carregar mesas: ${e.message || 'Erro desconhecido'}`);
      setMesas([]);
      setSobressalentes([]);
    } finally {
      setCarregandoMesas(false);
    }
  };

  // Buscar dados do torneio e rodadas
  useEffect(() => {
    const carregarTorneio = async () => {
      try {
        setLoading(true);
        const torneioId = id ? parseInt(id) : 1;

        const [dadosTorneio, jogadores, rodadasTorneio] = await Promise.all([
          buscarTorneioPorId(torneioId),
          buscarJogadoresInscritos(torneioId),
          buscarRodadasDoTorneio(torneioId)
        ]);

        setTournament(dadosTorneio);
        setJogadoresInscritos(jogadores);
        setRodadas(rodadasTorneio);

        // Selecionar automaticamente a rodada em andamento, ou a primeira se não houver
        if (rodadasTorneio.length > 0) {
          const rodadaEmAndamento = rodadasTorneio.find(r =>
            r.status?.toLowerCase() === 'em andamento'
          );
          const rodadaInicial = rodadaEmAndamento || rodadasTorneio[0];
          setRodadaSelecionada(rodadaInicial);
          await carregarMesasDaRodada(rodadaInicial);
        }

      } catch (e) {
        console.error('Erro ao carregar torneio:', e);
        setErro(tratarErroTorneio(e));
      } finally {
        setLoading(false);
      }
    };

    carregarTorneio();
  }, [id]);

  // Processar regras do torneio
  const regrasPartida = tournament?.regras
    ? tournament.regras.split('\n').filter(regra => regra.trim() !== '')
    : [
        'Formato Commander padrão',
        'Time limit: 50 minutos por partida',
        'Decks devem ter exatamente 100 cartas',
        'Banlist oficial da Wizards',
        'Vida inicial: 40 pontos por jogador',
        'Comportamento respeitoso é obrigatório'
      ];

  const getStatusLabel = () => {
    if (tournament?.status === "em_andamento" || tournament?.status === "Em andamento") {
      return "Em andamento";
    } else if (tournament?.status === "em_breve" || tournament?.status === "Em breve") {
      return "Em breve";
    } else if (tournament?.status === "Finalizado") {
      return "Finalizado";
    } else if (tournament?.status === "Aberto") {
      return "Aberto";
    }
    return "Em andamento";
  };

  // Handler para confirmar resultado da mesa
  const handleConfirmarResultado = async (mesaId: number, pontuacaoTime1: number, pontuacaoTime2: number) => {
    try {
      // Determinar vencedor
      let timeVencedor: number;
      if (pontuacaoTime1 > pontuacaoTime2) {
        timeVencedor = 1;
      } else if (pontuacaoTime2 > pontuacaoTime1) {
        timeVencedor = 2;
      } else {
        timeVencedor = 0; // Empate
      }

      // Importar e chamar a API usando o endpoint correto para LOJA
      const { atualizarResultadoMesa } = await import("../../../services/mesaServico");
      await atualizarResultadoMesa(mesaId, pontuacaoTime1, pontuacaoTime2, timeVencedor);

      // Criar novo Set com a mesa confirmada
      const novoSetConfirmadas = new Set(mesasConfirmadas).add(mesaId);

      // Atualizar estado
      setMesasConfirmadas(novoSetConfirmadas);

      // Recarregar mesas passando o Set atualizado
      if (rodadaSelecionada) {
        await carregarMesasDaRodada(rodadaSelecionada, novoSetConfirmadas);
      }

      return true;
    } catch (error) {
      console.error('Erro ao confirmar resultado:', error);
      throw error;
    }
  };

  // Handler para selecionar rodada
  const handleSelecionarRodada = async (rodada: IRodada) => {
    setRodadaSelecionada(rodada);
    setDropdownAberto(false);
    await carregarMesasDaRodada(rodada);
  };

  // Handler para iniciar torneio
  const handleIniciarTorneio = async () => {
    if (!tournament?.id) return;

    const result = await Swal.fire({
      title: 'Iniciar Torneio',
      html: `
        <p>Deseja realmente iniciar o torneio <strong>"${tournament.nome}"</strong>?</p>
        <br>
        <p><strong>Jogadores inscritos:</strong> ${jogadoresInscritos.length}</p>
        <p>Esta ação criará a primeira rodada e emparelhará os jogadores.</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sim, iniciar!',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#9b80b6',
      cancelButtonColor: '#6c757d',
    });

    if (!result.isConfirmed) return;

    try {
      setIniciandoTorneio(true);
      setErro(null);

      const resultado = await iniciarTorneio(tournament.id);

      await Swal.fire({
        title: 'Torneio Iniciado!',
        html: `
          <p>${resultado.message}</p>
          <br>
          <p><strong>Mesas criadas:</strong> ${resultado.mesas_criadas}</p>
          <p><strong>Total de jogadores:</strong> ${resultado.total_jogadores}</p>
        `,
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#46AF87',
      });

      // Recarregar dados do torneio
      const torneioAtualizado = await buscarTorneioPorId(tournament.id);
      setTournament(torneioAtualizado);

      // Recarregar rodadas
      const rodadasAtualizadas = await buscarRodadasDoTorneio(tournament.id);
      setRodadas(rodadasAtualizadas);

      // Selecionar a primeira rodada criada
      if (rodadasAtualizadas.length > 0) {
        const primeiraRodada = rodadasAtualizadas[0];
        setRodadaSelecionada(primeiraRodada);
        await carregarMesasDaRodada(primeiraRodada);
      }

    } catch (e: any) {
      console.error('Erro ao iniciar torneio:', e);
      const mensagemErro = e.response?.data?.detail || tratarErroTorneio(e);
      
      await Swal.fire({
        title: 'Erro!',
        text: mensagemErro,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#DC2626',
      });
    } finally {
      setIniciandoTorneio(false);
    }
  };

  // Handler para avançar para próxima rodada
  const handleProximaRodada = async () => {
    if (!tournament?.id) return;

    const result = await Swal.fire({
      title: 'Avançar para Próxima Rodada',
      html: `
        <p>Deseja avançar para a próxima rodada?</p>
        <br>
        <p>Esta ação finalizará a rodada atual e criará uma nova rodada com emparelhamento Swiss.</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sim, avançar!',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#46AF87',
      cancelButtonColor: '#6c757d',
    });

    if (!result.isConfirmed) return;

    try {
      setAvancandoRodada(true);
      setErro(null);

      const resultado = await proximaRodadaTorneio(tournament.id);

      await Swal.fire({
        title: 'Rodada Avançada!',
        html: `
          <p>${resultado.message}</p>
          <br>
          <p><strong>Mesas criadas:</strong> ${resultado.mesas_criadas}</p>
        `,
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#46AF87',
      });

      // Recarregar rodadas
      const rodadasAtualizadas = await buscarRodadasDoTorneio(tournament.id);
      setRodadas(rodadasAtualizadas);

      // Selecionar a nova rodada criada
      if (rodadasAtualizadas.length > 0) {
        const novaRodada = rodadasAtualizadas[rodadasAtualizadas.length - 1];
        setRodadaSelecionada(novaRodada);
        await carregarMesasDaRodada(novaRodada);
      }

    } catch (e: any) {
      console.error('Erro ao avançar rodada:', e);
      const mensagemErro = e.response?.data?.detail || tratarErroTorneio(e);
      
      await Swal.fire({
        title: 'Erro!',
        text: mensagemErro,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#DC2626',
      });
    } finally {
      setAvancandoRodada(false);
    }
  };

  // Handler para finalizar torneio
  const handleFinalizarTorneio = async () => {
    if (!tournament?.id) return;

    const result = await Swal.fire({
      title: 'Finalizar Torneio',
      html: `
        <p>Deseja realmente finalizar o torneio <strong>"${tournament.nome}"</strong>?</p>
        <br>
        <p><strong>⚠️ Esta ação é irreversível!</strong></p>
        <p>O ranking final será gerado e o torneio será encerrado.</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, finalizar!',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6c757d',
    });

    if (!result.isConfirmed) return;

    try {
      setFinalizandoTorneio(true);
      setErro(null);

      const resultado = await finalizarTorneio(tournament.id);

      // Formatar ranking para exibição em HTML
      const rankingHtml = resultado.ranking
        .map(r => `
          <div style="display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #eee;">
            <span><strong>${r.posicao}º</strong> - ${r.jogador_nome}</span>
            <span><strong>${r.pontos}</strong> pontos</span>
          </div>
        `)
        .join('');

      await Swal.fire({
        title: 'Torneio Finalizado!',
        html: `
          <p>${resultado.message}</p>
          <p><strong>Total de rodadas:</strong> ${resultado.total_rodadas}</p>
          <br>
          <div style="text-align: left; max-height: 300px; overflow-y: auto; border: 1px solid #ddd; border-radius: 8px;">
            <div style="background: #f8f9fa; padding: 10px; border-bottom: 2px solid #ddd; position: sticky; top: 0;">
              <strong>🏆 RANKING FINAL</strong>
            </div>
            ${rankingHtml}
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#46AF87',
        width: '600px',
      });

      // Recarregar dados do torneio
      const torneioAtualizado = await buscarTorneioPorId(tournament.id);
      setTournament(torneioAtualizado);

      // Recarregar rodadas
      const rodadasAtualizadas = await buscarRodadasDoTorneio(tournament.id);
      setRodadas(rodadasAtualizadas);

    } catch (e: any) {
      console.error('Erro ao finalizar torneio:', e);
      const mensagemErro = e.response?.data?.detail || tratarErroTorneio(e);
      
      await Swal.fire({
        title: 'Erro!',
        text: mensagemErro,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#DC2626',
      });
    } finally {
      setFinalizandoTorneio(false);
    }
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickFora = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.rodadaDropdownContainer}`)) {
        setDropdownAberto(false);
      }
    };

    if (dropdownAberto) {
      document.addEventListener('click', handleClickFora);
    }

    return () => {
      document.removeEventListener('click', handleClickFora);
    };
  }, [dropdownAberto]);

  if (loading) return <div className={styles.loading}>Carregando...</div>;
  if (erro) return <div className={styles.error}>{erro}</div>;
  if (!tournament) return <div className={styles.error}>Nenhum torneio encontrado.</div>;

  return (
    <div className={styles.container}>
      {/* Cabeçalho */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>Torneio {getStatusLabel().toLowerCase()}</h1>
          <p className={styles.subtitulo}>{tournament.nome}</p>
        </div>

        <div className={styles.headerActions}>
          {/* Botão Iniciar Torneio - Aparece apenas quando status é "Aberto" */}
          {tournament.status === "Aberto" && (
            <Button
              label="Iniciar Torneio"
              onClick={handleIniciarTorneio}
              disabled={iniciandoTorneio}
              width="auto"
              height="44px"
              paddingHorizontal="24px"
              fontSize="14px"
            />
          )}

          {/* Botões para torneio "Em Andamento" */}
          {tournament.status === "Em Andamento" && (
            <>
              <Button
                label="Próxima Rodada"
                onClick={handleProximaRodada}
                disabled={avancandoRodada}
                width="auto"
                height="44px"
                paddingHorizontal="24px"
                fontSize="14px"
                backgroundColor="#46AF87"
              />
              <Button
                label="Finalizar Torneio"
                onClick={handleFinalizarTorneio}
                disabled={finalizandoTorneio}
                width="auto"
                height="44px"
                paddingHorizontal="24px"
                fontSize="14px"
                backgroundColor="#DC2626"
              />
            </>
          )}

          {/* Dropdown de Rodadas - Aparece apenas para torneios em andamento ou finalizados */}
          {tournament.status !== "Aberto" && (
            <div className={styles.rodadaDropdownContainer}>
            <button
              className={styles.rodadaDropdownButton}
              onClick={() => setDropdownAberto(!dropdownAberto)}
            >
              <span>
                {rodadaSelecionada
                  ? `Rodada ${rodadaSelecionada.numero_rodada} de ${rodadas.length}`
                  : 'Selecione uma rodada'}
              </span>
              <FiChevronDown className={dropdownAberto ? styles.iconRotate : ''} />
            </button>

            {dropdownAberto && (
              <div className={styles.rodadaDropdownMenu}>
                {rodadas.map((rodada) => (
                  <div
                    key={rodada.id}
                    className={`${styles.rodadaDropdownItem} ${
                      rodadaSelecionada?.id === rodada.id ? styles.rodadaAtiva : ''
                    }`}
                    onClick={() => handleSelecionarRodada(rodada)}
                  >
                    <span>Rodada {rodada.numero_rodada}</span>
                    <span className={styles.rodadaStatus}>{rodada.status}</span>
                  </div>
                ))}
              </div>
            )}
            </div>
          )}
        </div>
      </div>

      {/* Layout em Grid */}
      <div className={styles.gridContainer}>
        {/* Coluna Esquerda - Mesas e Sobressalentes */}
        <div className={styles.colunaEsquerda}>
          {/* Condicional: Exibe Mesas para torneios em andamento ou Jogadores Inscritos para torneios abertos */}
          {tournament.status === "Aberto" ? (
            /* Jogadores Inscritos - Para torneios abertos */
            <div className={styles.mesasCard}>
              <h2 className={styles.cardTitulo}>Usuários inscritos</h2>
              <span className={styles.infoJogadores}>
                {jogadoresInscritos.length} {jogadoresInscritos.length === 1 ? 'jogador' : 'jogadores'}
              </span>
              {jogadoresInscritos.length > 0 ? (
                <ul className={styles.playerList}>
                  {jogadoresInscritos.map((player, index) => (
                    <li key={index} className={styles.playerItem}>
                      <span className={styles.numeroJogador}>{index + 1}. </span>
                      <span className={styles.nomeJogador}>{player}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={styles.mensagemVazia}>Nenhum jogador inscrito ainda.</div>
              )}
            </div>
          ) : (
            /* Mesas Participantes - Para torneios em andamento */
            <>
              <div className={styles.mesasCard}>
                <h2 className={styles.cardTitulo}>Mesas participantes</h2>
                {erro && (
                  <div className={styles.mensagemErro}>
                    {erro}
                  </div>
                )}
                {carregandoMesas ? (
                  <div className={styles.loading}>Carregando mesas...</div>
                ) : (
                  <div className={styles.mesasGrid}>
                    {mesas.filter(m => m.numero_mesa !== 0).length > 0 ? (
                      mesas
                        .filter(m => m.numero_mesa !== 0)
                        .map((mesa) => (
                          <MesaCard
                            key={mesa.id}
                            mesaId={mesa.id}
                            numeroMesa={mesa.numero_mesa}
                            time1={mesa.time1}
                            time2={mesa.time2}
                            status={mesa.status}
                            pontuacaoTime1={mesa.pontuacao_time_1}
                            pontuacaoTime2={mesa.pontuacao_time_2}
                            onConfirmarResultado={handleConfirmarResultado}
                          />
                        ))
                    ) : (
                      <p className={styles.mensagemVazia}>Nenhuma mesa criada ainda.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Participantes Sobressalentes */}
              <div className={styles.sobressalentesCard}>
                <h2 className={styles.cardTitulo}>Participantes sobressalentes</h2>
                <div className={styles.sobressalentesList}>
                  {sobressalentes.length > 0 ? (
                    sobressalentes.map((participante) => (
                      <div key={participante.id} className={styles.sobressalenteItem}>
                        {participante.nome}
                      </div>
                    ))
                  ) : (
                    <p className={styles.mensagemVazia}>Nenhum participante sobressalente.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Coluna Direita - Informações */}
        <div className={styles.colunaDireita}>
          {/* Premiação */}
          <div className={styles.cardPremiacaoWrapper}>
            <CardSuperior
              count={tournament.incricao_gratuita ? "Gratuito" :
                tournament.valor_incricao ?
                  new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(tournament.valor_incricao) : "Não informado"}
              label="Premiação"
              icon={FiGift}
              selected={false}
            />
          </div>

          {/* Informações do Torneio */}
          <CardInfoTorneio
            title="Informações do Torneio"
            name={tournament.nome}
            date={new Date(tournament.data_inicio).toLocaleDateString("pt-BR")}
            time={new Date(tournament.data_inicio).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            location={tournament.loja_nome || 'Loja não especificada'}
            price={
              tournament.incricao_gratuita
                ? "Gratuito"
                : tournament.valor_incricao
                  ? new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(tournament.valor_incricao)
                  : "Não informado"
            }
            players={jogadoresInscritos.length}
          />

          {/* Regras da Partida */}
          <RegrasPartida regras={regrasPartida} />
        </div>
      </div>
    </div>
  );
};

export default InformacaoTorneioLoja;
