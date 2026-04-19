import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Shield, Building2, User, AlertTriangle, CheckCircle2, XCircle,
  Users, FileSearch, Scale, Globe, TrendingUp, Activity
} from 'lucide-react';

/**
 * EnterpriseExecutiveSummary — Resumo executivo para análise de casos PIX API Enterprise.
 * Renderiza um "at-a-glance" das principais fontes de risco cruzando dados declarados (questionário)
 * com dados BDC enriquecidos e verificação CAF. Foco: agilidade do analista.
 *
 * Não altera business logic — apenas apresenta dados já coletados pelos backends existentes
 * (bdcEnrichCase, cafPostCaptureAnalysis, autoEnrichOnboarding).
 */
export default function EnterpriseExecutiveSummary({
  onboardingCase,
  merchant,
  complianceScore,
  validations = [],
  integrationLogs = [],
}) {
  const summary = useMemo(() => buildSummary({ onboardingCase, merchant, complianceScore, validations, integrationLogs }), [onboardingCase, merchant, complianceScore, validations, integrationLogs]);

  if (!summary) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-200 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-[var(--pagsmile-blue)]">Executive Summary — PIX API Enterprise</h3>
          <p className="text-[11px] text-[var(--pagsmile-blue)]/50">Visão rápida para o time de compliance</p>
        </div>
        {summary.recommendation && (
          <Badge className={`${summary.recommendation.bg} ${summary.recommendation.color} border-0 text-[10px]`}>
            {summary.recommendation.label}
          </Badge>
        )}
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={Building2} label="Empresa" value={summary.companyStatus.label} color={summary.companyStatus.color} />
        <KPI icon={User} label="Representante" value={summary.representativeStatus.label} color={summary.representativeStatus.color} />
        <KPI icon={Users} label="Sócios / UBOs" value={`${summary.ownersCount} analisados`} color="text-[var(--pagsmile-blue)]" />
        <KPI icon={Scale} label="Score Final" value={summary.score != null ? `${summary.score}` : '—'} color={summary.scoreColor} />
      </div>

      {/* Pontos críticos */}
      {summary.criticalPoints.length > 0 && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="text-xs font-bold text-red-700">Pontos Críticos ({summary.criticalPoints.length})</p>
          </div>
          <ul className="space-y-1">
            {summary.criticalPoints.map((p, i) => (
              <li key={i} className="text-[11px] text-red-700/90 flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pontos positivos */}
      {summary.positivePoints.length > 0 && (
        <div className="p-3.5 rounded-xl bg-green-50 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <p className="text-xs font-bold text-green-700">Pontos Positivos ({summary.positivePoints.length})</p>
          </div>
          <ul className="space-y-1">
            {summary.positivePoints.map((p, i) => (
              <li key={i} className="text-[11px] text-green-700/90 flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cruzamento declarado vs enriquecido */}
      {summary.crossValidation.length > 0 && (
        <div className="p-3.5 rounded-xl bg-white border border-[var(--pagsmile-blue)]/8">
          <div className="flex items-center gap-2 mb-2.5">
            <FileSearch className="w-4 h-4 text-[var(--pagsmile-blue)]/60" />
            <p className="text-xs font-bold text-[var(--pagsmile-blue)]">Declarado vs Enriquecido</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {summary.crossValidation.map((row, i) => (
              <div key={i} className={`p-2 rounded-lg border text-[10px] ${row.match ? 'bg-green-50/40 border-green-100' : 'bg-amber-50/40 border-amber-100'}`}>
                <div className="flex items-center gap-1.5">
                  {row.match ? <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" /> : <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />}
                  <span className="font-semibold text-[var(--pagsmile-blue)]">{row.field}</span>
                </div>
                <div className="mt-1 ml-4.5 space-y-0.5">
                  <p className="text-[var(--pagsmile-blue)]/50">Declarado: <span className="text-[var(--pagsmile-blue)]">{row.declared || '—'}</span></p>
                  <p className="text-[var(--pagsmile-blue)]/50">Encontrado: <span className="text-[var(--pagsmile-blue)]">{row.found || '—'}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Indicadores de atividade */}
      {summary.activityIndicators && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <ActivityBadge icon={Activity} label="NF Emitidas" value={summary.activityIndicators.invoices} />
          <ActivityBadge icon={Globe} label="Domínios" value={summary.activityIndicators.domains} />
          <ActivityBadge icon={TrendingUp} label="Indicadores" value={summary.activityIndicators.totalIndicators} />
          <ActivityBadge icon={FileSearch} label="Datasets OK" value={summary.activityIndicators.datasetsOk} />
        </div>
      )}
    </div>
  );
}

function KPI({ icon: Icon, label, value, color }) {
  return (
    <div className="p-3 rounded-xl bg-white border border-[var(--pagsmile-blue)]/5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3 h-3 ${color || 'text-[var(--pagsmile-blue)]/40'}`} />
        <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--pagsmile-blue)]/40">{label}</p>
      </div>
      <p className={`text-sm font-bold ${color || 'text-[var(--pagsmile-blue)]'}`}>{value}</p>
    </div>
  );
}

function ActivityBadge({ icon: Icon, label, value }) {
  return (
    <div className="p-2 rounded-lg bg-white border border-[var(--pagsmile-blue)]/5 flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-[var(--pagsmile-blue)]/40" />
      <div>
        <p className="text-[9px] text-[var(--pagsmile-blue)]/40 leading-none">{label}</p>
        <p className="text-xs font-bold text-[var(--pagsmile-blue)]">{value ?? '—'}</p>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
//  Builder — puramente computacional, sem side-effects
// ═════════════════════════════════════════════════════════════════
function buildSummary({ onboardingCase, merchant, complianceScore, validations, integrationLogs }) {
  if (!onboardingCase && !merchant && !complianceScore) return null;

  // Score
  const score = complianceScore?.score_final ?? onboardingCase?.riskScoreV4 ?? null;
  const scoreColor = score == null ? 'text-[var(--pagsmile-blue)]/40'
    : score <= 200 ? 'text-green-600'
    : score <= 400 ? 'text-blue-600'
    : score <= 600 ? 'text-amber-600'
    : 'text-red-600';

  // Recomendação final
  const recMap = {
    'Aprovado': { label: 'Aprovado', bg: 'bg-green-100', color: 'text-green-700' },
    'Aprovado com Condições': { label: 'Com Condições', bg: 'bg-blue-100', color: 'text-blue-700' },
    'Revisão Manual': { label: 'Revisão Manual', bg: 'bg-amber-100', color: 'text-amber-700' },
    'Recusado': { label: 'Recusado', bg: 'bg-red-100', color: 'text-red-700' },
  };
  const recommendation = complianceScore?.recomendacao_final ? (recMap[complianceScore.recomendacao_final] || null) : null;

  // BDC data (já persistido pelos validations/logs)
  const bdcLogs = [...validations, ...integrationLogs].filter(r => r.provider === 'BigDataCorp');
  const bdcOk = bdcLogs.filter(r => ['Sucesso', 'success'].includes(r.status));
  const bdcData = bdcOk.map(r => r.resultData || r.response_payload || {}).filter(d => d && typeof d === 'object');
  const mergedBdc = Object.assign({}, ...bdcData);

  // Status da empresa (BDC Basic Data)
  const basicData = mergedBdc?.BasicData || mergedBdc?.basic_data || {};
  const taxStatus = basicData?.TaxIdStatus || basicData?.tax_id_status || basicData?.Status;
  const companyActive = taxStatus && /ativa|active|regular/i.test(String(taxStatus));
  const companyStatus = companyActive
    ? { label: 'Ativa na RFB', color: 'text-green-600' }
    : taxStatus
      ? { label: String(taxStatus), color: 'text-red-600' }
      : { label: 'Não verificado', color: 'text-[var(--pagsmile-blue)]/40' };

  // Representante (CAF)
  const cafLogs = [...validations, ...integrationLogs].filter(r => r.provider === 'CAF');
  const cafApproved = cafLogs.some(r => ['APPROVED', 'success'].includes(r.result_status || r.status));
  const cafReproved = cafLogs.some(r => ['REPROVED', 'failed'].includes(r.result_status || r.status));
  const representativeStatus = cafApproved
    ? { label: 'CAF Aprovado', color: 'text-green-600' }
    : cafReproved
      ? { label: 'CAF Reprovado', color: 'text-red-600' }
      : { label: 'CAF Pendente', color: 'text-amber-600' };

  // Sócios / UBOs
  const relationships = mergedBdc?.Relationships || mergedBdc?.relationships || {};
  const owners = relationships?.Owners || relationships?.CurrentOwners || relationships?.Partners || [];
  const ownersCount = Array.isArray(owners) ? owners.length : 0;

  // Pontos críticos extraídos do compliance score + red flags
  const criticalPoints = [];
  const positivePoints = [];
  (complianceScore?.red_flags || []).slice(0, 6).forEach(f => criticalPoints.push(typeof f === 'string' ? f : (f.title || f.description || JSON.stringify(f))));
  (onboardingCase?.redFlags || []).slice(0, 3).forEach(f => {
    if (!criticalPoints.includes(f)) criticalPoints.push(f);
  });
  (complianceScore?.pontos_positivos || []).slice(0, 5).forEach(p => positivePoints.push(typeof p === 'string' ? p : (p.title || p.description || '')));

  if (companyActive && !positivePoints.some(p => /ativa/i.test(p))) {
    positivePoints.unshift('Empresa com situação cadastral regular na RFB');
  }
  if (cafApproved && !positivePoints.some(p => /caf|biometria/i.test(p))) {
    positivePoints.push('Representante verificado via CAF (Liveness + Facematch)');
  }

  // Cross-validation declarado vs enriquecido
  const crossValidation = [];
  if (merchant?.companyName && basicData?.OfficialName) {
    const match = normalizeText(merchant.companyName) === normalizeText(basicData.OfficialName)
      || normalizeText(basicData.TradeName) === normalizeText(merchant.companyName);
    crossValidation.push({ field: 'Razão Social', declared: merchant.companyName || merchant.fullName, found: basicData.OfficialName, match });
  }
  if (basicData?.Activities?.[0] || basicData?.cnae) {
    const cnae = basicData?.Activities?.[0]?.Code || basicData?.cnae;
    crossValidation.push({ field: 'CNAE Principal', declared: '—', found: cnae, match: true });
  }
  const emails = mergedBdc?.Emails?.PrimaryEmail?.EmailAddress || mergedBdc?.emails?.[0];
  if (merchant?.email && emails) {
    const match = normalizeText(merchant.email) === normalizeText(emails);
    crossValidation.push({ field: 'E-mail', declared: merchant.email, found: emails, match });
  }
  const phones = mergedBdc?.Phones?.PrimaryPhone?.Number || mergedBdc?.phones?.[0];
  if (merchant?.phone && phones) {
    const match = onlyDigits(merchant.phone).slice(-8) === onlyDigits(phones).slice(-8);
    crossValidation.push({ field: 'Telefone', declared: merchant.phone, found: phones, match });
  }

  // Indicadores de atividade
  const activityIndicators = {
    invoices: mergedBdc?.ActivityIndicators?.Indicators?.find?.(i => /nota|invoice/i.test(i?.Name || ''))?.Value ?? mergedBdc?.ActivityIndicators?.HasRecentInvoiceActivity ? 'Sim' : 'Não',
    domains: Array.isArray(mergedBdc?.Domains?.Domains) ? mergedBdc.Domains.Domains.length : (Array.isArray(mergedBdc?.domains) ? mergedBdc.domains.length : 0),
    totalIndicators: Array.isArray(mergedBdc?.ActivityIndicators?.Indicators) ? mergedBdc.ActivityIndicators.Indicators.length : 0,
    datasetsOk: bdcOk.length,
  };

  return {
    score,
    scoreColor,
    recommendation,
    companyStatus,
    representativeStatus,
    ownersCount,
    criticalPoints,
    positivePoints,
    crossValidation,
    activityIndicators,
  };
}

function normalizeText(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '').trim();
}

function onlyDigits(s) {
  return String(s || '').replace(/\D/g, '');
}