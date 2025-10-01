// src/routes/AppRoutes.tsx

import { Routes, Route } from "react-router-dom";
import Layout from "../components/Layout";
import PaginaLogin from "../pages/auth/login";
import App from "../App";

// Importa os nossos componentes de lógica de rota
import { RotaSegura } from "./RotaSegura";
import JogadorTeste from "../pages/Testes/JogadorTeste";
import LojaTeste from "../pages/Testes/LojaTeste";
import PaginaRecuperarSenha from "../pages/auth/recuperar-senha";
import PaginaCadastrar from "../pages/auth/cadastrar";
import PaginaAlterarSenha from "../pages/auth/alterar-senha";
import InscricaoTorneio from "../pages/Torneio/inscrever";
import PaginaTorneio from "../pages/Torneio/visualizar";
import CriarTorneio from "../pages/Torneio/criar";

export default function AppRoutes() {
  return (
    <Routes>
      {/* --- Grupo 1: Rotas Públicas --- */}
      {/*
        Estas rotas são renderizadas sem nenhum Layout ou verificação de segurança.
        Isto garante que a página de login não terá a Navbar da aplicação principal.
      */}
      <Route path="/" element={<App />} />
      <Route path="/login/" element={<PaginaLogin />} />
      <Route path="/recuperar-senha/" element={<PaginaRecuperarSenha />} />
      <Route path="/cadastrar/" element={<PaginaCadastrar />} />


      {/* --- Grupo 2: Rotas Protegidas com Layout --- */}
      {/*
        1. A RotaSegura é o elemento "pai" mais externo. A verificação de
           segurança acontece ANTES de qualquer coisa visual ser renderizada (isso evita aquela rápida "piscadela" de conteúdo indevida).
        2. Se o usuário estiver logado, a RotaSegura renderiza o <Outlet />, que neste
           caso é o Layout.
        3. O Layout renderiza a Navbar e o seu próprio <Outlet />, que
           finalmente renderiza a página protegida (ex: App).
      */}
      <Route element={<RotaSegura />}>
        <Route element={<Layout />}>
          <Route path="/jogador/" element={<JogadorTeste />} />
          <Route path="/loja/" element={<LojaTeste />} />
          <Route path="/admin/" element={<App />} />
          <Route path="/alterar-senha/" element={<PaginaAlterarSenha />} />
          <Route path="/torneio/" element={<PaginaTorneio />} />
          <Route path="/inscricao-torneio/:id" element={<InscricaoTorneio />} />
          <Route path="/criar-evento/" element={<CriarTorneio />} />


        </Route>
      </Route>

    </Routes>
  );
}