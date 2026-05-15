/**
 * Expand documents that must be collected once PER legal representative.
 *
 * Context: when an onboarding case has multiple representatives (the principal +
 * N additional reps captured via the REPRESENTATIVES_LIST question), the template's
 * "identity document", "address proof" and "selfie with document" entries must be
 * multiplied — one per representative — so the client uploads documents for each.
 *
 * Strategy (deliberately conservative):
 *   - We ONLY expand documents whose label matches well-known patterns for personal
 *     KYC docs of the representative. Company / business documents (contrato social,
 *     comprovante comercial, balanço, faturamento) are NEVER expanded.
 *   - Expansion happens IN-PLACE in the requiredDocuments array, replacing each
 *     matching original entry with N copies, each tagged with the representative's
 *     name in the label and a unique documentTypeId suffix.
 *   - If there are no additional representatives, we just append " — Sócio/Representante 1"
 *     to the principal's label for clarity (no multiplication).
 *
 * Inputs:
 *   - requiredDocuments: original array from the template.
 *   - representatives: ordered list of representatives. The principal MUST be at
 *     index 0 if present. Shape: [{ nome, cpf, cargo }, ...].
 *
 * Output: new array, same shape as requiredDocuments, with per-rep docs expanded.
 */

// Personal documents that must be collected for EACH legal representative.
// Detection is keyword-based on the label (case-insensitive, accent-tolerant).
// Prefixos curtos otimizados para mobile (caso real iPhone: ~280px úteis no card).
// O detalhamento completo ("CNH ou RG ou RNE ou Passaporte — frente e verso") fica na
// descrição (doc.description), que o template já carrega. Aqui só o título essencial.
const PER_REP_DOC_PATTERNS = [
  {
    key: 'identity',
    keywords: ['documento de identidade', 'identidade do', 'rg ou cnh', 'cnh ou rg', 'identidade pessoal', 'documento pessoal'],
    excludes: ['empresa', 'social', 'comercial'],
    labelPrefix: 'Documento de Identidade',
  },
  {
    key: 'address',
    keywords: ['comprovante de residência', 'comprovante de residencia', 'comprovante de endereço pessoal', 'comprovante de endereco pessoal'],
    excludes: ['empresa', 'comercial', 'sede', 'estabelecimento'],
    labelPrefix: 'Comprovante de Residência',
  },
  {
    key: 'selfie',
    keywords: ['selfie', 'biometria facial', 'foto com documento', 'autorretrato'],
    excludes: [],
    labelPrefix: 'Selfie com Documento',
  },
];

const normalize = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

function matchPattern(label) {
  const n = normalize(label);
  for (const pat of PER_REP_DOC_PATTERNS) {
    const hit = pat.keywords.some(kw => n.includes(normalize(kw)));
    if (!hit) continue;
    const excluded = pat.excludes.some(ex => n.includes(normalize(ex)));
    if (excluded) continue;
    return pat;
  }
  return null;
}

export function expandPerRepresentativeDocs(requiredDocuments, representatives) {
  if (!Array.isArray(requiredDocuments)) return requiredDocuments || [];
  const reps = Array.isArray(representatives) ? representatives.filter(r => r && (r.nome || r.cpf)) : [];

  // No reps configured → no expansion, leave template as-is
  if (reps.length === 0) return requiredDocuments;

  const expanded = [];
  for (const doc of requiredDocuments) {
    const pattern = matchPattern(doc?.label);
    if (!pattern) {
      expanded.push(doc);
      continue;
    }

    // Multiply this doc — one copy per representative.
    // Label fica enxuto ("Documento de Identidade") porque o sócio é identificado
    // pelo badge colorido no topo do card (DocumentCard.jsx).
    reps.forEach((rep, idx) => {
      const repLabel = rep.nome ? rep.nome.trim() : `Representante ${idx + 1}`;
      const baseTypeId = doc.documentTypeId || doc.id || `${pattern.key}_doc`;
      expanded.push({
        ...doc,
        documentTypeId: `${baseTypeId}__rep${idx + 1}`,
        label: pattern.labelPrefix,
        _perRepKey: pattern.key,
        _representativeIndex: idx,
        _representativeName: repLabel,
        _representativeCpf: rep.cpf || '',
      });
    });
  }

  // Diagnóstico: registra quando o expand multiplica docs (ajuda a investigar
  // casos como "por que apareceram 3 RGs?" — pode ser bug ou pode ser 3 sócios reais).
  if (reps.length > 1 && typeof window !== 'undefined') {
    try {
      const summary = {
        repsCount: reps.length,
        repsNames: reps.map(r => r?.nome || '(sem nome)'),
        expandedTotal: expanded.length,
        originalTotal: requiredDocuments.length,
      };
      // Fire-and-forget — não bloqueia render
      fetch('/functions/logPublicClientError', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'subseller:expand_per_rep_summary',
          errorMessage: `Expandiu docs para ${reps.length} representantes`,
          extra: summary,
        }),
      }).catch(() => {});
    } catch {}
  }

  return expanded;
}

/**
 * Read the additional representatives + the principal from the saved questionnaire
 * data in localStorage. Returns a unified ordered list with the principal first.
 *
 * Detection of the principal is best-effort: we look for common label patterns
 * ("nome do representante", "responsável legal", "sócio administrador") in the
 * answered questions.
 */
export function getRepresentativesFromStorage(formDataKey, questions) {
  let formData = {};
  try { formData = JSON.parse(localStorage.getItem(formDataKey) || '{}'); } catch { formData = {}; }

  // 1. Find REPRESENTATIVES_LIST answer
  let additional = [];
  for (const q of (questions || [])) {
    const val = formData[q.id];
    const textLower = normalize(q.text || '');
    const isRepsList = q.type === 'REPRESENTATIVES_LIST'
      || (textLower.includes('representante legal') && (textLower.includes('mais de um') || textLower.includes('outros')));
    if (isRepsList && val && typeof val === 'object' && Array.isArray(val.list) && val.hasMultiple) {
      additional = val.list.filter(r => r?.nome || r?.cpf);
      break;
    }
  }

  // 2. Find principal: scan questions for the rep name + CPF
  const findVal = (kws) => {
    for (const q of (questions || [])) {
      const t = normalize(q.text || '');
      if (kws.some(kw => t.includes(normalize(kw)))) {
        const v = formData[q.id];
        if (v && typeof v === 'string') return v.trim();
      }
    }
    return '';
  };
  const principalName = findVal(['nome do representante', 'responsavel legal', 'representante legal', 'socio administrador', 'nome completo']);
  const principalCpf = findVal(['cpf do representante', 'cpf do responsavel', 'cpf']);
  const principal = (principalName || principalCpf) ? [{ nome: principalName, cpf: principalCpf }] : [];

  return [...principal, ...additional];
}