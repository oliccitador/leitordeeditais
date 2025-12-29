
import ItemClassifier from './lib/agents/03-items-v2.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const mockText = `
PREFEITURA MUNICIPAL DE CAFELÂNDIA
PREGÃO ELETRÔNICO Nº 30/2025

OBJETO: Aquisição de equipamentos e mobiliários.

1. ITEM 01 - MESA PARA ESCRITÓRIO - MESA PARA ESCRITORIO; CONFECCIONADO EM MDF; REVESTIMENTO EM LAMINADO MELAMINICO DE BAIXA PRESSAO (BP); NA COR CINZA; COM FORMATO RETANGULAR; COM BORDAS EM PVC DE ALTA RESISTENCIA; MEDINDO 1200 X 600 X 740MM ( L X P X A); COM 02 GAVETAS; COM 01 FECHADURA PARA AS GAVETAS; COM PUXADORES INJETADOS
Unidade: UN
Quantidade: 10

2. CADEIRA GIRATÓRIA - CADEIRA GIRATORIA; COM BRACOS; COM REGULAGEM DE ALTURA A GAS; COM BASE EM ACO COM CAPA EM POLIPROPILENO; COM 05 RODIZIOS DUPLOS; COM ASSENTO E ENCOSTO EM ESPUMA INJETADA; REVESTIDO EM TECIDO; NA COR PRETA
Qtd: 20 un.
`;

const mockCorpo = {
    fullText: mockText,
    textoCompleto: mockText,
    segments: [{ documentName: 'mock.pdf', documentType: 'edital' }],
    globalLines: mockText.split('\n').map((l, i) => ({ text: l, globalLine: i })),
    metadata: { totalPages: 1 }
};

async function test() {
    console.log("Teste de Qualidade de Prompt (LLM)...");
    const agent = new ItemClassifier();

    try {
        const result = await agent.process(mockCorpo, { cnaes: [] });

        console.log("\n================ RESULTADO ================");
        console.log(`Itens Detectados: ${result.dados.itens.length}`);

        result.dados.itens.forEach(i => {
            console.log(`[${i.item_numero}] ${i.descricao.substring(0, 50)}... | Qtd: ${i.quantidade}`);
        });

    } catch (e) {
        console.error("ERRO:", e);
    }
}

test();
