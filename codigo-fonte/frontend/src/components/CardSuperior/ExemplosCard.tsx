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

      {/* Amarelos (isActive) */}
      <CardSuperior count={1} label="Em Andamento" icon={FiStar} isActive />
      <CardSuperior count={3} label="Torneios Futuros" icon={FiUsers} isActive />
      <CardSuperior count={12} label="Histórico" icon={FiCalendar} isActive />
    </div>
  );
}
