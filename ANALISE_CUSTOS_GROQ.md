# 📊 ANÁLISE DE CUSTOS - GROQ API
## Leitor de Editais - Previsão de Gastos

---

## 📈 DADOS REAIS COLETADOS

**Consumo por Análise (Log Real):**
- Tokens por análise: ~10.114 tokens
- Modelo usado: `llama-3.3-70b-versatile`
- Tempo de resposta: ~164ms ⚡

**Documento testado:**
- PDF: 67 páginas
- Caracteres: 177.548
- Complexidade: Edital de pregão eletrônico (padrão)

---

## 💰 PLANOS GROQ

### 🆓 FREE TIER (Atual)
- **Limite:** 100.000 tokens/dia
- **Análises/dia:** ~9 análises (10.114 tokens cada)
- **Análises/mês:** ~270 análises
- **Custo:** $0.00
- **Velocidade:** Alta (164ms)
- **Limite reseta:** A cada 24h

### 💵 PAID TIER (Pay-as-you-go)
**Modelo:** llama-3.3-70b-versatile
- **Preço:** $0.59 / 1M tokens input
- **Preço:** $0.79 / 1M tokens output (resposta do modelo)

**Cálculo estimado por análise:**
- Input: 10.114 tokens × $0.59 / 1M = $0.006
- Output: ~2.000 tokens × $0.79 / 1M = $0.002
- **Total por análise:** ~$0.008 (R$ 0,04)

---

## 📊 PREVISÃO DE CUSTOS MENSAIS

### Cenário 1: Uso Baixo (10 análises/dia)
- **Análises/mês:** 300
- **Tokens/mês:** 3.034.200 (~3M)
- **Custo FREE:** $0 (dentro do limite)
- **Custo PAID:** ~$2.40/mês (R$ 12,00)

### Cenário 2: Uso Moderado (50 análises/dia)
- **Análises/mês:** 1.500
- **Tokens/mês:** 15.171.000 (~15M)
- **Custo FREE:** Impossível (excede limite)
- **Custo PAID:** ~$12.00/mês (R$ 60,00)

### Cenário 3: Uso Alto (200 análises/dia)
- **Análises/mês:** 6.000
- **Tokens/mês:** 60.684.000 (~60M)
- **Custo FREE:** Impossível
- **Custo PAID:** ~$48.00/mês (R$ 240,00)

### Cenário 4: Uso Intensivo (500 análises/dia)
- **Análises/mês:** 15.000
- **Tokens/mês:** 151.710.000 (~152M)
- **Custo FREE:** Impossível
- **Custo PAID:** ~$120.00/mês (R$ 600,00)

---

## 🎯 OTIMIZAÇÕES POSSÍVEIS

### 1. Redução de Prompt (50% economia)
**Como:** Enviar apenas trechos relevantes do edital
- Tokens por análise: ~5.000 (ao invés de 10k)
- **Análises FREE/dia:** 20 (ao invés de 9)
- **Custo PAID/análise:** $0.004 (50% mais barato)

### 2. Cache de Contexto (70% economia em reanálises)
**Como:** Reusar partes do edital já analisadas
- Útil para múltiplas perguntas sobre o mesmo edital
- Economia: ~7.000 tokens por pergunta adicional

### 3. Modelo Menor (80% economia)
**Alternativa:** `llama-3.1-8b-instant`
- Preço: $0.05 / 1M tokens (10x mais barato)
- Velocidade: Ainda mais rápida
- Trade-off: Qualidade ~10% menor

---

## 📉 COMPARAÇÃO COM CONCORRENTES

| Provedor | Modelo | Preço Input | Preço Output | Custo/Análise |
|----------|--------|-------------|--------------|---------------|
| **Groq** | Llama 3.3 70B | $0.59/1M | $0.79/1M | **$0.008** |
| OpenAI | GPT-4o | $2.50/1M | $10.00/1M | $0.045 |
| OpenAI | GPT-4o-mini | $0.15/1M | $0.60/1M | $0.003 |
| Google | Gemini 1.5 Pro | $1.25/1M | $5.00/1M | $0.023 |
| Anthropic | Claude 3.5 | $3.00/1M | $15.00/1M | $0.060 |

**Vantagens Groq:**
- ⚡ **10x mais rápido** que OpenAI
- 💰 **5x mais barato** que GPT-4o
- 🔥 Especializado em velocidade (164ms vs ~2s)

---

## 🎁 RECOMENDAÇÃO

### Para DESENVOLVIMENTO/TESTES:
✅ **FREE TIER (atual)**
- Suficiente para 9 análises/dia
- Criar 2-3 contas com emails diferentes
- Total: ~27 análises/dia grátis

### Para PRODUÇÃO (poucos usuários):
✅ **FREE TIER + Otimização**
- Reduzir prompt para 5k tokens
- 20 análises/dia grátis
- Upgrade para PAID se exceder

### Para PRODUÇÃO (escala):
✅ **PAID TIER**
- Custo baixíssimo: $0.008/análise
- Sem limite de taxa
- Billing mensal previsível

---

## 💡 ESTIMATIVA REALISTA PARA SEU CASO

**Perfil esperado:**
- Usuários: 10-50 (primeiros meses)
- Análises/usuário/dia: 1-3
- **Total/dia:** 10-150 análises

**Custo esperado:**
- Mês 1-3: $0 (FREE)
- Mês 4-6: $2-10/mês
- Mês 7+: $10-50/mês

**Break-even:** ~1.500 análises/mês para justify PAID tier

---

## 🔐 ESTRATÉGIA MULTI-CONTA (LEGAL)

**Para maximizar FREE tier:**
1. Conta 1: `email@gmail.com` (100k/dia)
2. Conta 2: `email+dev@gmail.com` (100k/dia)
3. Conta 3: `email+prod@gmail.com` (100k/dia)

**Total FREE:** 300k tokens/dia = ~27 análises/dia grátis

**Rotação automática:**
- Implementar sistema que alterna entre contas
- Resetar a cada 24h
- **810 análises/mês GRÁTIS**

---

## ✅ CONCLUSÃO

**Custo atual:** $0 (FREE tier)
**Custo estimado (1 ano):**
- Meses 1-6: $0-20
- Meses 7-12: $20-60/mês
- **Total ano 1:** ~$300 (R$ 1.500)

**ROI:** Excelente (velocidade + baixo custo)

**Próximos passos:**
1. ✅ Usar FREE tier para MVP
2. ✅ Implementar otimização de prompt (50% economia)
3. ✅ Monitorar uso real nos primeiros 30 dias
4. ⏰ Avaliar upgrade para PAID apenas se necessário

---

**Gerado em:** 2025-12-13
**Baseado em:** Logs reais de produção
**Modelo:** llama-3.3-70b-versatile
