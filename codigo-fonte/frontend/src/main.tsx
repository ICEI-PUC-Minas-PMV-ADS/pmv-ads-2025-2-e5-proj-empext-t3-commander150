// src/main.tsx

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';

import AppRoutes from './routes/AppRoutes';
import { GerenciadorSessao } from './contextos/AuthContexto';

// Encontra o elemento 'root' no HTML.
const rootElement = document.getElementById('root');

// Garante que o elemento root existe antes de renderizar.
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      {/* O BrowserRouter habilita o sistema de rotas na aplicação. */}
      <BrowserRouter>
        {/*
          O GerenciadorSessao "envolve" toda a aplicação.
          Isso significa que qualquer componente dentro de AppRoutes
          (ou seja, todas as páginas) terá acesso ao estado de autenticação (os dados do Usuário e Sessão) usando o hook 'useSessao'.
        */}
        <GerenciadorSessao>
          <AppRoutes />
        </GerenciadorSessao>
      </BrowserRouter>
    </StrictMode>
  );
}