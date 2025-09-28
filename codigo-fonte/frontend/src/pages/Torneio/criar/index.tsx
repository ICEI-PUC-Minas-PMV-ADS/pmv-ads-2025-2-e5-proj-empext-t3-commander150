import React, { useState } from "react";
import estilos from "./styles.module.css";

import Input from "../../../components/Input";
import Button from "../../../components/Button";
import Radio from "../../../components/Radio";

import { FaCalendarAlt, FaClock, FaUpload, FaTimes } from "react-icons/fa";

const CriarTorneio: React.FC = () => {
  // Estados para informações básicas
  const [nomeTorneio, setNomeTorneio] = useState("");
  const [dataTorneio, setDataTorneio] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [capaTorneio, setCapaTorneio] = useState<File | null>(null);
  const [descricao, setDescricao] = useState("");

  // Estados para inscrições e custos
  const [modalidadeInscricao, setModalidadeInscricao] = useState("gratuito");
  const [valorInscricao, setValorInscricao] = useState("R$ 0,00");
  const [possuiPremiacao, setPossuiPremiacao] = useState(false);
  const [vagasLimitadas, setVagasLimitadas] = useState("limitadas");
  const [capacidadeMaxima, setCapacidadeMaxima] = useState("");

  const corLabelInputs = "#FFFFFF";

  // Função para lidar com upload de arquivo
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCapaTorneio(file);
    }
  };

  // Função para remover arquivo selecionado
  const removeFile = () => {
    setCapaTorneio(null);
  };

  // Função para formatar valor monetário
  const formatarValor = (valor: string) => {
    // Remove caracteres não numéricos
    const numeros = valor.replace(/\D/g, '');
    // Converte para centavos e formata
    const valorFormatado = (parseInt(numeros) / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
    return valorFormatado;
  };

  // Função de envio do formulário
  const enviarFormulario = () => {
    if (!nomeTorneio || !dataTorneio) {
      alert("Preencha os campos obrigatórios: Nome do Torneio e Data do Torneio.");
      return;
    }

    if (vagasLimitadas === "limitadas" && !capacidadeMaxima) {
      alert("Informe a capacidade máxima de jogadores.");
      return;
    }

    // Aqui seria chamada a API do back-end
    console.log({
      nomeTorneio,
      dataTorneio,
      horaInicio,
      capaTorneio,
      descricao,
      modalidadeInscricao,
      valorInscricao,
      possuiPremiacao,
      vagasLimitadas,
      capacidadeMaxima
    });
    alert("Torneio criado com sucesso!");
  };

  return (
    <div className={estilos.container}>
      <main className={estilos.conteudo}>
        {/* Cabeçalho principal */}
        <h1 className={estilos.titulo}>Criação de Torneio</h1>
        <p className={estilos.subtitulo}>
          Complete suas informações para criar um torneio
        </p>

        {/* Card 1: Informações Básicas do Torneio */}
        <section className={estilos.cartao}>
          <h3 className={estilos.tituloSessao}>Informações Básicas do Torneio</h3>
          
          <div className={estilos.grupoInputs}>
            <Input
              placeholder="Digite o nome do torneio..."
              value={nomeTorneio}
              onChange={(e) => setNomeTorneio(e.target.value)}
              type="text"
              name="nome-torneio"
              label="Nome do Torneio*"
              labelColor={corLabelInputs}
              required
            />
            <div className={estilos.inputComIcone}>
              <Input
                placeholder="dd/mm/aaaa"
                value={dataTorneio}
                onChange={(e) => setDataTorneio(e.target.value)}
                type="date"
                name="data-torneio"
                label="Data do Torneio*"
                labelColor={corLabelInputs}
                required
              />
              <FaCalendarAlt className={estilos.iconeInput} />
            </div>
          </div>

          <div className={estilos.grupoInputs}>
            <div className={estilos.inputComIcone}>
              <Input
                placeholder="--:--"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                type="time"
                name="hora-inicio"
                label="Hora de Início"
                labelColor={corLabelInputs}
              />
              <FaClock className={estilos.iconeInput} />
            </div>
            <div className={estilos.uploadContainer}>
              <label className={estilos.labelUpload}>Capa do Torneio</label>
              <div className={estilos.uploadArea}>
                <input
                  type="file"
                  id="capa-torneio"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="capa-torneio" className={estilos.botaoUpload}>
                  <FaUpload /> Selecionar Arquivo...
                </label>
                {capaTorneio && (
                  <div className={estilos.arquivoSelecionado}>
                    <span>{capaTorneio.name}</span>
                    <button type="button" onClick={removeFile} className={estilos.botaoRemover}>
                      <FaTimes />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={estilos.textareaContainer}>
            <label className={estilos.labelTextarea}>Descrição</label>
            <textarea
              className={estilos.textarea}
              placeholder="Adicione uma descrição do torneio..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={4}
            />
          </div>
        </section>

        {/* Card 2: Inscrições e Custos */}
        <section className={estilos.cartao}>
          <h3 className={estilos.tituloSessao}>Inscrições e Custos</h3>
          
          <div className={estilos.grupoRadio}>
            <label className={estilos.labelRadio}>Modalidade de Inscrição</label>
            <div className={estilos.radioGroup}>
              <Radio
                name="modalidade"
                value="gratuito"
                checked={modalidadeInscricao === "gratuito"}
                onChange={(e) => {
                  setModalidadeInscricao(e.target.value);
                  setValorInscricao("R$ 0,00");
                }}
                label="Gratuito"
              />
              <Radio
                name="modalidade"
                value="pago"
                checked={modalidadeInscricao === "pago"}
                onChange={(e) => setModalidadeInscricao(e.target.value)}
                label="Pago"
              />
            </div>
          </div>

          <div className={estilos.grupoInputs}>
            <Input
              placeholder="R$ 0,00"
              value={valorInscricao}
              onChange={(e) => setValorInscricao(formatarValor(e.target.value))}
              type="text"
              name="valor-inscricao"
              label="Valor da Inscrição"
              labelColor={corLabelInputs}
              disabled={modalidadeInscricao === "gratuito"}
            />
            <div className={estilos.checkboxContainer}>
              <input
                type="checkbox"
                id="premiacao"
                checked={possuiPremiacao}
                onChange={(e) => setPossuiPremiacao(e.target.checked)}
                className={estilos.checkbox}
              />
              <label htmlFor="premiacao" className={estilos.labelCheckbox}>
                Possui premiação
              </label>
            </div>
          </div>

          <div className={estilos.grupoRadio}>
            <label className={estilos.labelRadio}>Vagas para o torneio</label>
            <div className={estilos.radioGroup}>
              <Radio
                name="vagas"
                value="ilimitadas"
                checked={vagasLimitadas === "ilimitadas"}
                onChange={(e) => setVagasLimitadas(e.target.value)}
                label="Ilimitadas"
              />
              <Radio
                name="vagas"
                value="limitadas"
                checked={vagasLimitadas === "limitadas"}
                onChange={(e) => setVagasLimitadas(e.target.value)}
                label="Limitadas"
              />
            </div>
          </div>

          {vagasLimitadas === "limitadas" && (
            <div className={estilos.inputLimitado}>
              <Input
                placeholder="Digite o número de jogadores"
                value={capacidadeMaxima}
                onChange={(e) => setCapacidadeMaxima(e.target.value)}
                type="number"
                name="capacidade-maxima"
                label="Capacidade Máxima de Jogadores"
                labelColor={corLabelInputs}
              />
            </div>
          )}
        </section>

        {/* Card 3: Regras do Torneio */}
        <section className={estilos.cartao}>
          <h3 className={estilos.tituloSessao}>Regras do Torneio</h3>
          <ul className={estilos.listaRegras}>
            <li>Formato Commander padrão (100 cartas)</li>
            <li>Time limit: 50 minutos por partida</li>
            <li>Banlist oficial da Wizards of the Coast</li>
            <li>Cada dupla deve ter decks de cores diferentes</li>
            <li>Proxies não são permitidas</li>
            <li>Comportamento respeitoso é obrigatório</li>
          </ul>
        </section>

        {/* Botões de ação */}
        <div className={estilos.botoes}>
          <Button 
            label="Cancelar" 
            onClick={() => window.history.back()}
            backgroundColor="var(--var-cor-terciaria)"
          />
          <Button 
            label="Criar Torneio"  
            onClick={enviarFormulario} 
            backgroundColor="var(--var-cor-primaria)"
          />
        </div>
      </main>
    </div>
  );
};

export default CriarTorneio;
