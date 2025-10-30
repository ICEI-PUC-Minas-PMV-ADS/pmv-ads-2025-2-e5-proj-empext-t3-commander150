import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./styles.module.css";
import MesaCard from "../../../components/CardMesaParticipante";
import Button from "../../../components/Button";
import CardRanking from "../../../components/CardRanking";
import { 
  buscarTorneioPorId, 
  tratarErroTorneio,
  buscarJogadoresInscritos 
} from "../../../services/torneioServico";
import type { ITorneio } from "../../../tipos/tipos";


interface Player {
  id: string;
  nome: string;
  position: number;
  points: number;
  avatar?: string;
}

interface Participante {
  id: number;
  nome: string;
  pontos?: number;
}

interface Mesa {
  id: number;
  numero_mesa: number;
  time1: string;
  time2: string;
  status: "Finalizado" | "Em andamento" | "Revisar dados";
}

const EmparelhamentoTorneio: React.FC = () => {
  const [ranking, setRanking] = useState<Player[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [sobressalentes, setSobressalentes] = useState<Participante[]>([]);
  const [rodada, setRodada] = useState(1);
  const [torneio, setTorneio] = useState<ITorneio | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [jogadores, setJogadores] = useState<string[]>([]);
  
  const { id } = useParams<{ id: string }>();

  // Buscar dados do torneio e jogadores
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        const torneioId = id ? parseInt(id) : 1;

        // Buscar torneio e jogadores em paralelo
        const [dadosTorneio, listaJogadores] = await Promise.all([
          buscarTorneioPorId(torneioId),
          buscarJogadoresInscritos(torneioId)
        ]);

        setTorneio(dadosTorneio);
        setJogadores(listaJogadores);

        const participantes = processarParticipantes(listaJogadores);
        setRanking(participantes);

        // Buscar mesas da rodada atual 
        await carregarMesasRodada(listaJogadores, rodada);

        definirSobressalentes(processarParticipantesBasico(listaJogadores));

      } catch (e) {
        console.error('Erro ao carregar dados:', e);
        setErro(tratarErroTorneio(e));
        
        // Fallback com dados mockados em caso de erro
        setDadosMockados();
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [id, rodada]);

  // Processar lista de jogadores para criar ranking
  const processarParticipantes = (jogadores: string[]): Player[] => {
    return jogadores.map((nome, index) => ({
      id: (index + 1).toString(),
      nome: nome,
      position: index + 1,
      points: Math.floor(Math.random() * 15), // Mock temporário
    })).sort((a, b) => b.points - a.points) // Ordenar por pontos
       .map((player, index) => ({
         ...player,
         position: index + 1 // Reatribuir posições após ordenação
       }));
  };

  // Processar participantes básico
  const processarParticipantesBasico = (jogadores: string[]): Participante[] => {
    return jogadores.map((nome, index) => ({
      id: index + 1,
      nome: nome,
      pontos: Math.floor(Math.random() * 15)
    })).sort((a, b) => (b.pontos || 0) - (a.pontos || 0));
  };

  // Buscar mesas da rodada atual
   const carregarMesasRodada = async (jogadores: string[], numeroRodada: number) => {
    try {
      const mesasMockadas = criarMesasMockadas(jogadores, numeroRodada);
      setMesas(mesasMockadas);
    } catch (error) {
      console.error('Erro ao carregar mesas:', error);
      const mesasMockadas = criarMesasMockadas(jogadores, numeroRodada);
      setMesas(mesasMockadas);
    }
  };

  // Criar mesas mockadas baseadas nos jogadores
  const criarMesasMockadas = (jogadores: string[], numeroRodada: number): Mesa[] => {
    if (jogadores.length < 4) return [];

    const participantes = processarParticipantesBasico(jogadores);
    const mesas: Mesa[] = [];
    
    // Criar mesas de 4 jogadores cada (2v2)
    for (let i = 0; i < Math.floor(participantes.length / 4); i++) {
      const startIdx = i * 4;
      const mesa: Mesa = {
        id: i + 1,
        numero_mesa: i + 1,
        time1: `${participantes[startIdx].nome} & ${participantes[startIdx + 1].nome}`,
        time2: `${participantes[startIdx + 2].nome} & ${participantes[startIdx + 3].nome}`,
        status: i % 3 === 0 ? "Em andamento" : i % 3 === 1 ? "Finalizado" : "Revisar dados"
      };
      mesas.push(mesa);
    }

    return mesas;
  };

  // Definir participantes sobressalentes (sem mesa)
  const definirSobressalentes = (participantes: Participante[]) => {
    if (mesas.length === 0) {
      setSobressalentes(participantes.slice(0, 3));
      return;
    }

    const participantesEmMesas = new Set();
    mesas.forEach(mesa => {
      const nomesTime1 = mesa.time1.split(' & ');
      const nomesTime2 = mesa.time2.split(' & ');
      
      [...nomesTime1, ...nomesTime2].forEach(nome => {
        participantesEmMesas.add(nome.trim());
      });
    });

    const sobressalentes = participantes.filter(p => 
      !participantesEmMesas.has(p.nome)
    ).slice(0, 3);

    setSobressalentes(sobressalentes);
  };

  // Dados mockados de fallback
  const setDadosMockados = () => {
    setRanking([
      { id: "1", nome: "Alexandre Shadows", position: 1, points: 12 },
      { id: "2", nome: "Julia Frostmage", position: 2, points: 10},
      { id: "3", nome: "Marina Stormcaller", position: 3, points: 8 },
      { id: "4", nome: "Pedro Flamecaster", position: 4, points: 6 },
    ]);

    setMesas([
      { id: 1, numero_mesa: 1, time1: "Alexandre Shadows & Marina Stormcaller", time2: "Pedro Flamecaster & Julia Frostmage", status: "Finalizado"},
      { id: 2, numero_mesa: 2, time1: "Jogador A & Jogador B", time2: "Jogador C & Jogador D", status: "Em andamento"},
    ]);

    setSobressalentes([
      { id: 5, nome: "Jogador Sobressalente 1", pontos: 4 },
      { id: 6, nome: "Jogador Sobressalente 2", pontos: 2 },
    ]);
  };

    // Função para emparelhar novamente
    const handleEmparelhar = async () => {
    try {
      console.log("Emparelhando novamente...");
      // Usar a lista de jogadores que já temos no estado
      await carregarMesasRodada(jogadores, rodada);
      
      alert("Emparelhamento realizado com sucesso!");
    } catch (error) {
      console.error('Erro ao emparelhar:', error);
      setErro("Erro ao realizar emparelhamento");
    }
  };

  // Função para iniciar próxima rodada 
  const handleIniciarRodada = async () => {
    try {
      console.log("Iniciando próxima rodada...");
      
      // Incrementar a rodada localmente
      const novaRodada = rodada + 1;
      setRodada(novaRodada);
      
      // Recarregar mesas com a nova rodada - usando a lista de jogadores existente
      await carregarMesasRodada(jogadores, novaRodada);
      
      alert(`Rodada ${novaRodada} iniciada com sucesso!`);
    } catch (error) {
      console.error('Erro ao iniciar rodada:', error);
      setErro("Erro ao iniciar rodada");
    }
  };


  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <p>Carregando emparelhamento...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Erro: {erro}</p>
          <Button 
            label="Recarregar" 
            onClick={() => window.location.reload()} 
            backgroundColor="var(--var-cor-primaria)" 
          />
        </div>
      </div>
    );
  }


  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Emparelhamento</h1>
        <span className={styles.badge}>{rodada}ª Rodada {mesas.some(m => m.status === "Em andamento") ? "Em Andamento" : "Finalizada"}</span>
      </div>
      <p className={styles.subtext}>
        {mesas.some(m => m.status === "Em andamento") 
          ? "Acompanhe as partidas em andamento" 
          : "Aguarde a finalização do emparelhamento para iniciar a próxima rodada"}
      </p>

      {/* Exibir erro se houver */}
      {erro && (
        <div className={styles.mensagemErro}>
          {erro}
        </div>
      )}

      {/* Ranking */}
      {torneio && (
        <CardRanking
          tournamentId={torneio.id}
          rodadaId={rodada}
          titulo="🏆 Ranking"
          mostrarMetricasAvancadas={true}
          className={styles.CardRanking}
        />
      )}

      {/* Mesas */}
      <section className={styles.cardMesa}>
        <div className={styles.headerMesas}>
          <h2>Mesas emparelhadas</h2>
        </div>
        <div className={styles.mesasGrid}>
          {mesas.length > 0 ? (
            mesas.map((m) => (
              <MesaCard
                key={m.id}
                numeroMesa={m.numero_mesa}
                time1={m.time1}
                time2={m.time2}
                status={m.status}
              />
            ))
          ) : (
            <div className={styles.subtext}>
              <p>Nenhuma mesa emparelhada para esta rodada.</p>
            </div>
          )}
        </div>
      </section>

      {/* Sobressalentes */}
      <section className={styles.cardSobressalentes}>
        <div className={styles.headerSobressalentes}>
          <h2>Participantes sobressalentes</h2>
          <span className={styles.contadorSobressalentes}>
            {sobressalentes.length} {sobressalentes.length === 1 ? 'jogador' : 'jogadores'}
          </span>
        </div>
        <div className={styles.ranking}>
          {sobressalentes.length > 0 ? (
            sobressalentes.map((p, idx) => (
              <div key={p.id} className={styles.rankingItem}>
                <span>{idx + 1}. {p.nome}</span>
              </div>
            ))
          ) : (
            <div className={styles.subtext}>
              <p>Nenhum participante sobressalente.</p>
            </div>
          )}
        </div>
      </section>

      {/* Botões */}
      <div className={styles.buttons}>
        <Button 
          label="Emparelhar Novamente" 
          onClick={handleEmparelhar} 
          backgroundColor="var(--var-cor-terciaria)" 
        />
        <Button 
          label={mesas.some(m => m.status === "Em andamento") ? "Rodada em Andamento" : "Iniciar Próxima Rodada"} 
          onClick={handleIniciarRodada} 
          backgroundColor="var(--var-cor-primaria)" 
        />
      </div>
    </div>
  );
};

export default EmparelhamentoTorneio;