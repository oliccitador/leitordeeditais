/**
 * TESTE 2: Build Local
 * Objetivo: Garantir que `npm run build` passa sem erros
 */

const { execSync } = require('child_process');

console.log('🧪 TESTE 2: Build Local');
console.log('═'.repeat(50));

try {
    console.log('⏳ Executando npm run build...\n');

    const output = execSync('npm run build', {
        cwd: __dirname.replace('\\tests', ''),
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 120000 // 2 minutos
    });

    console.log('📋 Output (últimas linhas):');
    const lines = output.split('\n');
    console.log(lines.slice(-10).join('\n'));

    // Verifica se tem a mensagem de sucesso
    if (output.includes('Compiled successfully')) {
        console.log('\n✅ PASSOU: Build compilou com sucesso!');
    } else if (!output.includes('Failed to compile')) {
        console.log('\n✅ PASSOU: Build concluiu sem erros críticos');
    } else {
        throw new Error('Build falhou');
    }

} catch (error) {
    console.error('\n❌ FALHOU: Build com erros');
    console.error('Erro:', error.message);
    if (error.stdout) {
        console.error('\nStdout:', error.stdout.toString().slice(-500));
    }
    if (error.stderr) {
        console.error('\nStderr:', error.stderr.toString().slice(-500));
    }
    process.exit(1);
}

console.log('\n🎉 TESTE 2 PASSOU: Build local funcionando!\n');
