/* fix-verification.js */

// Mock de textos de entrada difíceis (OCR sujo/linearizado)
const inputs = [
    // Caso Real do Print: "1 Unidade 5 DESCRIÇÃO..."
    "1 Unidade 5 MESA DE ESCRITORIO",

    // Caso Invertido: "2 DESCRIÇÃO Unidade 5"
    "2 CADEIRA GIRATORIA Unidade 10",

    // Caso com Quantidade e Unidade antes
    "3 Quant 30 Unid CAIXA ORGANIZADORA",

    // Caso "Limpo" (Controle)
    "4 ARMARIO DE ACO 2 PORTAS",

    // Caso "Item" Explícito
    "ITEM 5 - MONITOR 24 POL"
];

// NOVA LÓGICA PROPOSTA (Mais robusta e segura)
const itemPatterns = [
    // 1. Relaxamos a exigência de 3 maiúsculas para 1 maiúscula + texto
    //    Isso ajuda a pegar itens onde o OCR falhou em capitalizar tudo
    { pattern: /\b(\d{1,3})\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ][\w\s.,\-\/()]{5,})/gm, type: 'SIMPLE_START_V2' }
];


console.log("--- TESTANDO NOVA LÓGICA DE LIMPEZA (SEM QUEBRA) ---\n");

inputs.forEach(text => {
    console.log(`\n📄 Entrada: "${text}"`);

    let matched = false;

    itemPatterns.forEach(({ pattern, type }) => {
        pattern.lastIndex = 0;
        const matches = [...text.matchAll(pattern)];

        for (const match of matches) {
            matched = true;
            let numero = match[1];
            let descricao = (match[2] || '').trim();

            console.log(`   🎯 Match Bruto [${numero}]: "${descricao}"`);

            // --- NOVA LÓGICA DE LIMPEZA ---
            // 1. Limpeza de PREFIXO (ex: "Unidade 5 MESA")
            // Regex procura: (palavra chave) + (opcional: numeros/pontos) + (espaço) NO INICIO (^)
            const prefixTrash = descricao.match(/^(?:Unidade|Unid|Quant|Qtd|Marca|Valor|R\$|Item)\b[\s.:\d]*\s+/i);

            if (prefixTrash) {
                console.log(`      🧹 Removendo Prefixo: "${prefixTrash[0]}"`);
                descricao = descricao.substring(prefixTrash[0].length).trim();
            }

            // 2. Limpeza de SUFIXO (ex: "MESA Unidade 5")
            // Regex procura: (espaço) + (palavra chave) ...
            const suffixTrash = descricao.match(/\s+(?:Unidade|Unid|Quant|Qtd|Marca|Valor|R\$)\b/i);

            if (suffixTrash) {
                console.log(`      🧹 Removendo Sufixo: "${suffixTrash[0]}"`);
                descricao = descricao.substring(0, suffixTrash.index).trim();
            }

            console.log(`   ✨ Resultado Final: "${descricao}"`);

            if (descricao.length === 0) {
                console.log(`   ❌ ERRO: Descrição ficou vazia!`);
            } else {
                console.log(`   ✅ SUCESSO`);
            }
        }
    });

    if (!matched) console.log("   ❌ NENHUM MATCH CAPTURADO");
});
