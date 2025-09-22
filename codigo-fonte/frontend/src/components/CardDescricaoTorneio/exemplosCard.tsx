import CardDescricaoTorneio from "./index";

export default function App() {
  return (
    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {/* Tag em andamento e com o botão */}
      <CardDescricaoTorneio
        title="Copa Mystical Arcanum"
        description="Descrição do torneio"
        date="05/05/2023"
        time="14:00"
        location="Loja Cards & Dragons"
        price="R$ 25,00"
        players={12}
        status="em_andamento"
        showButton
        onButtonClick={() => alert("Acessando mesa...")}
      />

      {/* tag em breve sem botão */}
      <CardDescricaoTorneio
        title="Wakfu Championship"
        description="Descrição do torneio"
        date="05/05/2023"
        time="14:00"
        location="Loja Cards & Dragons"
        price="R$ 25,00"
        players={12}
        status="em_breve"
      />

      {/* tag encerado sem botão */}
      <CardDescricaoTorneio
        title="Clash Finals"
        description="Descrição do torneio"
        date="06/05/2023"
        time="18:00"
        location="Loja Cards & Dragons"
        price="R$ 30,00"
        players={16}
        status="encerrado"
      />
    </div>
  );
}
