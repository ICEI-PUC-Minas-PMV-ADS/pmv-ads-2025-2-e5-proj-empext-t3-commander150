// src/components/Radio/index.tsx

/**
 * Componente de Grupo de Rádio
 *
 * O QUE É E POR QUE EXISTE?
 * Este componente renderiza um grupo de opções de rádio customizadas.
 * Foi criado para ser reutilizável e para ter um visual consistente
 * com o design do Figma, substituindo os botões de rádio padrão do navegador.
 *
 * RESPONSABILIDADES:
 * 1. Renderizar um rótulo principal e uma lista de opções de rádio.
 * 2. Gerir qual opção está selecionada com base nas props recebidas.
 * 3. Notificar o componente pai quando a seleção for alterada.
 */

// Garanta que o nome do ficheiro de estilos é exatamente 'style.module.css'
import styles from './styles.module.css';

// Define a estrutura de uma única opção de rádio.
interface OpcaoRadio {
  valor: string;  // O valor que será guardado no estado (ex: "JOGADOR")
  rotulo: string; // O texto que será exibido para o utilizador (ex: "Sou um Jogador")
}

// Define a "planta baixa" das propriedades que o componente aceita.
interface RadioProps {
  labelPrincipal?: string;
  name: string;
  opcoes: OpcaoRadio[];
  valorSelecionado: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Radio = ({
  labelPrincipal,
  name,
  opcoes,
  valorSelecionado,
  onChange,
}: RadioProps) => {
  return (
    <div className={styles.radioGroup}>
      {labelPrincipal && <span className={styles.labelPrincipal}>{labelPrincipal}</span>}

      <div className={styles.opcoesContainer}>
        {opcoes.map((opcao) => (
          // A 'div' funciona como um container para cada opção,
          // o que ajuda no alinhamento e no clique.
          <div key={opcao.valor} className={styles.opcaoWrapper}>
            <input
              type="radio"
              id={opcao.valor}
              name={name}
              value={opcao.valor}
              checked={valorSelecionado === opcao.valor}
              onChange={onChange}
              className={styles.inputRadio}
            />
            {/*
              O 'label' agora é um irmão do 'input', não o pai.
              A ligação entre eles é feita pelo 'htmlFor' e 'id'.
              Esta estrutura permite que o CSS use o seletor '+',
              corrigindo o problema visual.
            */}
            <label
              htmlFor={opcao.valor}
              className={styles.labelOpcao}
            >
              {opcao.rotulo}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Radio;