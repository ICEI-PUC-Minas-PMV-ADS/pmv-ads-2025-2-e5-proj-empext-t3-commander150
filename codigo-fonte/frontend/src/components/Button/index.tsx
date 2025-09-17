import React from 'react';
import styles from './Button.module.css';

type ButtonType = 'button' | 'submit' | 'reset';

// Define a "planta baixa" das propriedades que o componente aceita.
interface ButtonProps {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  width?: string;
  height?: string;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: string;
  fontWeight?: number;
  borderRadius?: string;
  paddingVertical?: string;
  paddingHorizontal?: string;
  className?: string;
  disabled?: boolean;
  type?: ButtonType;
};

/**
 * Botão reutilizável
 * 
 * @param label Texto exibido no botão
 * @param onClick Função chamada ao clicar no botão
 * @param disabled Define se o botão está desabilitado
 * @param icon Ícone opcional exibido à esquerda do texto
 * @param width Largura do botão (ex: '140px')
 * @param height Altura do botão (ex: '44px')
 * @param backgroundColor Cor de fundo do botão (ex: '#46AF87')
 * @param textColor Cor do texto (ex: '#FFFFFF')
 * @param fontSize Tamanho da fonte (ex: '14px')
 * @param fontWeight Peso da fonte (ex: 600)
 * @param borderRadius Arredondamento da borda (ex: '8px')
 * @param paddingVertical Espaçamento interno vertical (ex: '8px')
 * @param paddingHorizontal Espaçamento interno horizontal (ex: '20px')
 * @param type Tipo do botão: 'button', 'submit' ou 'reset' (padrão: 'button')
 */
const Button = ({
  label,
  onClick,
  disabled = false,
  icon,
  width = '100%',
  height = '38px',
  backgroundColor = '#003A70',
  textColor = '#FFFFFF',
  fontSize = '12px',
  fontWeight = 600,
  borderRadius = '6px',
  paddingVertical = '8px',
  paddingHorizontal = '20px',
  className,

  type = 'button',
}: ButtonProps) => {
  
  return (
    <button
  className={`${styles.button} ${className ?? ''}`}
  type={type}
  onClick={onClick}
  disabled={disabled}
  style={{
    width,
    height,
    backgroundColor,
    color: textColor,
    borderRadius,
    padding: `${paddingVertical} ${paddingHorizontal}`,
    fontSize,
    fontWeight,
    cursor: disabled ? "not-allowed" : "pointer", // <- cursor diferente
    opacity: disabled ? 0.6 : 1, // <- visual de botão desabilitado
  }}
>
  {icon && <span className={styles.icon}>{icon}</span>}
  {label}
</button>

  );
};
export default Button;