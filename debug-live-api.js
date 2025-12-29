
/**
 * 🛠️ DEBUG LIVE API - FERRAMENTA DE TESTE RÁPIDO
 * 
 * MODO DE USO:
 * 1. Certifique-se que o server está rodando (npm run dev)
 * 2. Coloque o PDF alvo na pasta raiz ou ajuste o path abaixo
 * 3. Rode: node debug-live-api.js
 * 
 * OBJETIVO:
 * Testar a extração do Agente 3 sem usar o Frontend.
 * Mostra o texto bruto que chega no agente e os itens que saem.
 */

const fs = require('fs');
const path = require('path');

// CONFIGURAÇÃO
const API_URL = 'http://localhost:3000/api/analyze';
const PDF_PATH = 'c:/Leitordeeditais/test-files/09-Edital-PE42-Eletrodomesticos_26758.pdf';

async function runTest() {
    console.log('🔄 Iniciando teste de API...');

    if (!fs.existsSync(PDF_PATH)) {
        console.error(`❌ Erro: Arquivo ${PDF_PATH} não encontrado.`);
        console.log('💡 Dica: Copie o PDF problemático para a raiz do projeto.');
        return;
    }

    const formData = new FormData();
    const fileBuffer = fs.readFileSync(PDF_PATH);
    const fileBlob = new Blob([fileBuffer], { type: 'application/pdf' });
    formData.append('files', fileBlob, path.basename(PDF_PATH));

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const items = data.results?.itens || [];
        const fullText = data.corpo_integrado?.textoCompleto || "NÃO RETORNADO";

        console.log('\n================ RESULTADO DA EXTRAÇÃO ================');
        console.log(`📦 Itens Detectados: ${items.length}`);

        if (items.length > 0) {
            console.log('\n🔍 Primeiros 5 Itens:');
            items.slice(0, 5).forEach(item => {
                console.log(`   [${item.item_numero}] ${item.descricao.substring(0, 80)}...`);
                console.log(`       Qtd: ${item.quantidade} | Unid: ${item.unidade} | Cat: ${item.classificacao}`);
            });
        } else {
            console.log('⚠️ NENHUM ITEM DETECTADO.');
        }

        console.log('\n================ DEBUG DE TEXTO (AMOSTRA) ================');
        console.log('O texto abaixo é o que o Agente 3 "enxerga". Verifique se há quebras de linha.');
        console.log('-----------------------------------------------------------');
        console.log(fullText.substring(0, 1000));
        console.log('-----------------------------------------------------------');

    } catch (error) {
        console.error('❌ Falha no teste:', error.message);
    }
}

runTest();
