# 🧪 PLANO DE VALIDAÇÃO EM PRODUÇÃO (ENTERPRISE GRADE)
## Alvo: `https://oliccitador-leitor-editais.netlify.app`

Este documento serve como roteiro obrigatório para validação da Release Candidate (RC). Segue padrões de SRE (Site Reliability Engineering).

---

## 🛠️ 1. PREPARAÇÃO E FERRAMENTAS
Antes de iniciar, certifique-se de ter:
1.  **Navegador:** Google Chrome (Última versão) - *Simulando Cliente Padrão*.
2.  **Arquivos de Teste:**
    *   `clean.pdf` (PDF nativo digital, simples).
    *   `scanned.pdf` (Digitalização, inclinado, ruído - Teste OCR).
    *   `huge.pdf` (50MB+ ou 500 páginas - Teste de Limimtes).
3.  **Monitoramento:** Console do DevTools aberto (`F12`).

---

## 🚀 2. BATERIA DE TESTES DE FRONTEND (UX/PERFORMANCE)

### T1. Smoke Test (Conectividade)
*   **Ação:** Acessar a URL via aba anônima.
*   **Critério de Sucesso:**
    *   Carregamento < 2s (LCP - Largest Contentful Paint).
    *   Sem erros vermelhos no Console do DevTools.
    *   Título da aba correto.

### T2. Lighthouse Audit (Padrão Google)
*   **Ação:** DevTools -> Tab "Lighthouse" -> "Analyze page load" (Desktop).
*   **Meta Mínima:**
    *   Performance: > 90
    *   Accessibility: > 95
    *   Best Practices: 100
    *   SEO: 100

### T3. Responsividade e Throttling
*   **Ação:** DevTools -> Toggle Device Toolbar -> Selecionar "iPhone 12 Pro".
*   **Network:** Mudar de "No throttling" para **"Fast 3G"**.
*   **Teste:** Tentar fazer upload de 1 arquivo.
*   **Critério:** O app deve mostrar indicador de progresso e não "congelar" a UI.

---

## ⚙️ 3. BATERIA DE TESTES FUNCIONAIS (E2E)

### T4. O Caminho Feliz (Happy Path)
*   **Input:** `clean.pdf`.
*   **Fluxo:** Upload -> Preencher Contexto -> Executar Análise.
*   **Critério:**
    *   Stepper avança suavemente (1 -> 2 -> 3 -> 4).
    *   Redirecionamento para `/results/[id]` automático.
    *   Todas as abas (Itens, Habilitação, Risco) populas.

### T5. O Teste de "Sujeira" (OCR Stress)
*   **Input:** `scanned.pdf` (qualidade ruim).
*   **Critério:**
    *   Banner de "Qualidade OCR" DEVE aparecer (Amarelo ou Vermelho).
    *   O sistema não deve crashar (Erro 500), mas sim avisar "Low Confidence".

### T6. O Teste de Carga (Payload Limit)
*   **Input:** `huge.pdf` (>10MB).
*   **Critério:**
    *   Frontend valida tamanho antes do upload? (Se > Limite, aviso imediato).
    *   Backend aceita e processa ou retorna 413 Payload Too Large tratado?

---

## 🔬 4. BATERIA DE VALIDAÇÃO DE RESULTADOS (ACURÁCIA)
*Esta é a etapa mais crítica. Se o upload funciona mas os dados estão errados, o software é inútil.*

### T7. Acurácia de Itens (Agente 03)
*   **Ação:** Comparar a tabela de itens do PDF original com a tabela gerada na aba "Itens".
*   **Checklist de Validação:**
    *   [ ] **Contagem:** O PDF tem 15 itens. O sistema achou 15 itens? (Tolerância: 0%).
    *   [ ] **Valores:** O valor unitário do Item 1 bate centavo por centavo?
    *   [ ] **Lixo Zero:** Existe algum item que na verdade é um parágrafo jurídico? (Se sim, FALHA CRÍTICA).

### T8. Consistência Matemática
*   **Aferição:** Exportar CSV ou XLS na aba "Downloads".
*   **Cálculo:** Para uma amostra de 5 itens, calcular: `Quantidade` * `Valor Unitário` = `Valor Total`.
*   **Critério:** A diferença deve ser exatamente R$ 0,00.

### T9. Corretude da Habilitação (Agente 04)
*   **Cenário:** Usar um edital que pede explicitamente "Certidão de Falência e Concordata".
*   **Ação:** Ir na aba "Habilitação".
*   **Critério:** O card "Certidão de Falência" deve estar listado como REQUISITO?
*   **Evidência:** Ao clicar no card, ele mostra o trecho exato do PDF onde isso é pedido?

### T10. Detecção de Risco (Agente 05/07)
*   **Cenário:** O Agente de Risco sinalizou "Alto Risco"?
*   **Validação:** Ler a justificativa. Ela faz sentido jurídico ou é alucinação?
    *   *Exemplo Válido:* "Prazo de entrega de 2 dias é inexequível."
    *   *Exemplo Inválido:* "Risco alto porque o céu é azul."

---

## 🔒 5. TESTES DE SEGURANÇA E BLINDAGEM

### T7. Security Headers (Padrão OWASP)
*   **Ferramenta:** [securityheaders.com](https://securityheaders.com)
*   **Alvo:** `https://oliccitador-leitor-editais.netlify.app`
*   **Critério:** Nota mínima **B**. (Preferencialmente A).
*   **Verificar:** HSTS, X-Content-Type-Options, X-Frame-Options.

### T8. Vazamento de Credenciais
*   **Ação:** No DevTools -> Sources -> Procurar por `config`, `env`, ou strings como `API_KEY`.
*   **Critério Crítico:** NENHUMA chave de API do Gemini ou DB pode estar visível no client-side bundle.

---

## 📝 5. REPORTING (TEMPLATE DE EVIDÊNCIA)

Para cada falha, abrir issue no GitHub com:

```markdown
**[PROD-FAIL] Titulo do Erro**
**URL:** https://oliccitador-leitor-editais.netlify.app/results/xyz
**Passos:**
1. Upload de arquivo X
2. Clique em Y
**Esperado:** X
**Aconteceu:** Y (Erro 500)
**Log do Console:** (Print/Copy)
```

---

**Aprovado por:** __________________________
**Data:** 29/12/2025
