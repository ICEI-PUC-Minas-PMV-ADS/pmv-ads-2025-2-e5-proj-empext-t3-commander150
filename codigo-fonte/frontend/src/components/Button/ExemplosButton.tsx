import Button from './index';

import { FaPlus, FaSearch, FaTimes } from 'react-icons/fa'; // Ícones de exemplo

function ExemplosButton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '40px' }}>
      
      {/* Botão Cadastrar */}
      <Button
        label="Cadastrar"
        icon={<FaPlus />}
        backgroundColor="#46AF87" // Verde principal PUConsulta
        textColor="#FFFFFF"
        width="180px"
        height="48px"
        fontSize="16px"
        fontWeight={600}
        borderRadius="8px"
        onClick={() => console.log('Cadastrar clicado')}
      />

      {/* Botão Pesquisar */}
      <Button
        label="Pesquisar"
        icon={<FaSearch />}
        backgroundColor="#2C7BE5" // Azul-escuro para pesquisa
        textColor="#FFFFFF"
        width="160px"
        height="44px"
        fontSize="15px"
        fontWeight={600}
        borderRadius="8px"
        onClick={() => console.log('Pesquisar clicado')}
      />

      {/* Botão Cancelar */}
      <Button
        label="Cancelar"
        icon={<FaTimes />}
        backgroundColor="#E53935" // Vermelho para ações de cancelamento
        textColor="#FFFFFF"
        width="160px"
        height="44px"
        fontSize="15px"
        fontWeight={600}
        borderRadius="8px"
        onClick={() => console.log('Cancelar clicado')}
      />

    </div>
  );
}

export default ExemplosButton;
