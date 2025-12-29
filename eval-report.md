# 📊 Relatório de Validação Automática (Evals)
**Data:** 22/12/2025, 13:31:25
**Score Global:** 3/4 (75%)

## Detalhes por Arquivo
| Arquivo | Status | Score | Duração | Falhas Principais |
|---|---|---|---|---|
| **divergence_test_01.pdf** | ❌ | 67% | 53.3s | [Divergence] Esperada divergência, mas nenhuma encontrada. |
| **sample_01.pdf** | ✅ | 100% | 64.6s | None |
| **sample_02.pdf** | ✅ | 100% | 66.6s | None |
| **sample_03.pdf** | ✅ | 100% | 59.0s | None |

## Detalhes Técnicos
### divergence_test_01.pdf
```json
{
  "Structure.Modalidade": "OK",
  "Structure.Processo": "OK",
  "Divergence.Detection": "FAIL (0 found)"
}
```
### sample_01.pdf
```json
{
  "Structure.Modalidade": "OK",
  "Structure.Processo": "OK",
  "Compliance.Keyword.FGTS": "OK",
  "Compliance.Keyword.CNDT": "OK"
}
```
### sample_02.pdf
```json
{
  "Structure.Modalidade": "OK",
  "Structure.Processo": "OK",
  "Compliance.Keyword.FGTS": "OK",
  "Compliance.Keyword.CNDT": "OK"
}
```
### sample_03.pdf
```json
{
  "Structure.Modalidade": "OK",
  "Structure.Processo": "OK",
  "Compliance.Keyword.FGTS": "OK"
}
```