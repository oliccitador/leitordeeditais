# 🛡️ PROTOCOLO DE SEGURANÇA PRÉ-DEPLOY (ZERO ERROS)

Este documento define as **INSTRUÇÕES OBRIGATÓRIAS** que o Agente deve seguir antes de solicitar ou realizar qualquer deploy. 

> **REGRA DE OURO:** O código só sobe para produção se passar por **TODOS** os checks abaixo localmente. Deploy NÃO é ambiente de teste.

---

## 1. 🏗️ CHECKLIST DE INTEGRIDADE (Obrigatório)

Antes de considerar o deploy, execute e valide:

### A. Limpeza de Ambiente
- [ ] **Delete `.next` folder:** Garante que não há cache corrompido.
  ```bash
  rm -rf .next
  ```
- [ ] **Reinstale dependências (Se houver dúvida):**
  ```bash
  rm -rf node_modules
  npm install
  ```

### B. O Teste de Fogo (Build Local)
- [ ] **Execute o Build de Produção:**
  ```bash
  npm run build
  ```
  **CRITÉRIO DE ACEITE:** O comando deve terminar com "Compiled successfully" e **ZERO erros**. 
  *Se houver warnings de ESLint/TS que abortam o build, eles DEVEM ser corrigidos.*

### C. Validação de Tipagem (TypeScript)
- [ ] **Check estrito:**
  ```bash
  npx tsc --noEmit
  ```
  **CRITÉRIO:** Nenhum erro de tipo pode restar. Um erro de tipo aqui = Crash no deploy.

---

## 2. 🔐 AUDITORIA DE CONFIGURAÇÃO

### A. Variáveis de Ambiente (.env)
O Agente deve solicitar ao usuário que verifique no Painel da Netlify:
- [ ] `DATABASE_URL`: Está apontando para o banco de produção (Connect/Neon/Supabase)?
- [ ] `GEMINI_API_KEY`: A chave é válida e tem cota?
- [ ] `NEXTAUTH_SECRET`: Está definida (string aleatória forte)?

### B. Arquivos de Configuração
- [ ] **`netlify.toml`:** O `publish` directory está correto? (Geralmente `.next` ou `out` dependendo do export).
- [ ] **`package.json`:** O script `build` roda `next build`? A versão do Node (engines) bate com a da Netlify?

---

## 3. 🚦 PROCEDIMENTO DE DEPLOY

1. **Commit Final:** A mensagem de commit deve ser clara (ex: "chore: pre-deploy checks passed").
2. **Push:** `git push origin main` (ou branch específica).
3. **Monitoramento:** Acompanhar logs de build da Netlify em tempo real.

---

## ⚠️ EM CASO DE FALHA NO BUILD REMOTO

Se passar localmente mas falhar no Netlify:
1. **NÃO TENTE "CORRIGIR NO ESCURO".**
2. Compare a versão do Node local (`node -v`) com a do Netlify.
3. Verifique se alguma variável de ambiente está faltando no servidor.
4. Rode `npx netlify build` localmente para simular o ambiente Container.

**Assinado:** *Engenharia de Confiabilidade (SRE)*
