import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Admin tool: corrige leads históricos com tpvMensal absurdo (< R$ 1.000),
 * tipicamente causados por cliente digitar "5" pensando em "R$ 5 milhões"
 * antes da validação de R$ 50k mínimo entrar em vigor.
 *
 * Estratégia (sem destruir dado):
 *   1. Se ticketMedio × transacoesMes >= 50.000 → setar tpvMensal = ticket × tx (cálculo correto)
 *   2. Senão se questionnaireData.tpvMensal contém ponto/vírgula que sugere milhar
 *      (ex: "5.000000" → 5000000) → tentar parse alternativo
 *   3. Senão → marcar com flag _invalidTpv:true e zerar tpvMensal para não poluir KPIs
 *
 * Modo dry-run (default): apenas reporta o que faria.
 * Modo apply: aplica de fato.
 */

function reinterpretTpvString(raw) {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.trim();
  // "5.000000" → 5000000 (interpretar ponto como separador de milhar quando há 6+ dígitos depois)
  // "5.000.000" → 5000000
  // "5,000,000" → 5000000
  const onlyDigits = cleaned.replace(/[.,\s]/g, '');
  if (/^\d+$/.test(onlyDigits)) {
    const n = parseInt(onlyDigits, 10);
    if (n >= 50000 && n <= 1_000_000_000) return n;
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const apply = body.apply === true;
    const threshold = Number(body.threshold) || 1000; // leads com tpv < R$ 1.000

    const leads = await base44.asServiceRole.entities.Lead.list('-created_date', 5000);
    const candidates = leads.filter(l => {
      const t = Number(l.tpvMensal) || 0;
      return t > 0 && t < threshold;
    });

    const report = {
      totalLeads: leads.length,
      candidates: candidates.length,
      fixed_byTicketMedio: 0,
      fixed_byStringReinterpret: 0,
      flagged_invalid: 0,
      details: [],
    };

    for (const l of candidates) {
      const ticket = Number(l.ticketMedio) || 0;
      const tx = Number(l.transacoesMes) || 0;
      const computed = ticket * tx;

      let action = null;
      let newTpv = null;

      if (computed >= 50000) {
        action = 'fixed_byTicketMedio';
        newTpv = computed;
      } else {
        const fromString = reinterpretTpvString(l.questionnaireData?.tpvMensal);
        if (fromString) {
          action = 'fixed_byStringReinterpret';
          newTpv = fromString;
        } else {
          action = 'flagged_invalid';
        }
      }

      report.details.push({
        id: l.id, companyName: l.companyName || l.fullName, oldTpv: l.tpvMensal,
        ticket, tx, action, newTpv,
      });
      report[action]++;

      if (apply) {
        const update = {};
        if (newTpv) {
          update.tpvMensal = newTpv;
        } else {
          update.tpvMensal = 0;
          update.questionnaireData = { ...(l.questionnaireData || {}), _invalidTpv: true, _invalidTpvOriginal: l.tpvMensal };
        }
        try {
          await base44.asServiceRole.entities.Lead.update(l.id, update);
        } catch (e) {
          report.details[report.details.length - 1].error = e.message;
        }
      }
    }

    return Response.json({ ok: true, dryRun: !apply, report });
  } catch (error) {
    console.error('fixInvalidTpvLeads error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});