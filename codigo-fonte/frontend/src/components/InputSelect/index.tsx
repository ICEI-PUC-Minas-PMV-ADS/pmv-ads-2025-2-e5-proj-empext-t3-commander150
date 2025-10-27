// src/components/InputSelect/index.tsx

/**
 * Componente de InputSelect Reutilizável
 *
 * SUPORTA:
 * - Select com opções personalizáveis
 * - Label opcional
 * - Placeholder
 * - Estados desabilitados/bloqueados
 * - Requisição obrigatória
 */

import React from "react";
import styles from "../Input/style.module.css";

// Definição das propriedades aceitas pelo componente
interface InputSelectProps {
  name: string;
  placeholder?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string | number; label: string }[];
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean; // Nova propriedade: mostra valor sem permitir edição
  label?: string;
  labelAlign?: "left" | "center" | "right";
  labelColor?: string;
  textColor?: string;
  backgroundColor?: string;
}

const InputSelect: React.FC<InputSelectProps> = ({
  name,
  placeholder = "Selecione uma opção",
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  readOnly = false,
  label,
  labelAlign,
  labelColor,
  textColor,
  backgroundColor,
}) => {
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

      {readOnly ? (
        // Modo apenas leitura: mostra apenas o valor selecionado em um div estilizado
        <div
          className={styles.input}
          style={{
            color: textColor ?? "var(--var-cor-cinza-titulos)",
            backgroundColor: backgroundColor ?? "var(--var-cor-azul-fundo-section)",
            cursor: "default",
            borderColor: "#ddd", // borda mais suave
          }}
          aria-readonly="true"
        >
          {options.find(option => option.value === value)?.label || "Nenhum"}
        </div>
      ) : (
        // Modo select normal
        <div className={styles.inputWrapper}>
          <select
            id={name}
            name={name}
            className={styles.input}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            style={{
              color: textColor ?? "var(--var-cor-cinza-titulos)",
              backgroundColor: backgroundColor ?? "var(--var-cor-azul-fundo-section)",
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default InputSelect;
