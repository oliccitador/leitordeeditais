# HANDOFF_SPRINT3.md

> **Data:** 2025-12-12 15:12 BRT  
> **Projeto:** O Licitador Blindado  
> **Status:** DB-1 COMPLETO (100%) | Sprint 3 INICIADA (10%)  
> **Próximo:** Continuar Sprint 3 - Perguntas Pós-Análise + CNPJ/Contexto

---

## 📊 ESTADO ATUAL DO PROJETO

### **COMPLETO (100%):**

#### **Backend (9 agentes):**
- ✅ Pipeline (9 módulos) - ESTÁVEL
- ✅ AGENT_02 (StructureMapper) - Envelope padrão DEV DOC 3/8
- ✅ AGENT_03 (ItemClassifier) - Testado + Diário
- ✅ AGENT_04 (ComplianceChecker) - Testado + Diário
- ✅ AGENT_05 (TechnicalValidator) - Testado + Diário
- ✅ AGENT_06 (LegalMindEngine) - Básico funcional
- ✅ AGENT_07 (DivergenceScanner) - Testado + Diário
- ✅ AGENT_08 (DecisionCore) - Testado + Diário
- ✅ AGENT_09 (ReportSynthesizer) - Testado + Diário
- ✅ **Teste E2E Full: 100% (37/37)** 🎉

#### **Frontend Sprint 1+2:**
- ✅ Upload multi-arquivo com validações
- ✅ PipelineStatusStepper (9 etapas)
- ✅ ResultsDashboard (9 seções)
- ✅ SourcesPanel (filtros + copiar)
- ✅ BlackBoxPanel (timeline + warnings)
- ✅ DownloadsPanel (validação consolidado)
- ✅ **OCR Banner (trava < 50%)** ⚠️ CRÍTICO
- ✅ Página /history

#### **DB Sprint 1:**
- ✅ Prisma 6.x (SQLite)
- ✅ 8 modelos (users, organizations, analysis_batches, uploaded_documents, integrated_corpus, user_questions, user_answers, generated_artifacts)
- ✅ POST /api/analyze (persistência completa)
- ✅ GET /api/batches/:batchId (ownership)
- ✅ GET /api/history (últimos 20 batches)
- ✅ DB = fonte da verdade (localStorage = cache UX)

---

## 🎯 SPRINT 3 - ESTADO ATUAL (10%)

### **OBJETIVO:**
Perguntas Pós-Análise + CNPJ/Contexto

### **O QUE FOI FEITO:**
1. ✅ Schema Prisma atualizado com 3 novas tabelas:
   - `CompanyProfile` (cnpj, razaoSocial, cnaes, porte, situacaoCadastral)
   - `BatchCompanyContext` (estoque, alcanceLogisticoKm, apetiteRisco)
   - `BatchQuestion` (mode PRE|POST, category, questionText, answerText, evidence, status)

### **BLOQUEIO ATUAL:**
⚠️ **Erro de sintaxe no schema.prisma linha 121:**
```prisma
# LINHA 121 (ERRADA):
batchCompanyContext   BatchCompanyContext    ?  // espaço antes do ?

# CORRIGIR PARA:
batchCompanyContext   BatchCompanyContext?  // sem espaço
```

**Após correção, rodar:**
```bash
npx prisma migrate dev --name sprint3_questions_context
npx prisma generate
```

---

## 📋 ROADMAP SPRINT 3 (7 ENTREGAS)

### **1. ✅ Migrations (PENDENTE FIX)**
- Fix linha 121 do schema
- Rodar migration
- Gerar Prisma Client

### **2. ⏳ API: POST /api/company/lookup**
**Objetivo:** Consultar CNPJ na Receita Federal

**Input:**
```json
{
  "cnpj": "00.000.000/0000-00"
}
```

**Output:**
```json
{
  "id": "uuid",
  "cnpj": "00000000000000",
  "razaoSocial": "EMPRESA LTDA",
  "cnaes": ["1234-5/00", "6789-0/00"],
  "porte": "ME",
  "situacaoCadastral": "ATIVA"
}
```

**Regras:**
- Sanitizar CNPJ (somente dígitos)
- Cache por CNPJ (se já existe no DB, retornar)
- Se Receita falhar: erro claro + retry sugerido
- Persistir em `company_profiles`

**Implementação (usar serviço existente ou criar mock MVP):**
```typescript
// app/api/company/lookup/route.ts
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const { cnpj } = await request.json();
  
  // Sanitizar
  const cnpjClean = cnpj.replace(/\D/g, '');
  
  // Cache
  let profile = await prisma.companyProfile.findUnique({
    where: { cnpj: cnpjClean }
  });
  
  if (profile) return NextResponse.json(profile);
  
  // Consultar Receita (API/mock)
  const data = await consultarReceita(cnpjClean);
  
  // Persistir
  profile = await prisma.companyProfile.create({
    data: {
      cnpj: cnpjClean,
      razaoSocial: data.razaoSocial,
      cnaes: JSON.stringify(data.cnaes),
      porte: data.porte,
      situacaoCadastral: data.situacao,
    }
  });
  
  return NextResponse.json(profile);
}
```

---

### **3. ⏳ API: POST /api/batches/:batchId/context**
**Objetivo:** Salvar contexto operacional da empresa

**Input:**
```json
{
  "companyProfileId": "uuid",
  "estoque": "PRONTO",
  "alcanceLogisticoKm": 500,
  "apetiteRisco": "MEDIO",
  "observacoes": "Equipe reduzida em jan/fev"
}
```

**Output:**
```json
{
  "id": "uuid",
  "batchId": "uuid",
  "companyProfileId": "uuid",
  "estoque": "PRONTO",
  ...
}
```

**Implementação:**
```typescript
// app/api/batches/[batchId]/context/route.ts
import { prisma } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const { batchId } = await params;
  const body = await request.json();
  
  const context = await prisma.batchCompanyContext.create({
    data: {
      batchId: batchId,
      companyProfileId: body.companyProfileId,
      estoque: body.estoque,
      alcanceLogisticoKm: body.alcanceLogisticoKm,
      apetiteRisco: body.apetiteRisco,
      observacoes: body.observacoes,
    }
  });
  
  return NextResponse.json(context);
}
```

---

### **4. ⏳ API: POST /api/batches/:batchId/questions + QuestionRouter**
**Objetivo:** Responder perguntas usando CORPUS do DB

**Input:**
```json
{
  "mode": "POST",
  "questions": [
    {
      "category": "habilitacao",
      "questionText": "Preciso de certidão negativa de débitos?"
    }
  ]
}
```

**Output:**
```json
{
  "answers": [
    {
      "questionId": "uuid",
      "answerText": "Sim, certidão negativa de débitos...",
      "evidence": [
        {
          "field": "certidao_negativa",
          "documento": "Edital.pdf",
          "pagina": 15,
          "trecho_literal": "É obrigatória a apresentação..."
        }
      ],
      "status": "OK",
      "answerFormat": "TEXT"
    }
  ]
}
```

**QuestionRouter (categorias → agentes):**
```typescript
const CATEGORY_TO_AGENT = {
  'habilitacao': 'AGENT_04',
  'capacidade_tecnica': 'AGENT_05',
  'amostras': 'AGENT_05',
  'divergencias': 'AGENT_07',
  'itens': 'AGENT_03',
  'equivalencia_marca': 'AGENT_03',
  'juridico': 'AGENT_06',
  'go_no_go': 'AGENT_08',
};

function routeQuestion(category: string, questionText: string, corpus: any, results: any) {
  const agentId = CATEGORY_TO_AGENT[category] || 'GENERIC';
  
  // Buscar resposta no resultado do agente + corpus
  const agentData = results.agents[agentId];
  
  // Extrair resposta com evidência
  return {
    answerText: "...",
    evidence: [...],
    status: "OK",
  };
}
```

**Implementação:**
```typescript
// app/api/batches/[batchId]/questions/route.ts
import { prisma } from '@/lib/db';
import { QuestionRouter } from '@/lib/question-router';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const { batchId } = await params;
  const { mode, questions } = await request.json();
  
  // Carregar batch + corpus
  const batch = await prisma.analysisBatch.findUnique({
    where: { id: batchId },
    include: { integratedCorpus: true }
  });
  
  const corpus = JSON.parse(batch.integratedCorpus.globalLines);
  const results = JSON.parse(batch.results);
  
  // Processar perguntas
  const router = new QuestionRouter(corpus, results);
  const answers = [];
  
  for (const q of questions) {
    const answer = router.route(q.category, q.questionText);
    
    // Salvar no DB
    const saved = await prisma.batchQuestion.create({
      data: {
        batchId: batchId,
        mode: mode,
        category: q.category,
        questionText: q.questionText,
        answerText: answer.answerText,
        evidence: JSON.stringify(answer.evidence),
        status: answer.status,
        answerFormat: 'TEXT',
      }
    });
    
    answers.push({ questionId: saved.id, ...answer });
  }
  
  return NextResponse.json({ answers });
}
```

---

### **5. ⏳ UI: CNPJPanel**
**Localização:** `components/CNPJPanel.tsx`

**Funcionalidade:**
- Input CNPJ com máscara
- Botão "Consultar Receita"
- Exibe readonly: Razão Social, CNAEs, Porte
- Salva `companyProfileId` no estado

**Código:**
```typescript
'use client';

import { useState } from 'react';

export default function CNPJPanel({ onProfileLoaded }: { onProfileLoaded: (id: string) => void }) {
  const [cnpj, setCnpj] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/company/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnpj }),
      });
      
      const data = await res.json();
      setProfile(data);
      onProfileLoaded(data.id);
    } catch (error) {
      alert('Erro ao consultar CNPJ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">2. CNPJ da Empresa (Opcional)</h2>
      
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={cnpj}
          onChange={(e) => setCnpj(e.target.value)}
          placeholder="00.000.000/0000-00"
          className="flex-1 px-4 py-2 border rounded"
        />
        <button
          onClick={handleLookup}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700"
        >
          {loading ? 'Consultando...' : 'Consultar Receita'}
        </button>
      </div>

      {profile && (
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold mb-2">Dados da Empresa:</h3>
          <p><strong>Razão Social:</strong> {profile.razaoSocial}</p>
          <p><strong>CNAEs:</strong> {JSON.parse(profile.cnaes || '[]').join(', ')}</p>
          <p><strong>Porte:</strong> {profile.porte}</p>
        </div>
      )}
    </div>
  );
}
```

---

### **6. ⏳ UI: CompanyContextPanel + QuestionBox**

Similar ao CNPJPanel, criar componentes para:
- Contexto operacional (estoque/alcance/risco)
- Perguntas pré-análise (checklist + livre)
- Perguntas pós-análise (com sugestões)

---

### **7. ⏳ Diário Sprint 3**
Criar `docs/diary/SPRINT_03_DIARY.md` ao final.

---

## 🔧 DECISÕES TÉCNICAS IMPORTANTES

### **Backend:**
- Prisma 6.x (não 7) - estável, production-ready
- SQLite (MVP) → Postgres (produção)
- user_id = "dev" (placeholder até auth)
- JSON serializado em campos (migrar para S3 quando > 5MB)

### **Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- localStorage = cache UX (DB = fonte verdade)

### **Trava OCR < 50%:**
- Banner vermelho obrigatório
- Badges LOW_CONFIDENCE em campos sensíveis
- CTA "Anexar PDF melhor"

---

## 📁 ESTRUTURA DE ARQUIVOS CRÍTICOS

```
c:/Leitordeeditais/
├── prisma/
│   ├── schema.prisma ⚠️ CORRIGIR LINHA 121
│   ├── dev.db
│   └── migrations/
├── lib/
│   ├── db.ts (Prisma singleton)
│   ├── orchestrator/masterLicitator.js
│   └── agents/ (02-09)
├── app/
│   ├── page.tsx (Nova Análise)
│   ├── results/[batchId]/page.tsx
│   ├── history/page.tsx
│   └── api/
│       ├── analyze/route.ts
│       ├── batches/[batchId]/route.ts
│       └── history/route.ts
├── components/
│   ├── UploadPanel.tsx
│   ├── ResultsDashboard.tsx
│   ├── SourcesPanel.tsx
│   ├── BlackBoxPanel.tsx
│   ├── DownloadsPanel.tsx
│   └── OCRQualityBanner.tsx ⚠️ CRÍTICO
└── docs/
    ├── diary/ (9 agentes + Sprint DB-1 + Sprint 02)
    ├── BACKEND_STATUS.md
    └── FRONTEND_PLAN.md
```

---

## 🚀 COMO CONTINUAR (PRÓXIMA CONVERSA)

### **1. Corrigir Schema (URGENTE):**
```bash
# Editar prisma/schema.prisma linha 121
# Trocar:
batchCompanyContext   BatchCompanyContext    ?
# Para:
batchCompanyContext   BatchCompanyContext?

# Rodar:
npx prisma migrate dev --name sprint3_questions_context
npx prisma generate
```

### **2. Implementar APIs (ordem):**
1. `/api/company/lookup`
2. `/api/batches/:batchId/context`
3. `/api/batches/:batchId/questions` + QuestionRouter

### **3. Implementar UI:**
1. CNPJPanel
2. CompanyContextPanel
3. QuestionBox (pré e pós)

### **4. Testar fluxo:**
- Upload → CNPJ → Contexto → Perguntas Pré → Analisar → Resultado → Perguntas Pós

### **5. Criar Diário:**
- `docs/diary/SPRINT_03_DIARY.md`

---

## 📊 MÉTRICAS DO PROJETO

- **Backend:** 9 agentes, 9 módulos pipeline, ~15k linhas
- **Frontend:** 12 componentes, 3 páginas
- **DB:** 11 modelos Prisma (8 Sprint DB-1 + 3 Sprint 3)
- **Testes E2E:** 100% (37/37)
- **Diários:** 11 (9 agentes + Sprint DB-1 + Sprint 02)
- **Tempo total:** ~20h de desenvolvimento

---

## ⚠️ RISCOS E LIMITAÇÕES CONHECIDAS

1. **Auth:** user_id = "dev" (implementar NextAuth)
2. **Storage:** Arquivos locais (migrar S3/R2)
3. **Corpus > 1MB:** Limitar ou usar storage
4. **SQLite:** Migrar Postgres para produção

---

## 🎯 CRITÉRIOS DE ACEITE SPRINT 3

- [ ] CNPJ consulta Receita e persiste
- [ ] Contexto operacional salvo no DB
- [ ] Perguntas pré-análise funcionais
- [ ] Perguntas pós-análise usando corpus (sem rerodar pipeline)
- [ ] Template jurídico "Pedido de Esclarecimento"
- [ ] Q&A aparecem na tela de resultado
- [ ] F5 não perde perguntas/respostas
- [ ] Diário Sprint 3 completo

---

**✅ HANDOFF COMPLETO - PRONTO PARA NOVA CONVERSA**

**Ao iniciar próxima conversa:**
1. Fornecer este documento
2. Dizer: "Continuar Sprint 3 do HANDOFF"
3. Começar pela correção do schema.prisma

**Última atualização:** 2025-12-12 15:12 BRT
