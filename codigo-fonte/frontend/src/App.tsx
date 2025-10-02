// src/App.tsx
import { useState, useEffect } from "react";
import estilos from "./App.module.css";

// Importar imagens de banner
import b1 from "./assets/b1.png";
import b2 from "./assets/b2.png";
import b3 from "./assets/b3.png";

// Importa o CardTorneio já pronto
import CardTorneio from "./components/CardTorneio";

// Importa ícones do react-icons
import { FaUsers } from "react-icons/fa";

// Importa a Navbar
import Navbar from "./components/Navbar";

// Importa serviços e tipos
import { buscarTorneios, tratarErroTorneio } from "./services/torneioServico";
import { useSessao } from "./contextos/AuthContexto";
import type { ITorneio } from "./tipos/tipos";
import Swal from 'sweetalert2';

function App() {
  // Hook para acessar dados do usuário logado
  const { usuario } = useSessao();
  
  // Estados para gerenciar os torneios
  const [torneios, setTorneios] = useState<ITorneio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Função para formatar data
  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  // Função para formatar hora
  const formatarHora = (data: string) => {
    return new Date(data).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Função para obter imagem do banner
  const obterImagemBanner = (banner: string | null) => {
    if (banner) {
      // Se há banner da API, usar ele
      return banner;
    }
    // Senão, usar imagens padrão baseadas no ID
    const imagens = [b1, b2, b3];
    return imagens[Math.floor(Math.random() * imagens.length)];
  };

  // Função para obter tags do torneio
  const obterTagsTorneio = (torneio: ITorneio) => {
    const tags: Array<{ texto: string; icone?: React.ReactNode }> = [
      { texto: "2v2", icone: <FaUsers /> }
    ];

    if (torneio.incricao_gratuita) {
      tags.push({ texto: "Gratuito" });
    } else {
      tags.push({ texto: "Pago" });
    }

    if (torneio.vagas_limitadas) {
      tags.push({ texto: "Vagas limitadas" });
    }

    return tags;
  };

  // Buscar torneios quando o componente carregar
  useEffect(() => {
    const carregarTorneios = async () => {
      try {
        setCarregando(true);
        const resposta = await buscarTorneios(1, 20); // Buscar primeira página com até 20 torneios
        
        // Verificar se a resposta tem a estrutura esperada
        if (resposta && Array.isArray(resposta)) {
          // API retorna array direto
          setTorneios(resposta);
          setErro(null);
        } else if (resposta && resposta.results && Array.isArray(resposta.results)) {
          // API retorna formato paginado
          setTorneios(resposta.results);
          setErro(null);
        } else {
          console.error("Estrutura de resposta inesperada:", resposta);
          setTorneios([]);
          setErro("Formato de resposta inesperado da API");
        }
      } catch (error) {
        console.error("Erro ao carregar torneios:", error);
        const mensagemErro = tratarErroTorneio(error);
        setErro(mensagemErro);
        setTorneios([]); // Garantir que torneios seja um array vazio em caso de erro
        
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

    carregarTorneios();
  }, []);

  return (
    <div className={estilos.app}>
      {/* Navbar sempre visível */}
      <Navbar />

      {/* HERO */}
      <section className={estilos.hero}>
        <div className={estilos.heroConteudo}>
          <h1 className={estilos.titulo}>Commander 150</h1>
          <p className={estilos.subtitulo}>
            Sistema para torneios 2v2 de Magic: The Gathering. <br />
            Encontre seu parceiro, monte sua estratégia e domine o multiverso!
          </p>
        </div>
      </section>

      {/* LISTAGEM DE TORNEIOS */}
      <section className={estilos.listaTorneios}>
        <h2 className={estilos.tituloSecao}>Torneios disponíveis</h2>
        
        {carregando ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h3>Carregando torneios...</h3>
          </div>
        ) : erro ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h3>Erro ao carregar torneios</h3>
            <p>{erro}</p>
          </div>
        ) : !torneios || torneios.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h3>Nenhum torneio disponível no momento</h3>
          </div>
        ) : (
          <div className={estilos.gridTorneios}>
            {torneios && torneios.map((torneio) => (
              <CardTorneio 
                key={torneio.id}
                id={torneio.id}
                imagem={obterImagemBanner(torneio.banner || null)}
                titulo={torneio.nome}
                data={formatarData(torneio.data_inicio)}
                hora={formatarHora(torneio.data_inicio)}
                tags={obterTagsTorneio(torneio)}
                loja={torneio.loja_nome}
                status={torneio.status}
                usuario={usuario}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
