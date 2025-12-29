/* repro-issue-descriptions.js */

// Simulação da lógica ATUAL do Agente 3 (que está causando o bug)
// Copiada fielmente de lib/agents/03-items.js

const itemPatterns = [
    // Padrão flutuante atual
    { pattern: /\b(\d{1,2})\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ]{3,}[^\n]{10,})/gm, type: 'SIMPLE_START' }
];

const mockLines = [
    // Cenário provável: OCR colocou "Quantidade" ou "Unidade" ANTES da descrição
    // E a descrição começa com maiúsculas (ex: "MESA DE ESCRITÓRIO")
    // Se a lógica atual encontrar "Unidade", ela corta tudo antes?

    // Caso 1: OCR "Sujeira" no início
    "1 Unidade 5 MESA DE ESCRITORIO EM MDF",

    // Caso 2: OCR "Sujeira" no fim (comportamento esperado)
    "2 CADEIRA GIRATORIA Unidade 10",

    // Caso 3: O caso fatal - "Quantidade" antes da descrição
    "3 Quantidade 5 ARMARIO DE ACO",

    // Caso 4: Texto misturado, comum em tabelas linearizadas
    "4 30 Unid CAIXA DE PAPELAO 50X50",

    // Caso 5: Descrição contendo a palavra proibida "Unidade" no MEIO (Teste de robustez)
    "5 ESTANTE DE ACO COM 6 PRATELEIRAS Unidade de medida padrao"
];

console.log("--- INICIANDO REPRODUÇÃO DO BUG DE DESCRIÇÃO VAZIA ---\n");

mockLines.forEach(text => {
    console.log(`\n📄 Texto Original: "${text}"`);

    itemPatterns.forEach(({ pattern, type }) => {
        pattern.lastIndex = 0; // Reset regex
        const matches = [...text.matchAll(pattern)];

        if (matches.length === 0) {
            console.log(`   ❌ NENHUM MATCH (O Regex nem pegou o item)`);
        }

        for (const match of matches) {
            const numero = match[1];
            let descricao = (match[2] || '').trim();
            console.log(`   ✅ MATCH INICIAL: [${numero}] "${descricao}"`);

            // --- AQUI COMEÇA A LÓGICA QUE PODE ESTAR QUEBRANDO ---
            // Código copiado de lib/agents/03-items.js (linhas 170-174)

            // "Limpa 'sujeira' de tabela no final da descrição (ex: 'Unidade 4 01')"
            const splitMatch = descricao.match(/\s+(Unidade|Quant|Qtd|Marca|Valor|R\$)/i);

            if (splitMatch) {
                console.log(`   ⚠️  SPLIT DETECTADO: "${splitMatch[0]}" na posição ${splitMatch.index}`);
                const antes = descricao;
                descricao = descricao.substring(0, splitMatch.index).trim();
                console.log(`   ✂️  DESCRIÇÃO CORTADA: "${antes}" -> "${descricao}"`);

                if (descricao.length === 0) {
                    console.log(`   🚨 FALHA CRÍTICA: DESCRIÇÃO FICOU VAZIA!`);
                }
            } else {
                console.log(`   ok: Nenhum split acionado.`);
            }
            // -----------------------------------------------------------
        }
    });
});
