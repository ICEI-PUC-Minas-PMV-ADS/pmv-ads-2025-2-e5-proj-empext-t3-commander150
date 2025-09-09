// src/routes/RotaSegura.tsx

/**
 * Componente RotaSegura ("Layout de Segurança")
 *
 * O QUE É E POR QUE EXISTE?
 * Este componente atua como um porteiro para grupos de páginas que só devem
 * ser acessíveis por utilizadores autenticados. Na nova estrutura de rotas
 * aninhadas, ele funciona como um "layout de segurança" que envolve
 * todas as rotas protegidas.
 *
 * RESPONSABILIDADES:
 * 1. Verificar o estado da autenticação.
 * 2. Se o utilizador estiver autenticado, renderiza o <Outlet />, que por sua vez
 * renderizará a página filha protegida (ex: /dashboard).
 * 3. Se o utilizador não estiver autenticado, redireciona para a página de login.
 * 4. Exibe um estado de "a carregar" enquanto a sessão inicial é verificada.
 *
 * COMO USAR:
 * No ficheiro de rotas (AppRoutes.tsx), ele é usado como um elemento de uma
 * rota "pai" que aninha todas as outras rotas que precisam de proteção.
 *
 * Exemplo de uso em AppRoutes.tsx:
 *
 * <Route element={<RotaSegura />}>
 * <Route path="/dashboard" element={<PaginaDashboard />} />
 * <Route path="/perfil" element={<PaginaPerfil />} />
 * </Route>
 */

// Importa os componentes necessários do react-router-dom.
// O Outlet é o espaço reservado para as rotas filhas.
import { Navigate, Outlet } from 'react-router-dom';

// Importa o hook para aceder aos dados de autenticação.
import { useSessao } from '../contextos/AuthContexto';

// O componente já não precisa de receber 'children' como propriedade,
// pois o Outlet assume essa função de forma dinâmica.
export const RotaSegura = () => {
  // Acede às informações do nosso contexto de autenticação.
  const { usuario, carregandoSessao } = useSessao();

  // 1. Verifica se a sessão inicial ainda está a ser carregada.
  // Enquanto estiver a carregar, exibe uma mensagem.
  if (carregandoSessao) {
    return <div>A carregar sessão...</div>;
  }

  // 2. Se o carregamento terminou e existe um utilizador, o acesso é permitido.
  // Renderiza o <Outlet />, e o react-router-dom encarrega-se de renderizar
  // a rota filha correta (ex: PaginaDashboard).
  // Se não houver utilizador, redireciona para a página de login.
  return usuario ? <Outlet /> : <Navigate to="/login" replace />;
};