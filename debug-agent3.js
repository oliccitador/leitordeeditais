
import ItemClassifier from './lib/agents/03-items-v2.js';

// MOCK DO CORPO_INTEGRADO (Simulando o cenário real difícil)
const mockCorpoIntegrado = {
    globalLines: [
        { text: "6. 2, com o intuito de burlar a efetividade da sanção a ela aplicada, inclusive a sua controladora...", globalLine: 100 },
        { text: "2. 8. A vedação de que trata o item 2. 6. 9 estende-se a terceiro...", globalLine: 101 },

        // Item Real 1 (Padrão Completo)
        { text: "1. MESA DE ESCRITÓRIO em L com gaveteiro, cor cinza cristal. Unidade: 5", globalLine: 200 },

        // Item Real 2 (Minúsculo e curto)
        { text: "2 - cadeira giratória simples", globalLine: 201 },

        // Item Real 3 (Sem pontuação clara e sujo)
        { text: "3 computadores del inspiron i5 8gb ssd 256gb Quant 10", globalLine: 202 },

        // Falso Positivo (Cláusula que parece item)
        { text: "7. 1. Os proponentes que deixarem de encaminhar as propostas...", globalLine: 300 },

        // Item Real 4 (Item explícito)
        { text: "ITEM 4: ARQUIVO DE AÇO 4 GAVETAS", globalLine: 400 }
    ],
    segments: [],
    fullText: "..."
};

// Adiciona propiedade de texto para compatibilidade
mockCorpoIntegrado.globalLines.forEach(l => l.content = l.text);

async function runTest() {
    console.log("--> INICIANDO TESTE ISOLADO DO AGENTE 3 V2 <--");

    const agent = new ItemClassifier();

    try {
        const result = await agent.process(mockCorpoIntegrado, { cnaes: [] });

        console.log("\n--> RESULTADOS <--");
        console.log(`Status: ${result.status}`);
        console.log(`Total Itens Encontrados: ${result.dados.itens.length}`);

        console.log("\n--> DETALHE DOS ITENS <--");
        result.dados.itens.forEach(item => {
            console.log(`[${item.item_numero}] Desc: "${item.descricao}" | Qtd: ${item.quantidade} | Unid: ${item.unidade}`);
            if (item.descricao.length === 0) console.error("   !!! ERRO: DESCRIÇÃO VAZIA !!!");
            if (item.descricao.length > 300) console.error("   !!! ALERTA: DESCRIÇÃO MUITO LONGA (Pode ser cláusula) !!!");
        });

        // Verificação Lógica
        const itensEsperados = ['1', '2', '3', '4'];
        const itensAchados = result.dados.itens.map(i => i.item_numero);

        const faltantes = itensEsperados.filter(x => !itensAchados.includes(x));
        const intrusos = itensAchados.filter(x => !itensEsperados.includes(x));

        if (faltantes.length > 0) console.log(`\n❌ FALTOU CAPTURAR: ${faltantes.join(', ')}`);
        if (intrusos.length > 0) console.log(`\n⚠️ CAPTUROU INDESEJADOS (Possíveis Cláusulas): ${intrusos.join(', ')}`);

        if (faltantes.length === 0 && intrusos.length === 0) {
            console.log("\n✅ SUCESSO TOTAL: Todos os itens capturados e cláusulas ignoradas.");
        }

    } catch (error) {
        console.error("ERRO FATAL NO AGENTE:", error);
    }
}

runTest();
