// src/components/Input/index.tsx

/**
 * Componente de Input Reutilizável
 *
 * O QUE É E POR QUE EXISTE?
 * Este é o componente padrão de input para a aplicação, desenhado para ser
 * flexível e reutilizável em diversos formulários.
 *
 * RESPONSABILIDADES:
 * 1. Renderizar um campo de input com um rótulo (label) associado.
 * 2. Suportar os tipos 'text', 'email' e 'password'.
 * 3. Para o tipo 'password', incluir a funcionalidade de mostrar/ocultar a senha.
 * 4. Realizar uma validação básica para o tipo 'email'.
 */

import { useState } from "react";
// Importa os estilos do ficheiro CSS Module local.
import styles from "./style.module.css";
// Importa os ícones para a funcionalidade de mostrar/ocultar senha.
// Nota: É necessário ter a biblioteca 'react-icons' instalada: npm install react-icons
import { FaEye, FaEyeSlash } from "react-icons/fa";

// Define a "planta baixa" das propriedades que o componente aceita.
interface InputProps {
  type: "text" | "email" | "password";
  name: string;
  placeholder?: string;
  placeholderColor?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  minLength?: number;
  required?: boolean;
  label?: string;
  labelAlign?: "left" | "center" | "right";
  labelColor?: string;
  textColor?: string;
  backgroundColor?: string;
}

const Input = ({
  type,
  name,
  placeholder,
  value,
  onChange,
  minLength,
  required = false,
  label,
  labelAlign,
  labelColor,
  textColor,
  backgroundColor,

}: InputProps) => {
  // Estado para controlar a visibilidade da senha.
  const [mostrarSenha, setMostrarSenha] = useState(false);
  // Estado para armazenar a mensagem de erro da validação de email.
  const [erroEmail, setErroEmail] = useState("");

  // Alterna a visibilidade da senha.
  const handleAlternarSenha = () => {
    setMostrarSenha(!mostrarSenha);
  };

  // Valida o formato do email enquanto o utilizador digita.
  const handleValidacaoEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const emailRegex = /\S+@\S+\.\S+/;
    const valorInput = e.target.value;
    if (type === "email" && valorInput && !emailRegex.test(valorInput)) {
      setErroEmail("Email inválido");
    } else {
      setErroEmail("");
    }
    // Propaga a alteração para o componente pai.
    onChange(e);
  };

  return (
    <div className={styles.inputGroup}>
      {/* O rótulo (label) só é renderizado se a prop 'label' for fornecida. */}
      {label && <label htmlFor={name}
       className={styles.label}
       style={{
            textAlign: labelAlign ?? "left",
            color: labelColor ?? "var(--cor-texto-principal)"
          }}
       >
      {label}
      </label>}

      <div className={styles.inputWrapper}>
        <input
          id={name}
          name={name}
          className={styles.input}
          // A lógica para alternar o tipo do input entre 'password' e 'text'.
          type={type === "password" && mostrarSenha ? "text" : type}
          placeholder={placeholder}
          value={value}
          // Usa a função de validação se o tipo for 'email'.
          onChange={type === "email" ? handleValidacaoEmail : onChange}
          required={required}
          minLength={type === "password" && minLength ? minLength : undefined}
          style={{ 
            color: textColor ?? "var(--var-cor-cinza-titulos)" ,
            backgroundColor: backgroundColor ?? "var(--var-cor-azul-fundo-section)",
          }}
        />

        {/* O ícone de olho só é renderizado se o tipo for 'password'. */}
        {type === "password" && (
          <span className={styles.eyeIcon} onClick={handleAlternarSenha}>
            {mostrarSenha ? <FaEyeSlash /> : <FaEye />}
          </span>
        )}
      </div>

      {/* A mensagem de erro só é renderizada se houver um erro de email. */}
      {erroEmail && <small className={styles.error}>{erroEmail}</small>}
    </div>
  );
};

export default Input;