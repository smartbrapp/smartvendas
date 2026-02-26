# 🖼️ Sistema de Documentação Modernizado

> **Framework de orquestração e documentação para múltiplos projetos.**

---

## 🔍 Visão Geral
- **Acesso**: Estrutura de pastas root do projeto.
- **Objetivo**: Padronizar como 10+ aplicações são controladas e documentadas.

## 🔗 Integração (Fluxo do Agente)
- **Workflows**: `.agent/workflows/*.md`
- **Dash Central**: `README.md`
- **Histórico**: `roadmap/history/`

## ✅ Validações e Regras
- [x] README deve conter links funcionais para manuais.
- [x] Commits devem ser documentados via workflow `/track-commit`.
- [x] Roadmap deve seguir o ciclo Análise -> Implementação -> Teste.

## ⚠️ Riscos e Melhorias
- **Riscos**: Se não for atualizado frequentemente, a doc perde valor.
- **Melhorias**: Automatizar a leitura de commits Git via scripts node.

## 🛠️ Comandos Relacionados
- Inicializar estrutura: `mkdir docs/backend, docs/frontend...`
- Gerar resumo: `/summarize`

