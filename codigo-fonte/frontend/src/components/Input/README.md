# **Componente Input \- Commander150**

Este é o componente de input reutilizável para o projeto **Commander150**, com suporte completo aos tipos email, text e password, incluindo validações, exibição/ocultação de senha e props flexíveis.

## **📦 Estrutura de Ficheiros**

/src/components/Input/  
 ├── index.tsx          \# Código principal do componente  
 ├── style.module.css   \# Estilos isolados via CSS Modules  
 └── README.md          \# Esta documentação

## **🚀 Como Importar o Componente**

import Input from '@/components/Input';

## **🧩 Propriedades (Props)**

| Prop | Tipo | Obrigatório | Descrição |
| :---- | :---- | :---- | :---- |
| type | "text" | "email" | "password" | ✅ | Define o tipo do campo. |
| name | string | ✅ | Nome do campo (usado no id e htmlFor do label). |
| placeholder | string | ❌ | Texto placeholder exibido no campo. |
| value | string | ✅ | Valor atual do campo (controlado). |
| onChange | (e: React.ChangeEvent\<HTMLInputElement\>) \=\> void | ✅ | Função chamada ao alterar o valor do input. |
| minLength | number | ❌ | Tamanho mínimo do campo (usado em senhas). |
| required | boolean | ❌ | Define se o campo é obrigatório. |
| label | string | ❌ | Texto do rótulo exibido acima do campo. |

## **💡 Funcionalidades**

* **Validação de email automática** quando type="email".  
* **Exibição/ocultação de senha** via ícone (quando type="password").  
* **Mensagens de erro** para emails inválidos.  
* Suporte a minLength com HTML5 para validação.

## **🛠️ Exemplo de Uso**

### **Texto**

\<Input  
  type="text"  
  name="usuario"  
  label="Nome de Usuário"  
  placeholder="Digite seu nome"  
  value={usuario}  
  onChange={(e) \=\> setUsuario(e.target.value)}  
/\>

### **Email**

\<Input  
  type="email"  
  name="email"  
  label="Email"  
  placeholder="exemplo@dominio.com"  
  value={email}  
  onChange={(e) \=\> setEmail(e.target.value)}  
  required  
/\>

### **Senha**

\<Input  
  type="password"  
  name="senha"  
  label="Senha"  
  placeholder="\*\*\*\*\*\*\*\*"  
  value={senha}  
  onChange={(e) \=\> setSenha(e.target.value)}  
  minLength={6}  
  required  
/\>

## **🎨 Estilo**

* O componente utiliza CSS Modules para um estilo encapsulado.  
* O design é baseado no Figma do projeto, com cores e tipografia definidas em variáveis CSS para fácil manutenção.

## **⚠️ Observações Técnicas**

* Os ícones de mostrar/ocultar senha usam a biblioteca react-icons (FaEye e FaEyeSlash). Certifique-se de que a dependência está instalada (npm install react-icons).  
* A validação de email é feita via regex simples. Para cenários mais complexos, o uso de bibliotecas como yup ou zod é recomendado.

## **✅ Acessibilidade**

* O componente utiliza label, htmlFor e id para garantir uma associação correta entre o rótulo e o campo, melhorando a acessibilidade.