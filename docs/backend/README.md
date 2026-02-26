# 🛠️ Padrão de Desenvolvimento Backend

Este documento define como o servidor processa a inteligência da aplicação.

## 🏗️ Arquitetura e Tech Stack
- **Engine**: [Fastify / Express / Node.js]
- **Validação**: [Zod / Joi] - Schema de entrada e saída.

## 🔗 Conexão Telas -> Endpoints
Este mapeamento é vital para a IA entender onde mexer quando uma tela muda.

| Módulo | Endpoint Principal | Telas que Consomem | Função |
| :--- | :--- | :--- | :--- |
| **Auth** | `/api/auth/login` | Login | Validação e JWT |
| **Score**| `/api/score/:cnpj` | DetalheCliente, Score | Cálculo de risco |
| **Sync** | `/api/sync/erp` | Dashboard, Cobranças | Busca dados do Winthor |

## 📁 Estrutura de Módulos
- `/src/modules`: Divisão por domínio de negócio.
- `/src/utils`: Helpers globais e ENV config.

## 🛡️ Validação e Erros
- Como os erros são retornados? (Padrão JSON).
- Exemplos de Schemas Zod usados.

## 📦 Banco de Dados
- **ORM/Query**: [Prisma / Supabase / SQL Bruto]
- **Tabelas Críticas**: `clientes`, `titulos`, `logs`.
