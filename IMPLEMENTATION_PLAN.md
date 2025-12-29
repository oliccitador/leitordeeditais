# 🎯 PLANO DE IMPLEMENTAÇÃO - O LICITADOR BLINDADO v1.0

## 📋 VISÃO GERAL
Sistema multi-agentes para análise automática de licitações públicas com arquitetura modular, OCR obrigatório e conformidade legal rigorosa.

---

## 🏗️ FASE 1: ESTRUTURA BASE DO PROJETO

### 1.1 Configuração Inicial
- [x] Criar estrutura de diretórios
- [ ] Configurar package.json
- [ ] Configurar Next.js
- [ ] Configurar variáveis de ambiente
- [ ] Configurar Netlify

### 1.2 Estrutura de Diretórios
```
c:/Leitordeeditais/
├── app/                          # Next.js App Router
│   ├── api/
│   │   ├── analyze/              # Endpoint principal
│   │   ├── agents/               # Endpoints dos agentes
│   │   └── health/               # Health check
│   ├── layout.js
│   └── page.js
├── lib/
│   ├── orchestrator/             # Orquestrador Central
│   │   └── masterLicitator.js
│   ├── agents/                   # 9 Agentes Especializados
│   │   ├── 01-ingestor.js        # OCR e ingestão
│   │   ├── 02-structure.js       # Extração estrutural
│   │   ├── 03-items.js           # Classificação de itens
│   │   ├── 04-compliance.js      # Habilitação
│   │   ├── 05-technical.js       # Capacidade técnica
│   │   ├── 06-legal.js           # Análise jurídica
│   │   ├── 07-divergence.js      # Detector de divergências
│   │   ├── 08-decision.js        # Decisão estratégica
│   │   └── 09-report.js          # Relatórios e PDFs
│   ├── services/
│   │   ├── ocr.js                # Serviço de OCR
│   │   ├── pdf.js                # Geração de PDF
│   │   ├── validation.js         # Validações
│   │   └── logger.js             # Sistema de logs
│   ├── types/
│   │   └── schemas.js            # Schemas JSON
│   └── utils/
│       ├── legal-base.js         # Base legal
│       └── cnae.js               # Dados CNAE
├── public/
├── docs/
│   └── DEV_DOC_v1.0.md           # Documentação oficial
├── .env.local
├── .env.example
├── package.json
├── next.config.js
└── netlify.toml
```

---

## 🤖 FASE 2: IMPLEMENTAÇÃO DOS AGENTES

### 2.1 Agente 1 - Ingestor Engine (OCR)
**Responsabilidades:**
- Receber arquivos múltiplos
- Identificar tipo de documento
- Aplicar OCR em 100% dos casos
- Padronizar formatação
- Criar estrutura paginada

**Tecnologias:**
- Tesseract.js (OCR)
- pdf-parse (leitura de PDF)
- sharp (processamento de imagem)

**Output Schema:**
```json
{
  "tipo": "edital|tr|minuta|ata|anexo|planilha",
  "texto": "string",
  "paginas": ["array"],
  "linhas": ["array"],
  "metadata": {
    "totalPaginas": "number",
    "tamanho": "number"
  }
}
```

### 2.2 Agente 2 - Structure Mapper
**Responsabilidades:**
- Extrair metadados do certame
- Detectar modalidade e processo
- Identificar datas críticas
- Mapear seções hierárquicas

**Output Schema:**
```json
{
  "modalidade": "string",
  "processo": "string",
  "orgao": "string",
  "datas": {
    "abertura": "date",
    "entrega": "date",
    "sessao": "date"
  },
  "secoes": ["array"]
}
```

### 2.3 Agente 3 - Item Classifier
**Responsabilidades:**
- Extrair itens do edital
- Detectar normas técnicas
- Cruzar com CNAE da empresa
- Classificar: ELEGÍVEL / DÚVIDA / INCOMPATÍVEL

**Output Schema:**
```json
[
  {
    "item": "number",
    "descricao": "string",
    "classificacao": "ELEGIVEL|DUVIDA|INCOMPATIVEL",
    "motivo": "string",
    "cnae": "string",
    "origem": {
      "documento": "string",
      "pagina": "number",
      "trecho": "string"
    }
  }
]
```

### 2.4 Agente 4 - Compliance Checker
**Responsabilidades:**
- Interpretar exigências de habilitação
- Classificar riscos
- Identificar ilegalidades
- Criar checklist automático

### 2.5 Agente 5 - Technical Validator
**Responsabilidades:**
- Extrair requisitos de atestados
- Validar proporcionalidade
- Detectar abusos
- Sinalizar impugnações

### 2.6 Agente 6 - Legal Mind Engine (CRÍTICO)
**Responsabilidades:**
- Interpretar cláusulas jurídicas
- Validar base legal (14.133/2021, etc.)
- Detectar ilegalidades
- Gerar minutas jurídicas

**Regras Especiais:**
- SEMPRE citar documento, página e trecho
- NUNCA inventar dados jurídicos
- Usar "SEM DADOS NO ARQUIVO" quando não encontrar

### 2.7 Agente 7 - Divergence Scanner
**Responsabilidades:**
- Comparar Edital × TR
- Detectar diferenças em quantidades, descrições, prazos
- Criar tabela de divergências

### 2.8 Agente 8 - Decision Core
**Responsabilidades:**
- Avaliar somatório de riscos
- Considerar logística, habilitação, pagamento
- Emitir decisão: PARTICIPAR / NÃO PARTICIPAR
- Justificar decisão

### 2.9 Agente 9 - Report Synthesizer
**Responsabilidades:**
- Montar relatório HTML visual
- Gerar PDF profissional
- Criar Anexo I
- Disponibilizar downloads

---

## 🎛️ FASE 3: ORQUESTRADOR CENTRAL

### 3.1 Master Licitator
**Responsabilidades:**
- Gerenciar fluxo de execução
- Validar inputs/outputs entre agentes
- Garantir regras anti-alucinação
- Unificar conclusões
- Registrar logs completos

**Fluxo de Execução:**
1. Upload → Agente 1 (OCR)
2. → Agente 2 (Estrutura)
3. → Agente 3 (Itens)
4. → Agente 4 (Habilitação)
5. → Agente 5 (Técnica)
6. → Agente 6 (Jurídico)
7. → Agente 7 (Divergências)
8. → Agente 8 (Decisão)
9. → Agente 9 (Relatório)
10. → Consolidação final

---

## 🔒 FASE 4: REGRAS CRÍTICAS DE IMPLEMENTAÇÃO

### 4.1 Zero Alucinação
- ✅ Sem inferências
- ✅ Sem dados inventados
- ✅ Usar "SEM DADOS NO ARQUIVO"
- ✅ Validação estrita de outputs

### 4.2 Citação Obrigatória
Toda conclusão DEVE incluir:
```json
{
  "origem": {
    "documento": "Edital.pdf",
    "pagina": 12,
    "trecho": "texto literal extraído"
  }
}
```

### 4.3 Base Legal Obrigatória
- Lei 14.133/2021
- Lei 8.666/1993
- Lei 10.520/2002
- Lei 12.462/2011 (RDC)
- Lei 13.303/2016 (Estatais)
- LC 123/2006
- Jurisprudência TCU/TCEs

---

## 🚀 FASE 5: FRONTEND & UX

### 5.1 Interface Principal
- Upload múltiplo de arquivos
- Preview de documentos
- Barra de progresso por agente
- Visualização em tempo real

### 5.2 Relatório Final
- HTML visual e responsivo
- Seções colapsáveis
- Tabelas de divergências
- Minutas jurídicas
- Botões de download (PDF, Anexo I)
- Caixa preta (logs completos)

---

## 📦 FASE 6: DEPLOY & PRODUÇÃO

### 6.1 Configuração Netlify
- [ ] Configurar netlify.toml
- [ ] Variáveis de ambiente
- [ ] Build settings
- [ ] Funções serverless

### 6.2 Otimizações
- [ ] Caching inteligente
- [ ] Compressão de PDFs
- [ ] Rate limiting
- [ ] Error tracking (Sentry)

---

## 📊 CRONOGRAMA SUGERIDO

| Fase | Duração | Prioridade |
|------|---------|------------|
| Fase 1: Estrutura Base | 1 dia | 🔴 ALTA |
| Fase 2: Agentes 1-3 | 2 dias | 🔴 ALTA |
| Fase 2: Agentes 4-6 | 3 dias | 🔴 ALTA |
| Fase 2: Agentes 7-9 | 2 dias | 🟡 MÉDIA |
| Fase 3: Orquestrador | 2 dias | 🔴 ALTA |
| Fase 4: Validações | 1 dia | 🔴 ALTA |
| Fase 5: Frontend | 2 dias | 🟡 MÉDIA |
| Fase 6: Deploy | 1 dia | 🟢 BAIXA |

**Total Estimado: 14 dias**

---

## ✅ CRITÉRIOS DE SUCESSO

1. ✅ OCR funcional em 100% dos documentos
2. ✅ Zero alucinações nos outputs
3. ✅ Todas as conclusões com citação de origem
4. ✅ Relatório completo em HTML + PDF
5. ✅ Anexo I gerado automaticamente
6. ✅ Minutas jurídicas corretas
7. ✅ Decisão GO/NO-GO justificada
8. ✅ Logs completos de execução
9. ✅ Deploy em produção na Netlify
10. ✅ Conformidade legal 100%

---

**Última atualização:** 2025-12-12  
**Status:** 🚧 EM IMPLEMENTAÇÃO
