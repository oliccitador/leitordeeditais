/**
 * 🔍 CAPTURA DE LOGS - PRÓXIMO UPLOAD
 * 
 * Este script redireciona console.log para arquivo
 * Adicionar no topo de lib/pipeline/index.js
 */

import fs from 'fs';
import path from 'path';

// Criar arquivo de log
const logFile = path.join(process.cwd(), 'debug-ocr-logs.txt');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Interceptar console.log
const originalLog = console.log;
console.log = function (...args) {
    // Escrever no arquivo
    const timestamp = new Date().toISOString();
    const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');

    logStream.write(`[${timestamp}] ${message}\n`);

    // Também exibir no console original
    originalLog.apply(console, args);
};

console.log('🔍 LOG CAPTURE INICIADO - Arquivo: debug-ocr-logs.txt');
