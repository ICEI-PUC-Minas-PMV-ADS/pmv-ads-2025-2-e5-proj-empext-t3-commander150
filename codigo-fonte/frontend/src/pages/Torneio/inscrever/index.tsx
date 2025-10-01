import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import estilos from "./styles.module.css";

import Input from "../../../components/Input";
import Button from "../../../components/Button";
import { buscarTorneioPorId, tratarErroTorneio } from "../../../services/torneioServico";
import type { ITorneio } from "../../../tipos/tipos";

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
}

import { FaCalendarAlt, FaClock, FaStore, FaMoneyBillAlt } from "react-icons/fa";
import { MdOutlinePeople } from "react-icons/md";

const InscricaoTorneio: React.FC = () => {
  // estados locais para capturar os campos do formulário
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [deck, setDeck] = useState("");
  const [aceiteTermos, setAceiteTermos] = useState(false);
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

  const formatarValor = (valor: number | null | undefined) => {
    if (valor === null || valor === undefined) return "Gratuito";
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
  };

  const formatarRegras = (regras: string | null | undefined) => {
    if (!regras) return [];
    return regras.split('\n').filter(regra => regra.trim() !== '');
  };

  // função de envio do formulário - Adicionar validações conforme necessário
  const enviarFormulario = () => {
    if (!aceiteTermos) {
      alert("É necessário aceitar os termos e condições do torneio.");
      return;
    }

    // aqui seria chamada a API do back-end
    console.log({
      nomeCompleto,
      email,
      telefone,
      deck,
      aceiteTermos,
    });
    alert("Inscrição enviada com sucesso!");
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
              <div style={{justifyItems: '20px' }}>
                <FaCalendarAlt /> <span>{formatarData(torneio.data_inicio)}</span>
                <FaClock /> <span>{formatarHora(torneio.data_inicio)}</span>
              </div>
              <div>
                <FaStore /> <span>Loja: {torneio.id_loja}</span>
                <FaMoneyBillAlt /> <span>{formatarValor(torneio.valor_incricao)}</span>
              </div>
            </div>
            
          </div>
        </section>

        {/* Formulário de inscrição */}
        <section className={estilos.formulario}>
          <h3 className={estilos.tituloSessao}>Informações Pessoais</h3>
          <p className={estilos.subtituloSessao}>
            Preencha seus dados abaixo para concluir a inscrição no torneio.
          </p>

          <div className={estilos.grupoInputs}>
            <Input
              placeholder="Seu nome completo"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              type="text"
              name="nome-completo"
              label="Nome Completo*"
              labelColor={corLabelInputs}
              required
            />
            <Input
              placeholder="Informe o link do seu deck na Liga Magic"
              value={deck}
              onChange={(e) => setDeck(e.target.value)}
              type="text"
              name="link-deck"
              label="Seu deck"
              labelColor={corLabelInputs}

            />
          </div>

          <div className={estilos.grupoInputs}>
            <Input
              placeholder="exemplo@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              name="email"
              label="Email*"
              labelColor={corLabelInputs}
              required
            />
            <Input
                type="telefone"
                name="telefone"
                label="Telefone"
                placeholder="(99) 99999-9999"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
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
            />
            <Button label="Confirmar Inscrição"  
              onClick={enviarFormulario} 
              backgroundColor="var(--var-cor-primaria)"
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
