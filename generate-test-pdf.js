/**
 * 📄 GERADOR DE PDF SINTÉTICO PARA TESTE
 * 
 * Cria um PDF de edital fictício mas estruturado
 * para validar pipeline + agente 2
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const doc = new PDFDocument();
const outputPath = path.join(process.cwd(), 'test-files', 'edital-sintetico.pdf');

// Stream para arquivo
doc.pipe(fs.createWriteStream(outputPath));

// ==========================================
// PÁGINA 1 - CABEÇALHO E DADOS PRINCIPAIS
// ==========================================

doc.fontSize(16).font('Helvetica-Bold');
doc.text('PREFEITURA MUNICIPAL DE SÃO PAULO', { align: 'center' });
doc.moveDown(0.5);

doc.fontSize(14);
doc.text('SECRETARIA MUNICIPAL DE EDUCAÇÃO', { align: 'center' });
doc.moveDown(1);

doc.fontSize(18).font('Helvetica-Bold');
doc.text('PREGÃO ELETRÔNICO Nº 123/2025', { align: 'center' });
doc.moveDown(0.5);

doc.fontSize(12).font('Helvetica');
doc.text('Processo Administrativo nº 2025/00456-SME', { align: 'center' });
doc.moveDown(2);

doc.fontSize(11).font('Helvetica-Bold');
doc.text('TIPO DE LICITAÇÃO:', { continued: true });
doc.font('Helvetica').text(' Menor Preço');
doc.moveDown(0.3);

doc.font('Helvetica-Bold').text('SISTEMA DE REGISTRO DE PREÇOS:', { continued: true });
doc.font('Helvetica').text(' SIM - Decreto Municipal nº 12.345/2024');
doc.moveDown(0.3);

doc.font('Helvetica-Bold').text('PLATAFORMA:', { continued: true });
doc.font('Helvetica').text(' Portal Comprasnet 4.0');
doc.moveDown(0.3);

doc.font('Helvetica-Bold').text('CRITÉRIO DE JULGAMENTO:', { continued: true });
doc.font('Helvetica').text(' Menor Preço por Item');
doc.moveDown(2);

// Datas críticas
doc.fontSize(12).font('Helvetica-Bold');
doc.text('DATAS IMPORTANTES:', { underline: true });
doc.moveDown(0.5);

doc.fontSize(11).font('Helvetica');
doc.text('• Publicação do Edital: 15/01/2025');
doc.text('• Prazo para envio de propostas: até 31/01/2025 às 18h00');
doc.text('• Abertura da sessão pública: 01/02/2025 às 09h00');
doc.text('• Início da disputa de lances: 01/02/2025 às 10h00');
doc.text('• Prazo para recursos: até 05/02/2025 às 18h00');
doc.moveDown(2);

// Objeto
doc.fontSize(12).font('Helvetica-Bold');
doc.text('DO OBJETO:', { underline: true });
doc.moveDown(0.5);

doc.fontSize(11).font('Helvetica');
doc.text('Aquisição de mobiliário escolar (carteiras, cadeiras, mesas e armários) para as escolas municipais de ensino fundamental, conforme especificações constantes no Termo de Referência - Anexo I deste Edital.');
doc.moveDown(0.3);

doc.font('Helvetica-Bold').text('Valor estimado total:', { continued: true });
doc.font('Helvetica').text(' R$ 285.450,00 (duzentos e oitenta e cinco mil, quatrocentos e cinquenta reais)');

// Nova página
doc.addPage();

// ==========================================
// PÁGINA 2 - CAPÍTULOS E SEÇÕES
// ==========================================

doc.fontSize(14).font('Helvetica-Bold');
doc.text('CAPÍTULO I', { align: 'center' });
doc.text('DAS DISPOSIÇÕES PRELIMINARES', { align: 'center' });
doc.moveDown(1);

doc.fontSize(11).font('Helvetica');
doc.text('Art. 1º O presente Pregão Eletrônico, do tipo menor preço, será regido pela Lei Federal nº 14.133/2021 e demais normas pertinentes, e pelas condições previstas neste Edital.');
doc.moveDown(0.5);

doc.text('Art. 2º A sessão pública do Pregão Eletrônico será realizada por meio do sistema eletrônico disponível no Portal Comprasnet 4.0.');
doc.moveDown(1);

doc.fontSize(14).font('Helvetica-Bold');
doc.text('CAPÍTULO II', { align: 'center' });
doc.text('DO OBJETO E DOS ITENS', { align: 'center' });
doc.moveDown(1);

doc.fontSize(11).font('Helvetica');
doc.text('Art. 3º O objeto da presente licitação é a aquisição de mobiliário escolar, conforme especificações técnicas detalhadas no Anexo I - Termo de Referência, compreendendo os seguintes itens:');
doc.moveDown(0.5);

// Tabela de itens
doc.font('Helvetica-Bold');
doc.text('ITEM 1 - Carteira escolar individual');
doc.font('Helvetica');
doc.text('Quantidade: 500 unidades');
doc.text('Descrição: Carteira escolar individual com tampo em MDF, estrutura metálica, altura regulável.');
doc.moveDown(0.3);

doc.font('Helvetica-Bold');
doc.text('ITEM 2 - Cadeira escolar');
doc.font('Helvetica');
doc.text('Quantidade: 500 unidades');
doc.text('Descrição: Cadeira escolar em polipropileno, estrutura metálica, empilhável.');
doc.moveDown(0.3);

doc.font('Helvetica-Bold');
doc.text('ITEM 3 - Mesa para professor');
doc.font('Helvetica');
doc.text('Quantidade: 50 unidades');
doc.text('Descrição: Mesa reta para professor, tampo 120x60cm, 3 gavetas com fechadura.');
doc.moveDown(0.3);

doc.font('Helvetica-Bold');
doc.text('ITEM 4 - Armário de aço');
doc.font('Helvetica');
doc.text('Quantidade: 30 unidades');
doc.text('Descrição: Armário de aço com 2 portas, 4 prateleiras, sistema de travamento.');

// Nova página
doc.addPage();

// ==========================================
// PÁGINA 3 - HABILITAÇÃO E CONDIÇÕES
// ==========================================

doc.fontSize(14).font('Helvetica-Bold');
doc.text('CAPÍTULO III', { align: 'center' });
doc.text('DA HABILITAÇÃO', { align: 'center' });
doc.moveDown(1);

doc.fontSize(11).font('Helvetica');
doc.text('Art. 4º Para habilitação, os licitantes deverão apresentar:');
doc.moveDown(0.3);

doc.text('I - Certidão Negativa de Débitos Trabalhistas (CNDT);');
doc.text('II - Prova de regularidade fiscal federal, estadual e municipal;');
doc.text('III - Certidão Negativa de Falência e Concordata;');
doc.text('IV - Atestado de Capacidade Técnica, comprovando fornecimento anterior de mobiliário escolar em quantidade mínima de 30% do objeto licitado;');
doc.text('V - Declaração de cumprimento dos requisitos de habilitação.');
doc.moveDown(1);

doc.fontSize(14).font('Helvetica-Bold');
doc.text('CAPÍTULO IV', { align: 'center' });
doc.text('DAS PENALIDADES', { align: 'center' });
doc.moveDown(1);

doc.fontSize(11).font('Helvetica');
doc.text('Art. 5º O descumprimento total ou parcial das obrigações assumidas sujeitará a contratada às seguintes penalidades:');
doc.moveDown(0.3);

doc.text('I - Advertência;');
doc.text('II - Multa de 0,5% por dia de atraso, limitada a 10% do valor total do contrato;');
doc.text('III - Suspensão temporária de participação em licitações;');
doc.text('IV - Declaração de inidoneidade.');
doc.moveDown(1);

doc.fontSize(14).font('Helvetica-Bold');
doc.text('CAPÍTULO V', { align: 'center' });
doc.text('DAS DISPOSIÇÕES FINAIS', { align: 'center' });
doc.moveDown(1);

doc.fontSize(11).font('Helvetica');
doc.text('Art. 6º Os casos omissos serão resolvidos pelo Pregoeiro, com base na legislação vigente.');
doc.moveDown(0.5);

doc.text('Art. 7º Fica eleito o foro da Comarca de São Paulo para dirimir quaisquer questões oriundas desta licitação.');
doc.moveDown(2);

doc.fontSize(12).font('Helvetica');
doc.text('São Paulo, 15 de janeiro de 2025.');
doc.moveDown(2);

doc.text('_______________________________');
doc.text('Maria Silva Santos');
doc.text('Pregoeira Municipal');

// Finaliza PDF
doc.end();

console.log('✅ PDF sintético criado com sucesso!');
console.log(`📄 Arquivo: ${outputPath}`);
console.log('');
console.log('📋 CONTEÚDO DO PDF:');
console.log('   - Página 1: Dados principais (modalidade, processo, órgão, datas, plataforma, SRP)');
console.log('   - Página 2: Capítulos I e II + 4 itens detalhados');
console.log('   - Página 3: Habilitação, penalidades e disposições finais');
console.log('');
console.log('✅ Pronto para teste com: node test-e2e.js');
