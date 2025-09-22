import React from "react";
import { FiCalendar, FiClock, FiMapPin, FiUsers } from "react-icons/fi";
import { FaMoneyBillWave } from "react-icons/fa";
import Button from "../Button";
import "./style.module.css";

type Status = "em_andamento" | "em_breve" | "encerrado";

interface CardDescricaoTorneioProps {
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    price: string;
    players: number;
    status: Status;
    showButton?: boolean;
    onButtonClick?: () => void;
}

const CardDescricaoTorneio: React.FC<CardDescricaoTorneioProps> = ({
    title,
    description,
    date,
    time,
    location,
    price,
    players,
    status,
    showButton = false,
    onButtonClick,
}) => {
    const getStatusLabel = () => {
        if (status === "em_andamento") {
            return "Em andamento";
        } else if (status === "em_breve") {
            return "Em breve";
        } else if (status === "encerrado") {
            return "Encerrado";
        } else {
            return "";
        }
    };

    return (
        <div className="tournament-card">
            <div className="tournament-header">
                <h3>{title}</h3>
                <span className={`status-tag ${status}`}>{getStatusLabel()}</span>
            </div>
            <p className="tournament-description">{description}</p>

            <div className="tournament-info">
                <div><FiCalendar /> {date}</div>
                <div><FiClock /> {time}</div>
                <div><FiMapPin /> {location}</div>
                <div><FaMoneyBillWave /> {price}</div>
                <div><FiUsers /> {players} jogadores inscritos</div>
            </div>

            {showButton && (
                <div className="tournament-footer">
                    <Button
                        label="Acessar mesa"
                        onClick={onButtonClick}
                        backgroundColor="#003A70"
                        textColor="#FFF"
                        width="100%"
                    />
                </div>
            )}
        </div>
    );
};

export default CardDescricaoTorneio;
