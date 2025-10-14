// src/components/CardTorneio/index.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./styles.module.css";

interface TagProps {
  texto: string;
  icone?: React.ReactNode; // ícone opcional (esquerda)
  corFundo?: string; // cor customizável
}

interface CardTorneioProps {
  id: number; // ID do torneio
  imagem: string; // URL da imagem
  titulo: string; // título do torneio
  data: string; // data (ex: 18.08.23)
  hora: string; // hora (ex: 19:00)
  tags?: TagProps[]; // lista de tags
  loja?: string; // nome da loja
  status?: string; // status do torneio
  usuario?: any; // dados do usuário logado
  onInscreverJogador?: () => void; // callback para inscrever jogador (apenas para lojas)
}

const CardTorneio = ({ 
  id, 
  imagem, 
  titulo, 
  data, 
  hora, 
  tags = [], 
  loja, 
  status, 
  usuario,
  onInscreverJogador
}: CardTorneioProps) => {
  const navigate = useNavigate();

  // Função para lidar com o clique no card
  const handleClick = () => {
    // Se for loja, não navega ao clicar no card
    if (usuario?.tipo === 'LOJA') {
      return;
    }
    
    if (usuario) {
      // Se usuário está logado, vai direto para inscrição
      navigate(`/inscricao-torneio/${id}`);
    } else {
      // Se não está logado, vai para login com redirecionamento
      // Salvar o ID do torneio no localStorage para redirecionar após login
      localStorage.setItem('redirectAfterLogin', `/inscricao-torneio/${id}`);
      navigate('/login/');
    }
  };

  // Função para lidar com o botão de inscrever jogador
  const handleInscreverJogador = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que o clique no botão dispare o handleClick do card
    if (onInscreverJogador) {
      onInscreverJogador();
    }
  };

  return (
    <div className={styles.card} onClick={handleClick} style={{ cursor: 'pointer' }}>
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

        {/* Botão de inscrever jogador (apenas para lojas) */}
        {usuario?.tipo === 'LOJA' && onInscreverJogador && (
          <button 
            className={styles.btnInscrever}
            onClick={handleInscreverJogador}
          >
            + Inscrever Jogador
          </button>
        )}
      </div>
    </div>
  );
};

export default CardTorneio;
