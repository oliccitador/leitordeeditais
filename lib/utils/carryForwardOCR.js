/**
 * 🔧 CARRY FORWARD OCR - FUNÇÃO GLOBAL DE MERGE
 * 
 * REGRA OBRIGATÓRIA: Usar esta função em TODO lugar que altera doc após OCR
 * 
 * PROIBIDO:
 * - doc.metadata = algumaCoisa
 * - { ...doc, metadata: novaMetadata } sem merge
 * - recriar doc como { documentId, ... } sem carry-forward
 * 
 * @param {Object} baseDoc - Documento base (com OCR)
 * @param {Object} patch - Alterações a aplicar
 * @returns {Object} Documento merged com OCR preservado
 */
export function carryForwardOCR(baseDoc, patch = {}) {
    const baseOcr = baseDoc?.ocrQualityAvg ?? baseDoc?.metadata?.ocrQualityAvg ?? null;
    const patchOcr = patch?.ocrQualityAvg ?? patch?.metadata?.ocrQualityAvg ?? null;
    const ocr = patchOcr ?? baseOcr;

    return {
        ...baseDoc,
        ...patch,
        ocrQualityAvg: ocr,
        metadata: {
            ...(baseDoc?.metadata || {}),
            ...(patch?.metadata || {}),
            ocrQualityAvg: ocr
        }
    };
}

export default carryForwardOCR;
