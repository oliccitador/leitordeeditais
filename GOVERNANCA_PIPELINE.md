# 🔒 GOVERNANÇA DO PIPELINE - LICITADOR BLINDADO
## Data: 2025-12-15
## Status: REGRAS OBRIGATÓRIAS - NÃO NEGOCIÁVEL

---

## 1️⃣ REGRA DE OURO: CONTRATOS IMUTÁVEIS

### **Pipeline tem Contratos:**
Cada etapa recebe um **input contract** e devolve um **output contract**.

### **PROIBIDO:**
- ❌ Renomear campos
- ❌ Remover campos
- ❌ Sobrescrever `metadata` inteiro
- ❌ Reduzir doc para "subset" sem manter campos obrigatórios

### **PERMITIDO:**
- ✅ Adicionar novos campos (não quebra contrato)
- ✅ Criar versão (`v2`) mantendo compatibilidade

---

## 2️⃣ CAMPOS OBRIGATÓRIOS (NUNCA PODEM SUMIR)

### **A partir da Etapa 3 em diante:**

#### **No root do doc:**
```javascript
{
  documentId: string,              // ✅ OBRIGATÓRIO
  documentType: string,            // ✅ OBRIGATÓRIO (quando existir)
  classificationConfidence: number, // ✅ OBRIGATÓRIO (quando existir)
  ocrQualityAvg: number | null     // ✅ OBRIGATÓRIO
}
```

#### **Em `metadata`:**
```javascript
{
  metadata: {
    ocrQualityAvg: number | null,  // ✅ OBRIGATÓRIO
    totalChars: number,            // ✅ OBRIGATÓRIO
    totalLines: number,            // ✅ OBRIGATÓRIO (quando aplicável)
    totalPages: number             // ✅ OBRIGATÓRIO (quando aplicável)
  }
}
```

### **Regra Absoluta:**
`ocrQualityAvg` existe SEMPRE no root E em `metadata`.

---

## 3️⃣ REGRA ABSOLUTA DE MERGE

### **PROIBIDO:**
```javascript
// ❌ NUNCA FAZER ISSO
doc.metadata = algumaCoisa;
metadata: fileMetadata;  // sem merge
doc = { documentId: doc.documentId };  // strip
```

### **OBRIGATÓRIO:**
```javascript
// ✅ SEMPRE USAR
import { carryForwardOCR } from '../utils/carryForwardOCR.js';

const mergedDoc = carryForwardOCR(baseDoc, patch);
```

### **Função Oficial:**
```javascript
export function carryForwardOCR(baseDoc, patch = {}) {
  const baseOcr = baseDoc?.ocrQualityAvg ?? baseDoc?.metadata?.ocrQualityAvg ?? null;
  const patchOcr = patch?.ocrQualityAvg ?? patch?.metadata?.ocrQualityAvg ?? null;
  const ocr = patchOcr ?? baseOcr;

  return {
    ...baseDoc,
    ...patch,
    ocrQualityAvg: ocr,
    metadata: {
      ...(baseDoc?.metadata || {}),
      ...(patch?.metadata || {}),
      ocrQualityAvg: ocr
    }
  };
}
```

**Localização:** `lib/utils/carryForwardOCR.js`

---

## 4️⃣ PONTO BLOQUEADO: ETAPA 7 DEFINE TEXTO CANÔNICO

### **DocumentFusion é o Dono:**
O DocumentFusion (Etapa 7) é o **ÚNICO** responsável pelo texto canônico.

### **PROIBIDO:**
- ❌ Extractor (Etapa 8) inventar fontes alternativas
- ❌ Ler de `pages[].text` diretamente
- ❌ Concatenar texto manualmente

### **Contrato do CORPO_INTEGRADO (obrigatório):**
```javascript
{
  globalLines: Array,              // ✅ OBRIGATÓRIO
  metadata: {
    totalChars: number             // ✅ OBRIGATÓRIO
  },
  fullText: string                 // ✅ CANÔNICO (join de globalLines.text)
}
```

### **Regra:**
Etapa 8 **SEMPRE** lê de `CORPO_INTEGRADO.fullText` (fallback permitido só para debug).

---

## 5️⃣ GUARDRAILS OBRIGATÓRIOS (FALHA RÁPIDA)

### **5.1 - Antes do Fusion (Etapa 7)**
**Localização:** `lib/pipeline/index.js` (antes de chamar `documentFusion.fuse`)

```javascript
// 🔧 GUARDRAIL: Bloquear se doc chegar sem OCR
for (const d of uniqueDocs) {
    const ocr = d.ocrQualityAvg ?? d.metadata?.ocrQualityAvg ?? null;
    if (ocr == null) {
        throw new Error(`[PIPELINE-BLOCK] Doc sem OCR antes do Fusion: ${d.documentId}`);
    }
}
```

**Status:** ✅ Implementado

---

### **5.2 - Antes do Structured Extractor (Etapa 8)**
**Localização:** `lib/pipeline/index.js` (antes de chamar `structuredExtractor.extract`)

```javascript
// 🔧 GUARDRAIL: Bloquear se texto canônico insuficiente
const fullText = CORPO_INTEGRADO.fullText || '';
if (fullText.length < 1000) {
    throw new Error(
        `[PIPELINE-BLOCK] Texto canônico insuficiente para extração: ` +
        `${fullText.length} chars (mínimo: 1000)`
    );
}
```

**Status:** ⏳ A implementar

---

### **Sem Guardrail:**
Sistema "finge sucesso" e exibe "SEM DADOS" → **INACEITÁVEL**

---

## 6️⃣ POLÍTICA DE ALTERAÇÃO (SEM EXCEÇÃO)

### **Qualquer PR que mexa no pipeline DEVE conter:**

1. ✅ **Log tags mantidas:**
   - `[03]` (OCR Engine)
   - `[05-OUT]` (IndexBuilder saída)
   - `[PRE-07]` (Antes do Fusion)
   - `[07-META]` (Fusion metadata)
   - `[08-IN]` (Extractor entrada)
   - `[08-OUT]` (Extractor saída)

2. ✅ **1 teste de regressão:**
   - Usar PDF com texto nativo
   - Validar que OCR > 0
   - Validar que campos são extraídos

3. ✅ **Prova de contrato:**
   - Print `Object.keys(doc)` antes e depois
   - Print `Object.keys(doc.metadata)` antes e depois
   - Confirmar que campos obrigatórios existem

### **Se não cumprir:**
❌ **NÃO MERGEIA**

---

## 7️⃣ ESCOPO DO BUG ATUAL (NÃO DESVIAR)

### **Status:**
- ✅ OCR está resolvido
- 🎯 Foco: Etapa 8 (Structured Extractor) lendo fonte errada

### **PROIBIDO:**
- ❌ Mexer novamente no OCR Engine
- ❌ Mexer em Classifier
- ❌ Mexer no Fusion além de garantir `fullText` canônico

### **PERMITIDO:**
- ✅ Corrigir Structured Extractor para ler `CORPO_INTEGRADO.fullText`
- ✅ Adicionar guardrail antes da Etapa 8
- ✅ Adicionar logs `[08-IN]` e `[08-OUT]`

---

## ✅ CHECKLIST DE ACEITE (FINAL)

### **Teste Obrigatório:**

1. ✅ **OCR banner** não aparece em PDF com texto nativo
2. ✅ **[07-META]** mostra `usingSource:"docs"` e `docQs>=1`
3. ✅ **[08-IN]** mostra `fullTextLen > 1000`
4. ✅ **[08-OUT]** retorna ao menos `orgao` ou `modalidade` (não "SEM DADOS")

### **Se Falhar:**
- ❌ Guardrail deve estourar com mensagem clara
- ❌ Não "fingir sucesso"
- ❌ Não exibir "SEM DADOS" silenciosamente

---

## 📋 CONTRATOS DE DADOS (REFERÊNCIA)

### **Etapa 3 → Etapa 4 (OCR → TextNormalizer):**
```javascript
{
  documentId: string,
  pages: Array,
  fullTextRaw: string,
  ocrQualityAvg: number,  // ✅ OBRIGATÓRIO
  processingTimeMs: number,
  status: 'success'
}
```

### **Etapa 4 → Etapa 5 (TextNormalizer → IndexBuilder):**
```javascript
{
  documentId: string,
  pages: Array,
  fullTextNormalized: string,
  repeatedPatternsRemoved: Array,
  ocrQualityAvg: number,  // ✅ OBRIGATÓRIO
  status: 'success'
}
```

### **Etapa 5 → Etapa 6 (IndexBuilder → Deduplicator):**
```javascript
{
  documentId: string,
  globalLines: Array,
  structures: Object,
  metadata: {
    totalLines: number,
    totalChars: number,
    totalStructures: number,
    totalTables: number,
    ocrQualityAvg: number  // ✅ OBRIGATÓRIO
  },
  status: 'success'
}
```

### **Etapa 6 → Etapa 7 (Deduplicator → Fusion):**
```javascript
{
  documentId: string,
  globalLines: Array,
  structures: Object,
  documentType: string,
  classificationConfidence: number,
  ocrQualityAvg: number,  // ✅ OBRIGATÓRIO (root)
  metadata: {
    totalLines: number,
    totalChars: number,
    ocrQualityAvg: number,  // ✅ OBRIGATÓRIO (metadata)
    ...fileMetadata
  },
  status: 'success'
}
```

### **Etapa 7 → Etapa 8 (Fusion → Extractor):**
```javascript
{
  CORPO_INTEGRADO: {
    loteId: string,
    timestamp: string,
    textoCompleto: string,  // ⚠️ DEPRECATED
    fullText: string,       // ✅ CANÔNICO
    globalLines: Array,
    segments: Array,
    lineMap: Object,
    metadata: {
      totalDocuments: number,
      totalPages: number,
      totalLines: number,
      totalChars: number,
      ocrQualityGlobal: number,  // ✅ OBRIGATÓRIO
      ocrQualityMin: number,
      ocrQualityMax: number
    }
  }
}
```

---

## 🚨 VIOLAÇÕES COMUNS

### **1. Sobrescrever metadata:**
```javascript
// ❌ ERRADO
doc.metadata = fileMetadata;

// ✅ CORRETO
doc = carryForwardOCR(doc, { metadata: fileMetadata });
```

### **2. Strip de campos:**
```javascript
// ❌ ERRADO
doc = { documentId: doc.documentId, pages: doc.pages };

// ✅ CORRETO
doc = { ...doc };  // ou carryForwardOCR(doc, {})
```

### **3. Ler fonte errada:**
```javascript
// ❌ ERRADO (Etapa 8)
const text = pages.map(p => p.text).join('\n');

// ✅ CORRETO
const text = CORPO_INTEGRADO.fullText;
```

---

## 📚 REFERÊNCIAS

- **carryForwardOCR:** `lib/utils/carryForwardOCR.js`
- **Pipeline Runner:** `lib/pipeline/index.js`
- **Contratos:** Este documento

---

**GOVERNANÇA ESTABELECIDA - REGRAS OBRIGATÓRIAS** 🔒

**Qualquer violação deve ser bloqueada em code review.**

---

**Criado:** 2025-12-15 08:46  
**Autor:** Antigravity AI (Claude Sonnet 4.5)  
**Status:** ATIVO - NÃO NEGOCIÁVEL
