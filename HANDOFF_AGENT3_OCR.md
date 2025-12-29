# 🔧 HANDOFF: Agente 3 Item Extraction (OCR Issue)

> **PARA O PRÓXIMO AGENTE:**
> Aja como um **Engenheiro de Software Sênior Especializado em Debugging e Resolução de Problemas Críticos**.
> Você não está aqui para sugerir refatorações estéticas ou reescrever arquitetura.
> Sua missão é: **Diagnosticar, Isolar e Corrigir** a lógica de extração do Agente 3 com precisão cirúrgica, respeitando as restrições de legadoi)

**Status:** ✅ **RESOLVIDO (Migrado para Gemini 2.5 Flash)**  
**Data Resolução:** 2025-12-17  
**Prioridade:** CRÍTICA  
**Responsável:** Agente IA (Antigravity)

---

## ✅ RESOLUÇÃO FINAL

### Solução Implementada
- **Migração completa** de Groq/Llama-3 para **Google Gemini 2.5 Flash**
- **Modelo:** `gemini-2.5-flash` via API REST direta
- **Context Window:** 1M tokens (vs 32k anterior)
- **Rate Limit:** Resolvido (tier gratuito: 1500 req/dia)

### Validação
✅ **Teste Isolado:** 2/2 itens extraídos corretamente (100%)  
✅ **API Conectada:** Gemini respondendo sem erros  
✅ **JSON Parsing:** Funcionando com limpeza de markdown  
✅ **Traceability:** Origens rastreadas corretamente  
✅ **Performance:** 14s para extração (aceitável)

### Documentação
- Ver `MIGRACAO_GEMINI_RESUMO.md` para detalhes completos
- Scripts de teste: `test-agent3-direct.js`, `test-gemini-extraction.js`

---

## 🚨 STATUS CRÍTICO - AGENTE 3 (EXTRAÇÃO DE ITENS)

**Problema Original:** Regex falhava com tabelas quebradas pelo OCR.
**Solução Aplicada:** Migração para LLM (Llama-3 via Groq) com ContextOptimizer.
**Ponto de Atenção:** A extração via LLM consome muitos tokens (~25k por edital). O plano gratuito do Groq tem limites. O erro 429 (Rate Limit) foi observado durante testes intensivos. Recomenda-se monitorar ou fazer upgrade da chave.

# ⛔ ZONA PROIBIDA - LEIA ANTES DE RESPIRAR ⛔

**SOB HIPÓTESE ALGUMA TOQUE NOS SEGUINTES ARQUIVOS:**
Se você alterar estes arquivos, o sistema vai quebrar (Erro 500, Database Lock, Crash). Eles já foram debugados à exaustão e estão funcionando perfeitamente.

1.  🔴 **`lib/orchestrator/masterLicitator.js`**: O coração do sistema. A lógica de inicialização e `safeClone` é crítica. **NÃO MEXA.**
2.  🔴 **`app/api/analyze/route.ts`**: A persistência no banco e o endpoint estão validados. **NÃO MEXA.**
3.  🔴 **`lib/pipeline/*` (Exceto OCR/Normalizer)**: O fluxo de execução está correto. Não tente otimizar o `IndexBuilder` ou `Deduplicator` agora.
4.  🔴 **Qualquer outro Agente (01, 02, 04...)**: O problema é EXCLUSIVAMENTE na extração de itens do Agente 3. Se você quebrar o Agente 2 (Estrutura), o projeto regride semanas.

**SEU FOCO É ÚNICO:** `lib/agents/03-items-v2.js` (e talvez ajustes pontuais de regex no `04-textNormalizer.js`).

---

## CONTEXTO CRÍTICO
Este projeto está travado na etapa de **Extração de Itens (Agente 3)**.
O pipeline roda, o OCR extrai o texto, mas o resultado final ou é **ZERO itens** ou **200+ itens de lixo** (cláusulas jurídicas interpretadas como produtos).

## 📜 Histórico de Fracassos (O que NÃO fazer)

### 1. O Erro da "Normalização Agressiva"
*   **Tentativa:** Usar o `TextNormalizer.js` para limpar caracteres de controle ASCII (`\x00-\x1F`).
*   **Resultado:** Removeu todas as quebras de linha (`\n`), transformando o PDF em uma "tripa" única. O regex `^start-of-line` parou de funcionar.
*   **Correção (Já aplicada):** A regex foi ajustada para preservar `\n`, `\r`, `\t`. **NÃO MEXA NISSO** sem testar se o texto continua multilinhas.

### 2. O Erro do Regex "Guloso" (`SIMPLE_START`)
*   **Tentativa:** Usar regex `^\d+\s+.*` para pegar itens.
*   **Resultado:** Capturou todas as cláusulas do edital ("1. Do Objeto", "2. Da Habilitação") como se fossem itens de compra. Resultado: 206 itens inúteis.
*   **Contra-medida:** Tentei implementar listas negativas ("Da Habilitação", "Do Recurso").
*   **Por que falhou:** A variedade linguística de editais é infinita. Sempre sobra lixo.

### 3. O Erro da Confiança em Layout Linear
*   **Problema Real:** Editais frequentemente apresentam itens em **TABELAS**. O OCR `pdfjs-dist` lê texto linearmente (esquerda->direita, cima->baixo), destruindo a estrutura da tabela.
*   **Sintoma:** A coluna "Descrição" fica em uma linha, e a coluna "Quantidade" fica 50 linhas abaixo ou misturada no meio do texto.
*   **Consequência:** O Agente 3 não consegue vincular "Cadeira" com "Qtd: 10" porque eles estão visualmente longe no texto extraído.

---

## 🗺️ Roteiro para o Próximo Desenvolvedor

### OBJETIVO
Fazer o Agente 3 extrair APENAS os itens de compra (ex: "Geladeira", "Mesa") e ignorar o resto.

### COMO TESTAR (Protocolo Rígido)
**NUNCA** use o `npm run dev` + Navegador para testar lógica de extração. É lento e esconde logs.
1.  Garanta que o server está rodando (`npm run dev`) em um terminal.
2.  No segundo terminal, use o script de teste:
    ```bash
    node debug-live-api.js
    ```
3.  Analise o output no console.
    *   Veja `Itens Detectados`.
    *   Veja `DEBUG DE TEXTO`. Se o texto parecer "bagunçado" ou sem quebras de linha lógicas, o problema é no OCR (`03-ocrEngine.js`), não no Agente.

### ESTRATÉGIA RECOMENDADA (A Solução Real)
Pare de tentar "remendar" Regexes no `03-items-v2.js`. Você está numa guerra perdida contra a entropia do texto não estruturado.

**Opção A (Mais Robusta - Recomendada):**
Utilize um **LLM Local (Agente 2 ou 3)** para fazer a extração.
*   Passe o texto cru para o LLM com o prompt: *"Extraia apenas os itens de compra (produto, qtd, unidade) deste texto. Ignore cláusulas jurídicas. Retorne JSON."*
*   Regex falha em tabelas quebradas. LLMs entendem tabelas quebradas.

**Opção B (Se tiver que ser Regex):**
Filtro de "Densidade Numérica":
*   Itens de compra geralmente têm códigos (CATMAT), quantidades e unidades próximos.
*   Cláusulas jurídicas são texto longo.
*   Implemente uma heurística: *Se a linha tem > 100 caracteres e NENHUM número, descarte.*

### ARQUIVOS PARA IGNORAR
*   Não mexa em `MasterLicitator.js` (está estável).
*   Não mexa em `route.ts` (está estável).

### ARQUIVOS DO PROBLEMA
*   `lib/agents/03-items-v2.js`: Onde a lógica de extração falha.
*   `lib/pipeline/03-ocrEngine.js`: Onde o texto é gerado (pode precisar de `layout: true` se mudarem a lib de OCR).

---
*Boa sorte. O código está limpo, mas a lógica de extração precisa de inteligência real, não apenas Regex.*
