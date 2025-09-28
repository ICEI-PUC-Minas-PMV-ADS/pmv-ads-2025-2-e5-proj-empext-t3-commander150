// src/components/Layout.tsx

/**
 * Componente de Layout Principal
 *
 * O QUE É E POR QUE EXISTE?
 * Este componente define a estrutura visual comum a todas as páginas da
 * aplicação, como a barra de navegação (Navbar).
 *
 * RESPONSABILIDADES:
 * 1. Renderizar os elementos visuais que se repetem em todas as páginas.
 * 2. Utilizar o componente <Outlet /> do react-router-dom para renderizar
 * o conteúdo específico da página atual.
 */

import { Outlet } from 'react-router-dom';
// A importação foi corrigida para usar a exportação padrão (default) do ficheiro Navbar.
import Navbar from './Navbar';
import './Layout.css';

// O componente Layout já não precisa da prop 'children', pois o <Outlet />
// assume essa responsabilidade de forma dinâmica.
const Layout = () => {
  return (
    <div>
      {/* A Navbar será exibida em todas as páginas */}
      <Navbar />

      {/* Compensa a altura da navbar fixa */}
      <main className="main-content">
        {/*
          O <Outlet /> funciona como um espaço reservado.
          O react-router-dom irá substituir este Outlet pelo componente
          da rota que corresponde à URL atual.
        */}
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;