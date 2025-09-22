import React from "react";
import type { IconType } from "react-icons";
import "./style.module.css";

type CardProps = {
  count: number;
  label: string;
  icon: IconType; 
  isActive?: boolean;
};

export const CardSuperior: React.FC<CardProps> = ({ count, label, icon: Icon, isActive }) => {
  return (
    <div className={`card ${isActive ? "active" : "inactive"}`}>
      <Icon className="card-icon" />
      <div className="card-content">
        <span className="card-count">{count}</span>
        <span className="card-label">{label}</span>
      </div>
    </div>
  );
};
