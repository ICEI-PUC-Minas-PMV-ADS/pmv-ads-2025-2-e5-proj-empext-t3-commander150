import { useEffect, useState } from "react";
import type { ITorneio } from "../../../tipos/tipos";
import { buscarTorneioPorId, tratarErroTorneio } from "../../../services/torneioServico";
import styles from "./styles.module.css";
import CardInfoTorneio from "../../../components/CardInfoTorneio";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import RegrasPartida from "../../../components/CardRegrasPartida";
import Button from "../../../components/Button";

type Aba = "inscritos" | "andamento" | "historico";

const InformacaoTorneio: React.FC = () => {
  const [torneio, setTorneio] = useState<ITorneio | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [regras, setRegras] = useState<string>("");
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as { aba?: Aba } | null;
  const abaOrigem: Aba = state?.aba ?? "inscritos";

  const handleVoltarHistorico = () => {
      navigate("/historico", { state: { aba: abaOrigem } });
  };

  // Buscar dados do torneio
  useEffect(() => {
    const carregarTorneio = async () => {
      try {
        setLoading(true);
        const torneioId = id ? parseInt(id) : 1;
        console.log('InformacaoTorneio - Buscando torneio ID:', torneioId);
        const [dadosTorneio] = await Promise.all([
          buscarTorneioPorId(torneioId)
        ]);
        console.log('InformacaoTorneio - Torneio encontrado:', dadosTorneio);
        setTorneio(dadosTorneio);
        setRegras(dadosTorneio.regras || "");

      } catch (e) {
        console.error('InformacaoTorneio - Erro ao carregar torneio:', e);
        setErro(tratarErroTorneio(e));
      } finally {
        setLoading(false);
      }
    };

    carregarTorneio();
  }, [id]);
  

  if (loading) return <p>Carregando...</p>;
  if (erro) return <p>{erro}</p>;
  if (!torneio) return <p>Nenhum torneio encontrado.</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Informações do torneio</h1>
          <div className={styles.buttonVoltarWrapper}>
              <Button
                  label="Voltar"
                  onClick={handleVoltarHistorico}
                  width="auto"
                  height="44px"
                  paddingHorizontal="24px"
                  fontSize="14px"
              />
          </div>
      </div>
      
      {erro && (
        <div className={styles.mensagemErro}>
          {erro}
        </div>
      )}

      <p className={styles.subtitle}>{torneio.nome}</p>

      <div className={styles.grid}>
        <div className={styles.up}>
            <CardInfoTorneio
            className={styles.cardInfoTorneio}
            title="Informações do Torneio"
            name={torneio.nome}
            date={new Date(torneio.data_inicio).toLocaleDateString("pt-BR")}
            time={new Date(torneio.data_inicio).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            location={`Loja ${torneio.loja_nome}`}
            price={
              torneio.incricao_gratuita
                ? "Gratuito"
                : torneio.valor_incricao
                  ? new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(torneio.valor_incricao)
                  : "Não informado"
            }
            hidePlayers
            //players={torneio.qnt_vagas || 0}
          />
          </div>
          <div className={styles.CardDescricao}>
            <h3 className={styles.titleDescricao}>Descrição do Torneio</h3>
            <p className={styles.descricao}>{torneio.descricao || "Um torneio de Magic é uma batalha de estratégia e sorte onde duelistas com decks personalizados competem em rodadas eliminatórias para receber a coroa de campeão."}</p>
          </div>          
        </div>
        <div className={styles.down}>
            <RegrasPartida regras={regras}></RegrasPartida> 
        </div>
      </div>
  );
};

export default InformacaoTorneio;