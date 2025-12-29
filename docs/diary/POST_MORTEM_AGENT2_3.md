# Post-Mortem e Solução: Crise dos Agentes 2 e 3 (16/12/2025)

## 1. O Incidente
Durante a implementação de melhorias no Agente 3 (Extração de Itens) para corrigir descrições vazias, foram introduzidas duas regressões graves que paralisaram o sistema:
1. **Agente 2 (Estrutura) Falhou Completamente:** Retornando "SEM DADOS NO ARQUIVO".
2. **Agente 3 (Itens) Falhou Parcialmente:** Ignorando itens válidos como "Prateleira" e falhando em capturar "Item 4".

## 2. Diagnóstico

### A. Agente 2 - Estrutura
- **Sintoma:** Todos os campos (Modalidade, Órgão, Datas) vinham vazios.
- **Causa Raiz 1 (Isolamento Inadequado):** A tentativa de "blindar" os agentes usando `structuredClone(CORPO_INTEGRADO)` removeu métodos e protótipos essenciais dos objetos, causando falhas internas silenciosas.
- **Causa Raiz 2 (Rate Limit API):** Após reverter o isolamento, o Agente 2 voltou a executar, mas colidiu com o limite de requisições (Rate Limit 429) do modelo `llama-3.3-70b-versatile` no Groq, resultando em resposta vazia.

### B. Agente 3 - Itens
- **Sintoma:** Itens como "5 prateleira..." e "Item 4..." eram ignorados.
- **Causa Raiz 1 (Regex Guloso de Exclusão):** O regex de exclusão de termos legais (`/LEI|ATA|.../`) não usava limites de palavra (`\b`). Resultado: Palavras como "PRATE**LEI**RA" e "BAT**ATA**" eram descartadas por conterem "LEI" e "ATA".
- **Causa Raiz 2 (Regex de Captura):** O padrão "Item X" exigia separadores específicos (`[\s.-]`) e falhava com dois pontos (`:`) em "ITEM 4: COMPUTADOR".

## 3. Soluções Aplicadas

### Correções no Agente 2
1. **Isolamento Mantido:** O uso de `structuredClone` foi mantido para garantir integridade dos dados entre agentes.
2. **Troca de Modelo LLM:** Migrado de `llama-3.3-70b` para `mixtral-8x7b-32768` (Groq), que possui limites de API mais permissivos e maior estabilidade, resolvendo o problema de "SEM DADOS".
3. **Otimização de Contexto:** Contexto reduzido de 25k para 15k tokens para evitar gargalos.

### Correções no Agente 3 (V2)
1. **Regex de Exclusão Inteligente:** Adicionado word boundaries (`\bTERM\b`) para evitar falsos positivos em palavras compostas.
2. **Regex de Captura Universal (Dragnet V5):** Expandido conjunto de separadores para incluir `:` e `)`.
3. **Confirmação via Stress Test:** Todos os itens de teste agora são capturados com sucesso.

## 5. O Incidente do Processo Zumbi
Mesmo após aplicar as correções, o sistema continuou apresentando falhas ("sem informações") porque o processo Node.js antigo (porta 3000) não foi encerrado corretamente e continuou servindo a versão antiga do código.
- **Ação:** Identificados e exterminados processos zumbis (PIDs 5148, 7120) via `taskkill`.
- **Resultado:** Nova instância limpa iniciada na porta 3000 com todas as correções ativas.
