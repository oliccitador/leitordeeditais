
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import MasterLicitator from './lib/orchestrator/masterLicitator.js';

// Configurar ambiente
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATASET_DIR = path.join(__dirname, 'tests', 'golden-dataset');

// Utilitario de cores para console
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    bold: "\x1b[1m"
};

async function runEval() {
    console.log(`${colors.cyan}${colors.bold}🚀 INICIANDO SUÍTE DE AVALIAÇÃO (EVALS) - GOLDEN DATASET${colors.reset}\n`);

    // 1. Descobrir arquivos de teste
    const files = fs.readdirSync(DATASET_DIR).filter(f => f.endsWith('.pdf'));
    const results = [];

    console.log(`Encontrados ${files.length} casos de teste.\n`);

    const orchestrator = new MasterLicitator();

    for (const pdfFile of files) {
        const truthFile = pdfFile.replace('.pdf', '_truth.json');
        const truthPath = path.join(DATASET_DIR, truthFile);

        if (!fs.existsSync(truthPath)) {
            console.log(`${colors.yellow}⚠️ Gabarito não encontrado para ${pdfFile}. Pulando...${colors.reset}`);
            continue;
        }

        console.log(`${colors.bold}▶️ Executando caso: ${pdfFile}${colors.reset}`);

        try {
            // Carregar PDF e Gabarito
            const pdfBuffer = fs.readFileSync(path.join(DATASET_DIR, pdfFile));
            const truth = JSON.parse(fs.readFileSync(truthPath, 'utf8'));

            // Mock do arquivo para o pipeline
            const fileMock = {
                name: pdfFile,
                size: pdfBuffer.length,
                arrayBuffer: async () => pdfBuffer,
                buffer: pdfBuffer
            };

            // Executar Pipeline
            console.log(`   Running pipeline... (pode demorar)`);
            const start = Date.now();

            const result = await orchestrator.execute([fileMock]);

            const duration = ((Date.now() - start) / 1000).toFixed(1);
            console.log(`   ✅ Concluído em ${duration}s`);

            // Comparar Resultados
            const evalResult = evaluateResult(result, truth);
            evalResult.duration = duration;
            results.push(evalResult);

            if (evalResult.passed) {
                console.log(`   ${colors.green}PASS ✅${colors.reset} (Score: ${evalResult.score}/100)`);
            } else {
                console.log(`   ${colors.red}FAIL ❌${colors.reset} (Score: ${evalResult.score}/100)`);
                evalResult.failures.forEach(f => console.log(`      - ${f}`));
            }
            console.log('');

        } catch (error) {
            console.error(`   ${colors.red}CRITICAL ERROR:${colors.reset} ${error.message}`);
            results.push({
                file: pdfFile,
                passed: false,
                score: 0,
                error: error.message,
                failures: [`Execução falhou com erro crítico: ${error.message}`]
            });
        }
    }

    generateReport(results);
}

function evaluateResult(actual, expected) {
    const report = {
        file: expected.meta.filename,
        passed: true,
        score: 100,
        failures: [],
        details: {}
    };

    let totalChecks = 0;
    let passedChecks = 0;

    // Helper seguro para strings
    const safeLower = (val) => String(val || '').toLowerCase().trim();

    const check = (category, name, actualVal, expectedVal) => {
        totalChecks++;
        const match = safeLower(actualVal).includes(safeLower(expectedVal)) ||
            safeLower(expectedVal).includes(safeLower(actualVal));
        if (match) {
            passedChecks++;
            report.details[`${category}.${name}`] = 'OK';
        } else {
            report.failures.push(`[${category}] ${name}: Esperado "${expectedVal}", Recebido "${actualVal}"`);
            report.details[`${category}.${name}`] = 'FAIL';
        }
    };

    // 1. Agente 2
    const ag2 = actual.results?.structure?.dados || {};
    const exp2 = expected.expected_output.agent_02_structure;

    // DEBUG: dump chaves se process estiver ausente
    if (!ag2.numeroProcesso && !ag2.modalidade) {
        report.details['DEBUG_AG2_Content'] = JSON.stringify(actual.results?.structure || 'MISSING');
    }

    if (exp2) {
        check('Structure', 'Modalidade', ag2.modalidade, exp2.modalidade);

        // Comparação robusta de processo (remove espaços e pontuação)
        const cleanProc = (s) => String(s || '').replace(/[\s\.\-\/]/g, '');
        const procRecebido = ag2.numeroProcesso;
        const procEsperado = exp2.numero_processo;

        const procRecClean = cleanProc(procRecebido);
        const procEspClean = cleanProc(procEsperado);

        totalChecks++;
        // Check se um contem o outro (flexibilidade)
        if (procRecebido && (procRecClean.includes(procEspClean) || procEspClean.includes(procRecClean) || procEsperado === 'TODO')) {
            passedChecks++;
            report.details['Structure.Processo'] = 'OK';
        } else {
            if (procEsperado !== 'TODO') {
                report.failures.push(`[Structure] Processo: Esperado algo contendo "${procEsperado}" (clean: ${procEspClean}), Recebido "${procRecebido}" (clean: ${procRecClean})`);
                report.details['Structure.Processo'] = 'FAIL';
            } else {
                passedChecks++;
                report.details['Structure.Processo'] = 'OK (TODO)';
            }
        }
    }

    // 2. Agente 4
    const ag4 = actual.results?.compliance?.dados || {};
    const exp4 = expected.expected_output.agent_04_compliance;
    const listaRequisitos = ag4.requisitos || [];

    if (exp4) {
        if (listaRequisitos.length > 0) {
            exp4.keywords_present.forEach(kw => {
                totalChecks++;
                const kwLower = safeLower(kw);

                // Validação NULL-SAFE
                const found = listaRequisitos.some(item =>
                    safeLower(item.descricao).includes(kwLower) ||
                    safeLower(item.trecho_literal).includes(kwLower) ||
                    (item.origens && item.origens.some(o => safeLower(o.trecho).includes(kwLower)))
                );

                if (found) {
                    passedChecks++;
                    report.details[`Compliance.Keyword.${kw}`] = 'OK';
                } else {
                    report.failures.push(`[Compliance] Keyword Missing: "${kw}" não encontrada no checklist`);
                    report.details[`Compliance.Keyword.${kw}`] = 'FAIL';
                }
            });
        } else {
            exp4.keywords_present.forEach(kw => {
                totalChecks++;
                report.failures.push(`[Compliance] Keyword Missing: "${kw}" (Lista de requisitos vazia)`);
                report.details[`Compliance.Keyword.${kw}`] = 'FAIL_EMPTY_LIST';
            });
        }
    }

    // 3. Agente 7 - Divergence Scanner
    const ag7 = actual.results?.divergences?.dados || {};
    const exp7 = expected.expected_output?.agent_07_divergence;

    if (exp7) {
        const inconsistencias = ag7.inconsistencias || [];

        if (exp7.expect_divergence) {
            totalChecks++;
            if (inconsistencias.length > 0) {
                passedChecks++;
                report.details['Divergence.Detection'] = `OK (${inconsistencias.length} found)`;
            } else {
                report.failures.push(`[Divergence] Esperada divergência, mas nenhuma encontrada.`);
                report.details['Divergence.Detection'] = 'FAIL (0 found)';
            }
        } else {
            totalChecks++;
            if (inconsistencias.length === 0) {
                passedChecks++;
                report.details['Divergence.Clean'] = 'OK';
            } else {
                report.failures.push(`[Divergence] Inesperada divergência encontrada.`);
                report.details['Divergence.Clean'] = 'FAIL';
            }
        }
    }

    // Calculo Score
    report.score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
    report.passed = report.score > 80;

    return report;
}

function generateReport(results) {
    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;

    console.log('--- RESUMO FINAL ---');
    console.log(`Total: ${totalCount}`);
    console.log(`Approved: ${passedCount}`);
    console.log(`Failed: ${totalCount - passedCount}`);

    const markdown = [
        '# 📊 Relatório de Validação Automática (Evals)',
        `**Data:** ${new Date().toLocaleString()}`,
        `**Score Global:** ${passedCount}/${totalCount} (${Math.round(passedCount / totalCount * 100)}%)`,
        '',
        '## Detalhes por Arquivo',
        '| Arquivo | Status | Score | Duração | Falhas Principais |',
        '|---|---|---|---|---|',
        ...results.map(r => {
            const statusIcon = r.passed ? '✅' : '❌';
            const failures = r.failures.length > 0 ? r.failures[0] + (r.failures.length > 1 ? ` (+${r.failures.length - 1})` : '') : 'None';
            return `| **${r.file}** | ${statusIcon} | ${r.score}% | ${r.duration}s | ${failures} |`;
        }),
        '',
        '## Detalhes Técnicos',
        ...results.map(r => `### ${r.file}\n\`\`\`json\n${JSON.stringify(r.details, null, 2)}\n\`\`\``)
    ].join('\n');

    fs.writeFileSync('eval-report.md', markdown);
    console.log(`\n📄 Relatório salvo em: eval-report.md`);
}

runEval();
