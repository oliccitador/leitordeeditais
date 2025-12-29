/**
 * 🔍 LOGGER DE DEBUG - SALVA LOGS EM ARQUIVO
 * 
 * Adicionar no início de cada arquivo instrumentado
 */

import fs from 'fs';
import path from 'path';

const DEBUG_LOG_FILE = path.join(process.cwd(), 'debug-ocr-pipeline.log');

// Helper que loga no console E no arquivo
const dbg = (tag, obj) => {
    const logLine = `${tag} ${JSON.stringify(obj)}`;
    console.log(logLine);

    // Salvar em arquivo
    try {
        fs.appendFileSync(DEBUG_LOG_FILE, logLine + '\n');
    } catch (err) {
        // Ignorar erro de escrita
    }
};

export default dbg;
