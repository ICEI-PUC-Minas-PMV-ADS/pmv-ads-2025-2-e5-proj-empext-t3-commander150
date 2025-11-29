# Implantação do Software

<!-- •	Apresentar o planejamento da implantação: descrever tecnologias e processo de implantação.

•	Informar link da aplicação em ambiente de produção

•	Apresentar o planejamento de evolução da aplicação. -->

## Planejamento da Implantação

A implantação do Commander150 foi planejada para garantir estabilidade, disponibilidade e escalabilidade. O processo foi dividido em duas partes: Backend e Frontend, com tecnologias adequadas a cada necessidade.

### Tecnologias utilizadas
**Backend**

- Linguagem: Python 3.12
- Framework: Django + Django REST Framework (API RESTful)
- Banco de Dados: PostgreSQL
- Autenticação: JWT
- Implantação: Render.com

**Frontend**

- Framework: React 18 + TypeScript
- Empacotador: Vite
- Componentização: React Components + Hooks
- Implantação: Netlify
- Integração: API REST hospedada no Render

## Processo de implantação

### Backend: Render

- Configuração do ambiente Python 3.12
- Deploy automático via GitHub
- Variáveis de ambiente configuradas (SECRET_KEY, DEBUG, DATABASE_URL, JWT configs)
- Banco PostgreSQL criado e vinculado à aplicação
- Migrações aplicadas via Django

### Frontend: Netlify

- Conexão com repositório GitHub
- Build automático (via npm run build)
- Deploy contínuo a cada push
- Verificação das rotas e integridade visual

## Acesso
A aplicação pode ser acessada em <a href="https://pmv-ads-2025-2-e5-proj-empext-t3-co.vercel.app" target="_blank">Commander 150</a>

## Planejamento da Evolução
