/**
 * 🎯 ORQUESTRADOR DO PIPELINE - LICITADOR BLINDADO
 * 
 * Coordena as 9 etapas do pipeline para gerar CORPO_INTEGRADO canônico:
 * 
 * 1. Upload Layer
 * 2. Document Classifier
 * 3. OCR Engine
 * 4. Text Normalizer
 * 5. Index Builder
 * 6. Deduplicator
 * 7. Document Fusion ⭐ (CORPO_INTEGRADO)
 * 8. Structured Extractor
 * 9. Pipeline Validator
 */

import { randomUUID } from 'crypto';
import { getLogger } from '../services/logger.js';

// Importa todas as etapas
import UploadLayer from './01-uploadLayer.js';
import DocumentClassifier from './02-documentClassifier.js';
import OCREngine from './03-ocrEngine.js';
import TextNormalizer from './04-textNormalizer.js';
import IndexBuilder from './05-indexBuilder.js';
import Deduplicator from './06-deduplicator.js';
import DocumentFusion from './07-documentFusion.js';
import StructuredExtractor from './08-structuredExtractor.js';
import PipelineValidator from './09-pipelineValidator.js';

const logger = getLogger();
const PIPELINE_NAME = 'Pipeline';

class Pipeline {
    constructor() {
        this.uploadLayer = new UploadLayer();
        this.documentClassifier = new DocumentClassifier();
        this.ocrEngine = new OCREngine();
        this.textNormalizer = new TextNormalizer();
        this.indexBuilder = new IndexBuilder();
        this.deduplicator = new Deduplicator();
        this.documentFusion = new DocumentFusion();
        this.structuredExtractor = new StructuredExtractor();
        this.pipelineValidator = new PipelineValidator();
    }

    /**
     * Executa pipeline completo
     * Retorna CORPO_INTEGRADO + validação
     */
    async execute(files) {
        const pipelineId = randomUUID();
        const startTime = Date.now();

        try {
            logger.info(PIPELINE_NAME, `🚀 Iniciando pipeline ${pipelineId}`);

            // ETAPA 1: Upload Layer
            logger.info(PIPELINE_NAME, '▶️ [1/9] Upload Layer');
            const uploadResult = await this.uploadLayer.process(files);
            const loteId = uploadResult.loteId;

            // ETAPA 2: Document Classifier
            logger.info(PIPELINE_NAME, '▶️ [2/9] Document Classifier');
            const classificationResults = [];

            for (const fileMetadata of uploadResult.files) {
                // Precisa de texto para classificar - faz OCR rápido primeiro
                const quickOCR = await this.ocrEngine.process(fileMetadata);
                const text = quickOCR.fullTextRaw || '';

                const classification = await this.documentClassifier.classify(
                    text,
                    fileMetadata.originalFilename
                );

                classificationResults.push({
                    documentId: fileMetadata.documentId,
                    ...classification
                });

                // Armazena OCR result no metadata para usar depois
                fileMetadata.ocrResult = quickOCR;

                // 🔍 DEBUG: Verificar se pdfjs foi aplicado
                const primeiraLinha = quickOCR.pages?.[0]?.lines?.[0] || 'VAZIA';
                logger.info(PIPELINE_NAME, `[DEBUG] Primeira linha após OCR: ${primeiraLinha.substring(0, 100)}...`);
            }

            // ETAPA 3: OCR Engine (já foi feito na etapa 2)
            logger.info(PIPELINE_NAME, '▶️ [3/9] OCR Engine (concluído)');
            const ocrResults = uploadResult.files.map(f => f.ocrResult);

            // ETAPA 4: Text Normalizer
            logger.info(PIPELINE_NAME, '▶️ [4/9] Text Normalizer');
            const normalizedDocs = [];

            for (const ocrResult of ocrResults) {
                const normalized = await this.textNormalizer.normalize(ocrResult);
                normalizedDocs.push(normalized);
            }

            // ETAPA 5: Index Builder
            logger.info(PIPELINE_NAME, '▶️ [5/9] Index Builder');
            const indexedDocs = [];

            // 🔧 FIX: Importar carryForwardOCR
            const { carryForwardOCR } = await import('../utils/carryForwardOCR.js');

            for (const normalizedDoc of normalizedDocs) {
                const indexed = await this.indexBuilder.build(normalizedDoc);

                // Merge com dados anteriores
                const fileMetadata = uploadResult.files.find(f => f.documentId === normalizedDoc.documentId);
                const classification = classificationResults.find(c => c.documentId === normalizedDoc.documentId);

                // 🔧 FIX: Usar carryForwardOCR para preservar ocrQualityAvg
                // ANTES (BUG): metadata: fileMetadata sobrescrevia indexed.metadata.ocrQualityAvg
                const mergedDoc = carryForwardOCR(indexed, {
                    documentType: classification?.type || 'outros',
                    classificationConfidence: classification?.confidence || 0.5,
                    metadata: {
                        // 🔒 ORDEM BLINDADA: indexed primeiro, fileMetadata depois
                        ...(indexed.metadata || {}),
                        ...fileMetadata,
                        // 🔒 TRAVA O VALOR DO OCR (fonte de verdade - não depende de spread)
                        ocrQualityAvg: indexed.metadata?.ocrQualityAvg ?? indexed.ocrQualityAvg ?? null
                    }
                });

                indexedDocs.push(mergedDoc);
            }

            // ETAPA 6: Deduplicator
            logger.info(PIPELINE_NAME, '▶️ [6/9] Deduplicator');
            const deduplicationResult = await this.deduplicator.deduplicate(indexedDocs);
            const uniqueDocs = deduplicationResult.uniqueDocs;

            // 🔍 DEBUG: Log PRE-FUSION (ponto crítico - rastrear stripper)
            const fs = await import('fs');
            const path = await import('path');
            const dbg = (tag, obj) => {
                const logLine = `${tag} ${JSON.stringify(obj)}`;
                console.log(logLine);
                try {
                    fs.appendFileSync(path.join(process.cwd(), 'debug-ocr-pipeline.log'), logLine + '\n');
                } catch (e) { /* ignore */ }
            };
            dbg('[PRE-07]', {
                docsCount: uniqueDocs?.length,
                firstKeys: uniqueDocs?.[0] ? Object.keys(uniqueDocs[0]) : [],
                firstOcr: uniqueDocs?.[0]?.ocrQualityAvg ?? uniqueDocs?.[0]?.metadata?.ocrQualityAvg ?? null
            });

            // 🔧 FIX: GUARDRAIL - Bloquear se doc chegar sem OCR
            for (const d of uniqueDocs) {
                const ocr = d.ocrQualityAvg ?? d.metadata?.ocrQualityAvg ?? null;
                if (ocr == null) {
                    const errorMsg = `[PIPELINE-BLOCK] Doc sem OCR antes do Fusion: ${d.documentId} keys=${Object.keys(d).join(',')}`;
                    logger.error(PIPELINE_NAME, errorMsg);
                    throw new Error(errorMsg);
                }
            }

            // ETAPA 7: Document Fusion ⭐ CRÍTICO
            logger.info(PIPELINE_NAME, '▶️ [7/9] Document Fusion ⭐');
            const fusionResult = await this.documentFusion.fuse(
                uniqueDocs,
                loteId,
                classificationResults
            );

            const CORPO_INTEGRADO = fusionResult.corpoIntegrado;

            // Adiciona info de duplicatas ao metadata
            CORPO_INTEGRADO.metadata.duplicatesRemoved = deduplicationResult.duplicatesRemoved.length;
            CORPO_INTEGRADO.metadata.duplicateDetails = deduplicationResult.duplicatesRemoved;

            // 🔧 GARANTIR: Criar fullText canônico se não existir
            if (!CORPO_INTEGRADO.fullText) {
                CORPO_INTEGRADO.fullText = CORPO_INTEGRADO.globalLines
                    .map(line => line.text || '')  // ✅ Fallback seguro (evita undefined)
                    .join('\n');
            }

            // 🔧 GUARDRAIL: Validar texto canônico antes do Extractor
            const fullText = CORPO_INTEGRADO.fullText;  // ✅ APENAS fullText (fonte canônica)

            // 🔍 DEBUG: Log entrada do Extractor
            const dbg2 = (tag, obj) => {
                const logLine = `${tag} ${JSON.stringify(obj)}`;
                console.log(logLine);
                try {
                    fs.appendFileSync(path.join(process.cwd(), 'debug-ocr-pipeline.log'), logLine + '\n');
                } catch (e) { /* ignore */ }
            };
            dbg2('[08-IN]', {
                fullTextLen: fullText.length,
                totalChars: CORPO_INTEGRADO.metadata?.totalChars || 0,
                totalLines: CORPO_INTEGRADO.metadata?.totalLines || 0,
                ocrQualityGlobal: CORPO_INTEGRADO.metadata?.ocrQualityGlobal || 0
            });

            if (fullText.length < 1000) {
                const errorMsg =
                    `[PIPELINE-BLOCK] Texto canônico insuficiente para extração: ` +
                    `${fullText.length} chars (mínimo: 1000)`;
                logger.error(PIPELINE_NAME, errorMsg);
                throw new Error(errorMsg);
            }

            // ETAPA 8: Structured Extractor
            logger.info(PIPELINE_NAME, '▶️ [8/9] Structured Extractor');
            console.log('DEBUG: EXECUTING EXTRACTOR');
            const preAnalise = await this.structuredExtractor.extract(CORPO_INTEGRADO);
            console.log('DEBUG: EXTRACTOR DONE');

            // 🔍 DEBUG: Log saída do Extractor
            dbg2('[08-OUT]', {
                orgao: preAnalise?.orgao || null,
                modalidade: preAnalise?.modalidade || null,
                numeroEdital: preAnalise?.numero_edital || null,
                hasData: !!(preAnalise?.orgao || preAnalise?.modalidade),
                fieldsExtracted: Object.keys(preAnalise || {}).filter(k => preAnalise[k] && preAnalise[k] !== 'SEM DADOS NO ARQUIVO').length,
                sample: fullText.substring(0, 200)  // ✅ Sample para confirmar que é edital
            });

            // ETAPA 9: Pipeline Validator
            logger.info(PIPELINE_NAME, '▶️ [9/9] Pipeline Validator');
            const validation = await this.pipelineValidator.validate(CORPO_INTEGRADO, preAnalise);

            // Adiciona avisos e erros ao metadata
            CORPO_INTEGRADO.metadata.warningFlags = validation.warnings;
            CORPO_INTEGRADO.metadata.errorFlags = validation.errors;

            const duration = Date.now() - startTime;

            logger.info(
                PIPELINE_NAME,
                `✅ Pipeline concluído em ${(duration / 1000).toFixed(1)}s - ` +
                `Status: ${validation.status.toUpperCase()}`
            );

            // Retorna resultado completo
            return {
                pipelineId,
                loteId,
                status: validation.valid ? 'success' : 'completed_with_warnings',
                durationMs: duration,

                // CORPO_INTEGRADO canônico
                CORPO_INTEGRADO,

                // Pré-análise
                preAnalise,

                // Validação
                validation,

                // Metadados do pipeline
                pipelineMetadata: {
                    totalDocuments: uploadResult.files.length,
                    documentsProcessed: uniqueDocs.length,
                    duplicatesRemoved: deduplicationResult.duplicatesRemoved.length,
                    classificationResults,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            const duration = Date.now() - startTime;

            logger.critical(
                PIPELINE_NAME,
                `❌ Pipeline FALHOU após ${(duration / 1000).toFixed(1)}s`,
                { error: error.message, stack: error.stack }
            );

            throw new Error(`Pipeline falhou: ${error.message}`);
        }
    }

    /**
     * Obtém status de execução do pipeline
     */
    getStatus() {
        return {
            name: 'Pipeline Orquestrador',
            version: '1.0.0',
            stages: 9,
            stages_list: [
                '1. Upload Layer',
                '2. Document Classifier',
                '3. OCR Engine',
                '4. Text Normalizer',
                '5. Index Builder',
                '6. Deduplicator',
                '7. Document Fusion ⭐',
                '8. Structured Extractor',
                '9. Pipeline Validator'
            ]
        };
    }
}

export default Pipeline;
