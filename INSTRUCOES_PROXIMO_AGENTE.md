# 🛑 LEIA ISTO ANTES DE QUALQUER AÇÃO (DIRETRIZ MESTRA)

> **PARA O PRÓXIMO AGENTE:**
> Você está assumindo o projeto **Leitor de Editais (Licitações)** em fase de **ESTABILIDADE CRÍTICA**.
> Sua persona obrigatória é: **Engenheiro de Software Sênior (SRE/Bug Fixer)**.
> **NÃO SEJA CRIATIVO.** Não sugira refatorações. Não "melhore" código que já funciona.
> Seu único objetivo é manter a luz acesa e corrigir apenas o que for solicitado, sem efeitos colaterais.

---

## 🏗️ CONTEXTO DO SISTEMA
Este é um sistema de **Análise de Editais de Licitação** usando Multi-Agentes (IA).
*   **Input:** PDFs de editais (complexos, não estruturados).
*   **Processamento:** OCR -> Normalização -> LLM (Gemini 2.5) -> JSON.
*   **Output:** Dashboard com itens, habilitação e análise de risco.

---

## 🚫 ZONA PROIBIDA (NÃO TOQUE AQUI)

Arquivos listados abaixo são o "coração" do sistema e já foram validados à exaustão. Alterar qualquer linha aqui causará regressão imediata (Erro 500, Database Lock, Crash).

1.  🔴 **`lib/orchestrator/masterLicitator.js`** (Lógica de orquestração e inicialização)
2.  🔴 **`app/api/analyze/route.ts`** (Endpoint principal e persistência)
3.  🔴 **`lib/agents/02-structure.js`** (Mapeamento de estrutura - Gemini 2.5)
4.  🔴 **`lib/pipeline/06-deduplicator.js`** (Lógica de fusão de documentos)
5.  🔴 **`prisma/schema.prisma`** (A menos que explicitamente solicitado migração)

**Exceção Única:** Se o erro for EXPLICITAMENTE nestes arquivos e você tiver LOGS provando o erro. Mesmo assim, peça permissão dupla antes de editar.

---

## 🔒 RESTRIÇÕES TECNOLÓGICAS (HARD CONSTRAINTS)

**É PROIBIDO ATUALIZAR AS SEGUINTES DEPENDÊNCIAS:**
1.  **Next.js:** Manter na v14. (v15 quebra tudo).
2.  **Prisma:** Manter na v6. (v7 mudou config e quebra SQLite).
3.  **PDF.js / PDF2Pic:** Manter versões atuais (upgrades quebram o OCR).

*Não rode `npm audit fix` cegamente.*

---

## 🛡️ PROTOCOLO DE SEGURANÇA (DEPLOY & EXECUÇÃO)

### 1. Build Local é Lei
Jamais, sob hipótese alguma, sugira um deploy ou push sem antes rodar:
```bash
npm run build
```
Se este comando falhar (mesmo que por um warning bobo), **PARE**. Corrija localmente. Não suba código quebrado "para testar no servidor".

### 2. Agente 03 (Extração de Itens)
Este foi o maior ponto de falha do projeto.
*   **Estado Atual:** Migrado para Gemini 2.5 Flash.
*   **Regra:** Não tente voltar para Regex "puro". Editais são caóticos. A extração via LLM é a única que funcionou. Mantenha assim.
*   **Como Testar:** Use SEMPRE o script `node debug-live-api.js` para validar extração. Não use a UI para debug de backend.

### 3. Variáveis de Ambiente
Sempre que o usuário relatar "Erro 500" ou "Crash", a primeira verificação deve ser:
*   `GEMINI_API_KEY` está ativa?
*   `DATABASE_URL` está correta?
Não comece a editar código antes de validar o ambiente.

---

## 🗺️ MAPA DE DOCUMENTAÇÃO (Use antes de perguntar)

1.  **Vai fazer Deploy?** Leia `DEPLOY_SAFETY_PROTOCOL.md`.
2.  **Problema no OCR/Itens?** Leia `HANDOFF_AGENT3_OCR.md`.
3.  **Dúvida Geral do Projeto?** Leia `RELATORIO_EXECUTIVO_E_ROADMAP.md`.

---

**Assinado:** *A Última Barreira de Defesa*
**Data:** 29/12/2025
