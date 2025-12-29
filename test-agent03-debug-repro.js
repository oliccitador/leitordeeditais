/* test-agent03-debug.js */
import ItemClassifier from './lib/agents/03-items.js';

const mockTexts = [
    // Case 1: Standard expected pattern
    "1 DESCRIÇÃO VALIDA COM MAIS DE DEZ CARACTERES Unidade 5",

    // Case 2: Potential SplitMatch trigger at start
    "2 QUANTIDADE 5 UNIDADE DE CAIXA DE PAPELÃO",

    // Case 3: Mixed case unit before description (Regex shouldn't match untill Uppercase?)
    "3 Unidade 5 MESA DE ESCRITORIO GRANDE",

    // Case 4: Item explicitly
    "ITEM 4 CADEIRA GIRATORIA COM RODIZIOS 30 Unidades",

    // Case 5: The "5 5 unidade" case maybe?
    "5 5 unidade ARMARIO DE ACO COM PORTAS",

    // Case 6: User screenshot behavior? 
    // Maybe the description captured IS "UNIDADE"?? and then stripped?
    // But then length < 5 would filter it out.

    // Case 7: The 'Clean Table Dirt' logic
    "6 MESA DE REUNIÃO Unidade 1",

    // Case 8: Text starting with excluded word but valid desc after?
    "7 DATA DE ENTREGA IMEDIATA PARA O PRODUTO", // 'DATA' is excluded.
];

const corpoIntegradoMock = {
    globalLines: mockTexts.map((text, index) => ({
        text: text,
        globalLine: index + 1,
        sourceDocName: 'test.pdf',
        charStart: 0,
        charEnd: text.length
    })),
    fullText: mockTexts.join('\n')
};

async function run() {
    console.log("--- STARTING AGENT 03 DEBUG ---");
    const agent = new ItemClassifier();
    const result = await agent.process(corpoIntegradoMock);

    console.log(`Items Found: ${result.dados.itens.length}`);
    result.dados.itens.forEach(item => {
        console.log(`Item ${item.item_numero}:`);
        console.log(`   Desc (Literal): "${item.descricao_literal}"`);
        console.log(`   Qtd: ${item.quantidade}`);
        console.log(`   Und: ${item.unidade}`);
        console.log(`   Class: ${item.classificacao}`);
    });
    console.log("--- END DEBUG ---");
}

run();
