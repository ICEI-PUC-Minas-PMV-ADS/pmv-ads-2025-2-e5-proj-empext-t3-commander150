// src/routes/AppRoutes.tsx

import { Routes, Route } from "react-router-dom";
import Layout from "../components/Layout";
import PaginaLogin from "../pages/PaginaLogin";
import App from "../App";

// Importa os nossos componentes de lógica de rota
import { RotaSegura } from "./RotaSegura";
import PaginaDashboard from "../pages/Dashboard";

export default function AppRoutes() {
  return (
    <Routes>
      {/* --- Grupo 1: Rotas Públicas --- */}
      {/*
        Estas rotas são renderizadas sem nenhum Layout ou verificação de segurança.
        Isto garante que a página de login não terá a Navbar da aplicação principal.
      */}
      <Route path="/login" element={<PaginaLogin />} />


      {/* --- Grupo 2: Rotas Protegidas com Layout --- */}
      {/*
        1. A RotaSegura é o elemento "pai" mais externo. A verificação de
           segurança acontece ANTES de qualquer coisa visual ser renderizada (isso evita aquela rápida piscadela de conteúdo indevida).
        2. Se o usuário estiver logado, a RotaSegura renderiza o <Outlet />, que neste
           caso é o Layout.
        3. O Layout renderiza a Navbar e o seu próprio <Outlet />, que
           finalmente renderiza a página protegida (ex: PaginaDashboard).
      */}
      <Route element={<RotaSegura />}>
        <Route element={<Layout />}>
          <Route path="/" element={<App />} />
          <Route path="/dashboard" element={<PaginaDashboard />} />

          {/* Adicionar outras rotas protegidas aqui no futuro */}
        </Route>
      </Route>

    </Routes>
  );
}