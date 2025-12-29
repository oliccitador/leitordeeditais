/**
 * 🔍 SCRIPT DE DIAGNÓSTICO - VERIFICAR RESULTADO DO UPLOAD
 * 
 * Execute este script no Console do navegador (F12 → Console)
 * para verificar se o patch OCR funcionou
 */

console.log('🔍 ========== DIAGNÓSTICO OCR - RESULTADO DO UPLOAD ==========\n');

// Pegar último resultado do localStorage
const lastResult = localStorage.getItem('lastResult');

if (!lastResult) {
    console.log('❌ Nenhum resultado encontrado no localStorage');
    console.log('   Possível causa: Upload falhou ou ainda está processando');
} else {
    const data = JSON.parse(lastResult);

    console.log('✅ Resultado encontrado!\n');

    // Extrair valores OCR
    const ocrQualityAvg = data.pipeline_summary?.ocr_quality_avg;
    const ocrQualityPct = data.pipeline_summary?.ocr_quality_pct;
    const ocrQualityGlobal = data.corpo_integrado?.metadata?.ocrQualityGlobal;
    const ocrQualityMin = data.corpo_integrado?.metadata?.ocrQualityMin;
    const ocrQualityMax = data.corpo_integrado?.metadata?.ocrQualityMax;

    console.log('📊 VALORES OCR:');
    console.log('   - ocr_quality_avg (0-1):', ocrQualityAvg);
    console.log('   - ocr_quality_pct (0-100):', ocrQualityPct);
    console.log('   - ocrQualityGlobal (0-100):', ocrQualityGlobal);
    console.log('   - ocrQualityMin:', ocrQualityMin);
    console.log('   - ocrQualityMax:', ocrQualityMax);

    console.log('\n📋 ANÁLISE:');

    // Verificar se patch funcionou
    if (ocrQualityGlobal > 0) {
        console.log('✅ PATCH FUNCIONOU!');
        console.log('   - ocrQualityGlobal > 0:', ocrQualityGlobal);

        if (ocrQualityAvg > 0 && ocrQualityAvg <= 1) {
            console.log('✅ Conversão de escala correta!');
            console.log('   - ocr_quality_avg (0-1):', ocrQualityAvg);
            console.log('   - Exibição esperada:', (ocrQualityAvg * 100).toFixed(0) + '%');
        } else {
            console.log('⚠️ Conversão de escala pode estar incorreta');
            console.log('   - ocr_quality_avg:', ocrQualityAvg);
        }

        if (ocrQualityPct > 0) {
            console.log('✅ Campo debug presente!');
            console.log('   - ocr_quality_pct:', ocrQualityPct);
        }

    } else {
        console.log('❌ PATCH NÃO FUNCIONOU!');
        console.log('   - ocrQualityGlobal ainda é 0');
        console.log('   - Causa: ocrQualityAvg foi perdido no pipeline');
    }

    console.log('\n📄 OUTROS DADOS:');
    console.log('   - Status:', data.status);
    console.log('   - Batch ID:', data.batch_id);
    console.log('   - Total Pages:', data.pipeline_summary?.total_pages);
    console.log('   - Total Chars:', data.corpo_integrado?.metadata?.totalChars);

    console.log('\n🎯 RESULTADO FINAL:');

    if (ocrQualityGlobal > 0 && ocrQualityAvg > 0 && ocrQualityAvg <= 1) {
        console.log('✅✅✅ TUDO FUNCIONANDO CORRETAMENTE! ✅✅✅');
        console.log('   - OCR Quality calculado:', ocrQualityGlobal + '%');
        console.log('   - Valor para frontend:', ocrQualityAvg + ' (0-1)');
        console.log('   - Exibição no dashboard:', (ocrQualityAvg * 100).toFixed(0) + '%');
        console.log('   - Banner deve estar: OCULTO (qualidade boa)');
    } else if (ocrQualityGlobal > 0 && ocrQualityAvg === 0) {
        console.log('⚠️ PARCIALMENTE FUNCIONANDO');
        console.log('   - ocrQualityGlobal calculado:', ocrQualityGlobal);
        console.log('   - Mas conversão de escala falhou (ocr_quality_avg = 0)');
    } else {
        console.log('❌❌❌ PATCH NÃO FUNCIONOU ❌❌❌');
        console.log('   - ocrQualityGlobal = 0');
        console.log('   - Dados foram perdidos no pipeline');
    }
}

console.log('\n' + '='.repeat(80) + '\n');

// Retornar objeto para fácil inspeção
if (lastResult) {
    const data = JSON.parse(lastResult);
    console.log('📦 Objeto completo disponível como resultado:');
    window.ocrDebugResult = {
        ocr_quality_avg: data.pipeline_summary?.ocr_quality_avg,
        ocr_quality_pct: data.pipeline_summary?.ocr_quality_pct,
        ocrQualityGlobal: data.corpo_integrado?.metadata?.ocrQualityGlobal,
        ocrQualityMin: data.corpo_integrado?.metadata?.ocrQualityMin,
        ocrQualityMax: data.corpo_integrado?.metadata?.ocrQualityMax,
        totalChars: data.corpo_integrado?.metadata?.totalChars,
        totalPages: data.pipeline_summary?.total_pages,
        status: data.status,
        batch_id: data.batch_id
    };
    console.log(window.ocrDebugResult);
}
