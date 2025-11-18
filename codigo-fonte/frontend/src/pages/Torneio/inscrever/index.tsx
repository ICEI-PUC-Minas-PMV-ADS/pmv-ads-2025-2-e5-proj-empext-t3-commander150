import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import estilos from "./styles.module.css";

import Input from "../../../components/Input";
import Button from "../../../components/Button";
import { buscarTorneioPorId, tratarErroTorneio, inscreverNoTorneio } from "../../../services/torneioServico";
import { useSessao } from "../../../contextos/AuthContexto";
import type { ITorneio } from "../../../tipos/tipos";
import Swal from 'sweetalert2';

// Interface temporária para resolver problemas de tipo
interface ITorneioCompleto extends ITorneio {
  descricao?: string | null;
  regras?: string | null;
  banner?: string | null;
  vagas_limitadas: boolean;
  qnt_vagas?: number | null;
  incricao_gratuita: boolean;
  valor_incricao?: number | null;
  data_inicio: string;
  loja_nome: string;
}

import { FaCalendarAlt, FaClock, FaStore, FaMoneyBillAlt } from "react-icons/fa";
import { MdOutlinePeople } from "react-icons/md";

const InscricaoTorneio: React.FC = () => {
  // hook para acessar dados do usuário logado
  const { usuario } = useSessao();
  
  // hook para navegação
  const navigate = useNavigate();
  
  // estados locais para capturar os campos do formulário
  const [deck, setDeck] = useState("");
  const [aceiteTermos, setAceiteTermos] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const corLabelInputs = "#FFFFFF";

  // estados para dados do torneio
  const [torneio, setTorneio] = useState<ITorneioCompleto | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // pegar o ID do torneio da URL
  const { id } = useParams<{ id: string }>();

  // buscar dados do torneio quando o componente carregar
  useEffect(() => {
    const carregarTorneio = async () => {
      if (!id) {
        setErro("ID do torneio não fornecido");
        setCarregando(false);
        return;
      }

      try {
        setCarregando(true);
        const dadosTorneio = await buscarTorneioPorId(parseInt(id));
        setTorneio(dadosTorneio);
        setErro(null);
      } catch (error) {
        console.error("Erro ao carregar torneio:", error);
        setErro(tratarErroTorneio(error));
      } finally {
        setCarregando(false);
      }
    };

    carregarTorneio();
  }, [id]);

  // scroll para o topo quando o componente carregar
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // funções auxiliares para formatação
  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarHora = (data: string) => {
    return new Date(data).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatarValor = (valor?: number | null, gratuito?: boolean) => {
    if (gratuito) return 'Gratuito';
    if (!valor) return 'R$ 0,00';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatarRegras = (regras: string | null | undefined) => {
    if (!regras) return [];
    return regras.split('\n').filter(regra => regra.trim() !== '');
  };

  // função de envio do formulário
  const enviarFormulario = async () => {
    if (!aceiteTermos) {
      Swal.fire('Erro', 'É necessário aceitar os termos e condições do torneio.', 'error');
      return;
    }

    if (!torneio || !id) {
      Swal.fire('Erro', 'Torneio não encontrado.', 'error');
      return;
    }

    if (!usuario) {
      Swal.fire('Erro', 'Usuário não está logado.', 'error');
      return;
    }

    try {
      setEnviando(true);
      
      const dadosInscricao = {
        id_torneio: torneio.id,
        decklist: deck.trim() || undefined, // só envia se não estiver vazio
        id_usuario: usuario.id, // ID do usuário logado
      };

      await inscreverNoTorneio(dadosInscricao);
      
      // Sucesso
      Swal.fire({
        title: 'Sucesso!',
        text: `Inscrição no torneio "${torneio.nome}" realizada com sucesso!`,
        icon: 'success',
        confirmButtonText: 'OK'
      }).then(() => {
        // Redirecionar para a tela inicial após sucesso
        navigate('/');
      });
      
    } catch (error) {
      console.error("Erro ao inscrever no torneio:", error);
      const mensagemErro = tratarErroTorneio(error);
      
      Swal.fire({
        title: 'Erro ao inscrever no torneio',
        text: mensagemErro,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setEnviando(false);
    }
  };

  // renderizar loading
  if (carregando) {
    return (
      <div className={estilos.container}>
        <main className={estilos.conteudo}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>Carregando dados do torneio...</h2>
          </div>
        </main>
      </div>
    );
  }

  // renderizar erro
  if (erro) {
    return (
      <div className={estilos.container}>
        <main className={estilos.conteudo}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>Erro ao carregar torneio</h2>
            <p>{erro}</p>
            <Button 
              label="Voltar" 
              onClick={() => window.history.back()}
              backgroundColor="var(--var-cor-terciaria)"
            />
          </div>
        </main>
      </div>
    );
  }

  // renderizar erro se torneio não encontrado
  if (!torneio) {
    return (
      <div className={estilos.container}>
        <main className={estilos.conteudo}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>Torneio não encontrado</h2>
            <p>O torneio solicitado não foi encontrado.</p>
            <Button 
              label="Voltar" 
              onClick={() => window.history.back()}
              backgroundColor="var(--var-cor-terciaria)"
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={estilos.container}>

      <main className={estilos.conteudo}>
        {/* Cabeçalho principal */}
        <h1 className={estilos.titulo}>Inscrição no Torneio</h1>
        <p className={estilos.subtitulo}>
          Complete suas informações para participar da {torneio.nome}
        </p>

        {/* Informações do torneio */}
        <section className={estilos.cartaoTorneio}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className={estilos.nomeTorneio}>{torneio.nome}</h2>
                <div className={estilos.jogadoresInscritos}>
                    <MdOutlinePeople /> {torneio.qnt_vagas ? `${torneio.qnt_vagas} vagas` : 'Vagas ilimitadas'}
                </div>
            </div>
            
            <p className={estilos.descricaoTorneio}>
              {torneio.descricao || ''}
            </p>
            
          </div>

          <div className={estilos.detalhesTorneio}>
            <div className={estilos.linhaInfo}>
              <div className={estilos.infoEsquerda}>
                <div className={estilos.itemInfo}>
                  <FaCalendarAlt /> <span>{formatarData(torneio.data_inicio)}</span>
                </div>
                <div className={estilos.itemInfo}>
                  <FaClock /> <span>{formatarHora(torneio.data_inicio)}</span>
                </div>
              </div>
              <div className={estilos.infoDireita}>
                <div className={estilos.itemInfo}>
                  <FaStore /> <span>{torneio.loja_nome}</span>
                </div>
                <div className={estilos.itemInfo}>
                  <FaMoneyBillAlt /> <span>{formatarValor(torneio.valor_incricao, torneio.incricao_gratuita)}</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Formulário de inscrição */}
        <section className={estilos.formulario}>
          <h3 className={estilos.tituloSessao}>Inscrição no Torneio</h3>
          <p className={estilos.subtituloSessao}>
            Preencha as informações abaixo para concluir sua inscrição.
          </p>

          <div className={estilos.grupoInputs}>
            <Input
              placeholder="Informe o link do seu deck na Liga Magic (opcional)"
              value={deck}
              onChange={(e) => setDeck(e.target.value)}
              type="text"
              name="link-deck"
              label="Link do Deck"
              labelColor={corLabelInputs}
            />
          </div>

          <div className={estilos.checkbox}>
            <input
              type="checkbox"
              id="termos"
              checked={aceiteTermos}
              onChange={(e) => setAceiteTermos(e.target.checked)}
            />
            <label htmlFor="termos">
              Aceito os termos e condições do torneio
            </label>
          </div>

          <div className={estilos.botoes}>
            <Button 
              label="Voltar" 
              onClick={() => window.history.back()}
              backgroundColor="var(--var-cor-terciaria)"
              disabled={enviando}
            />
            <Button 
              label={enviando ? "Enviando..." : "Confirmar Inscrição"}  
              onClick={enviarFormulario} 
              backgroundColor="var(--var-cor-primaria)"
              disabled={enviando}
            />
          </div>
        </section>

        {/* Regras do torneio */}
        <section className={estilos.regras}>
          <h3 className={estilos.tituloSessao}>Regras do Torneio</h3>
          <ul>
            {formatarRegras(torneio.regras).map((regra, index) => (
              <li key={index}>{regra}</li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
};

export default InscricaoTorneio;
