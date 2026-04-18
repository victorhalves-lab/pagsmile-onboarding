/**
 * Variable Dictionary — turns raw V-codes from the V4 framework into
 * human-friendly titles. Used by "Entenda o Score V4" (Bloco 2).
 *
 * The dictionary is intentionally broad — if a code isn't in the dictionary
 * we still render it with its raw form and a generic description so nothing
 * appears uninformative.
 */

const KNOWN = {
  // ─── Identity / Cadastre (V01-V15) ─────────────────────────────────
  V01: { title: 'CNPJ inativo ou suspenso na Receita Federal', category: 'Identidade' },
  V02: { title: 'Empresa com menos de 6 meses de abertura', category: 'Identidade' },
  V03: { title: 'Empresa entre 6 e 12 meses de operação', category: 'Identidade' },
  V04: { title: 'CNAE primário de risco elevado (apostas, fintech sem regulação)', category: 'Identidade' },
  V05: { title: 'CNAE primário de risco moderado', category: 'Identidade' },
  V06: { title: 'Divergência entre MCC declarado e CNAE registrado', category: 'Identidade' },
  V07: { title: 'Capital social abaixo da mediana do segmento', category: 'Identidade' },
  V08: { title: 'Endereço fiscal em escritório virtual', category: 'Identidade' },
  V09: { title: 'Empresa aberta em paraíso fiscal ou jurisdição de risco', category: 'Identidade' },
  V10: { title: 'Situação cadastral instável (múltiplas alterações recentes)', category: 'Identidade' },

  // ─── Owners / QSA (V11-V20) ─────────────────────────────────────────
  V11: { title: 'Sócio PEP (Pessoa Politicamente Exposta)', category: 'Sócios' },
  V12: { title: 'Shell Company score elevado (>40%)', category: 'Sócios' },
  V13: { title: 'Grupo econômico com histórico de problemas', category: 'Sócios' },
  V14: { title: 'Sócio com múltiplas participações em empresas inativas', category: 'Sócios' },
  V15: { title: 'Sócio estrangeiro sem documentação completa', category: 'Sócios' },

  // ─── Compliance / Legal (V16-V25) ───────────────────────────────────
  V16: { title: 'Processos judiciais ativos relevantes', category: 'Compliance' },
  V17: { title: 'Processos criminais contra sócios', category: 'Compliance' },
  V18: { title: 'Dívida ativa federal detectada', category: 'Compliance' },
  V19: { title: 'Dívida ativa estadual ou municipal', category: 'Compliance' },
  V20: { title: 'Protestos ativos em cartório', category: 'Compliance' },
  V21: { title: 'Mídia adversa (temas graves)', category: 'Compliance' },
  V22: { title: 'Mídia adversa (temas leves)', category: 'Compliance' },
  V23: { title: 'Incompatibilidade volume declarado vs porte real', category: 'Compliance' },
  V24: { title: 'Política de PLD/FT ausente ou insuficiente', category: 'Compliance' },
  V25: { title: 'Ausência de registro em órgão regulador setorial obrigatório', category: 'Compliance' },

  // ─── Operational / Activity (V26-V35) ───────────────────────────────
  V26: { title: 'Zero empregados CLT em operação declarada robusta', category: 'Operacional' },
  V27: { title: 'Domínio próprio inativo ou inexistente', category: 'Operacional' },
  V28: { title: 'Sem passagens web — baixa atividade online', category: 'Operacional' },
  V29: { title: 'Divergência entre endereço declarado e BDC', category: 'Operacional' },
  V30: { title: 'Contatos declarados não confirmados pela BDC', category: 'Operacional' },
  V31: { title: 'MCC conflita com atividade real observada', category: 'Operacional' },
  V32: { title: 'Ausência de política documentada de devolução/reembolso', category: 'Operacional' },
  V33: { title: 'Modelo de negócio em subsegmento de risco alto', category: 'Operacional' },

  // ─── Financial / Credit (V36-V45) ───────────────────────────────────
  V36: { title: 'Score de crédito PJ abaixo do limiar', category: 'Financeiro' },
  V37: { title: 'Histórico de inadimplência em bureaus', category: 'Financeiro' },
  V38: { title: 'Cheques sem fundo registrados', category: 'Financeiro' },
  V39: { title: 'Faixa de receita RFB muito abaixo do TPV declarado', category: 'Financeiro' },
  V40: { title: 'Capital social incompatível com volume declarado', category: 'Financeiro' },

  // ─── ESG (V46-V50) ───────────────────────────────────────────────────
  V46: { title: 'Embargo ambiental IBAMA ativo', category: 'ESG' },
  V47: { title: 'Auto de infração trabalhista recente', category: 'ESG' },

  // ─── Enrichment positives (E01-E15) ─────────────────────────────────
  E01: { title: 'Empresa com +5 anos de operação', category: 'Enriquecimento' },
  E02: { title: 'Empresa com +10 anos de operação', category: 'Enriquecimento' },
  E03: { title: 'Zero processos judiciais ativos', category: 'Enriquecimento' },
  E04: { title: 'Zero pendências fiscais', category: 'Enriquecimento' },
  E05: { title: 'Empresa consolidada no segmento (referência de mercado)', category: 'Enriquecimento' },
  E06: { title: 'Domínio ativo há mais de 2 anos', category: 'Enriquecimento' },
  E07: { title: 'Mais de 50 funcionários CLT registrados', category: 'Enriquecimento' },
  E08: { title: 'Certificações relevantes (ISO, PCI-DSS, etc.)', category: 'Enriquecimento' },
  E09: { title: 'Bom score de crédito PJ', category: 'Enriquecimento' },
  E10: { title: 'Registros setoriais completos', category: 'Enriquecimento' },
};

/**
 * Resolve a variable code like "V12_Shell_score_elevado" or "V12" to a descriptor.
 * Returns an object { code, title, category, hasKnownTitle } that the UI can render.
 */
export function describeVariable(raw) {
  if (!raw) return { code: '', title: '', category: '', hasKnownTitle: false };
  const str = String(raw).trim();
  const codeMatch = str.match(/^([VE]\d{2,3})/i);
  const code = codeMatch ? codeMatch[1].toUpperCase() : str;
  const suffix = codeMatch ? str.slice(codeMatch[0].length).replace(/^[_\s-]+/, '').replace(/[_]/g, ' ').trim() : '';

  const known = KNOWN[code];
  if (known) {
    return {
      code,
      title: known.title,
      category: known.category,
      suffix,
      hasKnownTitle: true,
    };
  }

  // Fallback: infer category from code prefix and use the suffix as title when available
  const isEnrichment = /^E\d/.test(code);
  return {
    code,
    title: suffix || (isEnrichment ? 'Variável de enriquecimento aplicada' : 'Variável de risco aplicada'),
    category: isEnrichment ? 'Enriquecimento' : 'Risco',
    suffix,
    hasKnownTitle: false,
  };
}