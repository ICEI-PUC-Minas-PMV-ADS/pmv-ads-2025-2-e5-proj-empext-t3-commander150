import React, { useState } from "react";
import estilos from "./styles.module.css";

import Input from "../../../components/Input";
import Button from "../../../components/Button";

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

  return (
    <div className={estilos.container}>

      <main className={estilos.conteudo}>
        {/* Cabeçalho principal */}
        <h1 className={estilos.titulo}>Inscrição no Torneio</h1>
        <p className={estilos.subtitulo}>
          Complete suas informações para participar da Copa Mystical Arcanum
        </p>

        {/* Informações do torneio */}
        <section className={estilos.cartaoTorneio}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className={estilos.nomeTorneio}>Copa Mystical Arcanum</h2>
                <div className={estilos.jogadoresInscritos}>
                    <MdOutlinePeople /> 12 jogadores inscritos
                </div>
            </div>
            
            <p className={estilos.descricaoTorneio}>Descrição do torneio</p>
            
          </div>

          <div className={estilos.detalhesTorneio}>
            <div className={estilos.linhaInfo}>
              <div style={{justifyItems: '20px' }}>
                <FaCalendarAlt /> <span>05/05/2023</span>
                <FaClock /> <span>14:00</span>
              </div>
              <div>
                <FaStore /> <span>Loja Cards & Dragons</span>
                <FaMoneyBillAlt /> <span>R$ 25,00</span>
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
            <li>Formato Commander padrão (100 cartas)</li>
            <li>Tempo limite: 50 minutos por partida</li>
            <li>Banlist oficial da Wizards of the Coast</li>
            <li>Cada dupla deve ter decks de cores diferentes</li>
            <li>Proxies não são permitidas</li>
            <li>Comportamento respeitoso é obrigatório</li>
          </ul>
        </section>
      </main>
    </div>
  );
};

export default InscricaoTorneio;
