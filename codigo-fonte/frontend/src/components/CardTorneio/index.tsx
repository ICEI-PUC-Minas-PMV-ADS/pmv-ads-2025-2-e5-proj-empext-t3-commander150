// src/components/CardTorneio/index.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./styles.module.css";
import Swal from 'sweetalert2';

interface TagProps {
  texto: string;
  icone?: React.ReactNode;
  corFundo?: string;
}

interface CardTorneioProps {
  id: number;
  imagem: string;
  titulo: string;
  data: string; // Data formatada (ex: 18.08.23)
  hora: string; // Hora formatada (ex: 19:00)
  dataOriginal: string; // Data/hora original do torneio para comparação
  tags?: TagProps[];
  loja?: string;
  status?: string;
  usuario?: any;
  onInscreverJogador?: () => void;
}

const CardTorneio = ({ 
  id, 
  imagem, 
  titulo, 
  data, 
  hora, 
  dataOriginal, // Nova prop
  tags = [], 
  loja, 
  status, 
  usuario,
  onInscreverJogador
}: CardTorneioProps) => {
  const navigate = useNavigate();

  // Função para verificar se o torneio já aconteceu
  // const torneioJaOcorreu = () => {
  //   const dataTorneio = new Date(dataOriginal);
  //   const dataAtual = new Date();
  //   return dataTorneio < dataAtual;
  // };

  // Função para mostrar alerta de torneio já realizado
  const mostrarAlertaTorneioPassado = () => {
    Swal.fire({
      title: 'Torneio já realizado',
      text: 'Este torneio já aconteceu e não está mais disponível para inscrição.',
      icon: 'warning',
      confirmButtonText: 'Entendi',
      confirmButtonColor: '#334155',
    });
  };

  // Função para lidar com o clique no card
  const handleClick = () => {
    // Se for loja, não navega ao clicar no card
    if (usuario?.tipo === 'LOJA') {
      return;
    }

    // Verifica se o torneio já aconteceu
    // if (torneioJaOcorreu()) {
    //   mostrarAlertaTorneioPassado();
    //   return;
    // }
    
    if (usuario) {
      navigate(`/inscricao-torneio/${id}`);
    } else {
      localStorage.setItem('redirectAfterLogin', `/inscricao-torneio/${id}`);
      navigate('/login/');
    }
  };

  // Função para lidar com o botão de inscrever jogador
  const handleInscreverJogador = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Verifica se o torneio já aconteceu antes de inscrever
    // if (torneioJaOcorreu()) {
    //   mostrarAlertaTorneioPassado();
    //   return;
    // }
    
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
        
        {/* Badge se torneio já aconteceu */}
        {/*
        {torneioJaOcorreu() && (
          <div className={styles.badgeExpirado}>
            Realizado
          </div>
        )}
        */}
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
            // disabled={false} // Desabilita se torneio já aconteceu
          >
            {'+ Inscrever Jogador'}
          </button>
        )}
      </div>
    </div>
  );
};

export default CardTorneio;