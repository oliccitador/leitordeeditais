import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_FLASH_KEY || process.env.GEMINI_API_KEY;

console.log('API Key presente:', apiKey ? `Sim (${apiKey.substring(0, 10)}...)` : 'NÃO');

if (!apiKey) {
    console.error('❌ GEMINI_FLASH_KEY não encontrada no .env.local');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testGemini() {
    try {
        console.log('\n🧪 Testando conexão com Gemini API (via REST direto)...\n');

        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const body = {
            contents: [{
                parts: [{
                    text: "Retorne apenas um JSON com esta estrutura: {\"teste\": \"ok\", \"numero\": 42}"
                }]
            }]
        };

        console.log('Enviando requisição...');
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });

        console.log('Status da resposta:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('\n❌ Erro na API:');
            console.error(errorText);
            return;
        }

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;

        console.log('\n✅ Resposta recebida:');
        console.log(text);
        console.log('\n✅ Gemini API funcionando corretamente!');

    } catch (error) {
        console.error('\n❌ Erro ao chamar Gemini API:');
        console.error('Mensagem:', error.message);
        console.error('Detalhes:', error);
    }
}

testGemini();
