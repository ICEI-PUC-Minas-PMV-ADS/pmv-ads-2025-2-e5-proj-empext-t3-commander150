// src/App.tsx
import estilos from "./App.module.css";

// Importar imagens de banner
import b1 from "./assets/b1.png";
import b2 from "./assets/b2.png";
import b3 from "./assets/b3.png";

// Importa o CardTorneio já pronto
import CardTorneio from "./components/CardTorneio";

// Importa ícones do react-icons (se precisar para as tags)
import { FaUsers, FaLock } from "react-icons/fa";

function App() {
  // Exemplo de dados mockados dos torneios
  const torneios = [
    {
      imagem: b1,
      titulo: "Open Tour Winter Split",
      data: "09.06.23",
      hora: "21:00",
      tags: [
        { texto: "2v2", icone: <FaUsers /> },
        { texto: "Casual" },
      ],
    },
    {
      imagem: b2,
      titulo: "Copa Mystical Arcanum",
      data: "05.05.23",
      hora: "15:00",
      tags: [
        { texto: "2v2", icone: <FaUsers /> },
        { texto: "Com permissão", icone: <FaLock /> },
      ],
    },
    {
      imagem: b3,
      titulo: "Wakfu Championship",
      data: "04.07.23",
      hora: "21:00",
      tags: [
        { texto: "2v2", icone: <FaUsers /> },
        { texto: "Casual" },
      ],
    },
    {
      imagem: b1,
      titulo: "Goultaminator Junior",
      data: "18.08.23",
      hora: "19:00",
      tags: [
        { texto: "2v2", icone: <FaUsers /> },
        { texto: "Com permissão", icone: <FaLock /> },
      ],
    },
    {
      imagem: b2,
      titulo: "Copa Mystical Arcanum",
      data: "05.05.23",
      hora: "15:00",
      tags: [
        { texto: "2v2", icone: <FaUsers /> },
        { texto: "Com permissão", icone: <FaLock /> },
      ],
    },
    {
      imagem: b3,
      titulo: "Wakfu Championship",
      data: "04.07.23",
      hora: "21:00",
      tags: [
        { texto: "2v2", icone: <FaUsers /> },
        { texto: "Casual" },
      ],
    },
  ];

  return (
    <div className={estilos.app}>
      {/* HERO */}
      <section className={estilos.hero}>
        <div className={estilos.heroConteudo}>
          <h1 className={estilos.titulo}>Commander 150</h1>
          <p className={estilos.subtitulo}>
            Sistema para torneios 2v2 de Magic: The Gathering. <br />
            Encontre seu parceiro, monte sua estratégia e domine o multiverso!
          </p>
        </div>
      </section>

      {/* LISTAGEM DE TORNEIOS */}
      <section className={estilos.listaTorneios}>
        <h2 className={estilos.tituloSecao}>Torneios disponíveis</h2>
        <div className={estilos.gridTorneios}>
          {torneios.map((torneio, index) => (
            <CardTorneio key={index} {...torneio} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;
