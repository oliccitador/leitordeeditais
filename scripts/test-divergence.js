
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import MasterLicitator from '../lib/orchestrator/masterLicitator.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function createPDF(filename, title, content) {
    return new Promise((resolve) => {
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(filename);
        doc.pipe(stream);

        doc.fontSize(20).text(title, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(content);

        // Add unique ID and lots of text to avoid deduplication and reach > 1000 chars
        doc.text(`\n\nID ÚNICO DO DOCUMENTO: ${Math.random().toString(36).substring(7)}`);

        const longText = "Esta é uma cláusula de preenchimento obrigatório para garantir a integridade da análise pelo pipeline de inteligência artificial. ".repeat(20);
        doc.moveDown().text(longText);
        doc.moveDown().text(longText);

        doc.end();
        stream.on('finish', resolve);
    });
}

async function runTest() {
    console.log("🚀 Criando arquivos para teste de divergência...");

    // Edital - Keywords: EDITAL, PREGÃO, HABILITAÇÃO
    await createPDF('temp_edital.pdf', 'EDITAL DE LICITAÇÃO Nº 01/2025',
        'EDITAL DE PREGÃO ELETRÔNICO PARA REGISTRO DE PREÇOS.\n' +
        'O PRESENTE EDITAL E INTEGRADO PELO INSTRUMENTO CONVOCATÓRIO.\n' +
        'OBJETO DA LICITAÇÃO: Aquisição de mobiliário de escritório.\n' +
        'DAS CONDIÇÕES DE HABILITAÇÃO: Os proponentes devem apresentar certidões.\n' +
        'DO PRAZO DE ENTREGA: O prazo de entrega é de 10 dias úteis.\n' +
        'ESPECIFICAÇÕES DO ITEM 1:\n' +
        'ITEM 1: CADEIRA GIRATÓRIA. QUANTIDADE: 10 UNIDADES.\n' +
        'VALOR ESTIMADO TOTAL: R$ 5.000,00.\n'
    );

    // TR - Keywords: TERMO DE REFERÊNCIA, PROJETO BÁSICO
    await createPDF('temp_tr.pdf', 'ANEXO I - TERMO DE REFERÊNCIA',
        'TERMO DE REFERÊNCIA - DETALHAMENTO TÉCNICO.\n' +
        '1. OBJETO: Este termo de referência visa detalhar o objeto do edital.\n' +
        '2. ESPECIFICAÇÕES TÉCNICAS E REQUISITOS:\n' +
        'ITEM 1: CADEIRA GIRATÓRIA ERGONÔMICA PADRÃO ABNT.\n' +
        'QUANTIDADE: 50 UNIDADES.\n' + // DIVERGENCIA (10 vs 50)
        'PRAZO DE ENTREGA: O prazo de entrega do objeto será de 30 dias.\n' + // DIVERGENCIA (10 vs 30)
        '3. DAS OBRIGAÇÕES DA CONTRATADA E CRITÉRIOS DE ACEITAÇÃO.'
    );

    const orchestrator = new MasterLicitator();

    const files = [
        {
            name: 'temp_edital.pdf',
            buffer: fs.readFileSync('temp_edital.pdf'),
            arrayBuffer: async function () { return this.buffer; }
        },
        {
            name: 'temp_tr.pdf',
            buffer: fs.readFileSync('temp_tr.pdf'),
            arrayBuffer: async function () { return this.buffer; }
        }
    ];

    console.log("▶️ Executando pipeline...");
    try {
        const result = await orchestrator.execute(files);

        console.log("\n📊 RESULTADO DA EXECUÇÃO:");
        console.log(`- Batch ID: ${result.pipeline_summary.batch_id}`);
        console.log(`- Status: ${result.metadata.go_no_go}`);

        console.log("\n🔍 Análise de Agente 7 (DivergenceScanner):");
        const ag7 = result.agents.AGENT_07;
        const status = ag7?.status;
        const divergences = ag7?.dados?.inconsistencias || [];

        console.log(`Status do Agente: ${status}`);

        if (divergences.length > 0) {
            console.log(`✅ SUCESSO! Encontradas ${divergences.length} divergências.`);
            divergences.forEach((d, i) => {
                console.log(`\n[${i + 1}] Divergência Detectada:`);
                console.log(`    Campo: ${d.campo}`);
                console.log(`    Severidade: ${d.severidade}`);
                console.log(`    Valores:`, JSON.stringify(d.valores.map(v => `${v.fonte}: ${v.valor}`)));
                console.log(`    Ação Sugerida: ${d.acao_sugerida}`);
            });
        } else {
            console.log("❌ Nenhuma divergência encontrada.");
        }

    } catch (e) {
        console.error("❌ Erro na execução:", e);
    }
}

runTest().catch(console.error);
