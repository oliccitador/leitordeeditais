import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_FLASH_KEY || process.env.GEMINI_API_KEY;

const textoTeste = `
PREGÃO ELETRÔNICO Nº 30/2025

OBJETO: Aquisição de equipamentos e mobiliários.

ITEM 01 - MESA PARA ESCRITÓRIO
Descrição: MESA PARA ESCRITORIO; CONFECCIONADO EM MDF; REVESTIMENTO EM LAMINADO MELAMINICO
Unidade: UN
Quantidade: 10

ITEM 02 - CADEIRA GIRATÓRIA  
Descrição: CADEIRA GIRATORIA; COM BRACOS; COM REGULAGEM DE ALTURA A GAS
Unidade: UN
Quantidade: 20
`;

async function testGeminiExtraction() {
    try {
        console.log('🧪 Testando extração de itens com Gemini...\n');

        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const prompt = `
Tarefa: Extrair LISTA DE ITENS ou LOTES de licitação deste texto.

Regras:
1. Extraia Item, Descrição, Unidade e Quantidade.
2. Se a descrição estiver multilinhas, concatene.

IMPORTANTE: Retorne APENAS um objeto JSON válido, sem markdown, sem explicações.

Formato esperado:
{
  "itens": [
    {
      "item_numero": "1",
      "descricao": "descrição completa do item",
      "unidade": "UN",
      "quantidade": 10
    }
  ]
}

Texto do Edital:
${textoTeste}
        `;

        const body = {
            contents: [{
                parts: [{
                    text: prompt
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

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro:', response.status, response.statusText);
            console.error(errorText);
            return;
        }

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;

        console.log('\n✅ Resposta do Gemini:');
        console.log(text);
        console.log('\n---\n');

        // Tentar parsear
        let cleanText = text.trim();
        if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
        }

        const parsed = JSON.parse(cleanText);
        console.log('✅ JSON parseado com sucesso!');
        console.log(`Itens encontrados: ${parsed.itens.length}`);
        parsed.itens.forEach(item => {
            console.log(`  - Item ${item.item_numero}: ${item.descricao.substring(0, 50)}... (${item.quantidade} ${item.unidade})`);
        });

    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error(error);
    }
}

testGeminiExtraction();
