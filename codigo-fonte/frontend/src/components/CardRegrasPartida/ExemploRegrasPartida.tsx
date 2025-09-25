// ficheiro apenas de exemplo para CardRegrasPartida.tsx
//import React from "react"; // até o momento não foi necessário.
import RegrasPartida from "./index";

export default function ExemploRegrasPartida() {
    return (
        <div style={{ padding: 24, background: "#0b0f1a", minHeight: "100vh" }}>
            <RegrasPartida
                regras={[
                    "Texto padrão.",
                    "Texto padrão.",
                    "Texto padrão.",
                    "Cada jogador começa com 40 pontos de vida.",
                    "Não são permitidas cartas proxies.",
                    "O tempo de cada rodada é de 50 minutos.",
                    "Decks devem seguir as regras do formato Commander.",
                    "Texto padrão.",
                ]}
            />
        </div>
    );
}
