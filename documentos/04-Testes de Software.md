# Planos de Testes de Software
Este documento apresenta os casos de teste de **Sucesso** e **Insucesso** para a verificação e validação da aplicação.

### Tipo de Teste
- **Sucesso**: Tem o objetivo de verificar se as funcionalidades funcionam corretamente.
- **Insucesso**: Tem o objetivo de verificar se o sistema trata erros de maneira correta.

### ETAPA 2  

| Módulo        | Operação             | ID       | Cenário                               | Entrada                                             | Status Esperado | Assertivas |
|---------------|----------------------|----------|---------------------------------------|-----------------------------------------------------|-----------------|------------|
| Login         | Acessar              | CT-001-S | Credenciais válidas                   | CPF válido, senha válida                            | Sucesso         | Redireciona para página inicial |
| Login         | Acessar              | CT-001-I | Credenciais inválidas                 | CPF válido, senha inválida                          | Insucesso       | Mensagem "Login inválido" |
| Login         | Recuperar senha      | CT-002-S | Recuperação com email válido          | Email cadastrado                                    | Sucesso         | Link de redefinição enviado |
| Login         | Recuperar senha      | CT-002-I | Recuperação com email inválido        | Email não cadastrado                                | Insucesso       | Mensagem "Email não cadastrado" |
| Permissão     | Redirecionar         | CT-003-S | Acesso como administrador             | Usuário com perfil admin                            | Sucesso         | Vai para interface de administração |
| Permissão     | Redirecionar         | CT-003-I | Perfil inexistente                     | Usuário sem perfil                                  | Insucesso       | Mensagem de erro |
| Torneio       | Inscrição            | CT-004-S | Jogador se inscreve                   | Dados válidos, torneio aberto                       | Sucesso         | Jogador inscrito |
| Torneio       | Inscrição            | CT-004-I | Inscrição fora do prazo               | Jogador válido, torneio encerrado                   | Insucesso       | Mensagem "Inscrição indisponível" |
| Torneio       | Desinscrição         | CT-005-S | Jogador se desinscreve                | Jogador inscrito, rodada entre turnos               | Sucesso         | Jogador removido |
| Torneio       | Desinscrição         | CT-005-I | Desinscrição fora do prazo            | Jogador inscrito, rodada em andamento               | Insucesso       | Mensagem "Desinscrição indisponível" |
| Loja          | Inscrição jogador    | CT-006-S | Inscrição pela loja                   | Jogador válido, torneio aberto                      | Sucesso         | Jogador inscrito pela loja |
| Loja          | Desinscrição jogador | CT-006-I | Desinscrição após término             | Jogador válido, torneio encerrado                   | Insucesso       | Mensagem de erro |
| Rodada        | Visualizar score     | CT-007-S | Visualização de mesas e score         | Rodada ativa                                        | Sucesso         | Exibe mesas e pontuação |
| Rodada        | Visualizar score     | CT-007-I | Erro ao carregar mesas                 | Rodada inexistente                                  | Insucesso       | Mensagem "Dados indisponíveis" |
| Partida       | Reportar resultado   | CT-008-S | Reporte válido                        | Partida ativa, resultado válido                     | Sucesso         | Resultado registrado |
| Partida       | Reportar resultado   | CT-008-I | Reporte inválido                      | Resultado fora do padrão                            | Insucesso       | Mensagem de erro |
| Score         | Gerar tabela         | CT-009-S | Geração automática                    | Partidas válidas                                    | Sucesso         | Tabela de score atualizada |
| Score         | Gerar tabela         | CT-009-I | Falha ao atualizar tabela             | Dados corrompidos                                   | Insucesso       | Mensagem de falha |
| Loja          | Editar resultado     | CT-010-S | Edição válida                         | Resultado válido                                    | Sucesso         | Alteração salva |
| Loja          | Editar resultado     | CT-010-I | Edição inválida                       | Resultado incorreto                                 | Insucesso       | Mensagem de erro |
| Loja          | Gerenciar torneios   | CT-011-S | Criação válida de torneio             | Dados válidos                                       | Sucesso         | Torneio criado |
| Loja          | Gerenciar torneios   | CT-011-I | Criação inválida de torneio           | Nome vazio                                          | Insucesso       | Sistema rejeita criação |
| Partida       | Salvar dados         | CT-012-S | Salvamento automático                 | Partida válida                                      | Sucesso         | Dados salvos |
| Partida       | Salvar dados         | CT-012-I | Falha no salvamento                   | Erro de rede                                        | Insucesso       | Mensagem de falha |
| Mesas         | Editar manualmente   | CT-013-S | Edição válida                         | Mesa válida                                         | Sucesso         | Alteração salva |
| Mesas         | Editar manualmente   | CT-013-I | Edição inválida                       | Número de mesa inexistente                          | Insucesso       | Mensagem de erro |
| Pontuação     | Ajustar sistema      | CT-014-S | Ajuste válido                         | Critérios válidos                                   | Sucesso         | Sistema aplica novas regras |
| Pontuação     | Ajustar sistema      | CT-014-I | Ajuste inválido                       | Critérios fora do padrão                            | Insucesso       | Mensagem de erro |

### ETAPA 3
Criar casos de teste da etapa 3

### ETAPA 4
Criar casos de teste da etapa 4
 
# Evidências de Testes de Software

Apresente imagens e/ou vídeos que comprovam que um determinado teste foi executado, e o resultado esperado foi obtido. Normalmente são screenshots de telas, ou vídeos do software em funcionamento.

## Parte 1 - Testes de desenvolvimento
Cada funcionalidade desenvolvida deve ser testada pelo próprio desenvolvedor, utilizando casos de teste, tanto de sucesso quanto de insucesso, elaborados por ele. Todos os testes devem ser evidenciados.

### Exemplo
### ETAPA 2
<table>
  <tr>
    <th colspan="6" width="1000">CT-001<br>Login com credenciais válidas</th>
  </tr>
  <tr>
    <td width="170"><strong>Critérios de êxito</strong></td>
    <td colspan="5">O sistema deve redirecionar o usuário para a página inicial do aplicativo após o login bem-sucedido.</td>
  </tr>
    <tr>
    <td><strong>Responsável pela funcionalidade (desenvolvimento e teste)</strong></td>
    <td width="430">José da Silva </td>
     <td width="100"><strong>Data do Teste</strong></td>
    <td width="150">08/05/2024</td>
  </tr>
    <tr>
    <td width="170"><strong>Comentário</strong></td>
    <td colspan="5">O sistema está permitindo o login corretamente.</td>
  </tr>
  <tr>
    <td colspan="6" align="center"><strong>Evidência</strong></td>
  </tr>
  <tr>
    <td colspan="6" align="center"><video src="https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2024-1-e5-proj-time-sheet/assets/82043220/2e3c1722-7adc-4bd4-8b4c-3abe9ddc1b48"/></td>
  </tr>
</table>

### ETAPA 3
Colocar evidências de teste da etapa 3

### ETAPA 4
Colocar evidências de teste da etapa 4

## Parte 2 - Testes por pares
A fim de aumentar a qualidade da aplicação desenvolvida, cada funcionalidade deve ser testada por um colega e os testes devem ser evidenciados. O colega "Tester" deve utilizar o caso de teste criado pelo desenvolvedor responsável pela funcionalidade (desenvolveu a funcionalidade e criou o caso de testes descrito no plano de testes) e caso perceba a necessidade de outros casos de teste, deve acrescentá-los na sessão "Plano de Testes".

### ETAPA 2

### Exemplo
<table>
  <tr>
    <th colspan="6" width="1000">CT-001<br>Login com credenciais válidas</th>
  </tr>
  <tr>
    <td width="170"><strong>Critérios de êxito</strong></td>
    <td colspan="5">O sistema deve redirecionar o usuário para a página inicial do aplicativo após o login bem-sucedido.</td>
  </tr>
    <tr>
      <td><strong>Responsável pela funcionalidade</strong></td>
    <td width="430">José da Silva </td>
      <td><strong>Responsável pelo teste</strong></td>
    <td width="430">Maria Oliveira </td>
     <td width="100"><strong>Data do teste</strong></td>
    <td width="150">08/05/2024</td>
  </tr>
    <tr>
    <td width="170"><strong>Comentário</strong></td>
    <td colspan="5">O sistema está permitindo o login corretamente.</td>
  </tr>
  <tr>
    <td colspan="6" align="center"><strong>Evidência</strong></td>
  </tr>
  <tr>
    <td colspan="6" align="center"><video src="https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2024-1-e5-proj-time-sheet/assets/82043220/2e3c1722-7adc-4bd4-8b4c-3abe9ddc1b48"/></td>
  </tr>
</table>

### ETAPA 3
Colocar evidências de teste da etapa 3

### ETAPA 4
Colocar evidências de teste da etapa 4

