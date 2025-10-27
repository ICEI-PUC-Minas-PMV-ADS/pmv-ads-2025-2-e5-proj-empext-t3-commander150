import React, { useState } from "react";
import estilos from "./styles.module.css";

import Input from "../../../components/Input";
import Button from "../../../components/Button";
import Radio from "../../../components/Radio";

// Importar imagens de banner
import b1 from "../../../assets/b1.png";
import b2 from "../../../assets/b2.png";
import b3 from "../../../assets/b3.png";

// Importar serviços e tipos
import { criarTorneio, tratarErroTorneio } from "../../../services/torneioServico";
import type { ITorneioCriacao } from "../../../tipos/tipos";
import Swal from 'sweetalert2';

const CriarTorneio: React.FC = () => {
  // Estados para informações básicas
  const [nomeTorneio, setNomeTorneio] = useState("");
  const [dataHoraTorneio, setDataHoraTorneio] = useState("");
  const [bannerSelecionado, setBannerSelecionado] = useState("b1.png");
  const [bannerBase64, setBannerBase64] = useState<string>("");
  const [descricao, setDescricao] = useState("");
  const [regrasTorneio, setRegrasTorneio] = useState(`• Formato Commander padrão (100 cartas)
• Time limit: 50 minutos por partida
• Banlist oficial da Wizards of the Coast
• Cada dupla deve ter decks de cores diferentes
• Proxies não são permitidas
• Comportamento respeitoso é obrigatório`);

  // Estados para inscrições e custos
  const [modalidadeInscricao, setModalidadeInscricao] = useState("gratuito");
  const [valorInscricao, setValorInscricao] = useState("R$ 0,00");
  const [vagasLimitadas, setVagasLimitadas] = useState("limitadas");
  const [capacidadeMaxima, setCapacidadeMaxima] = useState("");

  // Estados para pontuações
  const [pontuacaoVitoria, setPontuacaoVitoria] = useState("3");
  const [pontuacaoDerrota, setPontuacaoDerrota] = useState("0");
  const [pontuacaoEmpate, setPontuacaoEmpate] = useState("1");
  const [pontuacaoBye, setPontuacaoBye] = useState("3");
  const [quantidadeRodadas, setQuantidadeRodadas] = useState("");

  // Estados para controle da API
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const corLabelInputs = "#FFFFFF";

  // Mapear nomes das imagens para os imports
  const imagensBanner = {
    "b1.png": b1,
    "b2.png": b2,
    "b3.png": b3
  };

  // Função para converter imagem para base64
  const converterImagemParaBase64 = async (imagemUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const base64 = canvas.toDataURL('image/png');
          resolve(base64);
        } else {
          reject(new Error('Não foi possível obter contexto do canvas'));
        }
      };
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = imagemUrl;
    });
  };

  // Função para converter base64 para File
  const base64ParaFile = async (base64: string, nomeArquivo: string): Promise<File> => {
    const response = await fetch(base64);
    const blob = await response.blob();
    return new File([blob], nomeArquivo, { type: 'image/png' });
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

  // Função para mapear dados do formulário para o formato da API
  const mapearDadosParaAPI = async (): Promise<ITorneioCriacao> => {
    // Converter data/hora para ISO string
    const dataHoraInicio = dataHoraTorneio 
      ? new Date(dataHoraTorneio).toISOString()
      : new Date().toISOString();

    // Converter valor monetário para número
    const valorNumerico = modalidadeInscricao === "pago" 
      ? parseFloat(valorInscricao.replace(/[^\d,]/g, '').replace(',', '.')) || 0
      : 0;

    // Converter imagem selecionada para File
    let bannerFile: File | undefined = undefined;
    if (bannerSelecionado && imagensBanner[bannerSelecionado as keyof typeof imagensBanner]) {
      try {
        const imagemUrl = imagensBanner[bannerSelecionado as keyof typeof imagensBanner];
        const base64 = await converterImagemParaBase64(imagemUrl);
        setBannerBase64(base64); // Salvar base64 para uso posterior
        bannerFile = await base64ParaFile(base64, bannerSelecionado);
      } catch (error) {
        console.error('Erro ao converter imagem:', error);
      }
    }

    return {
      nome: nomeTorneio,
      descricao: descricao || undefined,
      status: "Aberto", // Status padrão para novos torneios
      regras: regrasTorneio,
      banner: bannerFile,
      vagas_limitadas: vagasLimitadas === "limitadas",
      qnt_vagas: vagasLimitadas === "limitadas" ? parseInt(capacidadeMaxima) || undefined : undefined,
      incricao_gratuita: modalidadeInscricao === "gratuito",
      valor_incricao: modalidadeInscricao === "pago" ? valorNumerico : undefined,
      pontuacao_vitoria: parseInt(pontuacaoVitoria) || 3,
      pontuacao_derrota: parseInt(pontuacaoDerrota) || 0,
      pontuacao_empate: parseInt(pontuacaoEmpate) || 1,
      pontuacao_bye: parseInt(pontuacaoBye) || 3,
      quantidade_rodadas: quantidadeRodadas ? parseInt(quantidadeRodadas) : undefined,
      data_inicio: dataHoraInicio,
      id_loja: 1 // TODO: Obter ID da loja do usuário logado
    };
  };

  // Função de envio do formulário
  const enviarFormulario = async () => {
    // Validações
    if (!nomeTorneio || !dataHoraTorneio) {
      Swal.fire('Erro', 'Preencha os campos obrigatórios: Nome do Torneio e Data/Hora do Torneio.', 'error');
      return;
    }

    if (vagasLimitadas === "limitadas" && !capacidadeMaxima) {
      Swal.fire('Erro', 'Informe a capacidade máxima de jogadores.', 'error');
      return;
    }

    // Limpar erro anterior
    setErro(null);
    setCarregando(true);

    try {
      // Mapear dados para o formato da API
      const dadosTorneio = await mapearDadosParaAPI();
      
      // Chamar a API
      const torneioCriado = await criarTorneio(dadosTorneio);
      
      // Sucesso
      Swal.fire({
        title: 'Sucesso!',
        text: `Torneio "${torneioCriado.nome}" criado com sucesso!`,
        icon: 'success',
        confirmButtonText: 'OK'
      }).then(() => {
        // Limpar formulário após sucesso
        setNomeTorneio("");
        setDataHoraTorneio("");
        setBannerSelecionado("b1.png");
        setBannerBase64("");
        setDescricao("");
        setRegrasTorneio(`• Formato Commander padrão (100 cartas)
• Time limit: 50 minutos por partida
• Banlist oficial da Wizards of the Coast
• Cada dupla deve ter decks de cores diferentes
• Proxies não são permitidas
• Comportamento respeitoso é obrigatório`);
        setModalidadeInscricao("gratuito");
        setValorInscricao("R$ 0,00");
        setVagasLimitadas("limitadas");
        setCapacidadeMaxima("");
        setPontuacaoVitoria("3");
        setPontuacaoDerrota("0");
        setPontuacaoEmpate("1");
        setPontuacaoBye("3");
        setQuantidadeRodadas("");
      });

    } catch (error) {
      // Tratar erro
      const mensagemErro = tratarErroTorneio(error);
      setErro(mensagemErro);
      
      Swal.fire({
        title: 'Erro ao criar torneio',
        text: mensagemErro,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setCarregando(false);
    }
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
               <label className={estilos.labelInput}>Data e Hora do Torneio*</label>
               <input
                 type="datetime-local"
                 value={dataHoraTorneio}
                 onChange={(e) => setDataHoraTorneio(e.target.value)}
                 className={estilos.inputDatetime}
                 required
               />
             </div>
           </div>

           <div className={estilos.grupoInputs}>
             <div className={estilos.selecaoBanner}>
               <label className={estilos.labelBanner}>Banner do Torneio</label>
               <div className={estilos.opcoesBanner}>
                 {Object.entries(imagensBanner).map(([nome, imagem]) => (
                   <div 
                     key={nome}
                     className={`${estilos.opcaoBanner} ${bannerSelecionado === nome ? estilos.opcaoBannerSelecionada : ''}`}
                     onClick={() => setBannerSelecionado(nome)}
                   >
                     <img src={imagem} alt={`Banner ${nome}`} className={estilos.imagemBanner} />
                     <span className={estilos.nomeBanner}>{nome}</span>
                   </div>
                 ))}
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
          <Radio
            labelPrincipal="Modalidade de Inscrição"
            name="modalidade"
            opcoes={[
              { valor: "gratuito", rotulo: "Gratuito" },
              { valor: "pago", rotulo: "Pago" }
            ]}
            valorSelecionado={modalidadeInscricao}
            textColor="#FFFFFF"
            onChange={(e) => {
              setModalidadeInscricao(e.target.value);
              if (e.target.value === "gratuito") {
                setValorInscricao("R$ 0,00");
              }
            }}
          />
        </div>

           {modalidadeInscricao === "pago" && (
             <div className={estilos.grupoInputs}>
               <Input
                 placeholder="R$ 0,00"
                 value={valorInscricao}
                 onChange={(e) => setValorInscricao(formatarValor(e.target.value))}
                 type="text"
                 name="valor-inscricao"
                 label="Valor da Inscrição"
                 labelColor={corLabelInputs}
               />
             </div>
           )}

        <div className={estilos.grupoRadio}>
          <Radio
            labelPrincipal="Vagas para o torneio"
            name="vagas"
            opcoes={[
              { valor: "ilimitadas", rotulo: "Ilimitadas" },
              { valor: "limitadas", rotulo: "Limitadas" }
            ]}
            valorSelecionado={vagasLimitadas}
            textColor="#FFFFFF"
            onChange={(e) => setVagasLimitadas(e.target.value)}
          />
        </div>

          {vagasLimitadas === "limitadas" && (
            <div className={estilos.inputLimitado}>
            <Input
              placeholder="Digite o número de jogadores"
              value={capacidadeMaxima}
              onChange={(e) => setCapacidadeMaxima(e.target.value)}
              type="numero"
              name="capacidade-maxima"
              label="Capacidade Máxima de Jogadores"
              labelColor={corLabelInputs}
            />
            </div>
          )}
         </section>

         {/* Card 3: Sistema de Pontuação */}
         <section className={estilos.cartao}>
           <h3 className={estilos.tituloSessao}>Sistema de Pontuação</h3>
           
           <div className={estilos.grupoInputs}>
             <Input
               placeholder="3"
               value={pontuacaoVitoria}
               onChange={(e) => setPontuacaoVitoria(e.target.value)}
               type="numero"
               name="pontuacao-vitoria"
               label="Pontos por Vitória"
               labelColor={corLabelInputs}
             />
             <Input
               placeholder="0"
               value={pontuacaoDerrota}
               onChange={(e) => setPontuacaoDerrota(e.target.value)}
               type="numero"
               name="pontuacao-derrota"
               label="Pontos por Derrota"
               labelColor={corLabelInputs}
             />
           </div>

           <div className={estilos.grupoInputs}>
             <Input
               placeholder="1"
               value={pontuacaoEmpate}
               onChange={(e) => setPontuacaoEmpate(e.target.value)}
               type="numero"
               name="pontuacao-empate"
               label="Pontos por Empate"
               labelColor={corLabelInputs}
             />
             <Input
               placeholder="3"
               value={pontuacaoBye}
               onChange={(e) => setPontuacaoBye(e.target.value)}
               type="numero"
               name="pontuacao-bye"
               label="Pontos por Bye"
               labelColor={corLabelInputs}
             />
           </div>
         </section>

         {/* Card 4: Regras do Torneio */}
        <section className={estilos.cartao}>
          <h3 className={estilos.tituloSessao}>Regras do Torneio</h3>
          <div className={estilos.textareaContainer}>
            <textarea
              className={estilos.textarea}
              placeholder="Digite as regras do torneio..."
              value={regrasTorneio}
              onChange={(e) => setRegrasTorneio(e.target.value)}
              rows={8}
            />
          </div>
        </section>

        {/* Botões de ação */}
        <div className={estilos.botoes}>
          <Button 
            label="Cancelar" 
            onClick={() => window.history.back()}
            backgroundColor="var(--var-cor-terciaria)"
            disabled={carregando}
          />
          <Button 
            label={carregando ? "Criando..." : "Criar Torneio"}  
            onClick={enviarFormulario} 
            backgroundColor="var(--var-cor-primaria)"
            disabled={carregando}
          />
        </div>

        {/* Exibir erro se houver */}
        {erro && (
          <div className={estilos.erroContainer}>
            <p className={estilos.erroTexto}>{erro}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default CriarTorneio;
