# 🔧 GUIA: Ativando a Generative Language API no Google Cloud

## Problema Identificado
A chave API (`AIzaSy...REDACTED`) foi criada, mas a **Generative Language API** não está ativada no projeto.

Erro recebido:
```
[404 Not Found] models/gemini-pro is not found for API version v1beta
```

## Solução: Ativar a API

### Passo 1: Acessar o Console do Google Cloud
1. Acesse: https://console.cloud.google.com/
2. Certifique-se que o projeto correto está selecionado (o mesmo onde você criou a chave API)

### Passo 2: Ativar a Generative Language API
1. No menu lateral, vá em **APIs e serviços** → **Biblioteca**
2. Na barra de busca, digite: `Generative Language API`
3. Clique no resultado **"Generative Language API"**
4. Clique no botão azul **ATIVAR** (Enable)
5. Aguarde alguns segundos até a ativação ser concluída

**Link direto:** https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com

### Passo 3: Verificar se funcionou
Após ativar a API, execute novamente:
```bash
node test-gemini-connection.js
```

Se aparecer "✅ Gemini API funcionando corretamente!", está tudo certo!

---

## Alternativa: Usar o AI Studio (Mais Simples)

Se preferir não mexer no Google Cloud Console, você pode:

1. Acessar: https://aistudio.google.com/app/apikey
2. Clicar em **"Create API key"**
3. Selecionar **"Create API key in new project"**
4. Copiar a nova chave gerada
5. Substituir no `.env.local`:
   ```
   GEMINI_FLASH_KEY=<nova_chave_aqui>
   ```

As chaves criadas pelo AI Studio já vêm com a API ativada automaticamente.

---

## Próximos Passos
Após ativar a API ou gerar nova chave:
1. Execute `node test-gemini-connection.js` para validar
2. Execute `node debug-live-api.js` para testar a extração de itens
3. Se tudo funcionar, o Agente 3 estará 100% operacional com Gemini!
