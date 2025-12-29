/**
 * TESTE 1: Validação de Sintaxe - Results Page
 * Objetivo: Garantir que o arquivo não usa React.use() experimental
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'results', '[batchId]', 'page.tsx');
const content = fs.readFileSync(filePath, 'utf8');

console.log('🧪 TESTE 1: Validação Results Page');
console.log('═'.repeat(50));

// Check 1: Não deve importar 'use' do React
const hasUseImport = /import\s+{[^}]*\buse\b[^}]*}\s+from\s+['"]react['"]/.test(content);
if (hasUseImport) {
    console.error('❌ FALHOU: Arquivo importa hook "use" experimental do React');
    process.exit(1);
}
console.log('✅ PASSOU: Não importa hook "use"');

// Check 2: Não deve chamar use(params)
const hasUseCall = /\buse\s*\(\s*params\s*\)/.test(content);
if (hasUseCall) {
    console.error('❌ FALHOU: Arquivo chama use(params)');
    process.exit(1);
}
console.log('✅ PASSOU: Não chama use(params)');

// Check 3: Deve usar params diretamente
const hasDirectParams = /const\s+{\s*batchId\s*}\s*=\s*params/.test(content);
if (!hasDirectParams) {
    console.error('❌ FALHOU: Não desestrutura params corretamente');
    process.exit(1);
}
console.log('✅ PASSOU: Usa params.batchId corretamente');

// Check 4: Tipagem correta (não Promise)
const hasCorrectType = /params\s*:\s*{\s*batchId\s*:\s*string\s*}/.test(content);
if (!hasCorrectType) {
    console.error('❌ FALHOU: Tipagem de params incorreta');
    process.exit(1);
}
console.log('✅ PASSOU: Tipagem correta (não Promise)');

// Check 5: Tem estratégia de localStorage
const hasLocalStorageStrategy = /localStorage\.getItem\(`result_\$\{batchId\}`\)/.test(content);
if (!hasLocalStorageStrategy) {
    console.error('❌ FALHOU: Não implementa estratégia de localStorage');
    process.exit(1);
}
console.log('✅ PASSOU: Implementa cache de localStorage');

console.log('\n🎉 TESTE 1 PASSOU: Results Page está correto!\n');
