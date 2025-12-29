/* test-agent03-regex-debug-v2.js */

const itemPatterns = [
    // NEW Relaxed Regex
    { pattern: /\b(\d{1,2})\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ][\w\s.,\-\/()]{8,})/gm, type: 'SIMPLE_START' },
    { pattern: /(?:^|\n)\s*ITEM\s+(\d{1,3})\s*[-:.]?\s*([^\n]{10,300})/gi, type: 'ITEM' }
];

const mockTexts = [
    "1 DESCRIÇÃO VALIDA COM MAIS DE DEZ CARACTERES Unidade 5",
    "2 QUANTIDADE 5 UNIDADE DE CAIXA DE PAPELÃO",
    "3 Unidade 5 MESA DE ESCRITORIO GRANDE",
    "ITEM 4 CADEIRA GIRATORIA COM RODIZIOS 30 Unidades",
    "5 5 unidade ARMARIO DE ACO COM PORTAS", // This might still fail if "5" is not Uppercase start.
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
                let descricao = m[2];
                console.log(`    Raw Desc: "${descricao}"`);

                if (type === 'SIMPLE_START') {
                    // Logic from 03-items.js
                    const leadingTrash = descricao.match(/^(?:Unidade|Unid|Quant|Qtd|Marca|Valor|R\$)[\s.:]*\d*\s*/i);
                    if (leadingTrash && leadingTrash[0].length < descricao.length) {
                        console.log(`    [CLEANING LEADING] Removing "${leadingTrash[0]}"`);
                        descricao = descricao.substring(leadingTrash[0].length).trim();
                    }

                    const splitMatch = descricao.match(/\s+(?:Unidade|Unid|Quant|Qtd|Marca|Valor|R\$)\b/i);
                    if (splitMatch) {
                        console.log(`    [CLEANING TRAILING] Found "${splitMatch[0]}" at ${splitMatch.index}`);
                        descricao = descricao.substring(0, splitMatch.index).trim();
                    }
                    console.log(`    [FINAL]: "${descricao}"`);
                }
            });
        }
    });
});
