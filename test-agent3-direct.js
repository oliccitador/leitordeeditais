import ItemClassifier from './lib/agents/03-items-v2.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const mockText = `
PREGÃO ELETRÔNICO Nº 42/2024

ITEM 1 - ASPIRADOR DE PÓ E ÁGUA
Descrição: ASPIRADOR DE PÓ E ÁGUA INOX: motor de 1600w; Voltagem: 127v
Unidade: UN
Quantidade: 5

ITEM 2 - BEBEDOURO
Descrição: BEBEDOURO DE PRESSÃO INOX com filtro
Unidade: UN  
Quantidade: 3
`;

const mockCorpo = {
    fullText: mockText,
    textoCompleto: mockText,
    segments: [{ documentName: 'mock.pdf', documentType: 'edital' }],
    globalLines: mockText.split('\n').map((l, i) => ({
        text: l,
        globalLine: i,
        charStart: 0,
        charEnd: l.length,
        sourceDocName: 'mock.pdf',
        sourcePage: 1
    })),
    metadata: { totalPages: 1 }
};

async function test() {
    console.log("🧪 Teste direto do Agente 3 (Gemini)...\n");
    const agent = new ItemClassifier();

    try {
        const result = await agent.process(mockCorpo, { cnaes: [] });

        console.log("\n================ RESULTADO ================");
        console.log(`Status: ${result.status}`);
        console.log(`Itens Detectados: ${result.dados.itens.length}`);

        if (result.dados.itens.length > 0) {
            console.log("\n✅ ITENS EXTRAÍDOS:");
            result.dados.itens.forEach(i => {
                console.log(`  [${i.item_numero}] ${i.descricao.substring(0, 60)}...`);
                console.log(`      Qtd: ${i.quantidade} ${i.unidade}`);
            });
        } else {
            console.log("\n⚠️ Nenhum item foi extraído.");
            if (result.alerts && result.alerts.length > 0) {
                console.log("\nAlertas:");
                result.alerts.forEach(a => console.log(`  - ${a.message}`));
            }
        }

    } catch (e) {
        console.error("\n❌ ERRO:", e.message);
        console.error(e);
    }
}

test();
