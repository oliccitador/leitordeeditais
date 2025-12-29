# 🔍 INSTRUMENTAÇÃO COMPLETA - RASTREAR "STRIPPER"
## Data: 2025-12-15 08:14
## Status: ✅ **LOGS DE KEYS ADICIONADOS - PRONTO PARA TESTE**

---

## 🎯 OBJETIVO

Identificar **onde** o objeto `doc` está sendo "stripado" (reduzido a apenas `{documentId}`) entre a Etapa 5 e o Fusion (Etapa 7).

---

## 📋 LOGS IMPLEMENTADOS

### ✅ [05-OUT] - SAÍDA do IndexBuilder
**Arquivo:** `lib/pipeline/05-indexBuilder.js` (linha ~101)

**Log:**
```javascript
dbg('[05-OUT]', {
    id: normalizedDoc.documentId,
    keys: Object.keys(result || {}),
    hasOcr: !!(result?.ocrQualityAvg || result?.metadata?.ocrQualityAvg),
    ocr: result?.ocrQualityAvg ?? result?.metadata?.ocrQualityAvg ?? null
});
```

**Esperado:**
```json
[05-OUT] {"id":"doc-xxx","keys":["documentId","globalLines","structures","metadata","status"],"hasOcr":true,"ocr":99}
```

---

### ✅ [06-OUT] - SAÍDA do Deduplicator
**Arquivo:** `lib/pipeline/06-deduplicator.js` (linha ~127)

**Log:**
```javascript
dbg('[06-OUT]', {
    count: uniqueDocs?.length,
    firstKeys: uniqueDocs?.[0] ? Object.keys(uniqueDocs[0]) : [],
    firstOcr: uniqueDocs?.[0]?.ocrQualityAvg ?? uniqueDocs?.[0]?.metadata?.ocrQualityAvg ?? null
});
```

**Esperado:**
```json
[06-OUT] {"count":1,"firstKeys":["documentId","globalLines","structures","metadata","status","fingerprint","ocrQualityAvg"],"firstOcr":99}
```

---

### ✅ [PRE-07] - ANTES de chamar Fusion
**Arquivo:** `lib/pipeline/index.js` (linha ~123)

**Log:**
```javascript
dbg('[PRE-07]', {
    docsCount: uniqueDocs?.length,
    firstKeys: uniqueDocs?.[0] ? Object.keys(uniqueDocs[0]) : [],
    firstOcr: uniqueDocs?.[0]?.ocrQualityAvg ?? uniqueDocs?.[0]?.metadata?.ocrQualityAvg ?? null
});
```

**Esperado (SE CORRETO):**
```json
[PRE-07] {"docsCount":1,"firstKeys":["documentId","globalLines","structures","metadata","status","fingerprint","ocrQualityAvg"],"firstOcr":99}
```

**OU (SE STRIPPER EXISTE):**
```json
[PRE-07] {"docsCount":1,"firstKeys":["documentId"],"firstOcr":null}
```

---

## 🔍 CENÁRIOS DE DIAGNÓSTICO

### ✅ Cenário 1: OCR Preservado (SEM Stripper)
```
[05-OUT] {"keys":[...],"hasOcr":true,"ocr":99}
[06-OUT] {"firstKeys":[...],"firstOcr":99}
[PRE-07] {"firstKeys":[...],"firstOcr":99}  ✅
[07-IN] [{"ocr":99,"metaOcr":99}]
[07-META] {"docQs":1,"usingSource":"docs"}
```

**Análise:** ✅ Tudo funcionando! Não há stripper.

---

### ❌ Cenário 2: Stripper ENTRE Etapa 6 e Fusion
```
[05-OUT] {"keys":[...],"hasOcr":true,"ocr":99}
[06-OUT] {"firstKeys":[...],"firstOcr":99}
[PRE-07] {"firstKeys":["documentId"],"firstOcr":null}  ❌ STRIPPER AQUI!
[07-IN] [{"ocr":null,"metaOcr":null}]
[07-META] {"docQs":0,"usingSource":"segments"}
```

**Análise:** ❌ O stripper está **entre [06-OUT] e [PRE-07]**

**Causa:** Algo no `pipeline/index.js` entre linha 121 e 125 está recriando o objeto.

---

### ❌ Cenário 3: Stripper NA Etapa 6
```
[05-OUT] {"keys":[...],"hasOcr":true,"ocr":99}
[06-OUT] {"firstKeys":["documentId"],"firstOcr":null}  ❌ STRIPPER AQUI!
[PRE-07] {"firstKeys":["documentId"],"firstOcr":null}
[07-IN] [{"ocr":null,"metaOcr":null}]
[07-META] {"docQs":0,"usingSource":"segments"}
```

**Análise:** ❌ O stripper está **DENTRO do Deduplicator**

**Causa:** O helper `preserveOCR` não está funcionando corretamente.

---

### ❌ Cenário 4: Stripper NA Etapa 5
```
[05-OUT] {"keys":["documentId"],"hasOcr":false,"ocr":null}  ❌ STRIPPER AQUI!
[06-OUT] {"firstKeys":["documentId"],"firstOcr":null}
[PRE-07] {"firstKeys":["documentId"],"firstOcr":null}
[07-IN] [{"ocr":null,"metaOcr":null}]
[07-META] {"docQs":0,"usingSource":"segments"}
```

**Análise:** ❌ O stripper está **DENTRO do IndexBuilder**

**Causa:** O IndexBuilder não está retornando campos suficientes.

---

## 🚀 PRÓXIMA AÇÃO

### **1. Fazer Novo Upload:**
- Abrir http://localhost:3000
- Upload: `test-files/PE_30_2025_Equipamentos_Mobiliarios_Sade_SITE.pdf`
- Aguardar processamento

### **2. Verificar Logs:**
- Abrir: `c:\Leitordeeditais\debug-ocr-pipeline.log`
- Procurar por:
  - `[05-OUT]`
  - `[06-OUT]`
  - `[PRE-07]`
  - `[07-IN]`
  - `[07-META]`

### **3. Identificar Stripper:**

**Comparar `firstKeys` entre os logs:**

- Se `[06-OUT]` tem keys mas `[PRE-07]` não tem → **Stripper entre 6 e 7**
- Se `[05-OUT]` tem keys mas `[06-OUT]` não tem → **Stripper na Etapa 6**
- Se `[05-OUT]` já não tem keys → **Stripper na Etapa 5**

### **4. Copiar e Enviar:**

**Copiar APENAS estas linhas:**
```
[05-OUT] {...}
[06-OUT] {...}
[PRE-07] {...}
[07-IN] {...}
[07-META] {...}
```

---

## 🎯 CRITÉRIO DE SUCESSO

Identificar **exatamente** onde o doc perde seus campos:

1. ✅ Se `[PRE-07]` mostra `firstKeys` completo → Não há stripper
2. ❌ Se `[PRE-07]` mostra `firstKeys: ["documentId"]` → Stripper identificado

---

## 📝 PRÓXIMO PASSO (APÓS IDENTIFICAR)

### **Se Stripper for Encontrado:**

**Localizar o código entre [06-OUT] e [PRE-07] que recria o objeto:**

Procurar por padrões como:
```javascript
// ❌ ERRADO (stripper)
docs = uniqueDocs.map(d => ({ documentId: d.documentId }));

// ✅ CORRETO
docs = uniqueDocs.map(d => ({ ...d }));
```

**Aplicar correção conforme AÇÃO 2 da ordem original.**

---

**Instrumentação completa! Pronto para identificar o stripper.** 🚀

---

**Desenvolvedor:** Antigravity AI (Claude Sonnet 4.5)  
**Data:** 2025-12-15 08:14  
**Tempo:** ~5 minutos  
**Complexidade:** Média (instrumentação de 3 pontos)
