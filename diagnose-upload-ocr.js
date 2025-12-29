/**
 * 🔍 DIAGNÓSTICO PROFUNDO - OCR QUALITY NO UPLOAD REAL
 * 
 * Objetivo: Verificar por que OCR está retornando 0% no upload real
 * mesmo com o fix aplicado
 */

console.log('🔍 ========== DIAGNÓSTICO OCR UPLOAD REAL ==========\n');

// Verificar localStorage
const batchId = 'a0a6948d-5b66-459e-9086-3b95d50561c8';
const resultKey = `result_${batchId}`;

console.log(`📦 Verificando localStorage para batch: ${batchId}\n`);

try {
    const stored = localStorage.getItem(resultKey);

    if (!stored) {
        console.log('❌ Nenhum resultado encontrado no localStorage');
        console.log('   Chave procurada:', resultKey);
        console.log('   Todas as chaves:', Object.keys(localStorage));
    } else {
        const data = JSON.parse(stored);

        console.log('✅ Resultado encontrado no localStorage\n');

        console.log('📊 PIPELINE SUMMARY:');
        console.log('   - Status:', data.pipeline_summary?.status);
        console.log('   - OCR Quality Avg:', data.pipeline_summary?.ocr_quality_avg);
        console.log('   - Documents Processed:', data.pipeline_summary?.documents_processed);
        console.log('   - Total Lines:', data.pipeline_summary?.total_lines);
        console.log('   - Total Pages:', data.pipeline_summary?.total_pages);

        console.log('\n📄 CORPO INTEGRADO:');
        console.log('   - Metadata:', data.corpo_integrado?.metadata);
        console.log('   - OCR Quality Global:', data.corpo_integrado?.metadata?.ocrQualityGlobal);
        console.log('   - OCR Quality Min:', data.corpo_integrado?.metadata?.ocrQualityMin);
        console.log('   - OCR Quality Max:', data.corpo_integrado?.metadata?.ocrQualityMax);

        console.log('\n🔍 ANÁLISE:');

        const ocrQualityAvg = data.pipeline_summary?.ocr_quality_avg;
        const ocrQualityGlobal = data.corpo_integrado?.metadata?.ocrQualityGlobal;

        console.log(`   - OCR Quality Avg (pipeline_summary): ${ocrQualityAvg}`);
        console.log(`   - OCR Quality Global (corpo_integrado): ${ocrQualityGlobal}`);

        if (ocrQualityAvg === 0 || ocrQualityAvg === undefined) {
            console.log('\n❌ PROBLEMA IDENTIFICADO:');
            console.log('   - pipeline_summary.ocr_quality_avg está 0 ou undefined');

            if (ocrQualityGlobal === 0 || ocrQualityGlobal === undefined) {
                console.log('   - corpo_integrado.metadata.ocrQualityGlobal TAMBÉM está 0 ou undefined');
                console.log('   - CAUSA: OCREngine não está calculando qualidade OU');
                console.log('   - CAUSA: DocumentFusion não está recebendo dados do OCR');
            } else {
                console.log(`   - corpo_integrado.metadata.ocrQualityGlobal = ${ocrQualityGlobal}`);
                console.log('   - CAUSA: Conversão no MasterLicitator não está funcionando');
                console.log(`   - ESPERADO: ${ocrQualityGlobal} / 100 = ${ocrQualityGlobal / 100}`);
            }
        } else {
            console.log('\n✅ OCR Quality está sendo calculado corretamente');
            console.log(`   - Valor: ${ocrQualityAvg}`);
            console.log(`   - Banner deveria ${ocrQualityAvg < 0.5 ? 'APARECER' : 'NÃO APARECER'}`);
        }

        console.log('\n📋 DADOS COMPLETOS (JSON):');
        console.log(JSON.stringify({
            pipeline_summary: data.pipeline_summary,
            corpo_integrado_metadata: data.corpo_integrado?.metadata
        }, null, 2));
    }

} catch (error) {
    console.error('❌ Erro ao analisar localStorage:', error);
}

console.log('\n' + '='.repeat(80) + '\n');
