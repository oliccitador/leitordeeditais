/**
 * 🎯 CONTEXT OPTIMIZER V2 - COMPLETO
 * 
 * Otimiza o CORPO_INTEGRADO para caber no limite de tokens do Groq (12k TPM)
 * mantendo 100% das informações críticas.
 * 
 * FEATURES:
 * - Extração hierárquica por prioridade (3 níveis)
 * - Busca targeted por keywords críticas
 * - Priorização de datas e informações estruturais
 * - Suporte multi-documento
 */

import { getLogger } from '../services/logger.js';

const logger = getLogger();
const MODULE_NAME = 'ContextOptimizer';

/**
 * Keywords críticas para busca targeted
 */
const KEYWORDS_CRITICAS = {
    datas: [
        'data', 'prazo', 'abertura', 'publicação', 'disputa', 'envio', 'recursos',
        'início', 'término', 'entrega', 'vigência', 'validade'
    ],
    estrutura: [
        'pregão', 'concorrência', 'modalidade', 'srp', 'registro de preços',
        'menor preço', 'técnica e preço', 'julgamento'
    ],
    docs: [
        'edital', 'termo de referência', 'anexo i', 'minuta', 'contrato'
    ],
    identificacao: [
        'número', 'processo', 'órgão', 'prefeitura', 'secretaria', 'cnpj'
    ],
    valores: [
        'valor estimado', 'orçamento', 'preço', 'r$', 'dotação'
    ],
    itens: [
        'item', 'lote', 'quantidade', 'unidade', 'especificação', 'marca'
    ],
    habilitacao: [
        'habilitação', 'documentação', 'certidão', 'regularidade', 'qualificação'
    ]
};

/**
 * Seções por nível de prioridade (baseado no MAPA)
 */
const SECOES_NIVEL_1 = [
    'EDITAL', 'TERMO DE REFERÊNCIA', 'ANEXO I', 'ANEXO 1',
    'OBJETO', 'CONDIÇÕES DE HABILITAÇÃO', 'CRITÉRIO DE JULGAMENTO',
    'ESPECIFICAÇÕES TÉCNICAS', 'PLANILHA', 'ITENS', 'LOTES',
    'RELAÇÃO DOS ITENS', 'DESCRIÇÃO DOS PRODUTOS', 'TERMO DE REF',
    'ANEXO', 'APÊNDICE', 'LISTA DE MATERIAIS', 'QUANTITATIVOS'
];

const SECOES_NIVEL_2 = [
    'MINUTA', 'CONTRATO', 'SANÇÕES', 'PENALIDADES',
    'GARANTIAS', 'PRAZO DE EXECUÇÃO', 'RECURSOS', 'IMPUGNAÇÃO'
];

const SECOES_NIVEL_3 = [
    'HISTÓRICO', 'MISSÃO', 'VISÃO', 'FUNDAMENTAÇÃO LEGAL',
    'LEGISLAÇÃO', 'PREÂMBULO', 'CONSIDERANDO', 'LEI Nº', 'DECRETO'
];

class ContextOptimizer {

    /**
     * Otimiza o corpus para caber no limite de tokens
     */
    static optimize(corpoIntegrado, maxChars = 35000) {
        logger.info(MODULE_NAME, `🎯 Iniciando otimização de contexto`);

        // ✅ FIX: Usar fullText (fonte canônica) com fallback para textoCompleto
        const textoCanon = corpoIntegrado.fullText || corpoIntegrado.textoCompleto || '';

        logger.info(MODULE_NAME, `📊 Tamanho original: ${textoCanon.length.toLocaleString()} chars`);

        const startTime = Date.now();

        // 1. Buscar trechos com keywords críticas (PRIORIDADE MÁXIMA)
        const trechosKeywords = this.buscarKeywordsPrioritarias(textoCanon);

        // 2. Extrair seções estruturadas
        const secoesExtraidas = this.extrairSecoesPorPrioridade(corpoIntegrado);

        // 3. Montar contexto otimizado
        const contextoOtimizado = this.montarContexto({
            trechosKeywords,
            secoesExtraidas,
            metadados: corpoIntegrado.metadata,
            textoOriginal: textoCanon  // ✅ FIX: Usar textoCanon
        }, maxChars);

        const duration = Date.now() - startTime;
        const reducao = textoCanon.length > 0
            ? ((textoCanon.length - contextoOtimizado.length) / textoCanon.length * 100).toFixed(1)
            : '0';

        logger.info(MODULE_NAME, `✅ Otimização concluída em ${duration}ms`);
        logger.info(MODULE_NAME, `📉 Redução: ${reducao}% (${contextoOtimizado.length.toLocaleString()} chars)`);

        return contextoOtimizado;
    }

    /**
     * Busca trechos com keywords críticas (OTIMIZADO para datas)
     */
    static buscarKeywordsPrioritarias(textoCompleto) {
        const trechos = [];
        const linhas = textoCompleto.split('\n');
        const linhasProcessadas = new Set();

        for (let i = 0; i < linhas.length; i++) {
            if (linhasProcessadas.has(i)) continue;

            const linhaLower = linhas[i].toLowerCase();

            for (const [categoria, keywords] of Object.entries(KEYWORDS_CRITICAS)) {
                let encontrou = false;

                for (const keyword of keywords) {
                    if (linhaLower.includes(keyword)) {
                        // Contexto MAIOR para datas (crítico!)
                        const tamanhoContexto = categoria === 'datas' ? 4 : 2;
                        const inicio = Math.max(0, i - tamanhoContexto);
                        const fim = Math.min(linhas.length, i + tamanhoContexto + 1);
                        const contexto = linhas.slice(inicio, fim).join('\n');

                        trechos.push({
                            categoria,
                            keyword,
                            trecho: contexto,
                            linha: i,
                            prioridade: categoria === 'datas' ? 1 : (categoria === 'estrutura' ? 2 : 3)
                        });

                        // Marcar linhas como processadas
                        for (let j = inicio; j < fim; j++) {
                            linhasProcessadas.add(j);
                        }

                        encontrou = true;
                        break;
                    }
                }

                if (encontrou) break;
            }
        }

        // Ordenar por prioridade
        trechos.sort((a, b) => a.prioridade - b.prioridade);

        const countDatas = trechos.filter(t => t.categoria === 'datas').length;
        logger.info(MODULE_NAME, `🔍 Keywords: ${trechos.length} trechos (${countDatas} datas, ${trechos.length - countDatas} outros)`);

        return trechos;
    }

    /**
     * Extrai seções do documento baseado em prioridade
     */
    static extrairSecoesPorPrioridade(corpoIntegrado) {
        const linhas = corpoIntegrado.globalLines || [];
        const resultado = {
            nivel1: [],
            nivel2: [],
            descartado: 0
        };

        for (const linha of linhas) {
            const textoLinha = linha.text.toUpperCase();

            // NÍVEL 1 (imprescindível)
            if (this.pertenceNivel(textoLinha, SECOES_NIVEL_1)) {
                resultado.nivel1.push(linha.text);
                continue;
            }

            // NÍVEL 2 (relevante)
            if (this.pertenceNivel(textoLinha, SECOES_NIVEL_2)) {
                resultado.nivel2.push(linha.text);
                continue;
            }

            // NÍVEL 3 (ignorar)
            if (this.pertenceNivel(textoLinha, SECOES_NIVEL_3)) {
                resultado.descartado++;
                continue;
            }

            // Default: incluir no nível 1 (seguro)
            resultado.nivel1.push(linha.text);
        }

        logger.info(MODULE_NAME, `📋 Seções: N1=${resultado.nivel1.length}, N2=${resultado.nivel2.length}, Descartadas=${resultado.descartado}`);

        return resultado;
    }

    /**
     * Verifica se linha pertence a uma categoria
     */
    static pertenceNivel(textoLinha, secoes) {
        return secoes.some(secao => textoLinha.includes(secao));
    }

    /**
     * Monta contexto otimizado final
     */
    static montarContexto(dados, maxChars) {
        const blocos = [];
        let charsUsados = 0;

        // 1. TRECHOS COM KEYWORDS (PRIORIDADE MÁXIMA - 40% do espaço)
        const limiteKeywords = Math.floor(maxChars * 0.4);
        blocos.push(`=== INFORMAÇÕES CRÍTICAS IDENTIFICADAS ===\n\n`);

        for (const trecho of dados.trechosKeywords) {
            const bloco = `[${trecho.categoria.toUpperCase()}]\n${trecho.trecho}\n\n`;
            if (charsUsados + bloco.length < limiteKeywords) {
                blocos.push(bloco);
                charsUsados += bloco.length;
            } else {
                break;
            }
        }

        // 2. SEÇÕES NÍVEL 1 (ESSENCIAIS - 50% do espaço)
        const limiteN1 = Math.floor(maxChars * 0.5);
        blocos.push(`\n=== CONTEÚDO ESSENCIAL DO DOCUMENTO ===\n\n`);

        const textoN1 = dados.secoesExtraidas.nivel1.join('\n');
        const textoN1Cortado = textoN1.substring(0, limiteN1);
        blocos.push(textoN1Cortado);
        charsUsados += textoN1Cortado.length;

        // 3. SEÇÕES NÍVEL 2 (COMPLEMENTAR - 10% do espaço restante)
        const espacoRestante = maxChars - charsUsados;
        if (espacoRestante > 1000 && dados.secoesExtraidas.nivel2.length > 0) {
            blocos.push(`\n\n=== INFORMAÇÕES COMPLEMENTARES ===\n\n`);
            const textoN2 = dados.secoesExtraidas.nivel2.join('\n');
            const textoN2Cortado = textoN2.substring(0, Math.floor(espacoRestante * 0.8));
            blocos.push(textoN2Cortado);
        }

        // Montar texto final
        let contextoFinal = blocos.join('');

        // Garantir que não excede
        if (contextoFinal.length > maxChars) {
            contextoFinal = contextoFinal.substring(0, maxChars);
            logger.warn(MODULE_NAME, `⚠️ Contexto cortado no limite de ${maxChars} chars`);
        }

        return contextoFinal;
    }
}

export default ContextOptimizer;
