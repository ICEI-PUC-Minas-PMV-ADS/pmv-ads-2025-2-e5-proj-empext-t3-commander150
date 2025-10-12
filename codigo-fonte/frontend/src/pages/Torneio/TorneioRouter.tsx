/**
 * TorneioRouter - Middleware de roteamento baseado em tipo de usuário
 *
 * Este componente verifica o tipo de usuário autenticado e renderiza
 * a visualização apropriada da página de informações do torneio:
 * - LOJA: InformacaoTorneioLoja (visão administrativa)
 * - JOGADOR/ADMIN: InformacaoTorneio (visão padrão)
 */

import { useSessao } from "../../contextos/AuthContexto";
import InformacaoTorneio from "./infoTorneio";
import InformacaoTorneioLoja from "./infoTorneioLoja";

const TorneioRouter: React.FC = () => {
  const { usuario, carregandoSessao } = useSessao();

  // Aguardar carregamento da sessão
  if (carregandoSessao) {
    return <div>Carregando...</div>;
  }

  // Verificar tipo de usuário e renderizar componente apropriado
  if (usuario?.tipo === 'LOJA') {
    return <InformacaoTorneioLoja />;
  }

  // Renderizar visualização padrão para JOGADOR e ADMIN
  return <InformacaoTorneio />;
};

export default TorneioRouter;
