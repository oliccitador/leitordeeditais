import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('\n🔍 DIAGNÓSTICO COMPLETO - AGENTE 3 GEMINI\n');
console.log('='.repeat(60));

// 1. Verificar variáveis de ambiente
console.log('\n1️⃣ VARIÁVEIS DE AMBIENTE:');
console.log('   GEMINI_FLASH_KEY:', process.env.GEMINI_FLASH_KEY ? '✅ PRESENTE' : '❌ AUSENTE');
console.log('   GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ PRESENTE' : '❌ AUSENTE');
console.log('   GROQ_API_KEY:', process.env.GROQ_API_KEY ? '✅ PRESENTE' : '❌ AUSENTE');

if (process.env.GEMINI_FLASH_KEY) {
    console.log('   Chave Gemini (10 primeiros):', process.env.GEMINI_FLASH_KEY.substring(0, 10));
}

// 2. Testar import do agente
console.log('\n2️⃣ IMPORT DO AGENTE:');
try {
    const { default: ItemClassifier } = await import('./lib/agents/03-items-v2.js');
    console.log('   ✅ Import bem-sucedido');

    const agent = new ItemClassifier();
    console.log('   ✅ Instância criada');
    console.log('   API Key no agente:', agent.apiKey ? agent.apiKey.substring(0, 10) + '...' : 'AUSENTE');

} catch (e) {
    console.log('   ❌ ERRO:', e.message);
    console.log('   Stack:', e.stack);
}

// 3. Testar conexão Gemini
console.log('\n3️⃣ TESTE DE CONEXÃO GEMINI:');
try {
    const apiKey = process.env.GEMINI_FLASH_KEY || process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: 'Teste' }] }]
        })
    });

    console.log('   Status:', response.status, response.statusText);

    if (response.ok) {
        console.log('   ✅ API Gemini respondendo');
    } else {
        const error = await response.text();
        console.log('   ❌ Erro:', error.substring(0, 200));
    }

} catch (e) {
    console.log('   ❌ ERRO:', e.message);
}

// 4. Testar extração simples
console.log('\n4️⃣ TESTE DE EXTRAÇÃO:');
try {
    const { default: ItemClassifier } = await import('./lib/agents/03-items-v2.js');
    const agent = new ItemClassifier();

    const mockCorpo = {
        fullText: 'ITEM 1 - MESA\nQuantidade: 10 UN',
        textoCompleto: 'ITEM 1 - MESA\nQuantidade: 10 UN',
        segments: [{ documentName: 'test.pdf', documentType: 'edital' }],
        globalLines: [
            { text: 'ITEM 1 - MESA', globalLine: 0, charStart: 0, charEnd: 13, sourceDocName: 'test.pdf', sourcePage: 1 },
            { text: 'Quantidade: 10 UN', globalLine: 1, charStart: 14, charEnd: 31, sourceDocName: 'test.pdf', sourcePage: 1 }
        ],
        metadata: { totalPages: 1 }
    };

    const result = await agent.process(mockCorpo, { cnaes: [] });

    console.log('   Status:', result.status);
    console.log('   Itens extraídos:', result.dados.itens.length);

    if (result.dados.itens.length > 0) {
        console.log('   ✅ Extração funcionando');
        result.dados.itens.forEach((item, i) => {
            console.log(`      Item ${i + 1}:`, item.descricao.substring(0, 50));
        });
    } else {
        console.log('   ⚠️ Nenhum item extraído');
        if (result.alerts) {
            result.alerts.forEach(a => console.log('      Alert:', a.message));
        }
    }

} catch (e) {
    console.log('   ❌ ERRO:', e.message);
    console.log('   Stack:', e.stack);
}

console.log('\n' + '='.repeat(60));
console.log('✅ DIAGNÓSTICO CONCLUÍDO\n');
