import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_FLASH_KEY || process.env.GEMINI_API_KEY;

async function listModels() {
    try {
        console.log('🔍 Listando modelos disponíveis na API...\n');

        const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;

        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro:', response.status, response.statusText);
            console.error(errorText);
            return;
        }

        const data = await response.json();

        console.log('✅ Modelos disponíveis:\n');
        data.models.forEach(model => {
            console.log(`- ${model.name}`);
            console.log(`  Métodos suportados: ${model.supportedGenerationMethods.join(', ')}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

listModels();
