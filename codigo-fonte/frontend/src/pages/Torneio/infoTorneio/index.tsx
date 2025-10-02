import { useEffect, useState } from "react";
import type { ITorneio } from "../../../tipos/tipos";
import { buscarTorneioPorId, tratarErroTorneio } from "../../../services/torneioServico";
import styles from "./styles.module.css";
import Button from "../../../components/Button";
import { CardSuperior } from "../../../components/CardSuperior";
import { FiEdit, FiGift, FiCheck, FiX} from "react-icons/fi";
import CardInfoTorneio from "../../../components/CardInfoTorneio";
import { useNavigate, useParams } from "react-router-dom";

type Status = "em_andamento" | "em_breve" | "encerrado";

const InformacaoTorneio: React.FC = () => {
  const [tournament, setTournament] = useState<ITorneio | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("em_breve");
  const [editando, setEditando] = useState(false);
  const [regrasEditadas, setRegrasEditadas] = useState<string>("");
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [jogadoresInscritos, setJogadoresInscritos] = useState<string[]>([]);
  
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Buscar dados do torneio
  useEffect(() => {
    const carregarTorneio = async () => {
      try {
        setLoading(true);
        const torneioId = id ? parseInt(id) : 1; // Usa ID da URL ou 1 como fallback
        const dados = await buscarTorneioPorId(torneioId);
        setTournament(dados);
        setRegrasEditadas(dados.regras || "");
        setStatus(dados.status as Status);
        
        // Mock temporário de jogadores sera substituido por dados reais da API
        // quando a funcionalidade estiver implementada
        setJogadoresInscritos([
          "Alexandre Shadows",
          "Julia Frostmage", 
          "Marina Stormcaller",
          "Pedro Flamecaster"
        ]);
        
      } catch (e) {
        setErro(tratarErroTorneio(e));
      } finally {
        setLoading(false);
      }
    };
    
    carregarTorneio();
  }, [id]);

  // Salvar regras editadas
const salvarRegras = async () => {
  if (!tournament || !regrasEditadas.trim()) return;
  
  try {
    setSalvando(true);
    setErro(null);

    const { atualizarTorneio } = await import("../../../services/torneioServico");
    
    // Preparar dados para PUT 
    const dadosAtualizacao = {
      nome: tournament.nome,
      status: tournament.status,
      pontuacao_vitoria: tournament.pontuacao_vitoria,
      pontuacao_empate: tournament.pontuacao_empate,
      pontuacao_derrota: tournament.pontuacao_derrota,
      pontuacao_bye: tournament.pontuacao_bye,
      quantidade_rodadas: tournament.quantidade_rodadas || 0,
      data_fim: tournament.data_fim || new Date().toISOString(),
      id_loja: tournament.id_loja,
      regras: regrasEditadas
    };

    console.log('Enviando dados para PUT:', dadosAtualizacao);

    const resposta = await atualizarTorneio(tournament.id, dadosAtualizacao);
    console.log('Resposta da API:', resposta);

    // Atualizar torneio localmente
    setTournament({
      ...tournament,
      regras: regrasEditadas
    });
    
    setEditando(false);
    setMensagemSucesso("Regras atualizadas com sucesso!");
    
    setTimeout(() => setMensagemSucesso(null), 3000);
    
  } catch (e) {
    console.error('Erro ao salvar regras:', e);
    const mensagemErro = tratarErroTorneio(e);
    setErro(`Erro ao salvar regras: ${mensagemErro}`);
  } finally {
    setSalvando(false);
  }
};

  const cancelarEdicao = () => {
    setRegrasEditadas(tournament?.regras || "");
    setEditando(false);
  };

  // Compartilhar torneio
  const compartilharTorneio = async () => {
    if (!tournament) return;
    
    try {
      const url = window.location.href;
      
      if (navigator.share) {
        await navigator.share({
          title: tournament.nome,
          text: `Confira o torneio ${tournament.nome}`,
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setMensagemSucesso("Link copiado para a área de transferência!");
        setTimeout(() => setMensagemSucesso(null), 3000);
      }
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
      await navigator.clipboard.writeText(window.location.href);
      setMensagemSucesso("Link copiado para a área de transferência!");
      setTimeout(() => setMensagemSucesso(null), 3000);
    }
  };
  
  const formatarRegrasParaLista = (regras: string): string[] => {
    if (!regras) return [];
    return regras.split('\n')
      .filter(regra => regra.trim() !== '')
      .map(regra => regra.replace(/^[•\-\*]\s*/, '').trim());
  };

  const getStatusLabel = () => {
    if (tournament?.status === "em_andamento") {
      return "Em andamento";
    } else if (tournament?.status === "em_breve") {
      return "Em breve";
    } else if (tournament?.status === "encerrado") {
      return "Encerrado";
    } else {
      return "Em breve";
    }
  };

  if (loading) return <p>Carregando...</p>;
  if (erro) return <p>{erro}</p>;
  if (!tournament) return <p>Nenhum torneio encontrado.</p>;

  const regrasFormatadas = formatarRegrasParaLista(tournament.regras || "");
  const regrasEditadasFormatadas = formatarRegrasParaLista(regrasEditadas);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Informações do torneio</h1>
        <span className={`${styles.statusTag} ${styles[tournament?.status || status]}`}>
          {getStatusLabel()}
        </span>
      </div>
      
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

      <p className={styles.subtitle}>{tournament.nome}</p>

      <div className={styles.grid}>
        {/* Esquerda: lista de jogadores */}
        <div className={styles.left}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Usuários inscritos</h3>
            <ul className={styles.playerList}>
              {jogadoresInscritos.length > 0 ? (
                jogadoresInscritos.map((player, index) => (
                  <li key={index} className={styles.playerItem}>
                    {index + 1}. {player}
                  </li>
                ))
              ) : (
                <p>Nenhum jogador inscrito.</p>
              )}
            </ul>

            <div className={styles.buttons}>
              <Button 
                label="Voltar" 
                backgroundColor="var(--var-cor-secundaria)" 
                onClick={() => navigate("/")}
              />
              <Button 
                label="Compartilhar Torneio" 
                backgroundColor="var(--var-cor-primaria)" 
                onClick={compartilharTorneio}
              />
            </div>
          </div>
        </div>

        {/* Direita: premiação, infos e regras */}
        <div className={styles.right}>
          <CardSuperior 
            className={styles.cardSuperior} 
            count={tournament.incricao_gratuita ? "Gratuito" : 
              tournament.valor_incricao ? 
                new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(tournament.valor_incricao) : "Não informado"} 
            label="Valor da Inscrição" 
            icon={FiGift} 
          />

          <CardInfoTorneio
            className={styles.cardInfoTorneio}
            title="Informações do Torneio"
            name={tournament.nome}
            date={new Date(tournament.data_inicio).toLocaleDateString("pt-BR")}
            time={new Date(tournament.data_inicio).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            location={`Loja ${tournament.id_loja}`}
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
            players={tournament.qnt_vagas || 0}
          />

          {/* Card de Regras com Edição */}
          <div className={styles.cardPartidas}>
            <div className={styles.headerPartidas}>
              <h3 className={styles.cardPartidasTitle}>Regras da Partida</h3>
              {!editando ? (
                <button className={styles.editButton} onClick={() => setEditando(true)}>
                  <FiEdit />
                </button>
              ) : (
                <div className={styles.botoesEdicao}>
                  <button 
                    className={styles.botaoConfirmar} 
                    onClick={salvarRegras}
                    disabled={salvando}
                  >
                    <FiCheck />
                  </button>
                  <button 
                    className={styles.botaoCancelar} 
                    onClick={cancelarEdicao}
                    disabled={salvando}
                  >
                    <FiX />
                  </button>
                </div>
              )}
            </div>

            {editando ? (
              <textarea
                className={styles.textareaRegras}
                value={regrasEditadas}
                onChange={(e) => setRegrasEditadas(e.target.value)}
                rows={8}
                placeholder="Digite as regras do torneio..."
                disabled={salvando}
              />
            ) : (
              <ul className={styles.regras}>
                {regrasFormatadas.length > 0 ? (
                  regrasFormatadas.map((regra, index) => (
                    <li key={index}>{regra}</li>
                  ))
                ) : (
                  <p>Nenhuma regra definida.</p>
                )}
              </ul>
            )}
            
            {salvando && <p className={styles.salvando}>Salvando...</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InformacaoTorneio;