import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * analyzeBrokenTpv — Lê todos os leads com tpvMensal < 50.000 (corrompidos)
 * e propõe uma correção baseada na string original digitada (questionnaireData.tpvMensal).
 *
 * Lógica: se o cliente digitou "200.000" (string), o backend salvou como 200 (number).
 * A string original está preservada em questionnaireData.tpvMensal.
 *
 * Modo padrão: dryRun=true (apenas analisa, não escreve).
 * Para aplicar: { dryRun: false, apply: true }.
 */

// Tenta interpretar string brasileira: "200.000" → 200000, "1.500.000" → 1500000,
// "200000" → 200000, "200,000" → 200000, "200.000,00" → 200000.
function parseBrazilianNumber(str) {
  if (str == null) return null;
  const s = String(str).trim();
  if (!s) return null;

  // Remove R$, espaços
  let cleaned = s.replace(/[Rr]\$\s*/g, '').replace(/\s/g, '');

  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  if (hasComma && hasDot) {
    // Formato BR: "200.000,00" → ponto = milhar, vírgula = decimal
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    // só vírgula → decimal
    cleaned = cleaned.replace(',', '.');
  } else if (hasDot) {
    // só ponto: ambíguo. Heurística:
    // "200.000" (3 dígitos após o ponto) e sem outros pontos → milhar
    // "1.5" (1-2 dígitos após) → decimal
    const parts = cleaned.split('.');
    const lastPart = parts[parts.length - 1];
    if (parts.length > 2) {
      // múltiplos pontos = todos milhares: "1.500.000"
      cleaned = parts.join('');
    } else if (lastPart.length === 3) {
      // "200.000" → 200000
      cleaned = parts.join('');
    }
    // senão mantém como decimal: "1.5" → 1.5
  }

  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

// Decide o TPV correto: prioriza o que foi digitado pelo cliente (questionnaireData.tpvMensal),
// fallback para arredondar ao múltiplo de 1000 mais próximo se >= 50.
function proposeCorrection(savedNum, originalStr) {
  const fromOriginal = parseBrazilianNumber(originalStr);

  // Caso 1: a string original interpretada dá um valor >= 50.000 → usar
  if (fromOriginal != null && fromOriginal >= 50000) {
    return { value: fromOriginal, source: 'questionnaireData_string', confidence: 'HIGH' };
  }

  // Caso 2: a string original em si parece o número certo mas multiplicado por 1000
  // ex: salvou 200, original "200" → cliente quis dizer 200.000
  if (fromOriginal != null && fromOriginal === savedNum && savedNum > 0 && savedNum < 1000) {
    return {
      value: savedNum * 1000,
      source: 'multiply_by_1000',
      confidence: 'MEDIUM',
      note: `Cliente digitou ${savedNum} — provavelmente quis ${savedNum * 1000}`,
    };
  }

  // Caso 3: nada interpretável → sugerir multiplicar por 1000 se for valor pequeno
  if (savedNum > 0 && savedNum < 1000) {
    return {
      value: savedNum * 1000,
      source: 'multiply_by_1000_fallback',
      confidence: 'LOW',
      note: `Sem string original confiável — sugestão: multiplicar por 1000`,
    };
  }

  // Caso 4: valor entre 1.000 e 50.000 — sem hipótese clara
  return { value: null, source: 'manual_review_required', confidence: 'NONE' };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const dryRun = body.dryRun !== false; // default true
    const apply = body.apply === true;
    const onlyIds = Array.isArray(body.onlyIds) ? body.onlyIds : null;

    // Busca todos os leads com tpvMensal corrompido (< 50.000 e > 0)
    const leads = await base44.asServiceRole.entities.Lead.filter(
      { tpvMensal: { $gt: 0, $lt: 50000 } },
      '-created_date',
      500
    );

    const analysis = leads.map(lead => {
      const saved = Number(lead.tpvMensal) || 0;
      const originalStr = lead.questionnaireData?.tpvMensal;
      const proposed = proposeCorrection(saved, originalStr);

      return {
        id: lead.id,
        protocolo: lead.protocolo,
        companyName: lead.companyName || lead.fullName,
        cpfCnpj: lead.cpfCnpj,
        email: lead.email,
        contactName: lead.contactName,
        segmento: lead.businessSubCategory,
        status: lead.status,
        createdAt: lead.created_date,
        savedTpv: saved,
        originalDigitado: originalStr ?? null,
        ticketMedio: lead.ticketMedio || lead.questionnaireData?.ticketMedio || null,
        faturamentoAnual: lead.questionnaireData?.faturamentoAnual || null,
        proposedTpv: proposed.value,
        proposedSource: proposed.source,
        proposedConfidence: proposed.confidence,
        proposedNote: proposed.note || null,
      };
    });

    // Resumo por nível de confiança
    const summary = {
      total: analysis.length,
      byConfidence: {
        HIGH: analysis.filter(a => a.proposedConfidence === 'HIGH').length,
        MEDIUM: analysis.filter(a => a.proposedConfidence === 'MEDIUM').length,
        LOW: analysis.filter(a => a.proposedConfidence === 'LOW').length,
        NONE: analysis.filter(a => a.proposedConfidence === 'NONE').length,
      },
      autoFixable: analysis.filter(a => a.proposedTpv != null).length,
      manualReview: analysis.filter(a => a.proposedTpv == null).length,
    };

    // Modo execução: aplica correções nos leads selecionados (ou todos com confiança HIGH/MEDIUM)
    let applied = [];
    if (apply && !dryRun) {
      const toFix = analysis.filter(a => {
        if (onlyIds) return onlyIds.includes(a.id) && a.proposedTpv != null;
        return a.proposedTpv != null && (a.proposedConfidence === 'HIGH' || a.proposedConfidence === 'MEDIUM');
      });

      for (const item of toFix) {
        try {
          await base44.asServiceRole.entities.Lead.update(item.id, {
            tpvMensal: item.proposedTpv,
          });
          applied.push({ id: item.id, protocolo: item.protocolo, from: item.savedTpv, to: item.proposedTpv });
        } catch (e) {
          applied.push({ id: item.id, protocolo: item.protocolo, error: e.message });
        }
      }
    }

    return Response.json({
      mode: apply && !dryRun ? 'APPLIED' : 'DRY_RUN',
      summary,
      analysis,
      applied,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});