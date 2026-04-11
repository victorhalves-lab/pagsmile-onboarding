import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function formatDoc(d) {
  if (!d) return '';
  if (d.length === 14) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  if (d.length === 11) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  return d;
}

function escapeCSV(val) {
  if (val == null || val === '') return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { filters = {} } = await req.json();

    const [merchants, cases, leads, scores] = await Promise.all([
      base44.asServiceRole.entities.Merchant.list('-created_date', 1000),
      base44.asServiceRole.entities.OnboardingCase.list('-created_date', 2000),
      base44.asServiceRole.entities.Lead.list('-created_date', 2000),
      base44.asServiceRole.entities.ComplianceScore.list('-created_date', 2000),
    ]);

    // Build lookup maps
    const caseMap = {};
    cases.forEach(c => {
      if (!caseMap[c.merchantId] || new Date(c.created_date) > new Date(caseMap[c.merchantId].created_date)) {
        caseMap[c.merchantId] = c;
      }
    });

    const scoreMap = {};
    scores.forEach(s => {
      if (!scoreMap[s.onboarding_case_id] || new Date(s.created_date) > new Date(scoreMap[s.onboarding_case_id].created_date)) {
        scoreMap[s.onboarding_case_id] = s;
      }
    });

    const leadByCnpj = {};
    leads.forEach(l => { if (l.cpfCnpj) leadByCnpj[l.cpfCnpj] = l; });

    // Filter merchants
    let filtered = merchants.filter(m => !m.isSubseller);
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(m => m.onboardingStatus === filters.status);
    }
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(m => m.type === filters.type);
    }
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      filtered = filtered.filter(m => new Date(m.created_date) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59);
      filtered = filtered.filter(m => new Date(m.created_date) <= to);
    }

    // Build CSV
    const headers = [
      'Nome', 'Nome Fantasia', 'CNPJ/CPF', 'Tipo', 'Status', 'E-mail', 'Telefone',
      'Segmento', 'Score V4', 'Subfaixa', 'Recomendação', 'Monitoramento',
      'Rolling Reserve %', 'Bloqueios', 'TPV Mensal', 'Ticket Médio',
      'Agente Comercial', 'Introducer', 'Data Criação'
    ];

    const rows = filtered.map(m => {
      const c = caseMap[m.id];
      const s = c ? scoreMap[c.id] : null;
      const l = leadByCnpj[m.cpfCnpj];
      return [
        m.fullName,
        m.companyName,
        formatDoc(m.cpfCnpj),
        m.type,
        m.onboardingStatus,
        m.email,
        m.phone,
        l?.businessSubCategory || '',
        s?.score_final ?? c?.riskScoreV4 ?? '',
        s?.subfaixa_nome || c?.subfaixaNome || '',
        s?.recomendacao_final || '',
        s?.monitoramento_nivel || c?.monitoramentoNivel || '',
        s?.rolling_reserve_percent ?? '',
        s?.bloqueios_ativos?.join('; ') || '',
        l?.tpvMensal || '',
        l?.ticketMedio || '',
        l?.commercialAgentName || c?.commercialAgentName || '',
        l?.introducerName || '',
        m.created_date ? new Date(m.created_date).toLocaleDateString('pt-BR') : '',
      ].map(escapeCSV);
    });

    // BOM for Excel UTF-8
    const BOM = '\uFEFF';
    const csv = BOM + headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=relatorio_cadastro_${new Date().toISOString().slice(0, 10)}.csv`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});