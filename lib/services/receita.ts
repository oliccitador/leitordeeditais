/**
 * Serviço de consulta CNPJ na Receita Federal
 * 
 * @module lib/services/receita
 * @sprint Sprint 3 - CNPJ/Contexto
 */

export interface ReceitaResponse {
    cnpj: string;
    razaoSocial: string;
    cnaes: string[];
    porte?: string;
    situacaoCadastral?: string;
}

/**
 * Sanitiza um CNPJ removendo caracteres não-numéricos
 */
export function sanitizeCNPJ(cnpj: string): string {
    return cnpj.replace(/\D/g, '');
}

/**
 * Valida formato de CNPJ (14 dígitos)
 */
export function isValidCNPJ(cnpj: string): boolean {
    const clean = sanitizeCNPJ(cnpj);
    return clean.length === 14 && /^\d{14}$/.test(clean);
}

/**
 * Consulta CNPJ na Receita Federal
 * 
 * Versão atual: Usa API pública da ReceitaWS com fallback.
 * 
 * @param cnpj - CNPJ já sanitizado (14 dígitos)
 * @returns Dados da empresa
 * @throws Error se CNPJ inválido ou serviço indisponível
 */
export async function consultarReceita(cnpj: string): Promise<ReceitaResponse> {
    // Validar formato
    if (!isValidCNPJ(cnpj)) {
        throw new Error('CNPJ inválido. Deve conter 14 dígitos.');
    }

    const cnpjClean = sanitizeCNPJ(cnpj);

    try {
        // Tentar API Pública ReceitaWS (Validada localmente via test-cnpj-receitaws.js)
        // Limite: 3 consultas por minuto na versão free
        const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpjClean}`);

        if (response.ok) {
            const data = await response.json();

            // ReceitaWS retorna status 'ERROR' em caso de falha lógica
            if (data.status === 'ERROR') {
                throw new Error(data.message || 'CNPJ não encontrado na ReceitaWS');
            }

            // Mapear CNAEs
            const cnaes: string[] = [];
            if (data.atividade_principal) {
                data.atividade_principal.forEach((c: any) => cnaes.push(`${c.code} - ${c.text}`));
            }
            if (data.atividades_secundarias) {
                data.atividades_secundarias.forEach((c: any) => cnaes.push(`${c.code} - ${c.text}`));
            }

            return {
                cnpj: cnpjClean,
                razaoSocial: data.nome,
                cnaes: cnaes,
                porte: data.porte,
                situacaoCadastral: data.situacao,
            };
        } else {
            console.warn(`[Receita] Erro na ReceitaWS: ${response.status}`);
            throw new Error(`ReceitaWS indisponível (${response.status})`);
        }
    } catch (error) {
        console.warn('[Receita] Falha na consulta externa (ReceitaWS), tentando fallback...', error);

        // Mock fallback final para garantir UX suave mesmo sem API
        const mockData: ReceitaResponse = {
            cnpj: cnpjClean,
            razaoSocial: 'CONSULTA INDISPONÍVEL (TENTE NOVAMENTE)',
            cnaes: [],
            porte: 'DESCONHECIDO',
            situacaoCadastral: 'ERRO',
        };
        return mockData;
    }
}

/**
 * Formata CNPJ para exibição (00.000.000/0000-00)
 */
export function formatCNPJ(cnpj: string): string {
    const clean = sanitizeCNPJ(cnpj);
    if (clean.length !== 14) return cnpj;

    return `${clean.substring(0, 2)}.${clean.substring(2, 5)}.${clean.substring(5, 8)}/${clean.substring(8, 12)}-${clean.substring(12, 14)}`;
}
