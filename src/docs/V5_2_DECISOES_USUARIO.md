# V5.2 — DECISÕES CONFIRMADAS PELO USUÁRIO

**Registro de todas as Q&A para preservar contexto entre sessões**

---

## Bloco 1 — Fundamentos

### Q1 — Conflito Marketplace Tier
**Pergunta:** MASTER_INDEX e GLOSSARIO dizem Marketplace = Tier 3 only. Tier Framework Errata E1 diz Marketplace = Tier 2 fixo. Qual é a verdade?

**✅ Resposta:** **Tier 2 fixo** (segue Errata E1 do TierFramework).

**Implicação no código:** `lib/v5_1/tiers.js` já está correto neste ponto.

---

### Q2 — Segmentos legados no enum
**Pergunta:** Enum atual tem `link_pagamento, foodtech, mpe, pix_merchant, pix_intermediario` que não aparecem nos docs V5.1. Removo?

**✅ Resposta:** **Manter por compatibilidade** com dados V4 legados.

**Implicação no código:** Não remover esses valores do enum `OnboardingCase.segmento_v5_1`. Apenas ADICIONAR os faltantes V5.1 (turismo, eventos, servicos_b2b, servicos_locais, crossborder).

---

### Q3 — Renomear capabilities para canônicas
**Pergunta:** Renomear `cap_marketplace_kyc`, `cap_crossborder_compliance`, `cap_subseller_kyb` para nomes canônicos dos docs?

**✅ Resposta:** **Sim, renomear para canônicas** dos docs V5.1/V5.2.

**Implicação no código:**
- `cap_marketplace_kyc` → `splits/subseller`
- `cap_crossborder_compliance` → `crossborder`
- `cap_subseller_kyb` → manter (mas reavaliar se é redundante com splits/subseller)
- Adicionar `recurrence` (nova, não existe no código)
- Adicionar/manter `cap_financial_capacity_validation` (correto, do Apêndice V5.1)

---

### Q4 — Corrigir escala de score
**Pergunta:** Confirmar que Tier 3 = 0-999 e os outros 4 tiers = 0-850?

**✅ Resposta:** **Sim, corrigir**.

**Estado atual ERRADO em `scoringV5_1.js`:**
- Tier 1 → 0 a 499 ❌
- Tier 2 → 0 a 849 ❌
- Tier 3 → 0 a 849 ❌
- Subseller → 0 a 999 ❌

**Estado alvo (canônico GLOSSARIO §2):**
- Tier 1 → 0 a 850 ✅
- Tier 2 → 0 a 850 ✅
- Tier 3 → **0 a 999** ✅
- Subseller PJ → 0 a 850 ✅
- Subseller PF → 0 a 850 ✅

---

### Q5 — TPV thresholds
**Pergunta:** Confirmar Tier 1 < R$50k/mês, Tier 2 R$50k-500k, Tier 3 > R$500k?

**✅ Resposta:** **Sim**.

---

### Q6 — Patch obrigatório Tier 1
**Pergunta:** Patch Financeiro obrigatório em Tier 1 só em Gateway+Dropshipping (já que Marketplace é Tier 2 e Crossborder é Tier 3)?

**✅ Resposta:** **Sim**.

**Implicação:** `cap_financial_capacity_validation.segmentos_forca_ativacao` deve ser `['gateway', 'dropshipping']` para forçar ativação em Tier 1.

---

### Q7 — Implementar ou só diagnosticar
**Pergunta:** Implementar agora ou só diagnóstico?

**✅ Resposta:** **Só diagnóstico** no momento.

---

## Bloco 2 — Datasets + Bloqueios

### Q8 — V5.1 vs V5.2 do DOC5
**Pergunta:** DOC5 V5.2 sobrescreve V5.1. Migro tudo para V5.2?

**✅ Resposta:** **V5.2**.

**Implicações estruturais:**
1. `framework_version` muda de `"v5.1"` para `"v5.2"` em casos NOVOS
2. Casos V5.1 já existentes mantêm `"v5.1"` (preservação histórica)
3. Schema `Bloqueio` precisa 8 campos novos (decisao_padrao, nucleo_duro_regulatorio, admite_categoria_5, tpv_cap_inicial_pct, rolling_reserve_adicional_pct, gatilhos_off_boarding_agil, etc.)
4. Schema `Exception` precisa adicionar `cat_5_monitoramento_intensivo` + 8 campos Cat 5
5. Função `aplicar_matriz_decisao_v5_1` → `aplicar_matriz_decisao_v5_2` com 3 listas canônicas hardcoded
6. Pasta `lib/v5_1/` → `lib/v5_2/`
7. Score Engine `scoringV5_1.js` → `scoringV5_2.js`
8. Nova entidade `PlanoMonitoramento`
9. Nova entidade `TermoAdicionalV5_2`
10. 3 novos princípios (V5-13, V5-14, V5-15) na documentação

---

### Q9 — Mesa de Monitoramento Transacional
**Pergunta:** Implementar Mesa de Monitoramento (dashboard real-time + workflow off-boarding ágil)?

**✅ Resposta:** **Não se preocupa — já temos aqui (encaminhado pelo usuário fora do escopo do código).**

**Implicação:** NÃO implementar:
- Dashboard real-time
- Workflow off-boarding ágil 24-48h
- Sistema de alertas tempo-real
- Roles especializadas L1/L2/Officer separadas em código

Mas SIM implementar:
- Estrutura de dados (`PlanoMonitoramento`, `TermoAdicionalV5_2`) para que quando a Mesa precisar de dados, eles existam no banco

---

### Q10 — Catalogar 58 datasets mesmo sem BDC contratado
**Pergunta:** Sigo criando os 58 datasets no catálogo mesmo que ~30 ainda não estejam ativos no BDC?

**✅ Resposta:** **Pode criar** todos os 58 com flag `ativo=false` para os não-contratados.

**Implicação:** Seedar 58 registros na entidade `Dataset`:
- Os ~30 já contratados/funcionando → `ativo: true`
- Os ~28 ainda em negociação BDC ou novos → `ativo: false`
- Catálogo canônico preservado, ativação posterior sem deploy

---

### Q11 — Renomear bloqueios para nomes canônicos
**Pergunta:** Meus bloqueios têm `B-FIN-03`, `B-OPE-10`, `B-KYB-30` (nomes errados). Renomear para canônicos do DOC5?

**✅ Resposta:** **Sim, renomear**.

**Implicação:**
- Deletar 10 bloqueios atuais com IDs errados (`B-KYB-30/31`, `B-OPE-10/11/20/21`, `B-FIN-03/04/05`)
- Recriar com IDs canônicos do DOC5 V5.2: `B01-B10`, `B-FIN-1` a `B-FIN-4`, `B-PLD-1` a `B-PLD-8`, `B-CAP-SPLITS-1`, `B-CB-1`, `B-CB-2`, `B-INT-1`, `B-CNJ-IMPROB-1`, `B-EC-*`, `B-MKT-*`, `B-GW-*`, `B-SAAS-*`, `B-INFO-*`, `B-PV-*`, `B-TUR-*`, `B-EVT-*`, `B-B2B-*`, `B-DS-*`, `B-LOC-*`, `B-EDU-*`
- Total: ~72 bloqueios

---

### Q12 — Continuar diagnóstico ou começar a implementar
**Pergunta:** Continuo só com diagnóstico ou começo a corrigir?

**✅ Resposta:** **Continuar SÓ diagnóstico** — salvar TUDO em arquivos `.md` em `docs/` e implementar tudo de uma vez no final, de forma consistente.

**Justificativa do usuário:** "Não faz mais sentido do que ficar implementando um pouco a pouco" — quer arquitetura coerente, não retrabalho.

---

## Bloco 3 — Tiers + Subsellers (perguntas em aberto)

### Q13 — 3 modos de integração subseller
Implementar **todos os 3** (API direta + SDK Drop-in + White-label) ou só um para começar?
**Status:** ⏳ Aguardando resposta

### Q14 — Webhook subseller → seller mestre
Construir infraestrutura agora ou deixar pendente para depois?
**Status:** ⏳ Aguardando resposta

### Q15 — Pix recebedor titularidade (dataset crítico)
Validar via BDC, integração PSP direta, ou Open Finance?
**Status:** ⏳ Aguardando resposta

### Q16 — DIRPF upload para Subseller PF Grau C
Upload pelo cliente (mais simples) ou integração com Receita (mais caro)?
**Status:** ⏳ Aguardando resposta

---

## 🔒 PRINCÍPIOS NÃO-NEGOCIÁVEIS DEFINIDOS

1. **DNA imutável** — caso V4 nascido nasce V4, V5.1 nasce V5.1, V5.2 nasce V5.2 (preservação histórica)
2. **Marketplace = Tier 2 fixo** (errata E1 vale)
3. **Crossborder, Gateway, Dropshipping = segmentos críticos** com Patch obrigatório mesmo em Tier 1
4. **Núcleo regulatório duro = 9 bloqueios INTOCÁVEIS** sem exceção (B03, B04, B08, B-PLD-2, B-PLD-4, B-CB-1, B-INT-1, B-MKT-PROD-CRIT-1, B-PV-LGPD-1-CRIT)
5. **Categoria 5 (Monitoramento Intensivo) é V5.2 NOVA** — diferente das Cats 1-4 (V5.1 temporárias)
6. **Bloqueios operacionais do cliente NUNCA recusam** — vão sempre para Aprovado c/ Cond. + Monitoramento (diretiva executiva V5.2)
7. **Tier 3 score = 0-999** (todos os outros tiers = 0-850)
8. **Subseller PJ/PF tem 3 GRAUS A/B/C**, não tiers escalonados
9. **Score subseller herda do seller mestre** com fator_grau (A=0.4, B=0.6, C=0.8)
10. **Subseller PF usa RENDA MENSAL LÍQUIDA** (não TPV) para resolver Grau
11. **`pix_recebedor_titularidade` é dataset crítico** em QUALQUER Grau PF (defesa anti-fraude primária)
12. **B-CNPJ-NOVO é regra TRANSVERSAL** em todos os tiers + subsellers (CNPJ <6 meses → Revisão Manual obrigatória)
13. **Tier 3 tem Base + 9 Módulos** (não é monolítico) — único tier modular
14. **NÃO existe Tier 4** — sellers gigantes (>R$50M/mês) ficam em Tier 3 com monitoramento intensivo