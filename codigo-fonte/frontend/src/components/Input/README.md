# **Componente Input - Commander150**

Este é o componente de input reutilizável para o projeto **Commander150**, cobrindo diversos tipos de entrada de dados com máscaras, validações, personalização de estilo e suporte a textarea (multiline).

---

## **📦 Estrutura de Ficheiros**

/src/components/Input/  
 ├── index.tsx          # Código principal do componente  
 ├── style.module.css   # Estilos isolados via CSS Modules  
 └── README.md          # Esta documentação

---

## **🚀 Como Importar o Componente**

```tsx
import Input from '@/components/Input';
```

---

## **🧩 Propriedades (Props)**

| Prop             | Tipo                                                                                         | Obrigatório | Descrição                                                                                      |
|------------------|----------------------------------------------------------------------------------------------|-------------|------------------------------------------------------------------------------------------------|
| type             | "text" \| "email" \| "password" \| "data" \| "hora" \| "telefone" \| "numero" \| "decimal" \| "dinheiro" | ✅           | Define o tipo do campo e aplica máscara/validação conforme necessário.                         |
| name             | string                                                                                       | ✅           | Nome único do campo (usado no id e htmlFor).                                                   |
| placeholder      | string                                                                                       | ❌           | Texto exibido como dica dentro do campo.                                                       |
| placeholderColor | string                                                                                       | ❌           | Cor personalizada para o texto do placeholder.                                                 |
| value            | string                                                                                       | ✅           | Valor atual do campo (controlado pelo estado).                                                 |
| onChange         | (e: React.ChangeEvent<HTMLInputElement \| HTMLTextAreaElement>) => void                     | ✅           | Função chamada sempre que o valor do campo é alterado.                                         |
| minLength        | number                                                                                       | ❌           | Define o tamanho mínimo do campo (usado principalmente em senhas).                             |
| required         | boolean                                                                                      | ❌           | Define se o campo é obrigatório no formulário.                                                 |
| label            | string                                                                                       | ❌           | Texto exibido como rótulo acima do campo.                                                      |
| labelAlign       | "left" \| "center" \| "right"                                                              | ❌           | Define o alinhamento do texto do rótulo.                                                       |
| labelColor       | string                                                                                       | ❌           | Cor personalizada do rótulo.                                                                  |
| textColor        | string                                                                                       | ❌           | Cor do texto digitado no input.                                                                |
| backgroundColor  | string                                                                                       | ❌           | Cor de fundo do campo.                                                                         |
| casasDecimais    | number                                                                                       | ❌           | Número de casas decimais (usado em tipos `decimal` e `dinheiro`). Default: 2.                  |
| multiline        | boolean                                                                                      | ❌           | Se `true`, renderiza um `<textarea>` para textos longos multilinha.                           |

---

## **💡 Funcionalidades**

- **Validação automática de email** (exibe mensagem em caso de formato inválido).  
- **Exibição/ocultação de senha** via ícone (FaEye / FaEyeSlash).  
- **Máscaras aplicadas automaticamente** para:  
  - Data (`dd/MM/yyyy`)  
  - Hora (`hh:mm`)  
  - Telefone (`(DD)XXXXX-XXXX` ou `(DD)XXXX-XXXX`)  
  - Número inteiro (somente dígitos)  
  - Número decimal (casas configuráveis)  
  - Dinheiro (formato brasileiro R$ com separador de milhar e vírgula decimal)  
- **Multiline (textarea)** com altura mínima de 80px e redimensionamento vertical.  
- **Totalmente personalizável** em cores, alinhamento de label e comportamento.

---

## **🛠️ Exemplos de Uso**

### Texto simples
```tsx
<Input
  type="text"
  name="usuario"
  label="Nome de Usuário"
  placeholder="Digite seu nome"
  value={usuario}
  onChange={(e) => setUsuario(e.target.value)}
  required
/>
```

### Email com validação
```tsx
<Input
  type="email"
  name="email"
  label="Email"
  placeholder="exemplo@dominio.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
/>
```

### Senha com mínimo de caracteres e botão de visibilidade
```tsx
<Input
  type="password"
  name="senha"
  label="Senha"
  placeholder="********"
  value={senha}
  onChange={(e) => setSenha(e.target.value)}
  minLength={6}
  required
/>
```

### Data com máscara
```tsx
<Input
  type="data"
  name="dataNascimento"
  label="Data de Nascimento"
  placeholder="dd/mm/aaaa"
  value={dataNascimento}
  onChange={(e) => setDataNascimento(e.target.value)}
/>
```

### Hora com máscara
```tsx
<Input
  type="hora"
  name="horarioInicio"
  placeholder="00:00"
  value={horario}
  onChange={(e) => setHorario(e.target.value)}
  label="Horário de Início"
/>
```

### Telefone com máscara
```tsx
<Input
  type="telefone"
  name="telefone"
  label="Telefone"
  placeholder="(99) 99999-9999"
  value={telefone}
  onChange={(e) => setTelefone(e.target.value)}
/>
```

### Número inteiro
```tsx
<Input
  type="numero"
  name="idade"
  label="Idade"
  value={idade}
  onChange={(e) => setIdade(e.target.value)}
/>
```

### Número decimal (2 casas)
```tsx
<Input
  type="decimal"
  name="altura"
  label="Altura"
  placeholder="0.00"
  value={altura}
  onChange={(e) => setAltura(e.target.value)}
  casasDecimais={2}
/>
```

### Dinheiro em Real
```tsx
<Input
  type="dinheiro"
  name="preco"
  label="Preço"
  value={preco}
  onChange={(e) => setPreco(e.target.value)}
  casasDecimais={2}
/>
```

### Multiline (textarea)
```tsx
<Input
  type="text"
  name="descricao"
  label="Descrição"
  placeholder="Escreva aqui sua descrição..."
  value={descricao}
  onChange={(e) => setDescricao(e.target.value)}
  multiline
/>
```

---

## **🎨 Estilo**

- Usa **CSS Modules** para encapsulamento de estilo.  
- Variáveis CSS centralizadas garantem consistência de cores e tipografia.  
- Multiline tem altura mínima de 80px e pode ser redimensionado verticalmente pelo usuário.  

---

## **⚠️ Observações Técnicas**

- Os ícones são importados da biblioteca `react-icons` (FaEye e FaEyeSlash).  
- A máscara de dinheiro e decimais utiliza formatação simples via regex e `toFixed`.  
- O campo de senha alterna para texto quando o ícone de olho é clicado.  
- Caso precise de validações mais avançadas, pode-se integrar com bibliotecas como **Yup** ou **Zod**.

---

## **✅ Acessibilidade**

- Cada input/textarea possui `id` vinculado ao `label` via `htmlFor`.  
- Labels com alinhamento configurável ajudam na leitura em diferentes layouts.  
- Mensagens de erro aparecem em `small`, garantindo semântica apropriada.

---
