import React from "react";
import type { IconType } from "react-icons";
import styles from "./style.module.css";

interface CardSuperiorProps {
  icon: IconType;
  count: number | string;
  label: string;
  className?: string;
  selected?: boolean;
  secondaryCount?: number;
}

export const CardSuperior: React.FC<CardSuperiorProps> = ({
  icon: Icon,
  count,
  label,
  className,
  selected,
  secondaryCount
}) => {
  return (
    <div className={`${styles.card} ${selected ? styles.selected : ''} ${className || ''}`}>
      <Icon className={styles.cardIcon} />
      <div className={styles.cardContent}>
        <span className={styles.cardCount}>
          {count}{secondaryCount ? ` de ${secondaryCount}` : ''}
        </span>
        <span className={styles.cardLabel}>{label}</span>
      </div>
    </div>
  );
};