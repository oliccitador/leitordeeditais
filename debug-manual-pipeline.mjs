import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config(); // carrega .env padrão se houver
import fs from 'fs';
import path from 'path';
import Pipeline from './lib/pipeline/index.js';
import { getLogger } from './lib/services/logger.js';
import MasterLicitator from './lib/orchestrator/masterLicitator.js';

// Configurar logger para console
const logger = getLogger();

async function runTest() {
    console.log('🤖 INICIANDO DEBUG MANUAL DO PIPELINE...');

    // Caminho do arquivo de teste
    // Vou usar um que parece real: 09-Edital-PE42-Eletrodomesticos_26758.pdf
    const filePath = path.join(process.cwd(), 'test-files', '09-Edital-PE42-Eletrodomesticos_26758.pdf');

    if (!fs.existsSync(filePath)) {
        console.error(`❌ Arquivo não encontrado: ${filePath}`);
        // Tentar outro
        const lista = fs.readdirSync(path.join(process.cwd(), 'test-files')).filter(f => f.endsWith('.pdf'));
        if (lista.length === 0) {
            console.error('❌ Nenhum PDF encontrado em test-files');
            return;
        }
        filePath = path.join(process.cwd(), 'test-files', lista[0]);
        console.log(`⚠️ Usando alternativo: ${filePath}`);
    }

    console.log(`📄 Arquivo alvo: ${path.basename(filePath)}`);
    const buffer = fs.readFileSync(filePath);

    // Mock do Input do Pipeline (similar ao UploadLayer)
    // O UploadLayer espera um array de arquivos com path ou buffer
    // Mas o Pipeline.execute espera o output do UploadLayer? Não.
    // O Pipeline.execute espera 'files'. O UploadLayer.process(files) trata.

    // Mock do Input do Pipeline (similar ao UploadLayer)
    // Precisamos passar um objeto que pareça um File, mas que o OCREngine aceite como Buffer ou similar.
    // OCREngine aceita Buffer se tiver Buffer.isBuffer().
    // UploadLayer acessa file.name e file.size.

    // Solução: Criar um Buffer e anexar propriedades name
    const fileMock = Buffer.from(buffer);
    fileMock.name = path.basename(filePath);
    fileMock.size = buffer.length;
    fileMock.originalFilename = fileMock.name; // Redundância

    const fileInput = [fileMock];

    const pipeline = new Pipeline();
    const licitator = new MasterLicitator(); // Instancia Orchestrator

    try {
        console.log('🚀 Executando Pipeline...');
        const result = await pipeline.execute(fileInput);

        console.log('\n✅ PIPELINE CONCLUÍDO!');
        console.log('---------------------------------------------------');

        // RESULTADO PRE-ANALISE (StructuredExtractor)
        // Isso é leve, apenas regex básico
        const preAnalise = result.preAnalise;
        console.log('📊 PRÉ-ANÁLISE (Pipeline Step 8):');
        console.log(`Itens detectados (regex simples): ${preAnalise?.itens?.length || 0}`);

        // AGORA O REAL: MasterLicitator (Agentes Completos)
        console.log('\n🤖 INICIANDO ORQUESTRADOR (Agentes 2, 3, 4, 5, 6, 7)...');

        // Simular contexto do usuário
        const userContext = {
            companyData: { cnae: [] },
            userQuestions: []
        };

        const finalResult = await licitator.process(result.CORPO_INTEGRADO, userContext);

        console.log('\n✅ ORQUESTRADOR CONCLUÍDO!');
        console.log('---------------------------------------------------');

        // Resultados dos Agentes
        console.log('📦 AGENTE 3 (Itens Avançados):');
        const itemsAgente = finalResult.results?.items?.dados?.itens || [];
        console.log(`Total Itens: ${itemsAgente.length}`);
        if (itemsAgente.length > 0) {
            console.log(JSON.stringify(itemsAgente.slice(0, 3), null, 2));
        } else {
            console.log('❌ AGENTE 3 NÃO ENCONTROU ITENS');
        }

    } catch (error) {
        console.error('❌ ERRO FATAL:', error);
    }
}

runTest();
