# 🔍 INSTRUMENTAÇÃO COMPLETA - DEBUG OCR QUALITY
## Data: 2025-12-15 07:35
## Status: ✅ **LOGS ADICIONADOS - PRONTO PARA TESTE**

---

## 📋 LOGS IMPLEMENTADOS

### ✅ [03] - OCR Engine
**Arquivo:** `lib/pipeline/03-ocrEngine.js`  
**Localização:** Antes do return final (linha ~82)

**Log:**
```javascript
dbg('[03]', {
    id: fileMetadata.documentId,
    ocr: ocrQualityAvg,
    pages: pages?.length,
    chars: (textRaw || '').length
});
```

**Esperado:**
```json
[03] {"id":"doc-123","ocr":100,"pages":53,"chars":89004}
```

---

### ✅ [04-IN] - Text Normalizer (Entrada)
**Arquivo:** `lib/pipeline/04-textNormalizer.js`  
**Localização:** Início da função normalize (linha ~28)

**Log:**
```javascript
dbg('[04-IN]', {
    id: ocrResult.documentId,
    ocr: ocrResult.ocrQualityAvg,
    metaOcr: ocrResult.metadata?.ocrQualityAvg
});
```

**Esperado:**
```json
[04-IN] {"id":"doc-123","ocr":100,"metaOcr":null}
```

---

### ✅ [05-IN] - Index Builder (Entrada)
**Arquivo:** `lib/pipeline/05-indexBuilder.js`  
**Localização:** Início da função build (linha ~44)

**Log:**
```javascript
dbg('[05-IN]', {
    id: normalizedDoc.documentId,
    ocr: normalizedDoc.ocrQualityAvg,
    metaOcr: normalizedDoc.metadata?.ocrQualityAvg
});
```

**Esperado:**
```json
[05-IN] {"id":"doc-123","ocr":100,"metaOcr":null}
```

---

### ✅ [07-IN] - Document Fusion (Entrada)
**Arquivo:** `lib/pipeline/07-documentFusion.js`  
**Localização:** Após sortedDocs (linha ~36)

**Log:**
```javascript
dbg('[07-IN]', sortedDocs.map(d => ({
    id: d.documentId,
    ocr: d.ocrQualityAvg,
    metaOcr: d.metadata?.ocrQualityAvg
})));
```

**Esperado:**
```json
[07-IN] [{"id":"doc-123","ocr":null,"metaOcr":100}]
```

---

### ✅ [07-META] - Document Fusion (buildMetadata)
**Arquivo:** `lib/pipeline/07-documentFusion.js`  
**Localização:** Após coletar segQs e docQs (linha ~353)

**Log:**
```javascript
dbg('[07-META]', {
    segQs: segQs.length,
    docQs: docQs.length,
    segSample: segQs.slice(0, 3),
    docSample: docQs.slice(0, 3)
});
```

**Esperado:**
```json
[07-META] {"segQs":0,"docQs":1,"segSample":[],"docSample":[100]}
```

---

## 🎯 CENÁRIOS DE DIAGNÓSTICO

### ✅ Cenário 1: OCR Preservado Corretamente
```
[03] {"id":"doc-123","ocr":100,"pages":53,"chars":89004}
[04-IN] {"id":"doc-123","ocr":100,"metaOcr":null}
[05-IN] {"id":"doc-123","ocr":100,"metaOcr":null}
[07-IN] [{"id":"doc-123","ocr":null,"metaOcr":100}]
[07-META] {"segQs":0,"docQs":1,"segSample":[],"docSample":[100]}
```

**Análise:**
- ✅ OCR calculado: 100
- ✅ Preservado em [04-IN]: 100
- ✅ Preservado em [05-IN]: 100
- ✅ Chegou em [07-IN] via metadata: 100
- ✅ Coletado em [07-META] via docQs: [100]
- ✅ **Resultado Final:** ocrQualityGlobal = 100

---

### ❌ Cenário 2: OCR Perdido na Etapa 4
```
[03] {"id":"doc-123","ocr":100,"pages":53,"chars":89004}
[04-IN] {"id":"doc-123","ocr":100,"metaOcr":null}
[05-IN] {"id":"doc-123","ocr":null,"metaOcr":null}
[07-IN] [{"id":"doc-123","ocr":null,"metaOcr":null}]
[07-META] {"segQs":0,"docQs":0,"segSample":[],"docSample":[]}
```

**Análise:**
- ✅ OCR calculado: 100
- ✅ Chegou em [04-IN]: 100
- ❌ Perdido em [05-IN]: null (TextNormalizer não preservou)
- ❌ Não chegou em [07-IN]: null
- ❌ Não coletado em [07-META]: docQs vazio
- ❌ **Resultado Final:** ocrQualityGlobal = 0

**Causa:** TextNormalizer não está preservando ocrQualityAvg no retorno

---

### ❌ Cenário 3: OCR Perdido na Etapa 5
```
[03] {"id":"doc-123","ocr":100,"pages":53,"chars":89004}
[04-IN] {"id":"doc-123","ocr":100,"metaOcr":null}
[05-IN] {"id":"doc-123","ocr":100,"metaOcr":null}
[07-IN] [{"id":"doc-123","ocr":null,"metaOcr":null}]
[07-META] {"segQs":0,"docQs":0,"segSample":[],"docSample":[]}
```

**Análise:**
- ✅ OCR calculado: 100
- ✅ Preservado até [05-IN]: 100
- ❌ Não chegou em [07-IN]: null (IndexBuilder não colocou no metadata)
- ❌ Não coletado em [07-META]: docQs vazio
- ❌ **Resultado Final:** ocrQualityGlobal = 0

**Causa:** IndexBuilder não está colocando ocrQualityAvg no metadata

---

### ❌ Cenário 4: Fallback Não Funcionando
```
[03] {"id":"doc-123","ocr":100,"pages":53,"chars":89004}
[04-IN] {"id":"doc-123","ocr":100,"metaOcr":null}
[05-IN] {"id":"doc-123","ocr":100,"metaOcr":100}
[07-IN] [{"id":"doc-123","ocr":100,"metaOcr":100}]
[07-META] {"segQs":0,"docQs":0,"segSample":[],"docSample":[]}
```

**Análise:**
- ✅ OCR preservado até [07-IN]
- ❌ Mas não coletado em [07-META]: docQs vazio
- ❌ **Resultado Final:** ocrQualityGlobal = 0

**Causa:** Lógica de fallback em buildMetadata não está funcionando

---

## 🚀 COMO EXECUTAR O TESTE

### PASSO 1: Fazer Upload
1. Abrir http://localhost:3000
2. Upload: `test-files/PE_30_2025_Equipamentos_Mobiliarios_Sade_SITE.pdf`
3. Clicar em "Analisar Licitação"

### PASSO 2: Capturar Logs
1. Abrir terminal onde `npm run dev` está rodando
2. Aguardar processamento completo
3. Procurar pelos logs com tags:
   - `[03]`
   - `[04-IN]`
   - `[05-IN]`
   - `[07-IN]`
   - `[07-META]`

### PASSO 3: Copiar Logs
Copiar **APENAS** as linhas com as tags acima:

```
[03] {...}
[04-IN] {...}
[05-IN] {...}
[07-IN] {...}
[07-META] {...}
```

---

## 📊 CRITÉRIO DE SUCESSO

### ✅ Patch Funcionou:
```json
[07-META] {"segQs":0,"docQs":1,"segSample":[],"docSample":[100]}
```
- `docQs` > 0
- `docSample` contém valores > 0

### ❌ Patch Não Funcionou:
```json
[07-META] {"segQs":0,"docQs":0,"segSample":[],"docSample":[]}
```
- `docQs` = 0
- `docSample` vazio

---

## 🎯 PRÓXIMA AÇÃO

**Executar 1 análise completa e coletar os 5 logs:**

1. Upload do PDF
2. Aguardar processamento
3. Copiar logs do terminal
4. Reportar resultados

---

**Servidor está rodando. Pronto para teste!** 🚀

---

**Desenvolvedor:** Antigravity AI (Claude Sonnet 4.5)  
**Data:** 2025-12-15 07:35  
**Tempo:** ~5 minutos  
**Complexidade:** Média (instrumentação de 5 pontos)
