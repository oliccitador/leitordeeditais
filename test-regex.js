/* test-agent03-regex-debug.js */

const itemPatterns = [
    { pattern: /\b(\d{1,2})\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ]{3,}[^\n]{10,})/gm, type: 'SIMPLE_START' },
    { pattern: /(?:^|\n)\s*ITEM\s+(\d{1,3})\s*[-:.]?\s*([^\n]{10,300})/gi, type: 'ITEM' }
];

const mockTexts = [
    "1 DESCRIÇÃO VALIDA COM MAIS DE DEZ CARACTERES Unidade 5",
    "2 QUANTIDADE 5 UNIDADE DE CAIXA DE PAPELÃO",
    "3 Unidade 5 MESA DE ESCRITORIO GRANDE",
    "ITEM 4 CADEIRA GIRATORIA COM RODIZIOS 30 Unidades",
    "5 5 unidade ARMARIO DE ACO COM PORTAS",
    // Hypothetical "Empty Description" offender
    "10 QUANTIDADE 5 UNIDADE"
];

mockTexts.forEach(text => {
    console.log(`\nTesting text: "${text}"`);
    itemPatterns.forEach(({ pattern, type }) => {
        pattern.lastIndex = 0;
        const matches = [...text.matchAll(pattern)];
        if (matches.length > 0) {
            console.log(`  MATCHED ${type}:`);
            matches.forEach(m => {
                console.log(`    Num: "${m[1]}" | Desc: "${m[2]}"`);

                // Simulate cleaning for SIMPLE_START
                if (type === 'SIMPLE_START') {
                    let descricao = m[2];
                    const splitMatch = descricao.match(/\s+(Unidade|Quant|Qtd|Marca|Valor|R\$)/i);
                    if (splitMatch) {
                        console.log(`    [CLEANING] Found split word "${splitMatch[0]}" at index ${splitMatch.index}`);
                        const cleaned = descricao.substring(0, splitMatch.index).trim();
                        console.log(`    [RESULT] "${cleaned}"`);
                    }
                }
            });
        }
    });
});
