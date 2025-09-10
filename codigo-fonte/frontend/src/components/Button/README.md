# Componente Button  - Commander150

Este é o componente de botão reutilizável criado para o projeto **Commander150**.  
Ele foi desenvolvido em **React + TypeScript** utilizando **CSS Modules** para estilização.

---

## 📦 Estrutura de Arquivos

```
/src/components/Button/
 ├── Button.tsx          # Código principal do componente
 ├── ExemplosButton.tsx  # Códigos de exemplo de uso
 ├── Button.module.css   # Estilos do botão (CSS Modules)
 ├── index.ts            # Exportação rápida
 └── README.md           # Esta documentação
```

---

## 🚀 Como Importar o Componente

Dentro do seu arquivo `.tsx`, importe o `Button` da seguinte forma:

```tsx
import Button from '@/components/Button'; // Se usar alias @ para /src
// ou
import Button from './components/Button'; // Importação relativa
```
---

## 🧩 Propriedades (Props)

| Prop               | Tipo                         | Obrigatório | Descrição |
|--------------------|-------------------------------|-------------|-----------|
| `label`            | `string`                      | ✅          | Texto que será exibido no botão. |
| `onClick`          | `() => void`                  | ❌          | Função a ser executada ao clicar no botão. |
| `icon`             | `React.ReactNode`              | ❌          | Ícone opcional que será exibido à esquerda do texto. |
| `width`            | `string`                      | ❌          | Largura do botão. Ex: `"140px"`. |
| `height`           | `string`                      | ❌          | Altura do botão. Ex: `"44px"`. |
| `backgroundColor`  | `string` (hexadecimal ou nome) | ❌          | Cor de fundo do botão. Ex: `"#46AF87"`. |
| `textColor`        | `string` (hexadecimal ou nome) | ❌          | Cor do texto. Ex: `"#FFFFFF"`. |
| `fontSize`         | `string`                      | ❌          | Tamanho da fonte. Ex: `"14px"`. |
| `fontWeight`       | `number`                      | ❌          | Peso da fonte. Ex: `600`. |
| `borderRadius`     | `string`                      | ❌          | Arredondamento da borda. Ex: `"8px"`. |
| `paddingVertical`  | `string`                      | ❌          | Espaçamento interno vertical. Ex: `"8px"`. |
| `paddingHorizontal`| `string`                      | ❌          | Espaçamento interno horizontal. Ex: `"20px"`. |

---

## 🛠️ Exemplo de Uso Básico

```tsx
import Button from '@/components/Button';

function App() {
  return (
    <Button label="Cadastrar" />
  );
}
```

---

## 🛠️ Exemplo de Uso com Ícone

Utilizando biblioteca de ícones (`react-icons`):

```tsx
import { Button } from '@/components/Button';
import { FaSearch } from 'react-icons/fa';

function App() {
  return (
    <Button
      label="Pesquisar"
      icon={<FaSearch />}
      onClick={() => console.log('Pesquisar clicado!')}
    />
  );
}
```

---

## 🎨 Personalizando Estilos

Você pode personalizar diretamente via props:

```tsx
<Button
  label="Salvar"
  backgroundColor="#2C7BE5"
  textColor="#FFFFFF"
  width="160px"
  height="48px"
  fontSize="16px"
  fontWeight={700}
  borderRadius="10px"
  onClick={() => console.log('Botão Salvar clicado')}
/>
```

---

## 📱 Responsividade

- O botão foi desenvolvido usando `flexbox` para manter o alinhamento de texto e ícone correto.
- Para telas menores, é possível aplicar media queries dentro do `Button.module.css` para adaptar o tamanho automaticamente.

Exemplo de media query (já sugerido):

```css
@media (max-width: 768px) {
  .button {
    width: 120px;
    height: 40px;
    font-size: 13px;
    padding: 6px 16px;
  }
}
```

---

## 🧹 Boas Práticas

- **Sempre passar o `label`** para garantir acessibilidade e clareza.
- **Passar o `onClick`** se o botão precisar executar alguma ação.
- **Utilizar ícones opcionais** para manter a flexibilidade de design.
- **Centralizar estilizações fixas no componente** e permitir ajustes via props para reuso em todo o projeto.

---

## ⚡ Observação Importante

Este componente foi construído para ser **totalmente flexível**:
- Pode ser utilizado com qualquer tipo de ícone (`SVG`, `FontAwesome`, `Material Icons`, etc.).
- Pode ser facilmente adaptado para qualquer estilo visual futuro da aplicação Commander150.

---
