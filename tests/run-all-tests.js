/**
 * SUITE DE TESTES COMPLETA
 * Executa todos os testes antes de aprovar deploy
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════╗');
console.log('║   SUITE DE TESTES - LEITOR DE EDITAIS         ║');
console.log('╚════════════════════════════════════════════════╝\n');

const testsDir = __dirname;
const tests = [
    {
        name: 'Validação Results Page',
        file: 'validate-results-page.js',
        critical: true
    },
    {
        name: 'Compressão de Storage',
        file: '../test-storage-optimization.js',
        critical: true
    },
    {
        name: 'Build Local',
        file: 'validate-build.js',
        critical: true,
        slow: true
    }
];

let passed = 0;
let failed = 0;
const results = [];

for (const test of tests) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Executando: ${test.name}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
        const testPath = path.join(testsDir, test.file);
        execSync(`node "${testPath}"`, {
            stdio: 'inherit',
            timeout: test.slow ? 180000 : 30000
        });

        passed++;
        results.push({ name: test.name, status: '✅ PASSOU', critical: test.critical });

    } catch (error) {
        failed++;
        results.push({ name: test.name, status: '❌ FALHOU', critical: test.critical });

        if (test.critical) {
            console.error(`\n🚨 TESTE CRÍTICO FALHOU: ${test.name}`);
            console.error('Deploy BLOQUEADO até correção.\n');
        }
    }
}

// Relatório Final
console.log('\n\n╔════════════════════════════════════════════════╗');
console.log('║            RELATÓRIO FINAL                     ║');
console.log('╚════════════════════════════════════════════════╝\n');

results.forEach(r => {
    const critical = r.critical ? '🔴 CRÍTICO' : '⚪ INFO';
    console.log(`${r.status} ${r.name.padEnd(30)} ${critical}`);
});

console.log(`\n📊 RESULTADOS: ${passed} passaram | ${failed} falharam`);

const criticalFailed = results.filter(r => r.critical && r.status.includes('FALHOU')).length;

if (criticalFailed > 0) {
    console.log('\n❌ TESTES CRÍTICOS FALHARAM - DEPLOY BLOQUEADO');
    console.log('Corrija os erros acima antes de enviar para produção.\n');
    process.exit(1);
}

if (failed > 0) {
    console.log('\n⚠️  ALGUNS TESTES FALHARAM - Revise antes do deploy');
    process.exit(1);
}

console.log('\n✅ TODOS OS TESTES PASSARAM - DEPLOY APROVADO');
console.log('Pode prosseguir com confiança!\n');
process.exit(0);
