const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

async function analyze() {
    try {
        // Pega arquivo do argumento ou usa padrão
        // Se argumento tiver espaços, o shell manda separado, então juntamos
        const targetFile = process.argv.slice(2).join(' ') || 'EDITAL+DE+ABERTURA_20251124113128.pdf';

        console.log(`\n📄 ANALISANDO ARQUIVO: "${targetFile}"`);

        const filePath = path.join(__dirname, 'test-files', targetFile);

        if (!fs.existsSync(filePath)) {
            console.error(`❌ ERRO CRÍTICO: Arquivo não encontrado em:\n${filePath}`);
            // Listar arquivos para debug
            console.log('\nArquivos disponíveis em test-files:');
            fs.readdirSync(path.join(__dirname, 'test-files')).forEach(f => console.log(` - ${f}`));
            return;
        }

        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        const text = data.text;

        const output = [];
        const log = (msg) => {
            console.log(msg);
            output.push(msg);
        };

        log('--- RELATÓRIO DE ADEQUAÇÃO PARA TESTE (QA AUDIT) ---');

        // 1. COMPLEXIDADE DE ESTRUTURA
        log('\n[CRITÉRIO 1: ESTRUTURA GERAL]');
        const isEdital = /edital|pregão|concorrência|dispensa|aviso/i.test(text);
        log(`Parece documento de licitação? ${isEdital ? '✅ SIM' : '❌ NÃO'}`);
        log(`Volume de dados: ${data.numpages} páginas`);

        // 2. COMPLEXIDADE DE ITENS (Tabelas)
        log('\n[CRITÉRIO 2: COMPLEXIDADE DE ITENS]');
        const tableHeader = /item|unid|quant|descri|valor|total/i.test(text);
        // Regex simplificado para detectar linhas de itens numéricos
        const itensSimples = text.match(/^\s*\d{1,3}\s+.*?(unidade|peça|caixa|serviço|kilo|litro|par|jogo).*?\d+/gim);
        const countItens = itensSimples ? itensSimples.length : 0;

        log(`Cabeçalho de Tabela detectado? ${tableHeader ? '✅ SIM' : '❌ NÃO'}`);
        log(`Linhas de itens aparentes: ${countItens}`);

        // 3. COMPLEXIDADE DE REQUISITOS
        log('\n[CRITÉRIO 3: REQUISITOS LEGAIS]');
        const hab = /habilitação|regularidade|qualificação|certidão/i.test(text);
        const tec = /capacidade técnica|atestado|visita|amostra|laudo/i.test(text);

        log(`Termos de Habilitação? ${hab ? '✅ SIM' : '❌ NÃO'}`);
        log(`Termos Técnicos? ${tec ? '✅ SIM' : '❌ NÃO'}`);

        // VEREDITO
        log('\n[VEREDITO DO ENGENHEIRO DE QA]');

        let verdict = 'APROVADO';
        let warnings = [];

        if (data.numpages < 3) {
            verdict = 'APROVADO COM RESSALVAS (Curto)';
            warnings.push('Documento curto, pode não ter complexidade suficiente para testes profundos.');
        }

        if (countItens === 0 && !text.includes('Lote')) {
            if (text.includes('Dispensa')) {
                warnings.push('É uma Dispensa: pode ter poucos ou nenhum item detalhado.');
            } else {
                verdict = 'REJEITADO (Falta Itens)';
                warnings.push('Não detectei itens. Ruim para testar Agente 3.');
            }
        }

        log(`Status: ${verdict}`);
        if (warnings.length > 0) {
            log('Ressalvas:');
            warnings.forEach(w => log(` - ${w}`));
        }

    } catch (e) {
        console.error('Erro na análise:', e.message);
    }
}

analyze();
