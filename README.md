# 🛡️ O LICITADOR BLINDADO

> Sistema Inteligente de Análise Automática de Licitações Públicas

[![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)](https://github.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14.1-black)](https://nextjs.org/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-4285F4)](https://ai.google.dev/)

---

## 📋 Sobre o Projeto

**O Licitador Blindado** é um sistema de análise automática de licitações públicas que utiliza **arquitetura multi-agentes** e **inteligência artificial** para:

✅ Analisar editais e documentos correlatos com **zero alucinação**  
✅ Classificar itens por CNAE da empresa  
✅ Detectar ilegalidades e divergências  
✅ Gerar relatórios estratégicos e minutas jurídicas  
✅ Emitir recomendação GO/NO-GO fundamentada  

### 🎯 Diferenciais

- **OCR Obrigatório** em 100% dos documentos
- **9 Agentes Especializados** coordenados por orquestrador central
- **Conformidade Legal Total** (Lei 14.133/2021 e legislação correlata)
- **Citação Obrigatória** de documento, página e trecho
- **Sistema Anti-Alucinação** rigoroso
- **Relatórios Completos** em HTML e PDF

---

## 🏗️ Arquitetura

### Orquestrador Central
**Master Licitator** - Coordena todos os agentes e garante conformidade

### 9 Agentes Especializados

1. **🔍 Ingestor Engine** - OCR e ingestão de documentos
2. **📊 Structure Mapper** - Extração de estrutura do edital
3. **🏷️ Item Classifier** - Classificação de itens por CNAE
4. **✅ Compliance Checker** - Análise de habilitação
5. **🔧 Technical Validator** - Validação de capacidade técnica
6. **⚖️ Legal Mind Engine** - Análise jurídica e minutas
7. **🔄 Divergence Scanner** - Detector de divergências Edital × TR
8. **🎯 Decision Core** - Decisão estratégica GO/NO-GO
9. **📄 Report Synthesizer** - Geração de relatórios e PDFs

---

## 🚀 Tecnologias

### Core
- **Next.js 14** - Framework React com App Router
- **Node.js 18+** - Runtime JavaScript
- **Google Gemini 1.5 Pro** - IA para análises complexas

### Processamento
- **Tesseract.js** - OCR open source
- **pdf-parse** - Leitura de PDFs
- **Sharp** - Processamento de imagens
- **Puppeteer** - Geração de PDFs

### Deploy
- **Netlify** - Hosting e Functions
- **Serverless** - Arquitetura escalável

---

## 📦 Instalação

### Pré-requisitos

```bash
node >= 18.0.0
npm >= 9.0.0
```

### Clone e Instale

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/licitador-blindado.git

# Entre no diretório
cd licitador-blindado

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local e adicione sua GEMINI_API_KEY
```

### Configure a API Key do Gemini

1. Obtenha uma API key em: https://ai.google.dev/
2. Adicione no `.env.local`:

```bash
GEMINI_API_KEY=sua_api_key_aqui
```

---

## 🏃‍♂️ Executando

### Desenvolvimento

```bash
npm run dev
```

Acesse: `http://localhost:3000`

### Produção (Build Local)

```bash
npm run build
npm start
```

### Deploy na Netlify

```bash
# Instale Netlify CLI
npm install -g netlify-cli

# Faça login
netlify login

# Deploy
netlify deploy --prod
```

---

## 📚 Documentação

- [📖 Documentação Oficial](docs/DEV_DOC_v1.0.md) - Arquitetura completa
- [📊 Plano de Implementação](IMPLEMENTATION_PLAN.md) - Roadmap detalhado
- [✅ Status do Projeto](PROJECT_STATUS.md) - Progresso atual

---

## 🔒 Regras Absolutas

### 1. Zero Alucinação
- ❌ Sem inferências
- ❌ Sem dados inventados
- ✅ Use "SEM DADOS NO ARQUIVO" quando não encontrar

### 2. Citação Obrigatória
Toda conclusão DEVE incluir:
```json
{
  "documento": "Edital.pdf",
  "pagina": 12,
  "trecho": "texto literal extraído"
}
```

### 3. Conformidade Legal
Análises em conformidade com:
- Lei 14.133/2021
- Lei 8.666/1993, 10.520/2002
- Lei 12.462/2011, 13.303/2016
- LC 123/2006
- Jurisprudência TCU/TCEs

---

## 📂 Estrutura do Projeto

```
licitador-blindado/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── analyze/          # Endpoint principal
│   │   └── health/           # Health check
│   ├── layout.js
│   └── page.js
├── lib/
│   ├── orchestrator/         # Orquestrador Central
│   ├── agents/               # 9 Agentes Especializados
│   ├── services/             # Serviços (logging, OCR, PDF)
│   ├── types/                # Schemas TypeScript
│   └── utils/                # Utilitários (base legal, CNAE)
├── docs/                     # Documentação
├── public/                   # Assets estáticos
└── netlify.toml              # Configuração Netlify
```

---

## 🧪 Testes

```bash
# Testes unitários
npm test

# Testes com watch mode
npm run test:watch
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👥 Autores

**Equipe de Desenvolvimento**
- Desenvolvimento Principal
- Arquitetura de Software
- Análise Jurídica

---

## 📞 Contato

- **Email:** contato@licitadorblindado.com.br
- **Website:** https://licitadorblindado.com.br

---

## ⚡ Status do Desenvolvimento

**Versão Atual:** 0.1.0 (Alpha)  
**Progresso:** 35%  
**Próxima Release:** v0.2.0 - Agentes 3-5 implementados

### Changelog

#### [0.1.0] - 2025-12-12
- ✅ Estrutura base do projeto
- ✅ Orquestrador Central implementado
- ✅ Agente 1 (Ingestor Engine) - OCR
- ✅ Agente 2 (Structure Mapper) - Extração estrutural
- ✅ Sistema de logging completo
- ✅ Base legal e validações

---

**Desenvolvido com ❤️ para tornar licitações públicas mais eficientes e transparentes**
