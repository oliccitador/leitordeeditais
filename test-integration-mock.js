
/**
 * 🧪 TESTE DE INTEGRAÇÃO COM MOCK DE LLM
 * 
 * Objetivo: Validar o fluxo completo (MasterLicitator -> Agente 3 -> Resposta)
 * isolando a falha de Rate Limit da API Groq.
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Mock da classe ItemClassifier ANTES de importar o MasterLicitator
import ItemClassifier from './lib/agents/03-items-v2.js';

// Monkey Patch na chamada de API
const originalProcess = ItemClassifier.prototype.process;
ItemClassifier.prototype.process = async function (corpoIntegrado, companyProfile) {
    console.log("⚠️ [MOCK MODE] Interceptando Agente 3 para evitar Rate Limit");

    // Simula delay de rede
    await new Promise(r => setTimeout(r, 1000));

    // Retorna itens mockados perfeitos
    const items = [
        {
            item_numero: "1",
            descricao: "MOCK: Computador de Alto Desempenho",
            unidade: "UN",
            quantidade: 10,
            classificacao: "ELEGIVEL",
            origens: [{ documento: "teste.pdf", pagina: 1, trecho: "Mocked trecho" }]
        },
        {
            item_numero: "2",
            descricao: "MOCK: Monitor 24pol",
            unidade: "UN",
            quantidade: 10,
            classificacao: "ELEGIVEL",
            origens: [{ documento: "teste.pdf", pagina: 1, trecho: "Mocked trecho" }]
        }
    ];

    return {
        agent_id: "AGENT_03",
        status: "ok",
        dados: { itens: items, resumo: { total_itens: 2, elegiveis: 2 } },
        alerts: [],
        evidence: [],
        metadata: { run_ms: 100, items_found: 2, confidence: 1.0 },
        quality_flags: { needs_review: false }
    };
};

import MasterLicitator from './lib/orchestrator/masterLicitator.js';

async function runIntegrationTest() {
    console.log("🚀 Iniciando Teste de Integração (Mocked LLM)...");

    const orchestrator = new MasterLicitator();

    // Mock de arquivos e corpo integrado simplificado para passar no pipeline
    // Como o Pipeline roda OCR, vamos mockar o RESULTADO do pipeline se possível?
    // Não, o MasterLicitator chama o pipeline.execute.
    // O Pipeline.execute chama OCR. OCR demora e precisa de arquivo.

    // Para teste rápido, vamos mockar o Pipeline.execute também?
    // Sim, foco é testar a orquestração dos agentes.

    const mockPipelineResult = {
        status: 'success',
        pipelineId: 'test-123',
        loteId: 'lote-123',
        durationMs: 500,
        pipelineMetadata: { documentsProcessed: 1, totalDocuments: 1, duplicatesRemoved: 0 },
        CORPO_INTEGRADO: {
            fullText: "Texto Simulado...",
            textoCompleto: "Texto Simulado...",
            globalLines: [{ text: "Linha 1", globalLine: 1 }],
            segments: [{ documentName: "test.pdf", documentType: "edital" }],
            metadata: { ocrQualityGlobal: 100, totalPages: 1 },
            preAnalise: { itens: [], secoesImportantes: [] } // Agente 2 vai popular
        },
        validation: { warnings: [] },
        preAnalise: { metadados: {}, itens: [], secoesImportantes: [] }
    };

    orchestrator.pipeline.execute = async () => {
        console.log("🔹 [MOCK] Pipeline executado com sucesso.");
        return mockPipelineResult;
    };

    // Executa
    try {
        const result = await orchestrator.execute([{ name: "test.pdf", size: 100, arrayBuffer: () => new ArrayBuffer(8) }]);

        console.log("\n================ RESULTADO FINAL ================");
        console.log(`Status de Integração: ${result.status}`);

        const items = result.results.items.dados.itens;
        console.log(`Itens no Report Final: ${items.length}`);

        if (items.length === 2 && items[0].descricao.includes("MOCK")) {
            console.log("✅ SUCESSO: Fluxo completo validado (Agente 3 integrado corretamente).");
        } else {
            console.log("❌ FALHA: Itens não apareceram no resultado final.");
        }

    } catch (e) {
        console.error("ERRO:", e);
    }
}

runIntegrationTest();
