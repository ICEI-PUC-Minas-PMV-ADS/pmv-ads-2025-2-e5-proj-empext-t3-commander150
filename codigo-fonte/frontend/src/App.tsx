// src/App.tsx
import { useState, useEffect } from "react";
import estilos from "./App.module.css";

// Importar imagens de banner
import b1 from "./assets/b1.png";
import b2 from "./assets/b2.png";
import b3 from "./assets/b3.png";

// Componentes
import CardTorneio from "./components/CardTorneio";
import ModalInscricaoJogador from "./components/ModalInscricaoJogador";
import Navbar from "./components/Navbar";

// Ícones
import { FaUsers } from "react-icons/fa";

// Serviços, contextos e tipos
import { buscarTorneiosAtivos, tratarErroTorneio } from "./services/torneioServico";
import { useSessao } from "./contextos/AuthContexto";
import type { ITorneio } from "./tipos/tipos";

// Utilitários
import Swal from 'sweetalert2';

// Constantes para configuração
const CONFIG = {
  PAGINA_INICIAL: 1,
  LIMITE_TORNEIOS: 20,
  BANNERS_PADRAO: [b1, b2, b3] as const,
} as const;

// Mapeamento de banners do backend para imagens locais
const IMAGENS_BANNER: Record<string, string> = {
  "b1.png": b1,
  "b2.png": b2,
  "b3.png": b3,
};

// ============================
// HOOKS PERSONALIZADOS
// ============================

/**
 * Hook para gerenciar o estado dos torneios
 * Centraliza a lógica de carregamento, erro e dados
 */
const useTorneios = () => {
  const [torneios, setTorneios] = useState<ITorneio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  /**
   * Carrega torneios ativos da API
   */
  const carregarTorneios = async () => {
    try {
      setCarregando(true);
      setErro(null);
      
      const resposta = await buscarTorneiosAtivos();
      
      // Extrai torneios da resposta (suporta array direto ou formato paginado)
      const torneiosExtraidos = extrairTorneiosDaResposta(resposta);
      setTorneios(torneiosExtraidos);
      
    } catch (error) {
      console.error("Erro ao carregar torneios:", error);
      const mensagemErro = tratarErroTorneio(error);
      setErro(mensagemErro);
      setTorneios([]);
      
      // Mostra alerta de erro para o usuário
      Swal.fire({
        title: 'Erro ao carregar torneios',
        text: mensagemErro,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setCarregando(false);
    }
  };

  /**
   * Recarrega os torneios (útil após ações como inscrição)
   */
  const recarregarTorneios = async () => {
    await carregarTorneios();
  };

  return {
    torneios,
    carregando,
    erro,
    carregarTorneios,
    recarregarTorneios,
  };
};

/**
 * Hook para gerenciar o modal de inscrição
 */
const useModalInscricao = (onSucessoInscricao: () => void) => {
  const [modalAberto, setModalAberto] = useState(false);
  const [torneioSelecionado, setTorneioSelecionado] = useState<{ 
    id: number; 
    nome: string 
  } | null>(null);

  const abrirModal = (torneioId: number, torneioNome: string) => {
    setTorneioSelecionado({ id: torneioId, nome: torneioNome });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setTorneioSelecionado(null);
  };

  const handleSucesso = () => {
    fecharModal();
    onSucessoInscricao();
  };

  return {
    modalAberto,
    torneioSelecionado,
    abrirModal,
    fecharModal,
    handleSucesso,
  };
};

// ============================
// UTILITÁRIOS
// ============================

/**
 * Extrai array de torneios da resposta da API
 * Suporta tanto array direto quanto formato paginado
 */
const extrairTorneiosDaResposta = (resposta: any): ITorneio[] => {
  if (Array.isArray(resposta)) {
    return resposta;
  }
  
  if (resposta?.results && Array.isArray(resposta.results)) {
    return resposta.results;
  }
  
  console.error("Estrutura de resposta inesperada:", resposta);
  return [];
};

/**
 * Formata data no formato DD.MM.AA
 */
const formatarData = (data: string): string => {
  const date = new Date(data);
  const dia = date.getDate().toString().padStart(2, '0');
  const mes = (date.getMonth() + 1).toString().padStart(2, '0');
  const ano = date.getFullYear().toString().slice(-2);
  return `${dia}.${mes}.${ano}`;
};

/**
 * Formata hora no formato HH:MM
 */
const formatarHora = (data: string): string => {
  return new Date(data).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Obtém imagem do banner do torneio
 * Se não houver banner, retorna um aleatório dos padrões
 */
const obterImagemBanner = (banner: string | null): string => {
  if (!banner) {
    return CONFIG.BANNERS_PADRAO[
      Math.floor(Math.random() * CONFIG.BANNERS_PADRAO.length)
    ];
  }

  const nomeArquivo = banner.split('/').pop() || '';
  return IMAGENS_BANNER[nomeArquivo] || banner;
};

/**
 * Gera tags para exibição no card do torneio
 * Baseado nas propriedades do torneio
 */
const obterTagsTorneio = (torneio: ITorneio): Array<{ 
  texto: string; 
  icone?: React.ReactNode 
}> => {
  const tags: Array<{ texto: string; icone?: React.ReactNode }> = [
    { texto: "2v2", icone: <FaUsers /> }
  ];

  // Adiciona tag de gratuito/pago
  tags.push({
    texto: torneio.incricao_gratuita ? "Gratuito" : "Pago"
  });

  // Adiciona tag de vagas limitadas se aplicável
  if (torneio.vagas_limitadas) {
    tags.push({ texto: "Vagas limitadas" });
  }

  return tags;
};

// ============================
// COMPONENTES DE APOIO
// ============================

/**
 * Componente para exibir estado de carregamento
 */
const EstadoCarregando: React.FC = () => (
  <div className={estilos.estadoContainer}>
    <h4>Carregando torneios...</h4>
  </div>
);

/**
 * Componente para exibir estado de erro
 */
const EstadoErro: React.FC<{ mensagem: string }> = ({ mensagem }) => (
  <div className={estilos.estadoContainer}>
    <h4>Erro ao carregar torneios</h4>
    <p>{mensagem}</p>
  </div>
);

/**
 * Componente para exibir quando não há torneios
 */
const EstadoVazio: React.FC = () => (
  <div className={estilos.estadoContainer}>
    <h4>Nenhum torneio disponível no momento</h4>
  </div>
);

/**
 * Seção Hero da landing page
 */
const HeroSection: React.FC = () => (
  <section className={estilos.hero}>
    <div className={estilos.heroConteudo}>
      <h1 className={estilos.titulo}>Commander 150</h1>
      <p className={estilos.subtitulo}>
        Sistema para torneios 2v2 de Magic: The Gathering. <br />
        Encontre seu parceiro, monte sua estratégia e domine o multiverso!
      </p>
    </div>
  </section>
);

/**
 * Seção de listagem de torneios
 */
interface ListaTorneiosProps {
  torneios: ITorneio[];
  carregando: boolean;
  erro: string | null;
  usuario: any;
  onAbrirModalInscricao: (id: number, nome: string) => void;
}

const ListaTorneiosSection: React.FC<ListaTorneiosProps> = ({
  torneios,
  carregando,
  erro,
  usuario,
  onAbrirModalInscricao,
}) => {
  // Renderiza estado apropriado baseado no status
  if (carregando) return <EstadoCarregando />;
  if (erro) return <EstadoErro mensagem={erro} />;
  if (!torneios.length) return <EstadoVazio />;

  return (
    <div className={estilos.gridTorneios}>
      {torneios.map((torneio) => (
        <CardTorneio 
          key={torneio.id}
          id={torneio.id}
          imagem={obterImagemBanner(torneio.banner || null)}
          titulo={torneio.nome}
          data={formatarData(torneio.data_inicio)}
          hora={formatarHora(torneio.data_inicio)}
          dataOriginal={torneio.data_inicio}
          tags={obterTagsTorneio(torneio)}
          loja={torneio.loja_nome}
          status={torneio.status}
          usuario={usuario}
          // Técnica de conditional property - só passa onInscreverJogador se for loja
          {...(usuario?.tipo === 'LOJA' && {
            onInscreverJogador: () => onAbrirModalInscricao(torneio.id, torneio.nome)
          })}
        />
      ))}
    </div>
  );
};

// ============================
// COMPONENTE PRINCIPAL
// ============================

function App() {
  // Hook para acessar dados do usuário logado
  const { usuario } = useSessao();
  
  // Gerenciamento de estado dos torneios
  const { 
    torneios, 
    carregando, 
    erro, 
    carregarTorneios, 
    recarregarTorneios 
  } = useTorneios();

  // Gerenciamento do modal de inscrição
  const {
    modalAberto,
    torneioSelecionado,
    abrirModal,
    fecharModal,
    handleSucesso,
  } = useModalInscricao(recarregarTorneios);

  // Carrega torneios quando o componente monta
  useEffect(() => {
    carregarTorneios();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={estilos.app}>
      {/* Navbar sempre visível */}
      <Navbar />

      {/* Seção Hero */}
      <HeroSection />

      {/* Seção de Listagem de Torneios */}
      <section className={estilos.listaTorneios}>
        <h2 className={estilos.tituloSecao}>
          {usuario?.tipo === 'LOJA' ? 'Meus torneios' : 'Torneios disponíveis'}
        </h2>
        
        <ListaTorneiosSection
          torneios={torneios}
          carregando={carregando}
          erro={erro}
          usuario={usuario}
          onAbrirModalInscricao={abrirModal}
        />
      </section>

      {/* Modal de inscrição de jogador */}
      {modalAberto && torneioSelecionado && (
        <ModalInscricaoJogador
          torneioId={torneioSelecionado.id}
          torneioNome={torneioSelecionado.nome}
          onClose={fecharModal}
          onSuccess={handleSucesso}
        />
      )}
    </div>
  );
}

export default App;