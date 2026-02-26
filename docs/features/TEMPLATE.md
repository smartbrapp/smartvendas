# 🖼️ Nome do Recurso / Tela

> **Breve descrição de uma linha sobre o que esta tela faz.**

---

## 🔍 Visão Geral
- **Acesso**: Link da rota ou onde encontrar na UI.
- **Objetivo**: O que o usuário resolve aqui.

## 🔗 Integração (Frontend -> Backend)
- **Componente**: `NomeDoComponente.tsx`
- **Hook/Service**: `useFeatureApi.ts`
- **Endpoint API**: `POST /api/feature/sync`
- **Model/Banco**: Tabela `FeatureData`

## ✅ Validações e Regras
- [ ] Validação X no campo Y.
- [ ] Regra de negócio Z antes de salvar.

## ⚠️ Riscos e Melhorias
- **Riscos**: Consumo excessivo de memória se a lista for muito longa.
- **Melhorias**: Adicionar paginação e filtro por data.

## 🛠️ Comandos Relacionados
- Rodar migrações: `npm run seed`
- Testar componente: `npm test ScreenName`
