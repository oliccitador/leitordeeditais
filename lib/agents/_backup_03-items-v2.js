/**
 * 🏷️ AGENTE 3 (V2) - ITEM CLASSIFIER (SANDBOXED VERSION)
 * 
 * Versão isolada para correção do bug de "Descrição Vazia" sem afetar Agente 2.
 * Aplica lógica de limpeza de prefixo/sufixo validada em testes.
 */

import { getLogger } from '../services/logger.js';

const logger = getLogger();
const AGENT_ID = 'AGENT_03';

class ItemClassifier {
    constructor() {
        this.cnaeCategoryHeuristics = this.loadCNAEHeuristics();
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
            logger.info(AGENT_ID, 'Extraindo e classificando itens (V2 Sandbox)');

            // ✅ FIX: Usar fullText (fonte canônica) com fallback para textoCompleto
            const textoCanon = corpoIntegrado?.fullText || corpoIntegrado?.textoCompleto;

            if (!corpoIntegrado || !textoCanon) {
                throw new Error('CORPO_INTEGRADO inválido');
            }

            // ✅ FIX: Assegurar compatibilidade
            if (!corpoIntegrado.textoCompleto) {
                corpoIntegrado.textoCompleto = textoCanon;
            }

            // Extrai itens do corpus
            const { items, evidence } = await this.extractItems(corpoIntegrado);

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
                low_ocr_quality: false, // Herda do pipeline se necessário
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
                    confidence: items.length > 0 ? 0.9 : 0.5
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
     * Extrai itens do CORPO_INTEGRADO
     */
    async extractItems(corpoIntegrado) {
        const items = [];
        const evidence = [];

        // Regex patterns para detectar itens - Ajustados (DRAGNET V6)
        const itemPatterns = [
            // Padrão 1: Universal Start (Número + Separador + Qualquer Coisa)
            // Agora suporta bullets: "- 1. Mesa", "* 2. Cadeira"
            // Ex: "1. mesa", "2 - computador", "3) cadeira", "4: monitor"
            { pattern: /^\s*(?:[-•*]\s*)?(\d{1,3})[\s.:)-]+(\S.*)$/gm, type: 'SIMPLE_START' },

            // Padrão 2: "Item X" ou "Lote X" explícito
            { pattern: /(?:ITEM|LOTE)\s+(\d{1,3})[\s.:)-]+(.{10,})/gi, type: 'ITEM' },

            // Padrão 3: Tabela (mantido)
            { pattern: /\|\s*(\d+)\s*\|([^\|]{10,200})\|/g, type: 'TABLE' }
        ];

        // Palavras que invalidam um item "SIMPLE_START" (para não pegar títulos de seção, leis ou datas)
        const exclusions = /\b(?:PREÂMBULO|CLÁUSULA|SEÇÃO|CAPÍTULO|OBJETO|DISPOSIÇÕES|ANEXO|CONTRATO|ATA|LEI|DECRETO|PORTARIA|EDITAL|DATA|LOCAL|PRAZO|JANEIRO|FEVEREIRO|MARÇO|ABRIL|MAIO|JUNHO|JULHO|AGOSTO|SETEMBRO|OUTUBRO|NOVEMBRO|DEZEMBRO|PÁGINA|FOLHA)\b/i;

        const lines = corpoIntegrado.globalLines;

        console.log(`[AGENT_03_V2_DEBUG] Total Linhas: ${lines.length}`);

        if (lines.length > 0) {
            console.log(`[AGENT_03_V2_DEBUG] Amostra Linha 1: "${lines[0].text}"`);
            // Procura linhas que pareçam itens para ver como estão escritas
            const candidates = lines.filter(l => /^\s*\d+\s+[A-Z]/.test(l.text)).slice(0, 5);
            console.log(`[AGENT_03_V2_DEBUG] Candidatos a Itens (Raw):`, candidates.map(c => c.text));
        }

        const processed = new Set();

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const text = line.text;

            for (const { pattern, type } of itemPatterns) {
                pattern.lastIndex = 0;
                const matches = [...text.matchAll(pattern)]; // Array para debug fácil

                if (matches.length > 0) {
                    console.log(`[AGENT_03_V2_DEBUG] Match encontrado (${type}) na linha: "${text.substring(0, 50)}..."`);
                }

                for (const match of matches) {
                    const numero = match[1];
                    let descricao = (match[2] || '').trim();

                    console.log(`[AGENT_03_V2_DEBUG] Captura Bruta: [${numero}] "${descricao}"`);

                    // Validação extra para SIMPLE_START
                    if (type === 'SIMPLE_START') {
                        if (exclusions.test(descricao)) continue;

                        // ✅ FIX (15/12): Limpeza INTELIGENTE de prefixos (ex: "Unidade 5 MESA...")
                        // Evita o bug de "Descrição Vazia" causado por limpeza excessiva
                        const prefixTrash = descricao.match(/^(?:Unidade|Unid|Quant|Qtd|Marca|Valor|R\$|Item)\b[\s.:\d-]*\s+/i);
                        if (prefixTrash) {
                            descricao = descricao.substring(prefixTrash[0].length).trim();
                        }

                        // ✅ FIX (15/12): Limpeza de sufixos (ex: "...MESA Unidade 5")
                        // Só remove se estiver no fim ou for um metadado claro
                        const suffixTrash = descricao.match(/\s+(?:Unidade|Unid|Quant|Qtd|Marca|Valor|R\$)\b/i);
                        if (suffixTrash) {
                            descricao = descricao.substring(0, suffixTrash.index).trim();
                        }
                    }

                    // LIMPEZA PRÉVIA: Remove lixo numérico do início da descrição
                    // Ex: Captura "6. 2, com o intuito..." -> Descrição "2, com o intuito..."
                    // Limpa para "com o intuito..."
                    descricao = descricao.replace(/^[\d.,-]+\s+/, '').trim();

                    const key = `${numero}-${descricao.substring(0, 30)}`;
                    if (processed.has(key)) continue;

                    // HEURÍSTICA V3.3: Filtro de Falso Positivo (Texto Jurídico vs Item)

                    // 1. Tamanho Excessivo: Itens reais raramente são parágrafos de 500 chars (Aumentado margem)
                    if (descricao.length > 800) {
                        logger.debug(AGENT_ID, `Descartado [${numero}] por tamanho excessivo (${descricao.length})`);
                        continue;
                    }

                    // 2. Exclusão de Termos Jurídicos/Administrativos (Expandida)
                    const legalPattern = /\b(da participação|do julgamento|da habilitação|do recurso|das sanções|dos prazos|da contratada|da contratante|do pagamento|da fiscalização|das obrigações|do objeto|das condições|disposições finais|cláusula|parágrafo|inciso|lei|decreto|portaria|conforme|mediante|sob pena|fica vedado|será concedido|não poderão|poderão participar|é vedado|observar|cumprir|apresentar|entregar|assinatura|digital|id|sessão|pública|impugnação|esclarecimento|anexo|modelo|declaração|atestado|certidão|balanço|vigência|garantia|multa|advertência|rescisão)\b/i;

                    if (legalPattern.test(descricao)) {
                        logger.debug(AGENT_ID, `Descartado [${numero}] por termo jurídico/adm: "${descricao.substring(0, 30)}..."`);
                        continue;
                    }

                    // 2.1 Exclusão de Início Jurídico (Reforçado)
                    const legalStart = /^(?:O\s+|A\s+|Os\s+|As\s+|Para\s+|Caso\s+|Sendo\s+|Quando\s+|Dever[áa]\s+|Fica\s+|Nos\s+|Nas\s+|Em\s+|Conforme\s+|Mediante\s+|Sob\s+|Sobre\s+|Com\s+o\s+intuito|Ficam|Ser[ãa]o|Poder[áa]|Caber[áa]|Compete|Incumbe|Ressalvad|Excetuad|Considera-se|Entende-se)/i;
                    if (legalStart.test(descricao)) {
                        logger.debug(AGENT_ID, `Descartado [${numero}] por início jurídico: "${descricao.substring(0, 20)}..."`);
                        continue;
                    }

                    if (exclusions.test(descricao)) {
                        logger.debug(AGENT_ID, `Descartado [${numero}] por exclusão de termo: "${descricao.substring(0, 20)}..."`);
                        continue;
                    }

                    // 3. Validação de Conteúdo Mínimo
                    if (descricao.length < 5) {
                        logger.debug(AGENT_ID, `Descartado [${numero}] por descrição muito curta: "${descricao}"`);
                        continue;
                    }

                    // Contexto completo
                    const contextLines = lines.slice(i, Math.min(i + 4, lines.length));
                    const fullContext = contextLines.map(l => l.text).join(' ');

                    // Extrai metadados
                    const qtdVal = this.extractQuantidade(fullContext);
                    const unidVal = this.extractUnidade(fullContext);
                    const category = this.detectCategory(descricao);

                    // 4. FILTRO DE CONSISTÊNCIA COMERCIAL (NOVO)
                    // Um item só é válido se tiver (Qtd OU Unid) OU (Categoria Conhecida)
                    // "outros" sem qtd/unid é quase sempre lixo jurídico (ex: "3. Da Habilitação")
                    const hasComercialSignal = (qtdVal !== null || unidVal !== null || category !== 'outros');

                    if (!hasComercialSignal) {
                        // Verifica words count - itens costumam ser curtos e diretos, cláusulas longas
                        // Se for curto (< 50 chars) e sem sinal comercial, pode ser título de subseção (ex: "3.1. Habilitação Jurídica")
                        logger.debug(AGENT_ID, `Descartado [${numero}] por falta de sinal comercial (sem Qtd/Unid/Cat): "${descricao.substring(0, 30)}..."`);
                        continue;
                    }

                    const quantidade = qtdVal || "SEM DADOS NO ARQUIVO";
                    const unidade = unidVal || "SEM DADOS NO ARQUIVO";

                    // (REMOVIDO) A checagem de % de maiúsculas estava matando itens reais em minúsculo.
                    // Agora confiamos apenas no Regex Dragnet + Filtro de Termos Jurídicos + Consistência Comercial.

                    processed.add(key);

                    // Detecta flags técnicas
                    const tem_marca = this.detectMarca(fullContext);
                    const tem_norma = this.detectNorma(fullContext);
                    const tem_servico = this.detectServico(fullContext);

                    // Monta item conforme contrato DEV DOC 3/8
                    const item = {
                        item_numero: numero,
                        descricao: descricao, // ✅ FIX: Nome correto conforme Schema/Frontend
                        unidade,
                        quantidade,
                        tem_marca,
                        tem_norma,
                        tem_servico,
                        classificacao: "SEM PERFIL EMPRESA", // Será preenchido depois
                        motivo: "SEM DADOS NO ARQUIVO",
                        origens: []
                    };

                    // Evidência completa
                    const lineRange = contextLines.map(l => l.globalLine);
                    const charRange = [contextLines[0].charStart, contextLines[contextLines.length - 1].charEnd];

                    const itemEvidence = {
                        field: `item_${numero}`,
                        documento: line.sourceDocName,
                        doc_id: line.docId || 'unknown',
                        doc_type: this.detectDocType(corpoIntegrado, line.sourceDocName),
                        pagina: line.sourcePage,
                        line_range: [lineRange[0], lineRange[lineRange.length - 1]],
                        char_range: charRange,
                        segment_hash: line.segmentHash || 'unknown',
                        trecho_literal: fullContext.substring(0, 200),
                        confidence: 0.9,
                        notes: `Item extraído via pattern ${type}`
                    };

                    item.origens.push(itemEvidence);
                    evidence.push(itemEvidence);
                    items.push(item);
                }
            }
        }

        // Fallback: pipeline pre_analise
        if (items.length === 0 && corpoIntegrado.preAnalise) {
            const detected = corpoIntegrado.preAnalise.itens_detectados || 0;
            if (detected > 0) {
                logger.warn(AGENT_ID, `Pipeline detectou ${detected} itens mas extração regex falhou`);
            }
        }

        return { items, evidence };
    }

    /**
     * Classifica itens por perfil da empresa
     */
    classifyItems(items, companyProfile, evidence) {
        const cnaes = companyProfile.cnaes || [];

        for (const item of items) {
            const category = this.detectCategory(item.descricao); // ✅ FIX: Nome correto
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
     * Extrai quantidade
     */
    extractQuantidade(text) {
        const patterns = [
            /quantidade[:\s]+(\d+)/i,
            /qtd\.?[:\s]+(\d+)/i,
            /quant\.?[:\s]+(\d+)/i,
            /(\d+)\s+(?:unid|peça|pç|cj|metro|litro|kg|caixa|frasco|galão)/i,
            /unidade\s*[:.]?\s*(\d+)/i, // Padrão tabela invertida: Unidade 4
            /\b(\d+)\s*$/ // Número isolado no final da linha (arriscado, mas útil para tabelas)
        ];

        for (const p of patterns) {
            const m = text.match(p);
            if (m) return parseInt(m[1], 10); // Retorna número
        }
        return null; // Retorna null se não achar, para o caller decidir o fallback "SEM DADOS"
    }

    /**
     * Extrai unidade
     */
    extractUnidade(text) {
        const units = ['unidade', 'un', 'peça', 'pç', 'conjunto', 'cj', 'metro', 'litro', 'kg', 'caixa', 'cx', 'frasco', 'galão'];
        const normalized = text.toLowerCase();

        for (const unit of units) {
            // Verifica palavra inteira para evitar falsos positivos (ex: "pç" em "opção")
            const regex = new RegExp(`\\b${unit}\\b`, 'i');
            if (regex.test(normalized)) return unit;
        }
        return null;
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
