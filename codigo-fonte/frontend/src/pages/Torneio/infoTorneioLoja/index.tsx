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
import type { ITorneio, IRodada, IMesaRodada, IJogadorMesa } from "../../../tipos/tipos";
import { buscarJogadoresInscritos, buscarSobressalentes, buscarTorneioPorId, tratarErroTorneio, iniciarTorneio, proximaRodadaTorneio, proximaRodadaNovo, finalizarTorneio, buscarRankingRodada, obterEmparelhamento, emparelharAutomatico, iniciarRodada, reemparelharRodada, editarEmparelhamentoManual, atualizarTorneio, buscarInscricoesAtivasCompletas, cancelarTorneio } from "../../../services/torneioServico";
import { buscarRodadasDoTorneio, buscarMesasDaRodada } from "../../../services/mesaServico";
import styles from "./styles.module.css";
import modalStyles from "./modalEditarStyles.module.css";
import { CardSuperior } from "../../../components/CardSuperior";
import { FiGift, FiChevronDown, FiPlay, FiSkipForward, FiCheckCircle, FiShare2, FiEdit, FiTrash2, FiX } from "react-icons/fi";
import CardInfoTorneio from "../../../components/CardInfoTorneio";
import RegrasPartida from "../../../components/CardRegrasPartida";
import MesaCard from "../../../components/CardMesaParticipante";
import ModalGerenciarInscricoes from "../../../components/ModalGerenciarInscricoes";
import { removerJogadorDoTorneioComoLoja } from "../../../services/torneioServico";
import Modal from "../../../components/Modal";
import { useParams } from "react-router-dom";
import Button from "../../../components/Button";
import CardRanking from "../../../components/CardRanking";
import Swal from 'sweetalert2';

interface Mesa {
  id: number;
  numero_mesa: number;
  time1: string;
  time2: string;
  status: "Finalizado" | "Em andamento" | "Revisar dados";
  pontuacao_time_1: number;
  pontuacao_time_2: number;
  jogadores?: IJogadorMesa[];
}

interface LocalJogadorMesa {
  id: number;
  username: string;
  time: 1 | 2;
}

interface Participante {
  id: number;
  nome: string;
}

const InformacaoTorneioLoja: React.FC = () => {
  const [tournament, setTournament] = useState<ITorneio | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [jogadoresInscritos, setJogadoresInscritos] = useState<Array<{
    id: number;
    username: string;
    id_usuario: number;
  }>>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [sobressalentes, setSobressalentes] = useState<Participante[]>([]);
  const [rodadas, setRodadas] = useState<IRodada[]>([]);
  const [rodadaSelecionada, setRodadaSelecionada] = useState<IRodada | null>(null);
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [carregandoMesas, setCarregandoMesas] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [iniciandoTorneio, setIniciandoTorneio] = useState(false);
  const [avancandoRodada, setAvancandoRodada] = useState(false);
  const [finalizandoTorneio, setFinalizandoTorneio] = useState(false);
  const [emparelhando, setEmparelhando] = useState(false);
  const [iniciandoRodada, setIniciandoRodada] = useState(false);
  const [resultadoFinalSelecionado, setResultadoFinalSelecionado] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [editandoTorneio, setEditandoTorneio] = useState(false);
  const [cancelandoTorneio, setCancelandoTorneio] = useState(false);
  const [mostrarModalInscricoes, setMostrarModalInscricoes] = useState(false);

  // Estados para campos do formulário de edição
  const [editNome, setEditNome] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [editDataHora, setEditDataHora] = useState("");
  const [editRegras, setEditRegras] = useState("");
  const [editModalidadeInscricao, setEditModalidadeInscricao] = useState("gratuito");
  const [editValorInscricao, setEditValorInscricao] = useState("R$ 0,00");
  const [editVagasLimitadas, setEditVagasLimitadas] = useState("limitadas");
  const [editCapacidadeMaxima, setEditCapacidadeMaxima] = useState("");
  const [editPontuacaoVitoria, setEditPontuacaoVitoria] = useState("3");
  const [editPontuacaoDerrota, setEditPontuacaoDerrota] = useState("0");
  const [editPontuacaoEmpate, setEditPontuacaoEmpate] = useState("1");
  const [editPontuacaoBye, setEditPontuacaoBye] = useState("3");
  const [editQuantidadeRodadas, setEditQuantidadeRodadas] = useState("");

  const { id } = useParams<{ id: string }>();
  const urlParams = new URLSearchParams(window.location.search);
  const preselectResult = urlParams.get('preselect') === 'result';

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
      } else if ((mesa.pontuacao_time_1 || 0) === 0 && (mesa.pontuacao_time_2 || 0) === 0) {
        // Não tem pontuações diferentes de 0
        status = "Em andamento";
      } else {
        // Tem pontuações diferentes de 0 (a serem revistas)
        status = "Revisar dados";
      }

      return {
        id: mesa.id,
        numero_mesa: mesa.numero_mesa,
        time1,
        time2,
        status,
        pontuacao_time_1: mesa.pontuacao_time_1 || 0,
        pontuacao_time_2: mesa.pontuacao_time_2 || 0,
        jogadores: mesa.jogadores || [] // Include jogadores array for the selects
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

      // Usar o set temporário se fornecido, caso contrário usar o estado
      const confirmadas = mesasConfirmadasTemp || mesasConfirmadas;

      if (!mesasDaRodada || mesasDaRodada.length === 0) {
        // Não há mesas, mas ainda devemos carregar sobressalentes
        setMesas([]);

        // Buscar jogadores sobressalentes sempre
        try {
          const sobressalentesRodada = await buscarSobressalentes(rodada.id);
          const jogadoresSobressalentes = sobressalentesRodada.map(s => ({
            id: s.id,
            nome: s.username
          }));

          setSobressalentes(jogadoresSobressalentes);
        } catch (error) {
          console.error('Erro ao buscar sobressalentes:', error);
          setSobressalentes([]);
        }

        return;
      }

      const mesasProcessadas = processarMesasDaAPI(mesasDaRodada, confirmadas, rodada.status);
      setMesas(mesasProcessadas);

      // Buscar jogadores sobressalentes
      try {
        const sobressalentesRodada = await buscarSobressalentes(rodada.id);
        const jogadoresSobressalentes = sobressalentesRodada.map(s => ({
          id: s.id,
          nome: s.username
        }));

        setSobressalentes(jogadoresSobressalentes);
      } catch (error) {
        console.error('Erro ao buscar sobressalentes:', error);
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

        const [dadosTorneio, jogadoresData, rodadasTorneio] = await Promise.all([
          buscarTorneioPorId(torneioId),
          buscarInscricoesAtivasCompletas(torneioId),
          buscarRodadasDoTorneio(torneioId)
        ]);

        // Converter para o formato expected pela interface
        const jogadores = jogadoresData.map(j => ({
          id: j.id,
          username: j.username,
          id_usuario: j.id_usuario
        }));

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

  // Definir regras do torneio como string
  const regrasPartida = tournament?.regras || [
      'Formato Commander padrão',
      'Time limit: 50 minutos por partida',
      'Decks devem ter exatamente 100 cartas',
      'Banlist oficial da Wizards',
      'Vida inicial: 40 pontos por jogador',
      'Comportamento respeitoso é obrigatório'
    ].join('\n');

  const getStatusLabel = () => {
    if (tournament?.status === "Cancelado") {
      return "Cancelado";
    } else if (tournament?.status === "em_andamento" || tournament?.status === "Em andamento") {
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

  // Compartilhar torneio
  const compartilharTorneio = async () => {
    if (!tournament) return;

    try {
      const baseUrl = window.location.origin;
      const urlInscricao = `${baseUrl}/inscricao-torneio/${tournament.id}`;

      if (navigator.share) {
        await navigator.share({
          title: tournament.nome,
          text: `Participe do torneio ${tournament.nome}!`,
          url: urlInscricao,
        });
      } else {
        await navigator.clipboard.writeText(urlInscricao);
        setMensagemSucesso("Link de inscrição copiado para a área de transferência!");
        setTimeout(() => setMensagemSucesso(null), 3000);
      }
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
      const baseUrl = window.location.origin;
      const urlInscricao = `${baseUrl}/inscricao-torneio/${tournament.id}`;
      await navigator.clipboard.writeText(urlInscricao);
      setMensagemSucesso("Link de inscrição copiado para a área de transferência!");
      setTimeout(() => setMensagemSucesso(null), 3000);
    }
  };

  // Abrir modal de edição com dados atuais
  const abrirModalEdicao = () => {
    if (!tournament) return;

    // Preencher estados com dados atuais
    setEditNome(tournament.nome || "");
    setEditDescricao(tournament.descricao || "");
    setEditDataHora(tournament.data_inicio ? new Date(tournament.data_inicio).toISOString().slice(0, 16) : "");
    setEditRegras(tournament.regras || "");
    setEditModalidadeInscricao(tournament.incricao_gratuita ? "gratuito" : "pago");
    setEditValorInscricao(
      tournament.valor_incricao && typeof tournament.valor_incricao === 'number'
        ? `R$ ${tournament.valor_incricao.toFixed(2).replace('.', ',')}`
        : "R$ 0,00"
    );
    setEditVagasLimitadas(tournament.vagas_limitadas ? "limitadas" : "ilimitadas");
    setEditCapacidadeMaxima(tournament.qnt_vagas ? tournament.qnt_vagas.toString() : "");
    setEditPontuacaoVitoria(tournament.pontuacao_vitoria?.toString() || "3");
    setEditPontuacaoDerrota(tournament.pontuacao_derrota?.toString() || "0");
    setEditPontuacaoEmpate(tournament.pontuacao_empate?.toString() || "1");
    setEditPontuacaoBye(tournament.pontuacao_bye?.toString() || "3");
    setEditQuantidadeRodadas(tournament.quantidade_rodadas ? tournament.quantidade_rodadas.toString() : "");

    setModalEditarAberto(true);
  };

  // Fechar modal de edição
  const fecharModalEdicao = () => {
    setModalEditarAberto(false);
  };

  // Função para formatar valor monetário
  const formatarValorEditar = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    const valorFormatado = (parseInt(numeros) / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
    return valorFormatado;
  };

  // Salvar edição do torneio
  const salvarEdicaoTorneio = async () => {
    if (!tournament?.id) return;

    // Validações
    if (!editNome.trim() || !editRegras.trim() || !editDataHora) {
      Swal.fire('Erro', 'Preencha os campos obrigatórios: Nome, Regras e Data/Hora.', 'error');
      return;
    }

    if (editVagasLimitadas === "limitadas" && !editCapacidadeMaxima) {
      Swal.fire('Erro', 'Informe a capacidade máxima de jogadores.', 'error');
      return;
    }

    // Confirmation
    const result = await Swal.fire({
      title: 'Salvar Alterações',
      text: 'Tem certeza que deseja salvar as alterações no torneio?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Salvar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    setEditandoTorneio(true);

    try {
      // Preparar dados para atualização (PUT requer todos os campos obrigatórios)
      const dadosAtualizacao: any = {
        // Campos obrigatórios do ITorneioAtualizacao
        nome: editNome.trim(),
        status: tournament.status, // Mantém o status atual
        pontuacao_vitoria: parseInt(editPontuacaoVitoria) || 3,
        pontuacao_empate: parseInt(editPontuacaoEmpate) || 1,
        pontuacao_derrota: parseInt(editPontuacaoDerrota) || 0,
        pontuacao_bye: parseInt(editPontuacaoBye) || 3,
        quantidade_rodadas: editQuantidadeRodadas ? parseInt(editQuantidadeRodadas) : tournament.quantidade_rodadas || 3,
        data_fim: tournament.data_fim || "", // Usar string vazia se não existir (PUT requer string)
        id_loja: tournament.id_loja,
      };

      // Campos opcionais adicionais - só adicionar se tiverem valor válido
      if (editDescricao.trim()) {
        dadosAtualizacao.descricao = editDescricao.trim();
      }
      dadosAtualizacao.regras = editRegras.trim();
      dadosAtualizacao.data_inicio = new Date(editDataHora).toISOString();
      dadosAtualizacao.incricao_gratuita = editModalidadeInscricao === "gratuito";
      if (editModalidadeInscricao === "pago") {
        dadosAtualizacao.valor_incricao = parseFloat(editValorInscricao.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      }
      dadosAtualizacao.vagas_limitadas = editVagasLimitadas === "limitadas";
      if (editVagasLimitadas === "limitadas" && editCapacidadeMaxima) {
        dadosAtualizacao.qnt_vagas = parseInt(editCapacidadeMaxima);
      }

      // Chamar API
      const torneioAtualizado = await atualizarTorneio(tournament.id, dadosAtualizacao);

      // Atualizar estado
      setTournament(torneioAtualizado);

      // Fechar modal
      setModalEditarAberto(false);

      // Mostrar sucesso
      setMensagemSucesso("Torneio atualizado com sucesso!");
      setTimeout(() => setMensagemSucesso(null), 3000);

      Swal.fire('Sucesso!', 'Torneio atualizado com sucesso!', 'success');

    } catch (error) {
      console.error('Erro ao salvar edição:', error);
      const mensagemErro = tratarErroTorneio(error);
      Swal.fire('Erro ao salvar', mensagemErro, 'error');
    } finally {
      setEditandoTorneio(false);
    }
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
    setResultadoFinalSelecionado(false);
    await carregarMesasDaRodada(rodada);
  };

  // Handler para selecionar resultado final
  const handleSelecionarResultadoFinal = async () => {
    if (!tournament?.id || rodadas.length === 0) return;

    try {
      setDropdownAberto(false);
      setResultadoFinalSelecionado(true);
      setMesas([]);
      setSobressalentes([]);
    } catch (e: any) {
      console.error('Erro ao selecionar resultado final:', e);
      setResultadoFinalSelecionado(false);
    }
  };

  // Handler para cancelar torneio
  const handleCancelarTorneio = async () => {
    if (!tournament?.id) return;

    const result = await Swal.fire({
      title: 'Cancelar Torneio',
      html: `
        <p>Deseja realmente cancelar o torneio <strong>"${tournament.nome}"</strong>?</p>
        <br>
        <p><strong>⚠️ ATENÇÃO: Esta ação é irreversível!</strong></p>
        <p>Todas as inscrições e dados serão mantidos para histórico, mas o torneio será marcado como cancelado e não poderá mais ser iniciado.</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, cancelar!',
      cancelButtonText: 'Não, voltar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
    });

    if (!result.isConfirmed) return;

    try {
      setCancelandoTorneio(true);
      setErro(null);

      const resultado = await cancelarTorneio(tournament.id);

      await Swal.fire({
        title: 'Torneio Cancelado!',
        html: `
          <p>${resultado.message}</p>
          <br>
          <p>Todos os dados foram mantidos para histórico.</p>
        `,
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545',
      });

      // Recarregar dados do torneio
      const torneioAtualizado = await buscarTorneioPorId(tournament.id);
      setTournament(torneioAtualizado);

      // Limpar rodadas pois torneio foi cancelado
      setRodadas([]);
      setRodadaSelecionada(null);
      setResultadoFinalSelecionado(false);

    } catch (e: any) {
      console.error('Erro ao cancelar torneio:', e);
      const mensagemErro = e.response?.data?.detail || tratarErroTorneio(e);

      await Swal.fire({
        title: 'Erro!',
        text: mensagemErro,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#DC2626',
      });
    } finally {
      setCancelandoTorneio(false);
    }
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

  // Handler para gerenciar jogadores inscritos em um torneio
  const handleGerenciarInscricoes = () => {
    setMostrarModalInscricoes(true);
  };

  // handler para hard delete de um jogador inscrito (LOJA)
  const handleRemoverInscricaoAberto = async (inscricaoId: number, username: string) => {
    if (!tournament?.id) return;

    const result = await Swal.fire({
      title: `Remover ${username}?`,
      text: "Essa ação vai remover este jogador do torneio. O jogador poderá se inscrever novamente se desejar.",
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

    try {
      await removerJogadorDoTorneioComoLoja(tournament.id, inscricaoId);

      // Atualiza o estado local removendo esse jogador da lista
      setJogadoresInscritos(prev =>
          prev.filter(j => j.id !== inscricaoId)
      );
    } catch (e: any) {
      Swal.fire({
        title: "Erro",
        text: "Não foi possível remover o jogador.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };



  // Handler para avançar para próxima rodada (MÉTODO NOVO)
  const handleAvancarRodadaNovo = async () => {
    if (!tournament?.id || !rodadaSelecionada?.id) return;

    const result = await Swal.fire({
      title: 'Avançar para Próxima Rodada',
      html: `
        <p>Deseja avançar para a próxima rodada?</p>
        <br>
        <p>Esta ação finalizará a rodada atual e criará uma nova ronda aguardando emparelhamento.</p>
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

      const resultado = await proximaRodadaNovo(tournament.id);

      await Swal.fire({
        title: 'Rodada Avançada!',
        html: `
          <p>${resultado.message}</p>
          <br>
          <p>A nova rodada está aguardando emparelhamento.</p>
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

  // Handler para emparelhar jogadores automaticamente
  const handleEmparelharAutomatico = async () => {
    if (!rodadaSelecionada?.id) return;

    const result = await Swal.fire({
      title: 'Emparelhar Jogadores',
      html: `
        <p>Deseja emparelhar os jogadores automaticamente?</p>
        <br>
        <p>Esta ação criará mesas usando o sistema Swiss.</p>
        <p><strong>Tipo:</strong> Swiss Pairing</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Emparelhar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#9b80b6',
      cancelButtonColor: '#6c757d',
    });

    if (!result.isConfirmed) return;

    try {
      setEmparelhando(true);
      setErro(null);

      const resultado = await emparelharAutomatico(rodadaSelecionada.id, 'swiss');

      await Swal.fire({
        title: 'Emparelhamento Concluído!',
        html: `
          <p>${resultado.message}</p>
          <br>
          <p><strong>Mesas criadas:</strong> ${resultado.mesas_criadas}</p>
          <p><strong>Total de jogadores:</strong> ${resultado.total_jogadores}</p>
          <br>
          <p>Agora você pode iniciar a rodada.</p>
        `,
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#46AF87',
      });

      // Recarregar rodada atual para atualizar status
      const rodadaAtualizada = await buscarRodadasDoTorneio(tournament!.id);
      if (rodadaAtualizada.length > 0) {
        const rodadaAtual = rodadaAtualizada.find(r => r.id === rodadaSelecionada?.id) || rodadaAtualizada[0];
        setRodadaSelecionada(rodadaAtual);
        await carregarMesasDaRodada(rodadaAtual);
      }

    } catch (e: any) {
      console.error('Erro ao emparelhar:', e);
      const mensagemErro = e.response?.data?.detail || tratarErroTorneio(e);

      await Swal.fire({
        title: 'Erro no Emparelhamento!',
        text: mensagemErro,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#DC2626',
      });
    } finally {
      setEmparelhando(false);
    }
  };

  // Handler para re-emparelhar uma rodada já emparelhada
  const handleReemparelharRodada = async () => {
    if (!rodadaSelecionada?.id) return;

    const result = await Swal.fire({
      title: 'Re-emparelhar Rodada',
      html: `
        <p>Deseja re-emparelhar esta rodada?</p>
        <br>
        <p>Isto removerá as mesas atuais e criará um novo emparelhamento automaticamente.</p>
        <p><strong>Útil quando:</strong> Novos jogadores são adicionados, ou outros saem do torneio.</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Re-emparelhar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f39c12',
      cancelButtonColor: '#6c757d',
    });

    if (!result.isConfirmed) return;

    try {
      setEmparelhando(true);
      setErro(null);

      // Primeiro, resetar o emparelhamento (volta para "Aguardando_Emparelhamento")
      await reemparelharRodada(rodadaSelecionada.id);

      // Em seguida, executar emparelhamento automático imediatamente
      const resultadoEmparelhamento = await emparelharAutomatico(rodadaSelecionada.id, 'swiss');

      // Mostrar sucesso com o novo emparelhamento
      await Swal.fire({
        title: 'Emparelhamento Refeito!',
        html: `
          <p>Emparelhamento Swiss criado automaticamente!</p>
          <br>
          <p><strong>Mesas criadas:</strong> ${resultadoEmparelhamento.mesas_criadas}</p>
          <p><strong>Total de jogadores:</strong> ${resultadoEmparelhamento.total_jogadores}</p>
          <br>
          <p>Agora você pode iniciar a rodada.</p>
        `,
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#46AF87',
      });

      // Recarregar rodada atual para atualizar status
      const rodadaAtualizada = await buscarRodadasDoTorneio(tournament!.id);
      if (rodadaAtualizada.length > 0) {
        const rodadaAtual = rodadaAtualizada.find(r => r.id === rodadaSelecionada?.id) || rodadaAtualizada[0];
        setRodadaSelecionada(rodadaAtual);
        await carregarMesasDaRodada(rodadaAtual);
      }

    } catch (e: any) {
      console.error('Erro ao re-emparelhar:', e);
      const mensagemErro = e.response?.data?.detail || tratarErroTorneio(e);

      await Swal.fire({
        title: 'Erro no Re-emparelhamento!',
        text: mensagemErro,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#DC2626',
      });
    } finally {
      setEmparelhando(false);
    }
  };

  // Handler para iniciar rodada emparelhada
  const handleIniciarRodada = async () => {
    if (!rodadaSelecionada?.id) return;

    const result = await Swal.fire({
      title: 'Iniciar Rodada',
      html: `
        <p>Deseja iniciar a rodada atual?</p>
        <br>
        <p>Isto permitirá que os jogadores reportarem resultados.</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Iniciar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#9b80b6',
      cancelButtonColor: '#6c757d',
    });

    if (!result.isConfirmed) return;

    try {
      setIniciandoRodada(true);
      setErro(null);

      const resultado = await iniciarRodada(rodadaSelecionada.id);

      await Swal.fire({
        title: 'Rodada Iniciada!',
        html: `
          <p>${resultado.message}</p>
          <br>
          <p>Agora os jogadores podem reportar resultados das mesas.</p>
        `,
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#46AF87',
      });

      // Recarregar rodada atual para atualizar status (seguindo padrão dos outros handlers)
      const rodadasAtualizadas = await buscarRodadasDoTorneio(tournament!.id);
      if (rodadasAtualizadas.length > 0) {
        setRodadas(rodadasAtualizadas);

        // Definir a rodada atualizada como selecionada
        const rodadaAtual = rodadasAtualizadas.find(r => r.id === rodadaSelecionada?.id) || rodadasAtualizadas[0];
        setRodadaSelecionada(rodadaAtual);
        await carregarMesasDaRodada(rodadaAtual);
      }

    } catch (e: any) {
      console.error('Erro ao iniciar rodada:', e);
      const mensagemErro = e.response?.data?.detail || tratarErroTorneio(e);

      await Swal.fire({
        title: 'Erro ao Iniciar!',
        text: mensagemErro,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#DC2626',
      });
    } finally {
      setIniciandoRodada(false);
    }
  };

  // Handler para avançar para próxima rodada (LEGADO - deixa por compatibilidade)
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

  // Handler para pré-selecionar resultado final quando vindo do histórico
  useEffect(() => {
    if (preselectResult && rodadas.length > 0 && tournament?.status === "Finalizado") {
      handleSelecionarResultadoFinal();
    }
  }, [preselectResult, rodadas, tournament]);

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

  // Handler para alterar jogador nelhe uma posição específica da mesa
  const handleAlterarJogadorMesa = async (timePosicao: 1 | 2 | 3 | 4, jogadorId: number | null) => {
    // Lógica para editar diretamente via dropdown
    // timePosicao 1 = Mesa atual, Time 1, Jogador 1
    // timePosicao 2 = Mesa atual, Time 1, Jogador 2
    // timePosicao 3 = Mesa atual, Time 2, Jogador 1
    // timePosicao 4 = Mesa atual, Time 2, Jogador 2

    // Aqui você pode implementar a lógica para alterar o jogador na posição específica
    console.log(`Alterando posição ${timePosicao} para jogador ${jogadorId}`);

    // Por enquanto, vamos apenas mostrar um alerta
    if (jogadorId) {
      await Swal.fire('Função em desenvolvimento', `Alterando posição ${timePosicao} para jogador ${jogadorId}`, 'info');
    } else {
      await Swal.fire('Função em desenvolvimento', `Removendo jogador da posição ${timePosicao}`, 'info');
    }

    // Recarregar mesas após mudança
    if (rodadaSelecionada) {
      await carregarMesasDaRodada(rodadaSelecionada);
    }
  };

  // Handler para editar emparelhamento de uma mesa específica
  const handleEditarEmparelhamentoMesa = async (
    mesaId: number,
    jogadorId?: number,
    novaMesaId?: number,
    novoTime?: 1 | 2
  ) => {
    // Se recebeu um novoTime diretamente, significa que foi clicado o botão do time
    if (novoTime && !jogadorId) {
      // Mostrar seleção de jogador para o time específico
      await handleSelecionarJogadorParaTime(mesaId, novoTime);
      return;
    }

    // Caso contrário, mostrar menu principal
    const result = await Swal.fire({
      title: 'Editar Emparelhamento',
      html: `<p>O que você deseja fazer?</p>`,
      showCancelButton: true,
      showConfirmButton: true,
      denyButtonText: 'Alterar Time',
      confirmButtonText: 'Mover Jogador',
      cancelButtonText: 'Cancelar',
      showDenyButton: true,
      confirmButtonColor: '#9b80b6',
      denyButtonColor: '#f39c12',
    });

    let acao = '';

    if (result.isConfirmed) {
      acao = 'mover';
    } else if (result.isDenied) {
      acao = 'alterar_time';
    } else {
      return; // Cancelado
    }

    if (acao === 'mover') {
      await handleMoverJogador(mesaId);
    } else if (acao === 'alterar_time') {
      await handleAlterarTime(mesaId);
    }
  };

  // Função para mover jogador
  const handleMoverJogador = async (mesaId: number) => {
    // Buscar dados da mesa
    const mesasAPI = await buscarMesasDaRodada(rodadaSelecionada?.id || 0);
    const mesaAtual = mesasAPI.find(m => m.id === mesaId);
    if (!mesaAtual) return;

    const jogadoresTime1 = mesaAtual.jogadores.filter(j => j.time === 1);
    const jogadoresTime2 = mesaAtual.jogadores.filter(j => j.time === 2);

    const jogadoresOptions = [
      ...jogadoresTime1.map((j, i) => ({ name: j.username, team: 1, id: j.id })),
      ...jogadoresTime2.map((j, i) => ({ name: j.username, team: 2, id: j.id }))
    ];

    const jogadorSelecionado = await Swal.fire({
      title: 'Selecionar Jogador',
      input: 'select',
      inputOptions: Object.fromEntries(
        jogadoresOptions.map(j => [j.id, `${j.name} (Time ${j.team})`])
      ),
      inputPlaceholder: 'Selecione um jogador',
      showCancelButton: true,
      confirmButtonText: 'Próximo',
      inputValidator: (value) => {
        if (!value) return 'Selecione um jogador!';
      }
    });

    if (!jogadorSelecionado.isConfirmed) return;

    const mesaDestino = await Swal.fire({
      title: 'Selecionar Mesa de Destino',
      input: 'number',
      inputPlaceholder: 'Digite o número da mesa',
      inputValue: '',
      inputValidator: (value) => {
        if (!value) return 'Digite o número da mesa!';
        const num = parseInt(value);
        if (num === mesaAtual.numero_mesa) return 'Selecione uma mesa diferente!';
        return null;
      },
      showCancelButton: true,
      confirmButtonText: 'Mover',
    });

    if (!mesaDestino.isConfirmed) return;

    try {
      const jogadorId = parseInt(jogadorSelecionado.value);
      const novaMesaId = parseInt(mesaDestino.value);

      await editarEmparelhamentoManual(rodadaSelecionada!.id, jogadorId, novaMesaId);
      await Swal.fire('Sucesso!', 'Jogador movido com sucesso!', 'success');

      // Recarregar mesas
      if (rodadaSelecionada) {
        await carregarMesasDaRodada(rodadaSelecionada);
      }
    } catch (error) {
      console.error('Erro ao mover jogador:', error);
      await Swal.fire('Erro', 'Não foi possível mover o jogador.', 'error');
    }
  };

  // Função para alterar time
  const handleAlterarTime = async (mesaId: number) => {
    // Buscar dados da mesa
    const mesasAPI = await buscarMesasDaRodada(rodadaSelecionada?.id || 0);
    const mesaAtual = mesasAPI.find(m => m.id === mesaId);
    if (!mesaAtual) return;

    const jogadoresTime1 = mesaAtual.jogadores.filter(j => j.time === 1);
    const jogadoresTime2 = mesaAtual.jogadores.filter(j => j.time === 2);

    const jogadoresOptions = [
      ...jogadoresTime1.map(j => ({ name: j.username, team: 1, newTeam: 2, id: j.id })),
      ...jogadoresTime2.map(j => ({ name: j.username, team: 2, newTeam: 1, id: j.id }))
    ];

    const jogadorSelecionado = await Swal.fire({
      title: 'Selecionar Jogador',
      input: 'select',
      inputOptions: Object.fromEntries(
        jogadoresOptions.map(j => [j.id, `${j.name} (Time ${j.team} → Time ${j.newTeam})`])
      ),
      inputPlaceholder: 'Selecione um jogador para alterar o time',
      showCancelButton: true,
      confirmButtonText: 'Alterar',
      inputValidator: (value) => {
        if (!value) return 'Selecione um jogador!';
      }
    });

    if (!jogadorSelecionado.isConfirmed) return;

    try {
      const jogadorId = parseInt(jogadorSelecionado.value);
      const novoTime = jogadoresOptions.find(j => j.id === jogadorId)?.newTeam as 1 | 2;

      await editarEmparelhamentoManual(rodadaSelecionada!.id, jogadorId, undefined, novoTime);
      await Swal.fire('Sucesso!', 'Time do jogador alterado!', 'success');

      // Recarregar mesas
      if (rodadaSelecionada) {
        await carregarMesasDaRodada(rodadaSelecionada);
      }
    } catch (error) {
      console.error('Erro ao alterar time:', error);
      await Swal.fire('Erro', 'Não foi possível alterar o time do jogador.', 'error');
    }
  };

  // Função para selecionar jogador para um time específico (quando clicado no botão do time)
  const handleSelecionarJogadorParaTime = async (mesaId: number, timeDesejado: 1 | 2) => {
    if (!jogadoresInscritos || jogadoresInscritos.length === 0) {
      await Swal.fire('Atenção', 'Não há jogadores suficientes para alteração.', 'warning');
      return;
    }

    const jogadorSelecionado = await Swal.fire({
      title: `Selecionar Jogador para Time ${timeDesejado}`,
      input: 'select',
      inputOptions: Object.fromEntries(
        jogadoresInscritos.map(j => [j.id_usuario, j.username])
      ),
      inputPlaceholder: 'Selecione um jogador',
      showCancelButton: true,
      confirmButtonText: 'Definir no Time',
      inputValidator: (value) => {
        if (!value) return 'Selecione um jogador!';
      }
    });

    if (!jogadorSelecionado.isConfirmed) return;

    try {
      const jogadorId = parseInt(jogadorSelecionado.value);
      const jogadorNome = jogadoresInscritos.find(j => j.id_usuario === jogadorId)?.username;

      await editarEmparelhamentoManual(rodadaSelecionada!.id, jogadorId, undefined, timeDesejado);

      await Swal.fire(
        'Sucesso!',
        `${jogadorNome} foi definido para o Time ${timeDesejado}!`,
        'success'
      );

      // Recarregar mesas
      if (rodadaSelecionada) {
        await carregarMesasDaRodada(rodadaSelecionada);
      }
    } catch (error) {
      console.error('Erro ao definir jogador no time:', error);
      await Swal.fire('Erro', 'Não foi possível definir o jogador no time.', 'error');
    }
  };

  if (loading) return <div className={styles.loading}>Carregando...</div>;
  if (erro) return <div className={styles.error}>{erro}</div>;
  if (!tournament) return <div className={styles.error}>Nenhum torneio encontrado.</div>;

  return (
    <div className={styles.container}>
      {/* Mensagens de feedback */}
      {mensagemSucesso && (
        <div className={styles.mensagemSucesso}>
          {mensagemSucesso}
        </div>
      )}

      {erro && (
        <div className={styles.mensagemErro}>
          {erro}
        </div>
      )}

      {/* Cabeçalho */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>Torneio {getStatusLabel().toLowerCase()}</h1>
          <p className={styles.subtitulo}>{tournament.nome}</p>
        </div>

        <div className={styles.headerActions}>
          {/* Botão Iniciar Torneio e Compartilhar - Aparece apenas quando status é "Aberto" */}
          {tournament.status === "Aberto" && (
            <>
              <Button
                label="Editar"
                onClick={abrirModalEdicao}
                width="auto"
                height="44px"
                paddingHorizontal="20px"
                fontSize="14px"
                backgroundColor="#6c757d"
              />
              <Button
                label="Compartilhar"
                onClick={compartilharTorneio}
                width="auto"
                height="44px"
                paddingHorizontal="20px"
                fontSize="14px"
                backgroundColor="#9b80b6"
              />
              <Button
                label={cancelandoTorneio ? "Cancelando..." : "Cancelar Torneio"}
                onClick={handleCancelarTorneio}
                disabled={cancelandoTorneio}
                width="auto"
                height="44px"
                paddingHorizontal="20px"
                fontSize="14px"
                backgroundColor="#dc3545"
              />
              <Button
                label="Iniciar Torneio"
                onClick={handleIniciarTorneio}
                disabled={iniciandoTorneio}
                width="auto"
                height="44px"
                paddingHorizontal="24px"
                fontSize="14px"
              />
            </>
          )}

          {/* Botões para torneio "Em Andamento" */}
          {tournament.status === "Em Andamento" && (
            <>
              {/* Se há rodada atual "Em Andamento" */}
              {rodadaSelecionada?.status === "Em Andamento" && (
                <Button
                  label="Avançar Rodada"
                  onClick={handleAvancarRodadaNovo}
                  disabled={avancandoRodada}
                  width="auto"
                  height="44px"
                  paddingHorizontal="24px"
                  fontSize="14px"
                  backgroundColor="#46AF87"
                />
              )}

              {/* Se há rodada atual "Aguardando_Emparelhamento" */}
              {rodadaSelecionada?.status === "Aguardando_Emparelhamento" && (
                <Button
                  label="Emparelhar Auto"
                  onClick={handleEmparelharAutomatico}
                  disabled={emparelhando}
                  width="auto"
                  height="44px"
                  paddingHorizontal="24px"
                  fontSize="14px"
                  backgroundColor="#9b80b6"
                />
              )}

              {/* Se há rodada atual "Emparelhamento" */}
              {(rodadaSelecionada?.status === "Emparelhamento") && (
                <>
                  {/* Botão Re-emparelhar - para ambos os status de emparelhamento */}
                  <Button
                    label="Re-emparelhar"
                    onClick={handleReemparelharRodada}
                    disabled={emparelhando}
                    width="auto"
                    height="44px"
                    paddingHorizontal="10px"
                    fontSize="14px"
                    backgroundColor="#f39c12"
                  />

                  <Button
                    label="Iniciar Rodada"
                    onClick={handleIniciarRodada}
                    disabled={iniciandoRodada}
                    width="auto"
                    height="44px"
                    paddingHorizontal="10px"
                    fontSize="14px"
                    backgroundColor="#46AF87"
                  />
                </>
              )}

              <Button
                label="Finalizar Torneio"
                onClick={handleFinalizarTorneio}
                disabled={finalizandoTorneio}
                width="auto"
                height="44px"
                paddingHorizontal="10px"
                fontSize="14px"
                backgroundColor="#DC2626"
              />
              <Button
                label="Gerenciar Inscrições"
                onClick={handleGerenciarInscricoes}
                width="auto"
                height="44px"
                paddingHorizontal="20px"
                fontSize="14px"
                backgroundColor="#17a2b8"
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
                {resultadoFinalSelecionado
                  ? 'Resultado final'
                  : rodadaSelecionada
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
                      rodadaSelecionada?.id === rodada.id && !resultadoFinalSelecionado ? styles.rodadaAtiva : ''
                    }`}
                    onClick={() => handleSelecionarRodada(rodada)}
                  >
                    <span>Rodada {rodada.numero_rodada}</span>
                    <span className={styles.rodadaStatus}>{rodada.status}</span>
                  </div>
                ))}
                {tournament.status === "Finalizado" && (
                  <div
                    className={`${styles.rodadaDropdownItem} ${
                      resultadoFinalSelecionado ? styles.rodadaAtiva : ''
                    }`}
                    onClick={() => handleSelecionarResultadoFinal()}
                  >
                    <span>🏆 Resultado final</span>
                    <span className={styles.rodadaStatus}>Final</span>
                  </div>
                )}
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
                        <li key={player.id} className={styles.playerItem}>
                          <div className={styles.playerInfoLeft}>
                            <span className={styles.numeroJogador}>{index + 1}.</span>
                            <span className={styles.nomeJogador}>{player.username}</span>
                          </div>

                          <button
                              className={styles.removePlayerBtn}
                              onClick={() => handleRemoverInscricaoAberto(player.id, player.username)}
                              title="Remover jogador"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </li>
                    ))}
                  </ul>

              ) : (
                <div className={styles.mensagemVazia}>Nenhum jogador inscrito ainda.</div>
              )}
            </div>
          ) : resultadoFinalSelecionado ? (
            /* Ranking Final - Quando resultado final é selecionado */
            <CardRanking
              tournamentId={tournament.id}
              isRankingFinal={true}
              titulo="🏆 Ranking Final do Torneio"
              subtitulo="Classificação final com todas as métricas"
              mostrarMetricasAvancadas={true}
            />
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
                            onEditarEmparelhamento={handleEditarEmparelhamentoMesa}
                            showSelectsAlways={true}
                            jogadoresDaMesa={mesa.jogadores || []}
                            jogadoresDisponiveis={
                              [{ id: 0, username: "--- Vazio ---"}].concat(
                                jogadoresInscritos.map((jogador) => ({
                                  id: jogador.id_usuario,
                                  username: jogador.username
                                }))
                              )
                            }
                            onAlterarJogador={handleAlterarJogadorMesa}
                            onRecarregarMesas={() => rodadaSelecionada && carregarMesasDaRodada(rodadaSelecionada)}
                            rodadaSelecionada={rodadaSelecionada}
                            isLoja={true}
                          />
                        ))
                    ) : rodadaSelecionada?.status !== "Aguardando_Emparelhamento" ? (
                      <p className={styles.mensagemVazia}>Nenhuma mesa criada ainda.</p>
                    ) : (
                      <div className={styles.mensagemVazia}>
                        <p><strong>📝 Fase de Emparelhamento</strong></p>
                        <p>Use o botão "Emparelhar Auto" acima para criar as mesas automaticamente.</p>
                      </div>
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

          {/* Ranking - Usando componente CardRanking com métricas avançadas */}
          {tournament.status !== "Aberto" && rodadaSelecionada && !resultadoFinalSelecionado && (
            <CardRanking
              tournamentId={tournament.id}
              rodadaId={rodadaSelecionada.id}
              titulo={`🏆 Ranking - Rodada ${rodadaSelecionada.numero_rodada}`}
              subtitulo="Pontuação acumulada com métricas avançadas"
              limite={10}
              mostrarMetricasAvancadas={true}
            />
          )}
        </div>
      </div>

      {/* Modal Gerenciar Inscrições (LOJA) */}
      {mostrarModalInscricoes && tournament?.id && (
          <ModalGerenciarInscricoes
              torneioId={tournament.id}
              onClose={() => setMostrarModalInscricoes(false)}
          />
      )}

      {/* Modal de Edição */}
      {modalEditarAberto && (
        <div className={modalStyles.overlayModal} onClick={fecharModalEdicao}>
          <div className={modalStyles.modalConteudo} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={modalStyles.modalHeader}>
              <h2 className={modalStyles.modalTitulo}>Editar Torneio</h2>
              <button
                onClick={fecharModalEdicao}
                className={modalStyles.modalCloseButton}
              >
                ×
              </button>
            </div>

            {/* Content */}
            {editandoTorneio ? (
              <div className={modalStyles.loadingContainer}>
                <div>Salvando alterações...</div>
              </div>
            ) : (
              <div className={modalStyles.modalBody}>
                {/* Informações Básicas */}
                <div className={modalStyles.secao}>
                  <h3 className={modalStyles.tituloSessao}>
                    ℹ️ Informações Básicas
                  </h3>

                  <div className={modalStyles.grupoInputs}>
                    <div className={modalStyles.inputGroup}>
                      <label className={modalStyles.inputLabel}>
                        Nome do Torneio *
                      </label>
                      <input
                        type="text"
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        className={modalStyles.input}
                        placeholder="Ex: Championship Commander - Janeiro 2025"
                      />
                    </div>

                    <div className={modalStyles.inputComIcone}>
                      <label className={modalStyles.inputLabel}>
                        Data e Hora *
                      </label>
                      <input
                        type="datetime-local"
                        value={editDataHora}
                        onChange={(e) => setEditDataHora(e.target.value)}
                        className={modalStyles.inputDatetime}
                      />
                    </div>
                  </div>

                  <div className={modalStyles.textareaContainer}>
                    <label className={modalStyles.inputLabel}>
                      Descrição (opcional)
                    </label>
                    <textarea
                      value={editDescricao}
                      onChange={(e) => setEditDescricao(e.target.value)}
                      className={modalStyles.textarea}
                      placeholder="Breve descrição do torneio..."
                      rows={4}
                    />
                  </div>
                </div>

                {/* Regras */}
                <div className={modalStyles.secao}>
                  <h3 className={modalStyles.tituloSessao}>
                    📋 Regras da Partida *
                  </h3>
                  <textarea
                    value={editRegras}
                    onChange={(e) => setEditRegras(e.target.value)}
                    className={modalStyles.textarea}
                    placeholder="Descreva as regras do torneio..."
                    rows={6}
                  />
                </div>

                {/* Configuração de Inscrição */}
                <div className={modalStyles.secao}>
                  <h3 className={modalStyles.tituloSessao}>
                    💰 Inscrição
                  </h3>

                  <div className={modalStyles.grupoRadio}>
                    <label className={modalStyles.inputLabel}>
                      Modalidade de Inscrição *
                    </label>
                    <div className={modalStyles.radioGroup}>
                      <input
                        type="radio"
                        id="gratuito-edit"
                        value="gratuito"
                        checked={editModalidadeInscricao === "gratuito"}
                        onChange={(e) => {
                          setEditModalidadeInscricao(e.target.value)
                          if (e.target.value === "gratuito") {
                            setEditValorInscricao("R$ 0,00")
                          }
                        }}
                        className={modalStyles.radioInput}
                      />
                      <label htmlFor="gratuito-edit" className={modalStyles.radioLabel}>
                        Gratuito
                      </label>

                      <input
                        type="radio"
                        id="pago-edit"
                        value="pago"
                        checked={editModalidadeInscricao === "pago"}
                        onChange={(e) => setEditModalidadeInscricao(e.target.value)}
                        className={modalStyles.radioInput}
                      />
                      <label htmlFor="pago-edit" className={modalStyles.radioLabel}>
                        Pago
                      </label>
                    </div>
                  </div>

                  {editModalidadeInscricao === "pago" && (
                    <div className={modalStyles.inputLimitado}>
                      <label className={modalStyles.inputLabel}>
                        Valor da Inscrição
                      </label>
                      <input
                        type="text"
                        value={editValorInscricao}
                        onChange={(e) => {
                          const formatted = formatarValorEditar(e.target.value);
                          setEditValorInscricao(formatted);
                        }}
                        className={modalStyles.input}
                        placeholder="R$ 0,00"
                      />
                    </div>
                  )}
                </div>

                {/* Limite de Vagas */}
                <div className={modalStyles.secao}>
                  <h3 className={modalStyles.tituloSessao}>
                    👥 Limite de Vagas
                  </h3>

                  <div className={modalStyles.grupoRadio}>
                    <label className={modalStyles.inputLabel}>
                      Tipo de Vagas *
                    </label>
                    <div className={modalStyles.radioGroup}>
                      <input
                        type="radio"
                        id="ilimitadas-edit"
                        value="ilimitadas"
                        checked={editVagasLimitadas === "ilimitadas"}
                        onChange={(e) => {
                          setEditVagasLimitadas(e.target.value)
                          setEditCapacidadeMaxima("")
                        }}
                        className={modalStyles.radioInput}
                      />
                      <label htmlFor="ilimitadas-edit" className={modalStyles.radioLabel}>
                        Vagas ilimitadas
                      </label>

                      <input
                        type="radio"
                        id="limitadas-edit"
                        value="limitadas"
                        checked={editVagasLimitadas === "limitadas"}
                        onChange={(e) => setEditVagasLimitadas(e.target.value)}
                        className={modalStyles.radioInput}
                      />
                      <label htmlFor="limitadas-edit" className={modalStyles.radioLabel}>
                        Vagas limitadas
                      </label>
                    </div>
                  </div>

                  {editVagasLimitadas === "limitadas" && (
                    <div className={modalStyles.inputLimitado}>
                      <label className={modalStyles.inputLabel}>
                        Capacidade Máxima *
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                          type="number"
                          value={editCapacidadeMaxima}
                          onChange={(e) => setEditCapacidadeMaxima(e.target.value)}
                          className={modalStyles.input}
                          placeholder="32"
                          min="1"
                          style={{ width: '120px', marginRight: '0.5rem' }}
                        />
                        <span style={{ color: 'var(--var-cor-cinza-placeholder)', fontSize: '14px' }}>jogadores</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sistema de Pontuação */}
                <div className={modalStyles.secao}>
                  <h3 className={modalStyles.tituloSessao}>
                    🎯 Sistema de Pontuação
                  </h3>

                  <div className={modalStyles.grupoInputs}>
                    <div className={modalStyles.inputGroup}>
                      <label className={modalStyles.inputLabel}>
                        Vitória
                      </label>
                      <input
                        type="number"
                        value={editPontuacaoVitoria}
                        onChange={(e) => setEditPontuacaoVitoria(e.target.value)}
                        className={modalStyles.input}
                        min="0"
                      />
                    </div>

                    <div className={modalStyles.inputGroup}>
                      <label className={modalStyles.inputLabel}>
                        Derrota
                      </label>
                      <input
                        type="number"
                        value={editPontuacaoDerrota}
                        onChange={(e) => setEditPontuacaoDerrota(e.target.value)}
                        className={modalStyles.input}
                        min="0"
                      />
                    </div>

                    <div className={modalStyles.inputGroup}>
                      <label className={modalStyles.inputLabel}>
                        Empate
                      </label>
                      <input
                        type="number"
                        value={editPontuacaoEmpate}
                        onChange={(e) => setEditPontuacaoEmpate(e.target.value)}
                        className={modalStyles.input}
                        min="0"
                      />
                    </div>

                    <div className={modalStyles.inputGroup}>
                      <label className={modalStyles.inputLabel}>
                        Bye
                      </label>
                      <input
                        type="number"
                        value={editPontuacaoBye}
                        onChange={(e) => setEditPontuacaoBye(e.target.value)}
                        className={modalStyles.input}
                        min="0"
                      />
                    </div>
                  </div>
                </div>
                
              </div>
            )}

            {/* Footer */}
            <div className={modalStyles.modalFooter}>
              <Button
                label="Cancelar"
                onClick={fecharModalEdicao}
                backgroundColor="#6c757d"
                width="auto"
              />
              <Button
                label={editandoTorneio ? "Salvando..." : "Salvar Alterações"}
                onClick={salvarEdicaoTorneio}
                width="auto"
                disabled={editandoTorneio}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InformacaoTorneioLoja;
