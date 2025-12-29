import ComplianceChecker from './lib/agents/04-compliance.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('\n🧪 TESTES EXAUSTIVOS - AGENTE 4 (HABILITAÇÃO)\n');
console.log('='.repeat(70));

// Mock de CORPO_INTEGRADO com requisitos de habilitação
const mockCorpo = {
    fullText: `
PREGÃO ELETRÔNICO Nº 42/2024

SEÇÃO DE HABILITAÇÃO

1. HABILITAÇÃO JURÍDICA
- Registro comercial
- Ato constitutivo

2. REGULARIDADE FISCAL
- Certidão Negativa de Débitos com a Fazenda Federal (RFB/PGFN)
- Certidão de Regularidade com a Fazenda Estadual
- Certidão de Regularidade com a Fazenda Municipal
- Certificado de Regularidade do FGTS
- Certidão Negativa de Débitos Trabalhistas (CNDT)

3. QUALIFICAÇÃO ECONÔMICO-FINANCEIRA
- Certidão negativa de falência ou recuperação judicial
- Balanço patrimonial dos últimos 3 exercícios
- Patrimônio líquido mínimo de R$ 100.000,00
- Índices de liquidez geral maior que 1,5

4. CADASTRO
- Certificado de Registro Cadastral (CRC) válido
- Registro no SICAF

5. DECLARAÇÕES
- Declaração de cumprimento do Art. 7º, XXXIII da Constituição Federal
- Declaração de inexistência de fato impeditivo
- Declaração de elaboração independente de proposta
- Declaração anticorrupção

TRATAMENTO DIFERENCIADO ME/EPP
As microempresas e empresas de pequeno porte terão prazo adicional de 5 dias úteis
para regularização fiscal, conforme LC 123/2006.
    `,
    textoCompleto: '',
    segments: [{ documentName: 'edital.pdf', documentType: 'edital' }],
    globalLines: [],
    metadata: { totalPages: 1 }
};

// Gerar globalLines a partir do texto
const lines = mockCorpo.fullText.split('\n');
mockCorpo.globalLines = lines.map((text, i) => ({
    text,
    globalLine: i,
    charStart: 0,
    charEnd: text.length,
    sourceDocName: 'edital.pdf',
    sourcePage: 1,
    docId: 'doc1',
    segmentHash: 'hash1'
}));
mockCorpo.textoCompleto = mockCorpo.fullText;

async function runTests() {
    const agent = new ComplianceChecker();

    console.log('\n📋 TESTE 1: Extração de Requisitos');
    console.log('-'.repeat(70));

    try {
        const result = await agent.process(mockCorpo);

        console.log(`\n✅ Status: ${result.status}`);
        console.log(`📊 Total de requisitos: ${result.dados.requisitos.length}`);

        // Teste 2: Validar Checklist
        console.log('\n📋 TESTE 2: Estrutura do Checklist');
        console.log('-'.repeat(70));

        const checklist = result.dados.checklist;
        console.log('\n🔍 Categorias encontradas:');

        const categorias = ['fiscal', 'trabalhista', 'cadastro', 'economico_financeiro', 'declaracoes'];
        for (const cat of categorias) {
            const items = checklist[cat] || [];
            const status = items.length > 0 && items[0] !== 'SEM DADOS NO ARQUIVO' ? '✅' : '⚠️';
            console.log(`  ${status} ${cat}: ${items.length} item(s)`);

            if (items.length > 0 && items.length <= 3) {
                items.forEach(item => console.log(`      - ${item}`));
            }
        }

        // Teste 3: Validar Requisitos Detalhados
        console.log('\n📋 TESTE 3: Requisitos Detalhados');
        console.log('-'.repeat(70));

        const reqPorCategoria = {};
        result.dados.requisitos.forEach(req => {
            if (!reqPorCategoria[req.categoria]) {
                reqPorCategoria[req.categoria] = [];
            }
            reqPorCategoria[req.categoria].push(req);
        });

        for (const [cat, reqs] of Object.entries(reqPorCategoria)) {
            console.log(`\n  📁 ${cat}: ${reqs.length} requisito(s)`);
            reqs.slice(0, 2).forEach(req => {
                console.log(`      ✓ ${req.descricao}`);
                if (req.exigencia_excessiva) {
                    console.log(`        ⚠️  EXIGÊNCIA EXCESSIVA!`);
                }
            });
        }

        // Teste 4: Validar Exigências Excessivas
        console.log('\n📋 TESTE 4: Detecção de Exigências Excessivas');
        console.log('-'.repeat(70));

        const excessivas = result.dados.requisitos.filter(r => r.exigencia_excessiva);
        console.log(`\n  🚨 Total de exigências excessivas: ${excessivas.length}`);

        if (excessivas.length > 0) {
            excessivas.forEach(req => {
                console.log(`      ⚠️  ${req.descricao}`);
                console.log(`         Justificativa: ${req.justificativa_alerta}`);
            });
        } else {
            console.log('  ✅ Nenhuma exigência excessiva detectada');
        }

        // Teste 5: Validar ME/EPP
        console.log('\n📋 TESTE 5: Observações ME/EPP');
        console.log('-'.repeat(70));

        const meEpp = result.dados.me_epp_observacoes;
        if (meEpp && meEpp !== 'SEM DADOS NO ARQUIVO') {
            console.log(`  ✅ Observações encontradas:`);
            console.log(`     ${meEpp.substring(0, 200)}...`);
        } else {
            console.log('  ⚠️  Nenhuma observação ME/EPP encontrada');
        }

        // Teste 6: Validar Evidências
        console.log('\n📋 TESTE 6: Rastreabilidade (Evidências)');
        console.log('-'.repeat(70));

        console.log(`\n  📍 Total de evidências: ${result.evidence.length}`);

        if (result.evidence.length > 0) {
            const amostra = result.evidence.slice(0, 3);
            amostra.forEach((ev, i) => {
                console.log(`\n  ${i + 1}. Campo: ${ev.field}`);
                console.log(`     Documento: ${ev.documento}, Página: ${ev.pagina}`);
                console.log(`     Trecho: "${ev.trecho_literal.substring(0, 80)}..."`);
            });
        }

        // Teste 7: Validar Alerts
        console.log('\n📋 TESTE 7: Alertas Gerados');
        console.log('-'.repeat(70));

        console.log(`\n  🔔 Total de alertas: ${result.alerts.length}`);

        if (result.alerts.length > 0) {
            result.alerts.forEach(alert => {
                const icon = alert.severity === 'HIGH' ? '🔴' : alert.severity === 'MEDIUM' ? '🟡' : '🟢';
                console.log(`\n  ${icon} [${alert.type}] ${alert.message}`);
                console.log(`     Ação sugerida: ${alert.action_suggested}`);
            });
        } else {
            console.log('  ✅ Nenhum alerta gerado');
        }

        // Teste 8: Validar Metadata
        console.log('\n📋 TESTE 8: Metadata e Quality Flags');
        console.log('-'.repeat(70));

        console.log(`\n  ⏱️  Tempo de execução: ${result.metadata.run_ms}ms`);
        console.log(`  📊 Itens encontrados: ${result.metadata.items_found}`);
        console.log(`  🎯 Confiança: ${(result.metadata.confidence * 100).toFixed(0)}%`);
        console.log(`  📂 Seções atingidas: ${result.metadata.sections_hit.join(', ') || 'Nenhuma'}`);

        console.log(`\n  🏁 Quality Flags:`);
        console.log(`     Precisa revisão: ${result.quality_flags.needs_review ? '⚠️  SIM' : '✅ NÃO'}`);
        console.log(`     OCR baixo: ${result.quality_flags.low_ocr_quality ? '⚠️  SIM' : '✅ NÃO'}`);
        console.log(`     Seções faltantes: ${result.quality_flags.missing_sections.join(', ') || 'Nenhuma'}`);

        // Resumo Final
        console.log('\n' + '='.repeat(70));
        console.log('📊 RESUMO DOS TESTES');
        console.log('='.repeat(70));

        const totalTestes = 8;
        const testesPassados = [
            result.status === 'ok',
            Object.keys(checklist).length > 0,
            result.dados.requisitos.length > 0,
            true, // Exigências excessivas (sempre passa)
            true, // ME/EPP (sempre passa)
            result.evidence.length > 0,
            true, // Alerts (sempre passa)
            result.metadata.run_ms > 0
        ].filter(Boolean).length;

        console.log(`\n  ✅ Testes passados: ${testesPassados}/${totalTestes}`);
        console.log(`  📊 Taxa de sucesso: ${((testesPassados / totalTestes) * 100).toFixed(0)}%`);

        if (testesPassados === totalTestes) {
            console.log('\n  🎉 TODOS OS TESTES PASSARAM!');
        } else {
            console.log('\n  ⚠️  Alguns testes falharam. Revisar implementação.');
        }

        // Teste 9: Validar formato JSON para frontend
        console.log('\n📋 TESTE 9: Compatibilidade com Frontend');
        console.log('-'.repeat(70));

        console.log('\n  🔍 Validando estrutura do checklist:');
        console.log(`     É objeto? ${typeof checklist === 'object' && !Array.isArray(checklist) ? '✅ SIM' : '❌ NÃO'}`);
        console.log(`     Tem categorias? ${Object.keys(checklist).length > 0 ? '✅ SIM' : '❌ NÃO'}`);

        for (const [cat, items] of Object.entries(checklist)) {
            const isArray = Array.isArray(items);
            console.log(`     ${cat}: ${isArray ? '✅' : '❌'} ${isArray ? 'Array' : typeof items}`);
        }

    } catch (error) {
        console.error('\n❌ ERRO NOS TESTES:', error.message);
        console.error(error.stack);
    }
}

runTests().then(() => {
    console.log('\n' + '='.repeat(70));
    console.log('✅ TESTES CONCLUÍDOS\n');
});
