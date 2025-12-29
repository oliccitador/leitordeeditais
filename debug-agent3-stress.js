
import ItemClassifier from './lib/agents/03-items-v2.js';

// MOCK AGRESSIVO (Baseado nos prints de erro)
const mockCorpoIntegrado = {
    globalLines: [
        // CENÁRIO 1: Cláusula Jurídica Numerada (DEVE SER DESCARTADA)
        { text: "6. 2, com o intuito de burlar a efetividade da sanção a ela aplicada, inclusive a sua controladora...", globalLine: 100 },
        { text: "7. 1, os proponentes que deixarem de encaminhar as propostas...", globalLine: 101 },
        { text: "2. 8. A vedação de que trata o item...", globalLine: 102 },

        // CENÁRIO 2: Itens Reais (DEVEM SER MANTIDOS)
        { text: "1 - MESA DE ESCRITÓRIO em L com gaveteiro. Unidade: 5", globalLine: 200 },
        { text: "02. Cadeira giratória simples. Quant: 10", globalLine: 201 },
        { text: "3 armário de aço. Unidade 2", globalLine: 202 }, // Minúsculo
        { text: "ITEM 4: COMPUTADOR I5. Qtd 3", globalLine: 203 },

        // CENÁRIO 3: Item "Difícil" (Sem pontuação clara, OCR sujo)
        { text: "5 prateleira de madeira mdf branca 15mm", globalLine: 300 },
        { text: "Quantidade: 20", globalLine: 301 } // Contexto para o item 5
    ],
    segments: [],
    fullText: "..."
};

// Adiciona propiedade de texto para compatibilidade
mockCorpoIntegrado.globalLines.forEach(l => l.content = l.text);

async function runTest() {
    console.log("--> INICIANDO TESTE DE STRESS V3.3 <--");

    // Instancia Agente V2
    const agent = new ItemClassifier();

    try {
        console.log(`\n--> INICIANDO TESTE DE STRESS V3.3 (COM CLONE) <--`);

        // SIMULAÇÃO DO AMBIENTE REAL: CLONAGEM PROFVNDA
        const inputClone = structuredClone(mockCorpoIntegrado);
        const result = await agent.process(inputClone, { cnaes: [] });

        console.log(`\n--> STATUS FINAL: ${result.status}`);
        console.log(`--> TOTAL ITENS: ${result.dados.itens.length}`);

        const itens = result.dados.itens;

        // RESULTADOS ESPERADOS
        const esperados = ['1', '2', '3', '4', '5']; // Números dos itens reais
        const proibidos = ['6', '7', '8']; // Números das cláusulas (que o OCR pega como número)

        // ANÁLISE DETALHADA
        console.log("\n--> DETALHES <--");
        itens.forEach(i => {
            console.log(`[ITEM ${i.item_numero}] "${i.descricao}" (Qtd: ${i.quantidade})`);
        });

        const achados = itens.map(i => i.item_numero.replace(/[^\d]/g, '')); // Limpa "02" para "2"

        // VERIFICAÇÃO DE SUCESSO
        const faltou = esperados.filter(e => !achados.includes(e));
        const intruso = achados.filter(a => proibidos.includes(a)); // Se pegou cláusula como item

        let passed = true;

        if (faltou.length > 0) {
            console.error(`\n❌ FALHA: Itens Válidos Ignorados: ${faltou.join(', ')}`);
            passed = false;
        }

        if (intruso.length > 0) {
            console.error(`\n❌ FALHA: Cláusulas Jurídicas Capturadas como Item: ${intruso.join(', ')}`);
            // Quem são?
            const itemsIntrusos = itens.filter(i => proibidos.includes(i.item_numero.replace(/[^\d]/g, '')));
            itemsIntrusos.forEach(i => console.error(`   -> Intruso [${i.item_numero}]: "${i.descricao}"`));
            passed = false;
        }

        if (itens.some(i => !i.descricao || i.descricao.trim() === '')) {
            console.error(`\n❌ FALHA: Item com Descrição Vazia Detectado!`);
            passed = false;
        }

        if (passed) {
            console.log("\n✅ SUCESSO ABSOLUTO: Filtros V3.3 funcionaram perfeitamente.");
            process.exit(0);
        } else {
            console.error("\n❌ TESTE FALHOU. Ajuste necessário.");
            process.exit(1);
        }

    } catch (e) {
        console.error("ERRO DE EXECUÇÃO:", e);
        process.exit(1);
    }
}

runTest();
