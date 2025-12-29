# 🧪 GUIA DE VALIDAÇÃO MANUAL - PATCH OCR QUALITY
## Data: 2025-12-13 21:23

---

## 🎯 OBJETIVO

Validar que o patch cirúrgico corrigiu o problema de OCR Quality 0%.

---

## 📋 PASSO A PASSO (5 MINUTOS)

### **PASSO 1: Abrir Aplicação**
1. Abrir navegador
2. Acessar: http://localhost:3000
3. Aguardar página carregar

---

### **PASSO 2: Fazer Upload**
1. Clicar no campo de upload de arquivos
2. Selecionar arquivo: `c:\Leitordeeditais\test-files\PE_30_2025_Equipamentos_Mobiliarios_Sade_SITE.pdf`
3. Aguardar arquivo ser carregado
4. Clicar no botão **"Analisar Licitação"**

---

### **PASSO 3: Aguardar Processamento**
- ⏳ Aguardar pipeline processar (pode levar 30-60 segundos)
- ✅ Página deve redirecionar automaticamente para `/results/{batch_id}`

---

### **PASSO 4: Verificar Dashboard**

#### **4.1 - Verificar Banner OCR**
**Esperado:**
- ✅ Banner de "⚠️ Leitura com Baixa Confiabilidade (OCR Baixo)" **NÃO** deve aparecer
- ✅ OU se aparecer, deve mostrar qualidade **> 50%** (não 0%)

**Se aparecer com 0%:**
- ❌ Patch não funcionou

---

#### **4.2 - Verificar Campos Extraídos**
**Esperado:**
- ✅ Campos **NÃO** devem ter tag `[LOW_CONFIDENCE]`
- ✅ Modalidade, Órgão, etc devem estar preenchidos

**Se tiver LOW_CONFIDENCE:**
- ⚠️ Pode ser problema de extração, não de OCR

---

### **PASSO 5: Verificar LocalStorage (CRÍTICO)**

#### **5.1 - Abrir DevTools**
1. Pressionar **F12** (ou Ctrl+Shift+I)
2. Clicar na aba **"Application"** (ou "Aplicativo")
3. No menu lateral esquerdo, expandir **"Local Storage"**
4. Clicar em **"http://localhost:3000"**

---

#### **5.2 - Encontrar Resultado**
1. Na lista de chaves, procurar por `result_{batch_id}`
2. OU procurar por `lastResult`
3. Clicar na chave para ver o valor

---

#### **5.3 - Verificar Valores OCR**

**Procurar por:**
```json
{
  "pipeline_summary": {
    "ocr_quality_avg": ???,      // ⭐ VERIFICAR ESTE VALOR
    "ocr_quality_pct": ???        // ⭐ VERIFICAR ESTE VALOR (DEBUG)
  },
  "corpo_integrado": {
    "metadata": {
      "ocrQualityGlobal": ???,   // ⭐ VERIFICAR ESTE VALOR
      "ocrQualityMin": ???,
      "ocrQualityMax": ???
    }
  }
}
```

---

### **PASSO 6: Interpretar Resultados**

#### ✅ **PATCH FUNCIONOU SE:**
```json
{
  "pipeline_summary": {
    "ocr_quality_avg": 1.0,      // ✅ ou próximo (0.95, 0.98, etc)
    "ocr_quality_pct": 100        // ✅ ou próximo (95, 98, etc)
  },
  "corpo_integrado": {
    "metadata": {
      "ocrQualityGlobal": 100,   // ✅ ou próximo
      "ocrQualityMin": 100,
      "ocrQualityMax": 100
    }
  }
}
```

**E:**
- ✅ Banner de "OCR Baixo" **NÃO** aparece
- ✅ Campos **NÃO** têm `LOW_CONFIDENCE`

---

#### ❌ **PATCH NÃO FUNCIONOU SE:**
```json
{
  "pipeline_summary": {
    "ocr_quality_avg": 0,        // ❌ AINDA 0
    "ocr_quality_pct": 0          // ❌ AINDA 0
  },
  "corpo_integrado": {
    "metadata": {
      "ocrQualityGlobal": 0,     // ❌ AINDA 0
      "ocrQualityMin": 0,
      "ocrQualityMax": 0
    }
  }
}
```

**E:**
- ❌ Banner de "OCR Baixo" **APARECE** com 0%
- ❌ Campos têm `LOW_CONFIDENCE`

---

### **PASSO 7: Verificar Console (OPCIONAL)**

#### **7.1 - Abrir Console**
1. No DevTools (F12), clicar na aba **"Console"**
2. Procurar por logs do pipeline

#### **7.2 - Procurar por:**
```
OCREngine: Qualidade: 100%
DocumentFusion: ocrQualityGlobal = 100
```

**Se encontrar:**
- ✅ OCR está calculando corretamente

**Se NÃO encontrar:**
- ⚠️ Pode ter erro no pipeline

---

## 📊 CHECKLIST DE VALIDAÇÃO

### ✅ Validação Mínima (Obrigatória):
- [ ] Upload realizado com sucesso
- [ ] Pipeline processou sem erros
- [ ] Redirecionou para página de resultados
- [ ] LocalStorage mostra `ocr_quality_avg` > 0
- [ ] LocalStorage mostra `ocrQualityGlobal` > 0

### ✅ Validação Completa (Recomendada):
- [ ] `ocr_quality_avg` = ~1.0 (escala 0-1)
- [ ] `ocr_quality_pct` = ~100 (escala 0-100)
- [ ] `ocrQualityGlobal` = ~100
- [ ] Banner de "OCR Baixo" NÃO aparece
- [ ] Campos NÃO têm `LOW_CONFIDENCE`
- [ ] Console mostra logs de qualidade OCR

---

## 🎯 RESULTADO ESPERADO

### **Cenário Ideal:**
```
✅ ocr_quality_avg: 1.0
✅ ocr_quality_pct: 100
✅ ocrQualityGlobal: 100
✅ Banner: Oculto
✅ Campos: Sem LOW_CONFIDENCE
```

### **Cenário Aceitável:**
```
✅ ocr_quality_avg: 0.85-1.0
✅ ocr_quality_pct: 85-100
✅ ocrQualityGlobal: 85-100
✅ Banner: Oculto (se > 0.5)
⚠️ Campos: Alguns com LOW_CONFIDENCE (normal)
```

### **Cenário Falha:**
```
❌ ocr_quality_avg: 0
❌ ocr_quality_pct: 0
❌ ocrQualityGlobal: 0
❌ Banner: Aparece com 0%
❌ Campos: Todos com LOW_CONFIDENCE
```

---

## 🚨 SE O PATCH NÃO FUNCIONOU

### **Possíveis Causas:**

1. **Servidor não foi reiniciado**
   - Solução: Reiniciar servidor (Ctrl+C + `npm run dev`)

2. **Cache do navegador**
   - Solução: Ctrl+Shift+Delete → Limpar cache

3. **Resultado antigo no LocalStorage**
   - Solução: DevTools → Application → Local Storage → Limpar tudo

4. **Erro no pipeline**
   - Solução: Verificar console (F12) por erros

---

## 📝 COMO REPORTAR RESULTADO

### **Se Funcionou:**
```
✅ PATCH VALIDADO!
- ocr_quality_avg: [valor]
- ocr_quality_pct: [valor]
- ocrQualityGlobal: [valor]
- Banner: [aparece/não aparece]
```

### **Se Não Funcionou:**
```
❌ PATCH NÃO FUNCIONOU
- ocr_quality_avg: [valor]
- ocr_quality_pct: [valor]
- ocrQualityGlobal: [valor]
- Banner: [aparece/não aparece]
- Erro no console: [copiar erro se houver]
```

---

## 🎉 BOA SORTE!

O patch foi aplicado corretamente. Agora é só validar!

**Tempo estimado:** 5 minutos

---

**Desenvolvedor:** Antigravity AI (Claude Sonnet 4.5)  
**Data:** 2025-12-13 21:23
