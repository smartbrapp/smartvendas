# 🎨 Padrão de Desenvolvimento Frontend

Este documento é o mapa definitivo da interface. Ele deve evitar que desenvolvedores ou IAs se percam na estrutura de telas.

## 💎 Design System & UX
- **Estética**: [Material v3 / Glassmorphism / etc]
- **Temas**: Localização do arquivo de cores e fontes.

## 🗺️ Mapeamento de Telas e Fluxos (Obrigatório)

Aqui detalhamos o que o usuário faz e por onde ele passa.

### 1. Sistema de Auth e Entrada
- **Landing Page**: `src/screens/LandingPage.tsx` - Porta de entrada, vitrine do produto.
- **Login / Reset**: `src/screens/Auth/` - Fluxo de autenticação e recuperação.

### 2. Telas em Uso (Core)
| Tela | Arquivo | Função Principal | Fluxo de Saída |
| :--- | :--- | :--- | :--- |
| **Dashboard** | `src/screens/Dashboard.tsx` | Visão geral e métricas | Menu Lateral / Cliques em Cards |
| **Lista de Clientes**| `src/screens/Clientes.tsx` | Gestão de base | Detalhe do Cliente / Novo Score |
| **Financeiro** | `src/screens/Financeiro.tsx`| Baixa de títulos e boletos| Relatórios |

### 3. Componentes e Modais Críticos
- **Modal de Pagamento**: `src/components/PaymentModal.tsx` - Usado em X, Y e Z.
- **Header Global**: Componente que controla o Drawer principal.

## 🏗️ Estrutura de Pastas e Padrões
- `src/screens`: Lógica de página.
- `src/components`: UI Pura e Reutilizável.
- `src/hooks`: Conexão com API e Regras de UI.

## 🚀 Integração Backend (BFF)
- Como os dados chegam? (ex: instanciado via `window.__ENV` no build).
- Qual Service centraliza as chamadas? (ex: `src/services/api.ts`).

---

## ⚠️ Quarentena e Legado
- Listar arquivos em `_quarentena` ou que não devem ser editados.
