import React from "react";
import type { IconType } from "react-icons";
import styles from "./style.module.css";

type CardProps = {
  count: number;
  label: string;
  icon: IconType; 
  isActive?: boolean;
};

export const CardSuperior: React.FC<CardProps> = ({ count, label, icon: Icon, isActive }) => {
  return (
    <div className={`${styles.card} ${isActive ? styles.active : styles.inactive}`}>
      <Icon className={styles.cardIcon} />
      <div className={styles.cardContent}>
        <span className={styles.cardCount}>{count}</span>
        <span className={styles.cardLabel}>{label}</span>
      </div>
    </div>
  );
};
