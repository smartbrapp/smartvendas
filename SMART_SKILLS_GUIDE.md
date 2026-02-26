# 🚀 SmartBR Workflow Automation Guide

Este guia descreve como instalar, configurar e utilizar o ecossistema de automação **SmartBR** para gestão de projetos, documentação viva e integração com ClickUp.

---

## ⚡ Quick Start (Instalação)

Sempre que iniciar ou assumir um novo projeto, siga este ritual para injetar a inteligência SmartBR.

1. **Abra o Terminal no Repositório de Skills:**
   ```bash
   cd E:\Git_Public\SmartSkills
   python smartskill.py
   ```

2. **No Menu Interativo:**
   - Escolha **Opção 2** (Instalar Item Específico em Projeto).
   - Cole o **Caminho do Projeto Alvo** (ex: `E:\GitHub\MeuProjeto`).
   - Selecione para instalar:
     - `[1] workflow-smart-readme` (Obrigatório: Gestão e Docs).
     - `[2] workflow-ui-ux-pro-max` (Opcional: Se for Frontend).

3. **Configuração Inicial (.env):**
   No projeto alvo, crie ou edite o arquivo `.env` na raiz:
   ```ini
   CLICKUP_API_TOKEN=seu_token_aqui
   CLICKUP_PROJECT_ID=id_da_tarefa_pai_do_projeto
   ```

---

## 🔄 Os 3 Pilares (Workflows)

O sistema opera com três workflows principais que cobrem todo o ciclo de vida do desenvolvimento.

### 1. 💡 Planejamento (`/readme-lifecycle`)
**Quando usar:** Antes de começar a codar uma nova feature.
**O que faz:**
- Lê o Backlog do ClickUp (via Bridge).
- Gera arquivos de Análise Técnica em `roadmap/analysis/feature-name.md`.
- Define o escopo, riscos e checklist técnico antes de escrever código.

### 2. 🗺️ Mapeamento (`/readme-resumo`)
**Quando usar:** Quando criar novos arquivos, telas ou rotas.
**O que faz:**
- Escaneia o projeto.
- Atualiza o `docs/SMART_MAP.md` (O "Mapa Mundi" do projeto).
- Classifica itens como `[SCREEN]`, `[MODULE]`, `[COMPONENT]`.
- **Sincroniza com ClickUp (Push):** Cria as tarefas no ClickUp se não existirem e grava os IDs de volta no arquivo Markdown.

### 3. 📝 Rastreamento (`/readme-trackcommit`)
**Quando usar:** Ao finalizar uma tarefa ou fazer um commit significativo.
**O que faz:**
- O Agente analisa os arquivos alterados.
- Atualiza a documentação técnica.
- **Automação ClickUp:** Identifica quais tarefas foram impactadas e registra automaticamente o histórico na descrição da tarefa (com data, mensagem e arquivos).
- *Fallback:* Se alterou arquivos de infra soltos, registra na Tarefa Pai do projeto.

---

## 🛠️ Ferramentas (Scripts & Bridges)

### 🌉 `readme_clickup_bridge.js` (O Motor Central)
Este script Node.js é o cérebro da integração. Você pode rodá-lo manualmente ou deixar o Agente rodar.

**Local:** `.agent/scripts/readme_clickup_bridge.js`

#### Menu Interativo (Manual)
Rode: `node .agent/scripts/readme_clickup_bridge.js .`
1.  **Preview:** Mostra o que ele enxerga no `SMART_MAP.md`.
2.  **Sync All (Push):** Envia sua estrutura de código para o ClickUp (Cria tarefas e Grava IDs). **Idempotente** (não duplica).
3.  **Sync Interactive:** (Futuro).
4.  **Pull Ideas:** Baixa tarefas novas do ClickUp (Backlog) para `docs/IDEAS_MAP.md` e gera arquivos de análise, ignorando o que já existe no código.

#### Modo CLI (Automação / Agente)
Usado pelo workflow `readme-trackcommit`.
```bash
node readme_clickup_bridge.js . --log-commit --message "Fix login" --files "src/Login.tsx"
```

### 📋 `readme_map_manager.js`
Este script auxiliar ajuda a gerar a estrutura inicial do `SMART_MAP.md` lendo a árvore de arquivos do projeto. É usado principalmente pelo workflow `/readme-resumo`.

---

## 📌 Resumo Operacional

| Ação | Workflow / Comando | Resultado |
| :--- | :--- | :--- |
| **Começar Projeto** | `python smartskill.py` | Ferramentas instaladas. |
| **Puxar Tarefa** | Bridge Opção 4 (Pull) | `IDEAS_MAP.md` atualizado com o que fazer. |
| **Criar Feature** | `/readme-lifecycle` | Planejamento técnico criado. |
| **Novo Arquivo** | `/readme-resumo` | `SMART_MAP.md` atualizado e tarefa criada no ClickUp. |
| **Commit** | `/readme-trackcommit` | Histórico registrado no ClickUp automaticamente. |

---
*SmartBR Automation Ecosystem v2.0*
