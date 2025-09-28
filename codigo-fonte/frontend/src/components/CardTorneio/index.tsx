// src/components/CardTorneio/index.tsx

import styles from "./styles.module.css";

interface TagProps {
  texto: string;
  icone?: React.ReactNode; // ícone opcional (esquerda)
  corFundo?: string; // cor customizável
}

interface CardTorneioProps {
  imagem: string; // URL da imagem
  titulo: string; // título do torneio
  data: string; // data (ex: 18.08.23)
  hora: string; // hora (ex: 19:00)
  tags?: TagProps[]; // lista de tags
}

const CardTorneio = ({ imagem, titulo, data, hora, tags = [] }: CardTorneioProps) => {
  return (
    <div className={styles.card}>
      {/* Imagem com degradê */}
      <div className={styles.imagemWrapper}>
        <img src={imagem} alt={titulo} className={styles.imagem} />
        <div className={styles.degrade}></div>
      </div>

      {/* Conteúdo abaixo da imagem */}
      <div className={styles.conteudo}>
        <h3 className={styles.titulo}>{titulo}</h3>
        <p className={styles.data}>
          {data} • {hora}
        </p>

        {/* Tags */}
        <div className={styles.tags}>
          {tags.map((tag, index) => (
            <div
              key={index}
              className={styles.tag}
              style={{ backgroundColor: tag.corFundo ?? "#334155" }}
            >
              {tag.icone && <span className={styles.icone}>{tag.icone}</span>}
              <span>{tag.texto}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CardTorneio;
