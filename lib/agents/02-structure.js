/**
 * 📊 AGENTE 2 - STRUCTURE MAPPER (GEMINI 2.5 FLASH)
 * 
 * Responsável por:
 * - Extrair metadados do certame do CORPO_INTEGRADO
 * - Detectar modalidade, tipo de julgamento, SRP, órgão, nº processo/edital
 * - Identificar datas críticas, plataforma
 * - Mapear seções detectadas
 * - TODAS informações com origem (doc/página/trecho) ou 'SEM DADOS NO ARQUIVO'
 * 
 * ENTRADA: CORPO_INTEGRADO canônico
 * SAÍDA: Estrutura completa com rastreabilidade total
 * 
 * IA: Google Gemini 2.5 Flash (mesma chave do Agente 3)
 */

import { getLogger } from '../services/logger.js';
import {
    validateNotEmpty,
    validateModalidade,
    validateData,
    validateNumeroProcesso,
} from '../services/validation.js';
import { MODALIDADES } from '../utils/legal-base.js';

const logger = getLogger();
const AGENTE_NOME = 'StructureMapper';

class StructureMapper {
    constructor() {
        // Usa a MESMA chave do Agente 3
        this.apiKey = process.env.GEMINI_FLASH_KEY || process.env.GEMINI_API_KEY;

        if (!this.apiKey) {
            logger.warn(AGENTE_NOME, 'GEMINI_FLASH_KEY não encontrada. Agente falhará se invocado.');
        }
    }

    /**
     * Processa CORPO_INTEGRADO e extrai estrutura completa
     */
    async process(corpoIntegrado) {
        try {
            logger.startAgent(AGENTE_NOME);
            logger.info(AGENTE_NOME, 'Extraindo estrutura do CORPO_INTEGRADO');

            // ✅ FIX: Usar fullText (fonte canônica) com fallback para textoCompleto
            const textoCanon = corpoIntegrado?.fullText || corpoIntegrado?.textoCompleto;

            if (!corpoIntegrado || !textoCanon) {
                throw new Error('CORPO_INTEGRADO inválido ou vazio');
            }

            // ✅ FIX: Assegurar que textoCompleto existe para compatibilidade
            if (!corpoIntegrado.textoCompleto) {
                corpoIntegrado.textoCompleto = textoCanon;
            }

            logger.info(
                AGENTE_NOME,
                `Analisando corpus: ${corpoIntegrado.globalLines.length} linhas, ` +
                `${corpoIntegrado.segments.length} documentos`
            );

            // Extrai estrutura usando OpenAI
            const structure = await this.extractStructure(corpoIntegrado);

            // Adiciona seções já detectadas pelo Pipeline
            structure.secoesDetectadas = this.extractPreDetectedSections(corpoIntegrado);

            logger.info(
                AGENTE_NOME,
                `Estrutura extraída: ${structure.modalidade} - ${structure.numeroProcesso}`
            );

            const endTime = Date.now();
            const startTime = logger.getStats()?.agents?.[AGENTE_NOME]?.startTime || endTime;

            // Envelope padrão DEV DOC 3/8
            return {
                agent_id: 'AGENT_02',
                status: 'ok',
                timestamp: new Date().toISOString(),
                dados: structure,
                alerts: [],
                evidence: this.buildEvidence(structure),
                metadata: {
                    run_ms: endTime - startTime,
                    items_found: structure.secoesDetectadas?.length || 0,
                    sections_hit: ['ESTRUTURA', 'METADADOS'],
                    confidence: 0.85
                },
                quality_flags: {
                    needs_review: structure.modalidade === 'SEM DADOS NO ARQUIVO',
                    low_ocr_quality: false,
                    missing_sections: []
                }
            };

        } catch (error) {
            logger.error(AGENTE_NOME, 'Erro ao extrair estrutura', { error: error.message });

            // 🔍 DEBUG: Salvar erro no arquivo de log (compatível ESM)
            import('fs').then(fsModule => {
                import('path').then(pathModule => {
                    const fsLib = fsModule.default || fsModule;
                    const pathLib = pathModule.default || pathModule;
                    const logPath = pathLib.join(process.cwd(), 'debug-ocr-pipeline.log');
                    const logLine = `[AGENT02-ERROR] ${JSON.stringify({ error: error.message, stack: error.stack?.substring(0, 500) })}\n`;
                    try {
                        fsLib.appendFileSync(logPath, logLine);
                    } catch (e) { /* ignore */ }
                });
            });

            return {
                agente: AGENTE_NOME,
                status: 'erro',
                timestamp: new Date().toISOString(),
                dados: this.createEmptyStructure(),
                erro: error.message,
                origem: {
                    documento: 'SISTEMA',
                    pagina: 0,
                    trecho: 'Erro na execução',
                },
            };
        }
    }

    /**
     * Extrai estrutura do CORPO_INTEGRADO usando Gemini 2.5 Flash
     */
    async extractStructure(corpoIntegrado) {
        // 🎯 OTIMIZAÇÃO INTELIGENTE DE CONTEXTO
        const maxChars = 15000;

        const textoLen = corpoIntegrado.textoCompleto?.length || 0;
        logger.info(AGENTE_NOME, `📊 Otimizando contexto: ${textoLen.toLocaleString()} → ${maxChars.toLocaleString()} chars`);

        // Importar ContextOptimizer dinamicamente
        const { default: ContextOptimizer } = await import('../pipeline/10-contextOptimizer.js');

        // Otimizar contexto mantendo informações críticas
        const textoParaAnalise = ContextOptimizer.optimize(corpoIntegrado, maxChars);

        const prompt = this.buildStructurePrompt(textoParaAnalise, corpoIntegrado);

        logger.info(AGENTE_NOME, '🤖 Chamando Gemini 2.5 Flash para extração estrutural');

        // Chamada via fetch direto (igual ao Agente 3)
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;

        const systemPrompt = 'Você é um especialista em análise de editais de licitações públicas brasileiras. Sua tarefa é extrair informações estruturadas com precisão absoluta. Retorne APENAS JSON.';

        const fullPrompt = `${systemPrompt}\n\n${prompt}`;

        const body = {
            contents: [{
                parts: [{
                    text: fullPrompt
                }]
            }]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const responseText = data.candidates[0].content.parts[0].text;

        logger.debug(AGENTE_NOME, 'Resposta Gemini recebida', { length: responseText.length });

        // 🔍 DEBUG: Mostrar resposta bruta do modelo
        console.log('\n🔍 ========== DEBUG GEMINI RESPONSE (AGENT 2) ==========');
        console.log('Primeiros 500 caracteres da resposta:');
        console.log(responseText.substring(0, 500));
        console.log('Últimos 200 caracteres da resposta:');
        console.log(responseText.substring(responseText.length - 200));
        console.log('==========================================\n');

        // 🔍 DEBUG: Salvar resposta em arquivo
        try {
            const fs = await import('fs');
            const path = await import('path');
            fs.appendFileSync(
                path.join(process.cwd(), 'debug-agent2-response.log'),
                `[${new Date().toISOString()}] RESP:\n${responseText}\n-------------------\n`
            );
        } catch (e) { /* ignore */ }

        // Parse JSON da resposta
        const extracted = this.parseStructureResponse(responseText);

        // 🔍 DEBUG: Mostrar objeto parseado
        console.log('\n🔍 ========== OBJETO PARSEADO ==========');
        console.log(JSON.stringify(extracted, null, 2).substring(0, 1000));
        console.log('=======================================\n');

        // Valida, normaliza e adiciona origens rastreáveis
        const structure = this.validateAndNormalize(extracted, corpoIntegrado);

        return structure;
    }

    /**
     * Constrói prompt otimizado para OpenAI
     */
    buildStructurePrompt(textoTruncado, corpoIntegrado) {
        return `Extraia TODAS as informações estruturais do edital/licitação abaixo.

REGRAS ABSOLUTAS:
1. NUNCA invente informações que não estejam no texto
2. Se não encontrar uma informação, retorne "SEM DADOS NO ARQUIVO"
3. Para CADA campo, forneça a origem com página e trecho literal
4. Retorne APENAS JSON válido
5. Use trechos literais de até 150 caracteres para rastreabilidade

INFORMAÇÕES OBRIGATÓRIAS:

**Metadados Básicos:**
- modalidade: pregão eletrônico | pregão presencial | concorrência | tomada de preços | convite | concurso | leilão | diálogo competitivo | dispensa de licitação | inexigibilidade
- tipoJulgamento: menor preço | melhor técnica | técnica e preço
- srp: true | false (Sistema de Registro de Preços)
- orgao: nome completo do órgão licitante
- numeroProcesso: número do processo administrativo interno ou protocolo. ATENÇÃO: NÃO CONFUNDIR COM NÚMERO DO EDITAL. Busque por "Processo", "PA", "Protocolo". (Ex: "047/2025", "PA 123/2025")
- numeroEdital: número público do edital/pregão. (Ex: "PE 042/2025", "Edital 10/2025", "042/2025")
- plataforma: comprasnet | licitanet | bec | portal | presencial | outra

**Datas Críticas:**
- dataPublicacao: data de publicação do edital
- dataAbertura: data/hora de abertura da sessão
- dataEnvioPropostas: data limite para envio de propostas
- dataInicioDisputa: data/hora início da disputa de lances
- dataRecursos: data limite para recursos

**Outras Informações:**
- objetoResumido: descrição curta (max 200 chars)
- valorEstimado: valor total estimado (se informado)

FORMATO DE SAÍDA (JSON - OBRIGATÓRIO incluir origens para TUDO):
{
  "modalidade": "string",
  "tipoJulgamento": "string",
  "srp": boolean,
  "orgao": "string",
  "numeroProcesso": "string",
  "numeroEdital": "string",
  "plataforma": "string",
  "objetoResumido": "string",
  "valorEstimado": "string ou null",
  "datas": {
    "publicacao": "ISO date ou null",
    "abertura": "ISO date ou null",
    "envioPropostas": "ISO date ou null",
    "inicioDisputa": "ISO date ou null",
    "recursos": "ISO date ou null"
  },
  "origens": {
    "modalidade": { "pagina": 1, "trecho": "trecho literal de até 150 chars" },
    "tipoJulgamento": { "pagina": 1, "trecho": "..." },
    "srp": { "pagina": 1, "trecho": "..." },
    "orgao": { "pagina": 1, "trecho": "..." },
    "numeroProcesso": { "pagina": 1, "trecho": "..." },
    "numeroEdital": { "pagina": 1, "trecho": "..." },
    "plataforma": { "pagina": 1, "trecho": "..." },
    "objetoResumido": { "pagina": 1, "trecho": "..." },
    "valorEstimado": { "pagina": 1, "trecho": "..." },
    "datas": {
      "publicacao": { "pagina": 1, "trecho": "..." },
      "abertura": { "pagina": 1, "trecho": "..." }
    }
  }
}

CONTEXTO DO CORPUS:
- Total de documentos: ${corpoIntegrado.segments.length}
- Total de linhas: ${corpoIntegrado.globalLines.length}
- Total de páginas: ${corpoIntegrado.metadata.totalPages}

TEXTO DO EDITAL (primeiros ~30k caracteres):
${textoTruncado}`;
    }

    /**
     * Parse da resposta JSON do Gemini (com limpeza de markdown)
     */
    parseStructureResponse(response) {
        try {
            // Limpar markdown se vier (igual ao Agente 3)
            let cleanContent = response.trim();

            if (cleanContent.startsWith('```')) {
                cleanContent = cleanContent.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
            }

            const parsed = JSON.parse(cleanContent);
            return parsed;

        } catch (error) {
            logger.error(
                AGENTE_NOME,
                'Erro ao parsear resposta JSON',
                { error: error.message, response: response.substring(0, 500) }
            );

            return this.createEmptyExtraction();
        }
    }

    /**
     * Valida e normaliza estrutura extraída com origens rastreáveis
     */
    validateAndNormalize(extracted, corpoIntegrado) {
        const structure = {};

        // Encontra documento principal (edital)
        const docPrincipal = corpoIntegrado.segments.find(s => s.documentType === 'edital') ||
            corpoIntegrado.segments[0];

        // Função helper para buscar trecho no corpus e retornar origem
        const findOrigin = (campo, valorExtraido, origemGemini) => {
            if (!valorExtraido || valorExtraido === 'SEM DADOS NO ARQUIVO') {
                return {
                    documento: 'SEM DADOS NO ARQUIVO',
                    pagina: 0,
                    trecho: 'SEM DADOS NO ARQUIVO'
                };
            }

            // Se OpenAI forneceu origem, valida e usa
            if (origemGemini && origemGemini.trecho && origemGemini.pagina) {
                return {
                    documento: docPrincipal.documentName,
                    pagina: origemGemini.pagina,
                    trecho: origemGemini.trecho.substring(0, 150)
                };
            }

            // Busca trecho no texto
            const trechoIndex = corpoIntegrado.textoCompleto.toLowerCase().indexOf(
                valorExtraido.toLowerCase().substring(0, 50)
            );

            if (trechoIndex >= 0) {
                // Encontra linha correspondente
                const linha = corpoIntegrado.globalLines.find(l =>
                    l.charStart <= trechoIndex && l.charEnd >= trechoIndex
                );

                if (linha) {
                    return {
                        documento: linha.sourceDocName,
                        pagina: linha.sourcePage,
                        trecho: linha.text.substring(0, 150)
                    };
                }
            }

            // Fallback: primeira linha do documento principal
            return {
                documento: docPrincipal.documentName,
                pagina: 1,
                trecho: corpoIntegrado.textoCompleto.substring(0, 150)
            };
        };

        // MODALIDADE
        structure.modalidade = extracted.modalidade || 'SEM DADOS NO ARQUIVO';
        if (structure.modalidade !== 'SEM DADOS NO ARQUIVO') {
            // ✅ FIX: Normalizar removendo acentos também
            const modalidadeNorm = structure.modalidade
                .toLowerCase()
                .replace(/\s+/g, '-')
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '');  // Remove acentos

            structure.modalidade = MODALIDADES.hasOwnProperty(modalidadeNorm)
                ? modalidadeNorm
                : 'SEM DADOS NO ARQUIVO';
        }

        // TIPO DE JULGAMENTO
        structure.tipoJulgamento = extracted.tipoJulgamento || 'SEM DADOS NO ARQUIVO';

        // SRP
        structure.srp = extracted.srp === true || extracted.srp === 'true';

        // ÓRGÃO
        structure.orgao = extracted.orgao || 'SEM DADOS NO ARQUIVO';

        // NÚMERO DO PROCESSO
        structure.numeroProcesso = extracted.numeroProcesso || 'SEM DADOS NO ARQUIVO';

        // NÚMERO DO EDITAL
        structure.numeroEdital = extracted.numeroEdital || 'SEM DADOS NO ARQUIVO';

        // PLATAFORMA
        structure.plataforma = extracted.plataforma || 'SEM DADOS NO ARQUIVO';

        // OBJETO RESUMIDO
        structure.objetoResumido = extracted.objetoResumido || 'SEM DADOS NO ARQUIVO';

        // VALOR ESTIMADO
        structure.valorEstimado = extracted.valorEstimado || null;

        // DATAS CRÍTICAS
        structure.datas = {
            publicacao: validateData(extracted.datas?.publicacao, 'publicacao', AGENTE_NOME),
            abertura: validateData(extracted.datas?.abertura, 'abertura', AGENTE_NOME),
            envioPropostas: validateData(extracted.datas?.envioPropostas, 'envioPropostas', AGENTE_NOME),
            inicioDisputa: validateData(extracted.datas?.inicioDisputa, 'inicioDisputa', AGENTE_NOME),
            recursos: validateData(extracted.datas?.recursos, 'recursos', AGENTE_NOME),
        };

        // ORIGENS RASTREÁVEIS (campo por campo)
        structure.origens = {
            modalidade: findOrigin('modalidade', structure.modalidade, extracted.origens?.modalidade),
            tipoJulgamento: findOrigin('tipoJulgamento', structure.tipoJulgamento, extracted.origens?.tipoJulgamento),
            srp: findOrigin('srp', structure.srp ? 'SRP' : 'não SRP', extracted.origens?.srp),
            orgao: findOrigin('orgao', structure.orgao, extracted.origens?.orgao),
            numeroProcesso: findOrigin('numeroProcesso', structure.numeroProcesso, extracted.origens?.numeroProcesso),
            numeroEdital: findOrigin('numeroEdital', structure.numeroEdital, extracted.origens?.numeroEdital),
            plataforma: findOrigin('plataforma', structure.plataforma, extracted.origens?.plataforma),
            objetoResumido: findOrigin('objetoResumido', structure.objetoResumido, extracted.origens?.objetoResumido),
            valorEstimado: findOrigin('valorEstimado', structure.valorEstimado, extracted.origens?.valorEstimado),
            datas: {
                publicacao: extracted.origens?.datas?.publicacao || { pagina: 0, trecho: 'SEM DADOS NO ARQUIVO' },
                abertura: extracted.origens?.datas?.abertura || { pagina: 0, trecho: 'SEM DADOS NO ARQUIVO' },
            },
            geral: {
                documento: docPrincipal.documentName,
                pagina: 1,
                trecho: corpoIntegrado.textoCompleto.substring(0, 200)
            }
        };

        return structure;
    }

    /**
     * Extrai seções já detectadas pelo Pipeline
     */
    extractPreDetectedSections(corpoIntegrado) {
        const sections = [];

        for (const segment of corpoIntegrado.segments) {
            const structures = segment.structures || {};

            // Capítulos
            if (structures.chapters) {
                structures.chapters.forEach(chapter => {
                    sections.push({
                        tipo: 'capitulo',
                        numero: chapter.number || '',
                        titulo: chapter.title || '',
                        nivel: chapter.level || 1,
                        globalLineStart: chapter.globalLineStart,
                        documento: segment.documentName
                    });
                });
            }

            // Seções
            if (structures.sections) {
                structures.sections.forEach(section => {
                    sections.push({
                        tipo: 'secao',
                        numero: section.number || '',
                        titulo: section.title || '',
                        nivel: section.level || 2,
                        globalLineStart: section.globalLineStart,
                        documento: segment.documentName
                    });
                });
            }

            // Artigos
            if (structures.articles) {
                structures.articles.forEach(article => {
                    sections.push({
                        tipo: 'artigo',
                        numero: article.number || '',
                        titulo: article.title || '',
                        nivel: article.level || 3,
                        globalLineStart: article.globalLineStart,
                        documento: segment.documentName
                    });
                });
            }
        }

        return sections.sort((a, b) => a.globalLineStart - b.globalLineStart);
    }

    /**
     * Cria estrutura vazia padrão
     */
    createEmptyStructure() {
        return {
            modalidade: 'SEM DADOS NO ARQUIVO',
            tipoJulgamento: 'SEM DADOS NO ARQUIVO',
            srp: false,
            orgao: 'SEM DADOS NO ARQUIVO',
            numeroProcesso: 'SEM DADOS NO ARQUIVO',
            numeroEdital: 'SEM DADOS NO ARQUIVO',
            plataforma: 'SEM DADOS NO ARQUIVO',
            objetoResumido: 'SEM DADOS NO ARQUIVO',
            valorEstimado: null,
            datas: {
                publicacao: null,
                abertura: null,
                envioPropostas: null,
                inicioDisputa: null,
                recursos: null,
            },
            secoesDetectadas: [],
            origens: {
                modalidade: { documento: 'SEM DADOS NO ARQUIVO', pagina: 0, trecho: 'SEM DADOS NO ARQUIVO' },
                tipoJulgamento: { documento: 'SEM DADOS NO ARQUIVO', pagina: 0, trecho: 'SEM DADOS NO ARQUIVO' },
                srp: { documento: 'SEM DADOS NO ARQUIVO', pagina: 0, trecho: 'SEM DADOS NO ARQUIVO' },
                orgao: { documento: 'SEM DADOS NO ARQUIVO', pagina: 0, trecho: 'SEM DADOS NO ARQUIVO' },
                numeroProcesso: { documento: 'SEM DADOS NO ARQUIVO', pagina: 0, trecho: 'SEM DADOS NO ARQUIVO' },
                numeroEdital: { documento: 'SEM DADOS NO ARQUIVO', pagina: 0, trecho: 'SEM DADOS NO ARQUIVO' },
                plataforma: { documento: 'SEM DADOS NO ARQUIVO', pagina: 0, trecho: 'SEM DADOS NO ARQUIVO' },
                objetoResumido: { documento: 'SEM DADOS NO ARQUIVO', pagina: 0, trecho: 'SEM DADOS NO ARQUIVO' },
                valorEstimado: { documento: 'SEM DADOS NO ARQUIVO', pagina: 0, trecho: 'SEM DADOS NO ARQUIVO' },
                datas: {
                    publicacao: { pagina: 0, trecho: 'SEM DADOS NO ARQUIVO' },
                    abertura: { pagina: 0, trecho: 'SEM DADOS NO ARQUIVO' },
                },
                geral: { documento: 'SEM DADOS NO ARQUIVO', pagina: 0, trecho: 'SEM DADOS NO ARQUIVO' }
            }
        };
    }

    /**
     * Cria objeto vazio de extração
     */
    createEmptyExtraction() {
        return {
            modalidade: 'SEM DADOS NO ARQUIVO',
            tipoJulgamento: 'SEM DADOS NO ARQUIVO',
            srp: false,
            orgao: 'SEM DADOS NO ARQUIVO',
            numeroProcesso: 'SEM DADOS NO ARQUIVO',
            numeroEdital: 'SEM DADOS NO ARQUIVO',
            plataforma: 'SEM DADOS NO ARQUIVO',
            objetoResumido: 'SEM DADOS NO ARQUIVO',
            valorEstimado: null,
            datas: {},
            origens: {}
        };
    }

    /**
     * Constrói array de evidências para o envelope padrão
     */
    buildEvidence(structure) {
        const evidence = [];

        if (structure.origens) {
            // Modalidade
            if (structure.origens.modalidade && structure.origens.modalidade.documento !== 'SEM DADOS NO ARQUIVO') {
                evidence.push({
                    field: 'modalidade',
                    documento: structure.origens.modalidade.documento,
                    doc_id: 'unknown',
                    doc_type: 'nucleo_certame',
                    pagina: structure.origens.modalidade.pagina,
                    line_range: [],
                    char_range: [],
                    segment_hash: 'unknown',
                    trecho_literal: structure.origens.modalidade.trecho?.substring(0, 200) || '',
                    confidence: 0.85,
                    notes: 'Extraído via OpenAI GPT-4'
                });
            }

            // Órgão
            if (structure.origens.orgao && structure.origens.orgao.documento !== 'SEM DADOS NO ARQUIVO') {
                evidence.push({
                    field: 'orgao',
                    documento: structure.origens.orgao.documento,
                    doc_id: 'unknown',
                    doc_type: 'nucleo_certame',
                    pagina: structure.origens.orgao.pagina,
                    line_range: [],
                    char_range: [],
                    segment_hash: 'unknown',
                    trecho_literal: structure.origens.orgao.trecho?.substring(0, 200) || '',
                    confidence: 0.9,
                    notes: 'Extraído via OpenAI GPT-4'
                });
            }
        }

        return evidence;
    }
}

export default StructureMapper;
