import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('\n🔍 DIAGNÓSTICO AGENTE 2\n');
console.log('='.repeat(60));

// 1. Verificar chave API
console.log('\n1️⃣ CHAVE API:');
console.log('   GEMINI_FLASH_KEY:', process.env.GEMINI_FLASH_KEY ? '✅ PRESENTE' : '❌ AUSENTE');
console.log('   GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ PRESENTE' : '❌ AUSENTE');

if (process.env.GEMINI_FLASH_KEY) {
    console.log('   Chave (10 primeiros):', process.env.GEMINI_FLASH_KEY.substring(0, 10));
}

// 2. Testar import do Agente 2
console.log('\n2️⃣ IMPORT AGENTE 2:');
try {
    const { default: StructureMapper } = await import('./lib/agents/02-structure.js');
    console.log('   ✅ Import bem-sucedido');

    const agent = new StructureMapper();
    console.log('   ✅ Instância criada');
    console.log('   API Key no agente:', agent.apiKey ? agent.apiKey.substring(0, 10) + '...' : '❌ AUSENTE');

} catch (e) {
    console.log('   ❌ ERRO:', e.message);
    console.log('   Stack:', e.stack?.substring(0, 500));
}

// 3. Testar conexão Gemini
console.log('\n3️⃣ TESTE CONEXÃO GEMINI:');
try {
    const apiKey = process.env.GEMINI_FLASH_KEY || process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: 'Teste rápido' }] }]
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

// 4. Testar Agente 2 com mock
console.log('\n4️⃣ TESTE AGENTE 2 COM MOCK:');
try {
    const { default: StructureMapper } = await import('./lib/agents/02-structure.js');
    const agent = new StructureMapper();

    const mockCorpo = {
        fullText: 'PREGÃO ELETRÔNICO Nº 42/2024\nModalidade: Pregão Eletrônico\nProcesso: 123/2024',
        textoCompleto: 'PREGÃO ELETRÔNICO Nº 42/2024\nModalidade: Pregão Eletrônico\nProcesso: 123/2024',
        segments: [{ documentName: 'test.pdf', documentType: 'edital' }],
        globalLines: [
            { text: 'PREGÃO ELETRÔNICO Nº 42/2024', globalLine: 0, charStart: 0, charEnd: 28, sourceDocName: 'test.pdf', sourcePage: 1 }
        ],
        metadata: { totalPages: 1 }
    };

    console.log('   Chamando agent.process()...');
    const result = await agent.process(mockCorpo);

    console.log('   Status:', result.status);
    console.log('   Modalidade extraída:', result.dados?.modalidade || 'N/A');
    console.log('   Processo extraído:', result.dados?.numeroProcesso || 'N/A');

    if (result.status === 'ok') {
        console.log('   ✅ Agente 2 funcionando!');
    } else {
        console.log('   ⚠️ Status não é "ok"');
        if (result.erro) {
            console.log('   Erro:', result.erro);
        }
    }

} catch (e) {
    console.log('   ❌ ERRO:', e.message);
    console.log('   Stack:', e.stack?.substring(0, 500));
}

console.log('\n' + '='.repeat(60));
console.log('✅ DIAGNÓSTICO CONCLUÍDO\n');
