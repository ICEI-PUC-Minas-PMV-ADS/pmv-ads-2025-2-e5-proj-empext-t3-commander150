import { CardSuperior } from "./index";
import { FiUsers, FiStar, FiCalendar } from "react-icons/fi";

//Esses exemplos mostram os cards na versão inativa(lilás) e ativa(amarela), e com os
// icons dinamicos

export default function ExemplosCardSuperior() {
  return (
    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
      {/* Lilás (padrão) */}
      <CardSuperior count={3} label="Torneios Futuros" icon={FiUsers} />
      <CardSuperior count={12} label="Histórico" icon={FiCalendar} />
      <CardSuperior count={1} label="Em Andamento" icon={FiStar} />

      {/* Amarelos (selected) */}
      <CardSuperior count={1} label="Em Andamento" icon={FiStar} selected />
      <CardSuperior count={3} label="Torneios Futuros" icon={FiUsers} selected />
      <CardSuperior count={12} label="Histórico" icon={FiCalendar} selected />
    </div>
  );
}
