// src/components/Input/index.tsx

/**
 * Componente de Input Reutilizável
 *
 * SUPORTA:
 * - Texto, Email, Senha
 * - Data (dd/MM/yyyy com máscara)
 * - Hora (HH:mm com máscara)
 * - Telefone ((DD)XXXXX-XXXX ou (DD)XXXX-XXXX)
 * - Número inteiro
 * - Número decimal (com casas configuráveis)
 * - Dinheiro em Real (R$)
 * - Multiline (textarea para textos longos)
 */

import { useState } from "react";
import styles from "./style.module.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

// Definição das propriedades aceitas pelo componente
interface InputProps {
  type:
    | "text"
    | "email"
    | "password"
    | "data"
    | "hora"
    | "telefone"
    | "numero"
    | "decimal"
    | "dinheiro";
  name: string;
  placeholder?: string;
  placeholderColor?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  minLength?: number;
  required?: boolean;
  label?: string;
  labelAlign?: "left" | "center" | "right";
  labelColor?: string;
  textColor?: string;
  backgroundColor?: string;
  casasDecimais?: number; // usado para decimal/dinheiro
  multiline?: boolean; // se true, usa <textarea> e permite textos longos multilinha
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
  casasDecimais = 2,
  multiline = false,
}: InputProps) => {
  // Estado local para alternar a visibilidade da senha
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Estado de mensagem de erro apenas para email
  const [erroEmail, setErroEmail] = useState("");

  // Alternar entre mostrar/ocultar senha
  const handleAlternarSenha = () => {
    setMostrarSenha(!mostrarSenha);
  };

  // Validação simples para emails
  const handleValidacaoEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const emailRegex = /\S+@\S+\.\S+/;
    const valorInput = e.target.value;
    if (type === "email" && valorInput && !emailRegex.test(valorInput)) {
      setErroEmail("Email inválido");
    } else {
      setErroEmail("");
    }
    onChange(e);
  };

  /**
   * Aplica as máscaras específicas para cada tipo customizado
   */
  const aplicarMascara = (valor: string): string => {
    if (type === "data") {
      valor = valor.replace(/\D/g, "");
      if (valor.length > 8) valor = valor.slice(0, 8);
      if (valor.length > 4) return valor.replace(/(\d{2})(\d{2})(\d{0,4})/, "$1/$2/$3");
      if (valor.length > 2) return valor.replace(/(\d{2})(\d{0,2})/, "$1/$2");
      return valor;
    }

    if (type === "hora") {
      valor = valor.replace(/\D/g, "");
      if (valor.length > 4) valor = valor.slice(0, 4);
      if (valor.length >= 3) return valor.replace(/(\d{2})(\d{0,2})/, "$1:$2");
      return valor;
    }


    if (type === "telefone") {
      valor = valor.replace(/\D/g, "");
      if (valor.length > 11) valor = valor.slice(0, 11);
      if (valor.length <= 10) {
        return valor.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
      } else {
        return valor.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
      }
    }

    if (type === "numero") {
      return valor.replace(/\D/g, "");
    }

    if (type === "decimal") {
      valor = valor.replace(",", ".").replace(/[^0-9.]/g, "");
      const partes = valor.split(".");
      if (partes.length > 2) {
        valor = partes[0] + "." + partes.slice(1).join("");
      }
      if (partes[1]) {
        valor = partes[0] + "." + partes[1].slice(0, casasDecimais);
      }
      return valor;
    }

    if (type === "dinheiro") {
      valor = valor.replace(/\D/g, "");
      const numero = (parseInt(valor, 10) / 100).toFixed(casasDecimais);
      return (
        "R$ " + // prefixo
        numero
          .toString()
          .replace(".", ",")
          .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
      );
    }


    return valor;
  };

  /**
   * Handler para inputs com máscara (data, telefone, número, decimal, dinheiro)
   */
  const handleMudancaComMascara = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const valorOriginal = e.target.value;
    const valorFormatado = aplicarMascara(valorOriginal);
    e.target.value = valorFormatado;
    onChange(e);
  };

  return (
    <div className={styles.inputGroup}>
      {/* Label opcional */}
      {label && (
        <label
          htmlFor={name}
          className={styles.label}
          style={{
            textAlign: labelAlign ?? "left",
            color: labelColor ?? "var(--cor-texto-principal)",
          }}
        >
          {label}
        </label>
      )}

      <div className={styles.inputWrapper}>
        {/* Renderiza textarea se for multiline, caso contrário usa input */}
        {multiline ? (
          <textarea
            id={name}
            name={name}
            className={styles.input}
            placeholder={placeholder}
            value={value}
            onChange={
              ["data", "hora", "telefone", "numero", "decimal", "dinheiro"].includes(type)
                ? handleMudancaComMascara
                : onChange
            }
            required={required}
            style={{
              color: textColor ?? "var(--var-cor-cinza-titulos)",
              backgroundColor:
                backgroundColor ?? "var(--var-cor-azul-fundo-section)",
              minHeight: "80px", // altura mínima para textos longos
              resize: "vertical", // usuário pode redimensionar verticalmente
            }}
          />
        ) : (
          <input
            id={name}
            name={name}
            className={styles.input}
            type={type === "password" && mostrarSenha ? "text" : "text"}
            placeholder={placeholder}
            value={value}
            onChange={
              type === "email"
                ? handleValidacaoEmail
                : ["data", "telefone", "numero", "decimal", "dinheiro"].includes(type)
                ? handleMudancaComMascara
                : onChange
            }
            required={required}
            minLength={type === "password" && minLength ? minLength : undefined}
            style={{
              color: textColor ?? "var(--var-cor-cinza-titulos)",
              backgroundColor:
                backgroundColor ?? "var(--var-cor-azul-fundo-section)",
            }}
          />
        )}

        {/* Ícone para mostrar/ocultar senha (apenas para password) */}
        {type === "password" && !multiline && (
          <span className={styles.eyeIcon} onClick={handleAlternarSenha}>
            {mostrarSenha ? <FaEyeSlash /> : <FaEye />}
          </span>
        )}
      </div>

      {/* Mensagem de erro apenas para email */}
      {erroEmail && <small className={styles.error}>{erroEmail}</small>}
    </div>
  );
};

export default Input;
