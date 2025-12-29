const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

async function extractText() {
    try {
        const filePath = path.join(__dirname, 'test-files', 'EDITAL+DE+ABERTURA_20251124113128.pdf');

        console.log(`Lendo arquivo: ${filePath}`);
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);

        console.log('\n--- INÍCIO DO CONTEÚDO ---\n');
        // Imprimo apenas os primeiros 5000 chars e trechos estratégicos para não poluir demais, 
        // mas o suficiente para eu (IA) analisar os pontos chaves.
        console.log(data.text);
        console.log('\n--- FIM DO CONTEÚDO ---\n');
        console.log(`Páginas: ${data.numpages}`);

    } catch (err) {
        console.error('Erro:', err);
    }
}

extractText();
