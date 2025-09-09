/**
 * Componente RotaSegura (O "Segurança" das Rotas)
 *
 * O QUE É E POR QUE EXISTE?
 * Este componente atua como um porteiro para as páginas que só devem ser
 * acessíveis por utilizadores autenticados (ex: /perfil, /dashboard).
 * Ele não tem uma aparência visual, a sua única função é lógica.
 *
 * RESPONSABILIDADES:
 * 1. Verificar o estado da autenticação consultando o "Placar Central" (AuthContexto).
 * 2. Renderizar a página protegida se o utilizador estiver autenticado.
 * 3. Redirecionar o utilizador para a página de login se não estiver autenticado.
 * 4. Exibir um estado de "a carregar" enquanto a sessão inicial é verificada,
 * evitando redirecionamentos incorretos.
 *
 * COMO USAR:
 * No ficheiro de rotas (AppRoutes.tsx), envolve-se o componente da página que
 * se quer proteger com o componente RotaSegura.
 *
 * Exemplo de uso em AppRoutes.tsx:
 *
 * import { RotaSegura } from './RotaSegura';
 * import { PaginaPerfil } from '../pages/Perfil';
 *
 * <Route path="/perfil" element={
 * <RotaSegura>
 * <PaginaPerfil />
 * </RotaSegura>
 * } />
 */

import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

// Importa o hook 'useSessao' para obter os dados de autenticação.
import { useSessao } from '../contextos/AuthContexto';

// Define as propriedades que o componente RotaSegura pode receber.
// 'children' representa o componente/página que está a ser protegido.
interface RotaSeguraProps {
  children: ReactNode;
}

export const RotaSegura = ({ children }: RotaSeguraProps) => {
  // Acede às informações do nosso contexto de autenticação.
  const { usuario, carregandoSessao } = useSessao();

  // 1. Verifica se a sessão inicial ainda está a ser carregada.
  // Enquanto estiver a carregar, exibe uma mensagem simples. Isto previne
  // que um utilizador já logado seja redirecionado para o login por um instante.
  if (carregandoSessao) {
    return <div>A carregar sessão...</div>;
  }

  // 2. Se o carregamento terminou e existe um utilizador, o acesso é permitido.
  // O componente simplesmente renderiza os 'children' (a página protegida).
  if (usuario) {
    return <>{children}</>;
  }

  // 3. Se o carregamento terminou e não há utilizador, o acesso é negado.
  // O componente <Navigate> do 'react-router-dom' é usado para redirecionar
  // programaticamente o utilizador para a página de login.
  // 'replace' impede que o utilizador volte para a página protegida usando o botão "Voltar" do navegador.
  return <Navigate to="/login" replace />;
};