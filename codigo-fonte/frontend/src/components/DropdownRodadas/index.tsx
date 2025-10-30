import { useState, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";
import styles from './styles.module.css';
import { buscarRodadasDoTorneio } from "../../services/mesaServico";
import type { IRodada } from "../../tipos/tipos";

interface DropdownRodadasProps {
  tournamentId?: number;
  rodadaSelecionada: IRodada | null;
  onSelecionarRodada: (rodada: IRodada) => void;
  onSelecionarResultadoFinal?: () => void;
  resultadoFinalSelecionado?: boolean;
  tournamentStatus?: string;
  className?: string;
}

const DropdownRodadas: React.FC<DropdownRodadasProps> = ({
  tournamentId,
  rodadaSelecionada,
  onSelecionarRodada,
  onSelecionarResultadoFinal,
  resultadoFinalSelecionado = false,
  tournamentStatus,
  className = ''
}) => {
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [rodadas, setRodadas] = useState<IRodada[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [rodadaInicialSelecionada, setRodadaInicialSelecionada] = useState(false);

  // Buscar rodadas do torneio
  const carregarRodadas = async () => {
    if (!tournamentId) return;

    try {
      setCarregando(true);
      setErro(null);
      const rodadasData = await buscarRodadasDoTorneio(tournamentId);
      setRodadas(rodadasData);
      
      // Selecionar rodada inicial apenas na primeira vez
      if (rodadasData.length > 0 && !rodadaSelecionada && !rodadaInicialSelecionada && !resultadoFinalSelecionado) {
        const rodadaEmAndamento = rodadasData.find(r => 
          r.status?.toLowerCase() === 'em andamento'
        );
        const rodadaInicial = rodadaEmAndamento || rodadasData[0];
        
        onSelecionarRodada(rodadaInicial);
        setRodadaInicialSelecionada(true);
      }
    } catch (error: any) {
      console.error('Erro ao carregar rodadas:', error);
      setErro('Erro ao carregar rodadas');
      setRodadas([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (tournamentId) {
      carregarRodadas();
    }
  }, [tournamentId]);

  // Resetar a flag quando o tournamentId mudar
  useEffect(() => {
    setRodadaInicialSelecionada(false);
  }, [tournamentId]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickFora = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.dropdownContainer}`)) {
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

  const formatarStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'Aguardando_Emparelhamento': 'Aguardando',
      'Emparelhamento': 'Emparelhada',
      'Em Andamento': 'Em Andamento',
      'Finalizada': 'Finalizada',
      'em_andamento': 'Em Andamento',
      'finalizada': 'Finalizada'
    };
    
    return statusMap[status] || status;
  };

  return (
    <div className={`${styles.dropdownContainer} ${className}`}>
      <button
        className={styles.dropdownButton}
        onClick={() => setDropdownAberto(!dropdownAberto)}
        disabled={carregando}
      >
        <span>
          {carregando ? (
            'Carregando rodadas...'
          ) : resultadoFinalSelecionado ? (
            '🏆 Resultado final'
          ) : rodadaSelecionada ? (
            `Rodada ${rodadaSelecionada.numero_rodada} de ${rodadas.length}`
          ) : rodadas.length > 0 ? (
            'Selecione uma rodada'
          ) : (
            'Nenhuma rodada disponível'
          )}
        </span>
        <FiChevronDown className={dropdownAberto ? styles.iconRotate : ''} />
      </button>

      {dropdownAberto && !carregando && (
        <div className={styles.dropdownMenu}>
          {rodadas.map((rodada) => (
            <div
              key={rodada.id}
              className={`${styles.dropdownItem} ${
                rodadaSelecionada?.id === rodada.id && !resultadoFinalSelecionado ? styles.itemAtivo : ''
              }`}
              onClick={() => {
                onSelecionarRodada(rodada);
                setDropdownAberto(false);
              }}
            >
              <span>Rodada {rodada.numero_rodada}</span>
              <span className={styles.statusRodada}>
                {formatarStatus(rodada.status)}
              </span>
            </div>
          ))}
          
          {tournamentStatus === "Finalizado" && onSelecionarResultadoFinal && rodadas.length > 0 && (
            <div
              className={`${styles.dropdownItem} ${
                resultadoFinalSelecionado ? styles.itemAtivo : ''
              } ${styles.resultadoFinalItem}`}
              onClick={() => {
                onSelecionarResultadoFinal();
                setDropdownAberto(false);
              }}
            >
              <span className={styles.resultadoFinalText}>🏆 Resultado final</span>
              <span className={styles.statusRodada}>Final</span>
            </div>
          )}
          
          {rodadas.length === 0 && !carregando && (
            <div className={styles.dropdownItem}>
              <span>Nenhuma rodada disponível</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DropdownRodadas;