# **Componente Radio \- Commander150**

Este é um componente reutilizável que renderiza um grupo de opções de rádio customizadas para o projeto **Commander150**. Ele foi desenhado para substituir os inputs de rádio padrão do navegador, oferecendo um visual consistente com o design do Figma e uma interface de uso simplificada.

## **📦 Estrutura de Ficheiros**

/src/components/Radio/  
 ├── index.tsx          \# Código principal do componente  
 ├── style.module.css   \# Estilos isolados via CSS Modules  
 └── README.md          \# Esta documentação

## **🚀 Como Importar o Componente**

import Radio from '@/components/Radio';

## **🧩 Propriedades (Props)**

| Prop | Tipo | Obrigatório | Descrição |
| :---- | :---- | :---- | :---- |
| labelPrincipal | string | ❌ | O rótulo exibido acima do grupo de opções. |
| name | string | ✅ | O nome do grupo de rádio (essencial para agrupar as opções). |
| opcoes | OpcaoRadio\[\] | ✅ | Um array de objetos, onde cada objeto define uma opção. |
| valorSelecionado | string | ✅ | O valor da opção que está atualmente selecionada. |
| onChange | (e: React.ChangeEvent\<HTMLInputElement\>) \=\> void | ✅ | A função que é chamada quando a seleção muda. |

### **A Interface OpcaoRadio**

interface OpcaoRadio {  
  valor: string;  // O valor que será guardado no estado (ex: "JOGADOR")  
  rotulo: string; // O texto que será exibido para o utilizador (ex: "Sou um Jogador")  
}

## **🛠️ Exemplo de Uso**

import { useState } from 'react';  
import Radio from '@/components/Radio';

function FormularioCadastro() {  
  const \[tipo, setTipo\] \= useState('');

  const opcoesTipoUsuario \= \[  
    { valor: 'JOGADOR', rotulo: 'Sou um Jogador' },  
    { valor: 'LOJA', rotulo: 'Sou uma Loja' },  
  \];

  return (  
    \<Radio  
      labelPrincipal="Tipo de Usuário"  
      name="tipo"  
      opcoes={opcoesTipoUsuario}  
      valorSelecionado={tipo}  
      onChange={(e) \=\> setTipo(e.target.value)}  
    /\>  
  );  
}

## **🎨 Estilo**

* O componente utiliza CSS Modules para um estilo encapsulado.  
* O design é baseado no Figma do projeto, com um visual customizado que esconde o input de rádio padrão e o substitui por um elemento estilizado com CSS.  
* As cores e a tipografia são definidas em variáveis CSS para fácil manutenção.

## **✅ Acessibilidade**

* O componente utiliza label com o atributo htmlFor associado ao id de cada input, garantindo que os leitores de tela possam associar corretamente o texto à opção clicável.  
* O input de rádio real, embora visualmente escondido, continua funcional e acessível via teclado.