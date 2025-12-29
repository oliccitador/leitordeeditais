// SCRIPT DE DIAGNÓSTICO - Cole no Console do Chrome (F12 → Console)
// Extrai dados relevantes do localStorage para análise

const batchId = 'd74ee07d-84de-4e13-94b9-c3b560544413';
const key = `result_${batchId}`;
const data = JSON.parse(localStorage.getItem(key));

console.log('═══════════════════════════════════════════════');
console.log('📊 DIAGNÓSTICO COMPLETO DO RESULTADO');
console.log('═══════════════════════════════════════════════\n');

console.log('🔹 PIPELINE SUMMARY:');
console.log('  - Status:', data.pipeline_summary.status);
console.log('  - Documentos Processados:', data.pipeline_summary.documents_processed);
console.log('  - Total Páginas:', data.pipeline_summary.total_pages);
console.log('  - OCR Quality Avg:', data.pipeline_summary.ocr_quality_avg + '%');
console.log('  - Total Linhas:', data.pipeline_summary.total_lines);

console.log('\n🔹 CORPO INTEGRADO:');
console.log('  - Total Páginas:', data.corpo_integrado.metadata.totalPages);
console.log('  - Total Caracteres:', data.corpo_integrado.metadata.totalCharacters);
console.log('  - OCR Quality Global:', data.corpo_integrado.metadata.ocrQualityGlobal + '%');
console.log('  - Texto Completo (primeiros 500 chars):',
    data.corpo_integrado.textoCompleto ?
        data.corpo_integrado.textoCompleto.substring(0, 500) :
        '(VAZIO)');

console.log('\n🔹 RESULTS - STRUCTURE:');
console.log('  - Status:', data.results.structure.status);
if (data.results.structure.erro) {
    console.log('  - Erro:', data.results.structure.erro);
}
console.log('  - Modalidade:', data.results.structure.dados?.modalidade || 'N/A');
console.log('  - Órgão:', data.results.structure.dados?.orgao || 'N/A');

console.log('\n🔹 WARNINGS:');
data.pipeline_warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));

console.log('\n🔹 PRE-ANÁLISE:');
console.log('  - Itens Detectados:', data.pre_analise.itens_detectados);
console.log('  - Seções Importantes:', data.pre_analise.secoes_importantes);

console.log('\n🔹 METADATA:');
console.log('  - Total Items:', data.metadata.total_items);
console.log('  - Go/No-Go:', data.metadata.go_no_go);

console.log('\n🔹 PERSISTÊNCIA:');
console.log('  - Persistido no DB:', data.persisted);
if (data.persistence_error) {
    console.log('  - Erro Persistência:', data.persistence_error.substring(0, 100) + '...');
}

console.log('\n═══════════════════════════════════════════════');
console.log('✅ Diagnóstico completo. Copie o output acima.');
console.log('═══════════════════════════════════════════════');
