# 🚢 Guia de Deploy e Infraestrutura

Detalhes sobre como manter e subir a aplicação.

## 🌍 Ambiente de Produção
- **Plataforma**: Railway / Vercel / Docker
- **URL**: `https://app-name.com`
- **Banco de Dados**: Supabase / MongoDB

## ⚙️ Variáveis de Ambiente (Config)
| Variavel | Descrição | Exemplo |
| :--- | :--- | :--- |
| `DATABASE_URL` | String de conexão banco | `postgresql://...` |
| `API_KEY` | Chave de serviço X | `sk-xxxx` |

## 💻 Deploy Local
1. **Clone**: `git clone ...`
2. **Env**: `cp .env.example .env`
3. **Dependências**: `npm install`
4. **Dev**: `npm run dev`

## 🔄 Fluxo de Atualização
- Merge em `main` dispara o deploy automático no provedor.
- Rodar `npx prisma migrate deploy` após o push (se aplicável).
