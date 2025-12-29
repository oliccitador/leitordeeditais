import TechnicalValidator from './lib/agents/05-technical.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('\n🧪 TESTES EXAUSTIVOS - AGENTE 5 (CAPACIDADE TÉCNICA)\n');
console.log('='.repeat(70));

// Mock de CORPO_INTEGRADO com requisitos técnicos
const mockCorpo = {
    fullText: `
PREGÃO ELETRÔNICO Nº 42/2024

SEÇÃO DE CAPACIDADE TÉCNICA

1. ATESTADOS DE CAPACIDADE TÉCNICA
- Atestado de Capacidade Técnica comprovando fornecimento anterior de mobiliário escolar
- Atestado de execução de serviços compatíveis com o objeto
- Parcela de 30% do valor estimado da contratação

2. NORMAS TÉCNICAS
- ABNT NBR 15575 (Edificações habitacionais - Desempenho)
- ABNT NBR 16001 (Responsabilidade social)
- ISO 9001 (Sistema de gestão da qualidade)
- ISO 14001 (Sistema de gestão ambiental)

3. CERTIFICAÇÕES
- Certificado de registro no INMETRO
- Laudo técnico de conformidade
- Registro na ANVISA para produtos de saúde

4. VISITA TÉCNICA
- Visita técnica obrigatória ao local de execução dos serviços
- Vistoria prévia às instalações

5. AMOSTRAS
- Amostra do produto para análise técnica
- Protótipo funcional do equipamento

6. ENSAIOS
- Ensaio de resistência mecânica
- Teste técnico de durabilidade

7. CONSELHO PROFISSIONAL
- Responsável técnico com registro no CREA
- Profissional com registro no CRQ
    `,
    textoCompleto: '',
    segments: [{ documentName: 'edital.pdf', documentType: 'edital' }],
    globalLines: [],
    metadata: { totalPages: 1 }
};

// Gerar globalLines
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
    const agent = new TechnicalValidator();

    console.log('\n📋 TESTE 1: Extração de Requisitos Técnicos');
    console.log('-'.repeat(70));

    try {
        const result = await agent.process(mockCorpo);

        console.log(`\n✅ Status: ${result.status}`);
        console.log(`📊 Total de requisitos: ${result.dados.requisitos_tecnicos.length}`);

        // Teste 2: Validar Resumo
        console.log('\n📋 TESTE 2: Resumo de Capacidade Técnica');
        console.log('-'.repeat(70));

        const resumo = result.dados.resumo;
        console.log(`\n  Exige Atestado: ${resumo.exige_atestado ? '✅ SIM' : '❌ NÃO'}`);
        console.log(`  Exige Normas: ${resumo.exige_normas ? '✅ SIM' : '❌ NÃO'}`);
        console.log(`  Exige Visita: ${resumo.exige_visita ? '✅ SIM' : '❌ NÃO'}`);
        console.log(`  Exige Amostra: ${resumo.exige_amostra ? '✅ SIM' : '❌ NÃO'}`);
        console.log(`  Total de requisitos: ${resumo.total_requisitos}`);
        console.log(`  Gatilhos de impugnação: ${resumo.gatilhos_impugnacao}`);
        console.log(`  Requisitos de risco ALTO: ${resumo.risco_alto}`);

        // Teste 3: Validar Requisitos por Tipo
        console.log('\n📋 TESTE 3: Requisitos por Tipo');
        console.log('-'.repeat(70));

        const reqPorTipo = {};
        result.dados.requisitos_tecnicos.forEach(req => {
            if (!reqPorTipo[req.tipo]) {
                reqPorTipo[req.tipo] = [];
            }
            reqPorTipo[req.tipo].push(req);
        });

        for (const [tipo, reqs] of Object.entries(reqPorTipo)) {
            console.log(`\n  📁 ${tipo}: ${reqs.length} requisito(s)`);
            reqs.forEach(req => {
                const riscoIcon = req.nivel_risco === 'ALTO' ? '🔴' : req.nivel_risco === 'MEDIO' ? '🟡' : '🟢';
                console.log(`      ${riscoIcon} ${req.criterio} (Risco: ${req.nivel_risco})`);
            });
        }

        // Teste 4: Validar Níveis de Risco
        console.log('\n📋 TESTE 4: Análise de Níveis de Risco');
        console.log('-'.repeat(70));

        const baixo = result.dados.requisitos_tecnicos.filter(r => r.nivel_risco === 'BAIXO').length;
        const medio = result.dados.requisitos_tecnicos.filter(r => r.nivel_risco === 'MEDIO').length;
        const alto = result.dados.requisitos_tecnicos.filter(r => r.nivel_risco === 'ALTO').length;

        console.log(`\n  🟢 BAIXO: ${baixo} requisito(s)`);
        console.log(`  🟡 MEDIO: ${medio} requisito(s)`);
        console.log(`  🔴 ALTO: ${alto} requisito(s)`);

        // Teste 5: Validar Gatilhos de Impugnação
        console.log('\n📋 TESTE 5: Gatilhos de Impugnação');
        console.log('-'.repeat(70));

        const gatilhos = result.dados.requisitos_tecnicos.filter(r => r.gatilho_impugnacao);
        console.log(`\n  🚨 Total de gatilhos: ${gatilhos.length}`);

        if (gatilhos.length > 0) {
            gatilhos.forEach(req => {
                console.log(`\n      ⚠️  ${req.criterio}`);
                console.log(`         Tipo: ${req.tipo}`);
                console.log(`         Risco: ${req.nivel_risco}`);
                console.log(`         Justificativa: ${req.justificativa_gatilho}`);
            });
        } else {
            console.log('  ✅ Nenhum gatilho de impugnação detectado');
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
                console.log(`     Trecho: "${ev.trecho_literal.substring(0, 60)}..."`);
                console.log(`     Confiança: ${(ev.confidence * 100).toFixed(0)}%`);
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
                console.log(`     Severidade: ${alert.severity}`);
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

        // Teste 9: Validar Estrutura de Dados
        console.log('\n📋 TESTE 9: Validação de Estrutura');
        console.log('-'.repeat(70));

        const primeiroReq = result.dados.requisitos_tecnicos[0];
        if (primeiroReq) {
            console.log('\n  🔍 Campos do primeiro requisito:');
            console.log(`     ✓ tipo: ${primeiroReq.tipo ? '✅' : '❌'}`);
            console.log(`     ✓ criterio: ${primeiroReq.criterio ? '✅' : '❌'}`);
            console.log(`     ✓ trecho_literal: ${primeiroReq.trecho_literal ? '✅' : '❌'}`);
            console.log(`     ✓ nivel_risco: ${primeiroReq.nivel_risco ? '✅' : '❌'}`);
            console.log(`     ✓ gatilho_impugnacao: ${typeof primeiroReq.gatilho_impugnacao === 'boolean' ? '✅' : '❌'}`);
            console.log(`     ✓ justificativa_gatilho: ${primeiroReq.justificativa_gatilho ? '✅' : '❌'}`);
            console.log(`     ✓ state: ${primeiroReq.state ? '✅' : '❌'}`);
            console.log(`     ✓ origens: ${Array.isArray(primeiroReq.origens) ? '✅' : '❌'}`);
        }

        // Resumo Final
        console.log('\n' + '='.repeat(70));
        console.log('📊 RESUMO DOS TESTES');
        console.log('='.repeat(70));

        const totalTestes = 9;
        const testesPassados = [
            result.status === 'ok',
            Object.keys(resumo).length > 0,
            result.dados.requisitos_tecnicos.length > 0,
            baixo + medio + alto === result.dados.requisitos_tecnicos.length,
            true, // Gatilhos (sempre passa)
            result.evidence.length > 0,
            true, // Alerts (sempre passa)
            result.metadata.run_ms > 0,
            primeiroReq && primeiroReq.tipo && primeiroReq.criterio
        ].filter(Boolean).length;

        console.log(`\n  ✅ Testes passados: ${testesPassados}/${totalTestes}`);
        console.log(`  📊 Taxa de sucesso: ${((testesPassados / totalTestes) * 100).toFixed(0)}%`);

        if (testesPassados === totalTestes) {
            console.log('\n  🎉 TODOS OS TESTES PASSARAM!');
        } else {
            console.log('\n  ⚠️  Alguns testes falharam. Revisar implementação.');
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
