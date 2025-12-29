/**
 * 🏷️ AGENTE 3 (V2) - ITEM CLASSIFIER (GEMINI 2.5 FLASH VERSION)
 * 
 * Versão HÍBRIDA/LLM para correção definitiva da extração de itens.
 * Migrado de Groq/Llama-3 para Google Gemini 2.5 Flash (Context Window 1M)
 * para resolver problemas de Rate Limit e Contexto Cortado.
 */

import { getLogger } from '../services/logger.js';

const logger = getLogger();
const AGENT_ID = 'AGENT_03';

class ItemClassifier {
    constructor() {
        this.cnaeCategoryHeuristics = this.loadCNAEHeuristics();

        // Prioriza a nova chave GEMINI_FLASH_KEY, fallback para GEMINI_API_KEY antiga (agora são a mesma)
        this.apiKey = process.env.GEMINI_FLASH_KEY || process.env.GEMINI_API_KEY;

        if (!this.apiKey) {
            logger.warn(AGENT_ID, 'GEMINI_FLASH_KEY não encontrada. Agente falhará se invocado.');
        }
    }

    /**
     * Processa CORPO_INTEGRADO e extrai/classifica itens
     * @param {Object} corpoIntegrado - CORPO_INTEGRADO do pipeline (Deve ser CLONE)
     * @param {Object} companyProfile - { cnaes: [], porte: 'ME|EPP|DEMAIS' }
     * @returns {Object} Envelope padrão DEV DOC 3/8
     */
    async process(corpoIntegrado, companyProfile = null) {
        const startTime = Date.now();

        try {
            logger.startAgent(AGENT_ID);
            logger.info(AGENT_ID, 'Extraindo e classificando itens (Gemini 2.5 Flash)');

            // ✅ FIX: Usar fullText (fonte canônica) com fallback para textoCompleto
            const textoCanon = corpoIntegrado?.fullText || corpoIntegrado?.textoCompleto;

            if (!corpoIntegrado || !textoCanon) {
                throw new Error('CORPO_INTEGRADO inválido');
            }

            // ✅ FIX: Assegurar compatibilidade
            if (!corpoIntegrado.textoCompleto) {
                corpoIntegrado.textoCompleto = textoCanon;
            }

            // Extrai itens do corpus usando LLM
            const { items, evidence } = await this.extractItemsLLM(corpoIntegrado);

            // Classifica se companyProfile fornecido
            if (companyProfile && companyProfile.cnaes) {
                this.classifyItems(items, companyProfile, evidence);
            }

            // Calcula resumo
            const resumo = this.calculateSummary(items);

            // Gera alerts se necessário
            const alerts = this.generateAlerts(items, companyProfile);

            // Quality flags
            const quality_flags = {
                needs_review: items.length === 0,
                low_ocr_quality: false,
                missing_sections: items.length === 0 ? ['ITENS'] : []
            };

            const runTime = Date.now() - startTime;

            logger.info(AGENT_ID, `${items.length} itens extraídos em ${runTime}ms`);

            return {
                agent_id: AGENT_ID,
                status: items.length > 0 ? 'ok' : 'partial',
                dados: {
                    itens: items,
                    resumo
                },
                alerts,
                evidence,
                metadata: {
                    run_ms: runTime,
                    items_found: items.length,
                    sections_hit: this.getSectionsHit(corpoIntegrado),
                    confidence: items.length > 0 ? 0.98 : 0.0
                },
                quality_flags
            };

        } catch (error) {
            logger.error(AGENT_ID, 'Erro na execução', { error: error.message });

            return {
                agent_id: AGENT_ID,
                status: 'fail',
                dados: {
                    itens: [],
                    resumo: {
                        total_itens: 0,
                        elegiveis: 0,
                        duvida: 0,
                        incompativeis: 0
                    }
                },
                alerts: [{
                    type: 'error',
                    message: error.message,
                    severity: 'high'
                }],
                evidence: [],
                metadata: {
                    run_ms: Date.now() - startTime,
                    items_found: 0,
                    sections_hit: [],
                    confidence: 0.0
                },
                quality_flags: {
                    needs_review: true,
                    low_ocr_quality: false,
                    missing_sections: ['ITENS']
                }
            };
        }
    }

    /**
     * Extrai itens do CORPO_INTEGRADO usando Gemini
     */
    async extractItemsLLM(corpoIntegrado) {
        // Import Dinâmico do ContextOptimizer para evitar ciclo
        const { default: ContextOptimizer } = await import('../pipeline/10-contextOptimizer.js');

        // Gemini 2.5 Flash aguenta 1M tokens, mas vamos limitar a 200k chars para ser rápido e econômico
        // Isso cobrirá 99% dos editais inteiros sem cortes.
        const maxChars = 200000;

        let textoParaLLM = ContextOptimizer.optimize(corpoIntegrado, maxChars);

        // Log de decisão
        if (textoParaLLM.length < corpoIntegrado.textoCompleto.length) {
            logger.info(AGENT_ID, `🤖 Enviando ${textoParaLLM.length} chars (Otimizado) para Gemini 2.5 Flash`);
        } else {
            logger.info(AGENT_ID, `🤖 Enviando ${textoParaLLM.length} chars (Integral) para Gemini 2.5 Flash`);
        }

        let { rawItems } = await this.callGemini(textoParaLLM);

        // Fallback: Se não achou nada e o texto foi otimizado (cortado), tenta com TUDO (até 500k chars)
        // Isso é possível graças à janela de 1M tokens do Flash.
        if (rawItems.length === 0 && textoParaLLM.length < corpoIntegrado.textoCompleto.length) {
            logger.warn(AGENT_ID, '⚠️ TENTATIVA 1 falhou. Tentando com TEXTO COMPLETO (limite expandido para 500k)...');
            textoParaLLM = corpoIntegrado.textoCompleto.substring(0, 500000); // Meio milhão de chars
            ({ rawItems } = await this.callGemini(textoParaLLM));
        }

        // Normalização e Traceability
        const items = [];
        const evidence = [];

        // Documento principal para fallback de origem
        const docPrincipal = corpoIntegrado.segments.find(s => s.documentType === 'edital') || corpoIntegrado.segments[0];

        for (const rip of rawItems) {
            // Normaliza campos
            const numero = String(rip.item_numero || '').replace(/[^\d]/g, '');
            const descricao = rip.descricao || 'SEM DADOS';

            // Validações básicas
            if (descricao.length < 3 || descricao === 'SEM DADOS') continue;
            // if (!numero) continue; 

            // Rastreamento (Find Origin)
            const origin = this.findOriginInText(corpoIntegrado, descricao);

            // Monta Item Final
            const item = {
                item_numero: numero || '1', // Default 1 se único
                descricao: descricao,
                unidade: rip.unidade || "UN",
                quantidade: this.parseQuantidade(rip.quantidade),
                tem_marca: this.detectMarca(descricao),
                tem_norma: this.detectNorma(descricao),
                tem_servico: this.detectServico(descricao),
                classificacao: "SEM PERFIL EMPRESA",
                motivo: "SEM DADOS NO ARQUIVO",
                origens: [origin]
            };

            // Monta Evidência para o envelope
            const ev = {
                field: `item_${item.item_numero}`,
                documento: origin.documento,
                doc_id: 'unknown',
                doc_type: this.detectDocType(corpoIntegrado, origin.documento),
                pagina: origin.pagina,
                line_range: [],
                char_range: [],
                segment_hash: 'unknown',
                trecho_literal: origin.trecho,
                confidence: 0.99,
                notes: 'Extraído via Google Gemini 2.5 Flash'
            };

            items.push(item);
            evidence.push(ev);
        }

        return { items, evidence };
    }

    /**
     * Chamada à API Gemini com Retry (usando fetch direto)
     */
    async callGemini(textoInput) {
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;

                const body = {
                    contents: [{
                        parts: [{
                            text: this.buildPrompt(textoInput)
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
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                const responseText = data.candidates[0].content.parts[0].text;

                // DEBUG
                try {
                    const fs = await import('fs');
                    const path = await import('path');
                    fs.appendFileSync(path.join(process.cwd(), 'debug-agent3-gemini.log'),
                        `\n[GEMINI SUCCESS] Response Size: ${responseText.length}\nSample: ${responseText.substring(0, 200)}...\n`);
                } catch (e) { }

                // Limpar markdown se vier
                let cleanContent = responseText.trim();

                // Debug log to file
                try {
                    const fs = await import('fs');
                    const path = await import('path');
                    fs.appendFileSync(path.join(process.cwd(), 'debug-agent3-gemini.log'),
                        `\n[PARSING START] Starts with backtick? ${cleanContent.startsWith('```')}\n`);
                } catch (e) { }

                logger.debug(AGENT_ID, `Resposta original (primeiros 200 chars): ${responseText.substring(0, 200)}`);

                if (cleanContent.startsWith('```')) {
                    cleanContent = cleanContent.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
                    logger.debug(AGENT_ID, 'Removido wrapper markdown');
                }

                // Debug trimmed content
                try {
                    const fs = await import('fs');
                    const path = await import('path');
                    fs.appendFileSync(path.join(process.cwd(), 'debug-agent3-gemini.log'),
                        `\n[CLEAN CONTENT SAMPLE] ${cleanContent.substring(0, 100)}\n`);
                } catch (e) { }

                logger.debug(AGENT_ID, `JSON limpo (primeiros 200 chars): ${cleanContent.substring(0, 200)}`);

                let parsed;
                try {
                    parsed = JSON.parse(cleanContent);
                    try {
                        const fs = await import('fs');
                        const path = await import('path');
                        fs.appendFileSync(path.join(process.cwd(), 'debug-agent3-gemini.log'),
                            `\n[PARSE SUCCESS] Itens count: ${parsed.itens?.length}\n`);
                    } catch (e) { }
                } catch (e) {
                    try {
                        const fs = await import('fs');
                        const path = await import('path');
                        fs.appendFileSync(path.join(process.cwd(), 'debug-agent3-gemini.log'),
                            `\n[PARSE ERROR] ${e.message}\n`);
                    } catch (e2) { }
                    return { rawItems: [] };
                }

                logger.info(AGENT_ID, `✅ JSON parseado com sucesso! Itens brutos: ${parsed.itens?.length || 0}`);

                return { rawItems: parsed.itens || [] };

            } catch (err) {
                attempts++;
                logger.error(AGENT_ID, `Erro Gemini (Tentativa ${attempts})`, err);

                // Log erro
                try {
                    const fs = await import('fs');
                    const path = await import('path');
                    fs.appendFileSync(path.join(process.cwd(), 'debug-agent3-gemini.log'), `\n[GEMINI ERROR] ${err.message}\n`);
                } catch (e) { }

                if (attempts >= maxAttempts) return { rawItems: [] };
                // Backoff simples
                await new Promise(r => setTimeout(r, 2000 * attempts));
            }
        }
        return { rawItems: [] };
    }

    /**
     * Constrói o prompt para o Gemini
     */
    buildPrompt(textoInput) {
        return `
Tarefa: Extrair LISTA DE ITENS ou LOTES de licitação deste texto.
Ignore definições legais ou instruções de como participar.
Foque apenas na tabela ou lista onde descreve O QUE está sendo comprado.

Regras:
1. Extraia Item, Descrição, Unidade e Quantidade.
2. Se a descrição estiver multilinhas, concatene.
3. Se não houver itens claros, retorne lista vazia.

IMPORTANTE: Retorne APENAS um objeto JSON válido, sem markdown, sem explicações.

Formato esperado:
{
  "itens": [
    {
      "item_numero": "1",
      "descricao": "descrição completa do item",
      "unidade": "UN",
      "quantidade": 10
    }
  ]
}

Texto do Edital:
${textoInput}
        `;
    }

    /**
     * Busca origem do texto no corpus (Traceability)
     */
    findOriginInText(corpoIntegrado, textoBusca) {
        if (!textoBusca) return { documento: 'SEM DADOS', pagina: 0, trecho: '' };

        // Tenta achar um trecho significativo (primeiros 50 chars)
        const snippet = textoBusca.substring(0, 50).toLowerCase();
        const fullTextLower = corpoIntegrado.textoCompleto.toLowerCase();

        const index = fullTextLower.indexOf(snippet);

        if (index >= 0) {
            // Acha a linha global correspondente
            const linha = corpoIntegrado.globalLines.find(l => l.charStart <= index && l.charEnd >= index);
            if (linha) {
                return {
                    documento: linha.sourceDocName,
                    pagina: linha.sourcePage,
                    trecho: linha.text
                };
            }
        }

        // Fallback: Retorna doc principal
        const docPrincipal = corpoIntegrado.segments[0];
        return {
            documento: docPrincipal?.documentName || 'unknown',
            pagina: 1,
            trecho: 'Origem exata não localizada automaticamente (extração semântica)'
        };
    }

    /**
     * Parseia quantidade para número
     */
    parseQuantidade(qtd) {
        if (typeof qtd === 'number') return qtd;
        if (!qtd) return "SEM DADOS NO ARQUIVO";
        const num = parseFloat(String(qtd).replace(',', '.').replace(/[^\d.]/g, ''));
        return isNaN(num) ? "SEM DADOS NO ARQUIVO" : num;
    }

    /**
     * Classifica itens por perfil da empresa
     */
    classifyItems(items, companyProfile, evidence) {
        const cnaes = companyProfile.cnaes || [];

        for (const item of items) {
            const category = this.detectCategory(item.descricao);
            const fit = this.checkCNAEFit(category, cnaes);

            if (fit === 'MATCH') {
                item.classificacao = 'ELEGIVEL';
                item.motivo = `Categoria '${category}' compatível com CNAE da empresa`;
            } else if (fit === 'PARTIAL') {
                item.classificacao = 'DUVIDA';
                item.motivo = `Categoria '${category}' parcialmente compatível - requer análise`;
            } else {
                item.classificacao = 'INCOMPATIVEL';
                item.motivo = `Categoria '${category}' fora do escopo dos CNAEs da empresa`;
            }

            // Flags técnicas afetam classificação
            if (item.tem_marca) {
                item.classificacao = 'DUVIDA';
                item.motivo += ' + MARCA ESPECIFICADA (verificar equivalência)';
            }

            if (item.tem_norma) {
                item.motivo += ' + NORMA TÉCNICA EXIGIDA';
            }
        }
    }

    /**
     * Detecta categoria do item
     */
    detectCategory(text) {
        const normalized = text.toLowerCase();

        const categories = {
            'moveis': /\b(mesa|cadeira|armario|estante|movel|mobiliario)\b/,
            'informatica': /\b(computador|notebook|impressora|servidor|switch|monitor)\b/,
            'construcao': /\b(obra|reforma|pintura|construcao|alvenaria)\b/,
            'servicos': /\b(manutencao|limpeza|vigilancia|consultoria)\b/,
            'veiculos': /\b(veiculo|carro|caminhao|onibus)\b/,
            'material_escritorio': /\b(papel|caneta|grampeador|pasta)\b/,
            'equipamentos': /\b(equipamento|maquina|aparelho|ferramenta)\b/,
            'alimentos': /\b(alimentacao|comida|refeicao|merenda)\b/,
            'medicamentos': /\b(medicamento|remedio|farmacia)\b/,
            'eletrodomesticos': /\b(geladeira|refrigerador|freezer|fogao|forno|microondas|lavadora|bebedouro|purificador|ar condicionado|ventilador|liquidificador|batedeira)\b/
        };

        for (const [cat, pattern] of Object.entries(categories)) {
            if (pattern.test(normalized)) return cat;
        }

        return 'outros';
    }

    /**
     * Verifica fit com CNAEs
     */
    checkCNAEFit(category, cnaes) {
        const mapping = {
            'moveis': ['3101', '3102', '4754'],
            'informatica': ['2610', '2621', '4751', '4752'],
            'construcao': ['4120', '4211', '4213'],
            'material_escritorio': ['4761'],
            'veiculos': ['4511', '4520']
        };

        const validCNAEs = mapping[category] || [];
        if (validCNAEs.length === 0) return 'NONE';

        for (const cnae of cnaes) {
            const digits = cnae.replace(/\D/g, '').substring(0, 4);
            for (const valid of validCNAEs) {
                if (digits.startsWith(valid)) return 'MATCH';
            }
        }

        return 'NONE';
    }

    /**
     * Detecta marca no texto
     */
    detectMarca(text) {
        const patterns = [
            /\bmarca\s+[\w\s]+/i,
            /\bmodelo\s+[\w\s]+/i,
            /\b[A-Z]{2,}[\w\s]*(?:TM|®|©)/,
            /\bfabricante\s+[\w\s]+/i
        ];

        return patterns.some(p => p.test(text));
    }

    /**
     * Detecta norma técnica
     */
    detectNorma(text) {
        const patterns = [
            /\b(?:ABNT|NBR|ISO|IEC|ASTM|DIN)\s*[\d-]+/i,
            /\bnorma\s+t[eé]cnica/i
        ];

        return patterns.some(p => p.test(text));
    }

    /**
     * Detecta serviço acoplado
     */
    detectServico(text) {
        const keywords = /\b(instalacao|manutencao|treinamento|assistencia|suporte|garantia estendida)\b/i;
        return keywords.test(text);
    }

    /**
     * Calcula resumo conforme DEV DOC 3/8
     */
    calculateSummary(items) {
        return {
            total_itens: items.length,
            elegiveis: items.filter(i => i.classificacao === 'ELEGIVEL').length,
            duvida: items.filter(i => i.classificacao === 'DUVIDA').length,
            incompativeis: items.filter(i => i.classificacao === 'INCOMPATIVEL').length
        };
    }

    /**
     * Gera alerts
     */
    generateAlerts(items, companyProfile) {
        const alerts = [];

        if (items.length === 0) {
            alerts.push({
                type: 'warning',
                message: 'Nenhum item detectado automaticamente',
                severity: 'medium',
                action_suggested: 'REVISAR_MANUALMENTE'
            });
        }

        const marcas = items.filter(i => i.tem_marca);
        if (marcas.length > 0) {
            alerts.push({
                type: 'attention',
                message: `${marcas.length} itens com MARCA especificada`,
                severity: 'medium',
                action_suggested: 'VERIFICAR_EQUIVALENCIA'
            });
        }

        return alerts;
    }

    /**
     * Detecta tipo do documento
     */
    detectDocType(corpoIntegrado, docName) {
        const seg = corpoIntegrado.segments.find(s => s.documentName === docName);
        return seg?.documentType || 'unknown';
    }

    /**
     * Seções atingidas
     */
    getSectionsHit(corpoIntegrado) {
        const sections = [];
        for (const seg of corpoIntegrado.segments) {
            if (seg.structures) {
                if (seg.structures.chapters) sections.push('chapters');
                if (seg.structures.sections) sections.push('sections');
                if (seg.structures.articles) sections.push('articles');
            }
        }
        return [...new Set(sections)];
    }

    /**
     * Load heuristics (placeholder)
     */
    loadCNAEHeuristics() {
        return {};
    }
}

export default ItemClassifier;
