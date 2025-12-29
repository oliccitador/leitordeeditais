const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

async function extractMetadata(filename) {
    try {
        const filePath = path.join(__dirname, 'tests', 'golden-dataset', filename);
        console.log(`\n📄 EXTRAINDO METADADOS DE: ${filename}`);

        if (!fs.existsSync(filePath)) {
            console.error('Arquivo não encontrado:', filePath);
            return;
        }

        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        const text = data.text;

        // Limita a busca às primeiras 2000 chars (header)
        const header = text.substring(0, 3000);

        console.log('--- HEADER ---');
        console.log(header.substring(0, 500));
        console.log('--------------');

        // Heurísticas de extração
        const processo = header.match(/(processo|protocolo|ref\.?)\s*n?[º°]?\s*([\d\.\-\/]+)/i);
        const orgao = header.match(/(Prefeitura|Município|Secretaria|Fundo|Câmara|Conselho)\s+(Municipal|Estadual|Federal)?\s*de\s+([A-ZÀ-Ú\s\-]+)/i);
        const dataAbertura = header.match(/(abertura|sessão|recebimento).*?(\d{2}\/\d{2}\/\d{4})/i);
        const modalidade = header.match(/(pregão|concorrência|dispensa|convite|tomada de preços).*?n?[º°]?\s*([\d\/]+)/i);

        console.log(`\nRESULTADOS PRELIMINARES:`);
        console.log(`- Modalidade: ${modalidade ? modalidade[0] : '??'}`);
        console.log(`- Processo: ${processo ? processo[2] : '??'}`);
        console.log(`- Órgão: ${orgao ? orgao[0] : '??'}`);
        console.log(`- Data Abertura: ${dataAbertura ? dataAbertura[2] : '??'}`);

    } catch (e) {
        console.error('Erro:', e);
    }
}

// Executa para os dois arquivos
(async () => {
    await extractMetadata('sample_02.pdf');
    await extractMetadata('sample_03.pdf');
})();
