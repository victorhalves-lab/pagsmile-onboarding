import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Shield, Globe, Building2, Activity, TrendingUp } from 'lucide-react';

const statusIcons = {
  ok: <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />,
  alert: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
  danger: <XCircle className="w-3.5 h-3.5 text-red-500" />,
};

export default function LeadBDCInsights({ lead }) {
  const bdcData = lead?.bdcEnrichmentData;
  const bdcScore = lead?.bdcLeadScore;
  const bdcLevel = lead?.bdcScoreLevel;
  const bdcFlags = lead?.bdcFlags || [];
  const crossVal = lead?.bdcCrossValidation;
  const dueReport = lead?.bdcDueReport;

  if (!bdcData && bdcScore == null) return null;

  const levelColors = {
    'EXCELENTE': 'bg-emerald-100 text-emerald-700',
    'BOM': 'bg-green-100 text-green-700',
    'REGULAR': 'bg-yellow-100 text-yellow-700',
    'FRACO': 'bg-orange-100 text-orange-700',
    'INSUFICIENTE': 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-3">
      {/* Score header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#002443]/40" />
          <span className="text-xs font-bold text-[#002443]/60 uppercase tracking-wider">Score BDC</span>
        </div>
        {bdcScore != null && (
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-[#002443]">{bdcScore}</span>
            <Badge className={`text-[10px] ${levelColors[bdcLevel] || 'bg-slate-100 text-slate-700'}`}>
              {bdcLevel || 'N/D'}
            </Badge>
          </div>
        )}
        {lead?.leadQualifierScore != null && (
          <span className="text-[10px] text-[#002443]/40 ml-auto">
            Declaratório: {lead.leadQualifierScore}
          </span>
        )}
      </div>

      {/* Activity indicators */}
      {bdcData?.activityIndicators && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Indicator icon={<Activity className="w-3 h-3" />} label="Atividade" value={bdcData.activityIndicators.activityLevel != null ? `${(bdcData.activityIndicators.activityLevel * 100).toFixed(0)}%` : 'N/D'} risk={bdcData.activityIndicators.activityLevel >= 0.3} />
          <Indicator icon={<Building2 className="w-3 h-3" />} label="Empregados" value={bdcData.activityIndicators.employeesRange || 'N/D'} />
          <Indicator icon={<TrendingUp className="w-3 h-3" />} label="Receita" value={bdcData.activityIndicators.incomeRange || 'N/D'} />
          <Indicator icon={<Globe className="w-3 h-3" />} label="Domínio" value={bdcData.activityIndicators.hasActiveDomain ? '✓ Ativo' : '✗ Sem'} risk={bdcData.activityIndicators.hasActiveDomain !== false} />
        </div>
      )}

      {/* BDC Flags */}
      {bdcFlags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {bdcFlags.map(flag => (
            <Badge key={flag} variant="outline" className="text-[9px] bg-red-50 text-red-600 border-red-200">
              {flag.replace('BDC_', '').replace(/_/g, ' ')}
            </Badge>
          ))}
        </div>
      )}

      {/* Cross-validation */}
      {crossVal?.checks?.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-[#002443]/40 uppercase">Cross-validation</span>
          <div className="grid grid-cols-2 gap-1">
            {crossVal.checks.slice(0, 8).map((check, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px]">
                {statusIcons[check.status]}
                <span className="text-[#002443]/70 truncate">{check.label}</span>
              </div>
            ))}
          </div>
          {crossVal.total > 0 && (
            <p className="text-[10px] text-[#002443]/40">
              {crossVal.ok}/{crossVal.total} ✓ {crossVal.alerts > 0 ? `| ${crossVal.alerts} ⚠️` : ''} {crossVal.dangers > 0 ? `| ${crossVal.dangers} 🔴` : ''}
            </p>
          )}
        </div>
      )}

      {/* Deep Due Diligence */}
      {dueReport && (
        <div className="p-2 rounded-lg bg-[#002443]/5 border border-[#002443]/10">
          <span className="text-[10px] font-bold text-[#002443]/60 uppercase">Due Diligence BDC</span>
          {dueReport.kyc && (
            <div className="flex flex-wrap gap-1 mt-1">
              {dueReport.kyc.companySanctions && <Badge className="bg-red-100 text-red-700 text-[9px]">SANÇÕES</Badge>}
              {dueReport.kyc.companyPep && <Badge className="bg-amber-100 text-amber-700 text-[9px]">PEP</Badge>}
              {dueReport.kyc.ownersPep?.length > 0 && <Badge className="bg-amber-100 text-amber-700 text-[9px]">PEP Sócios: {dueReport.kyc.ownersPep.length}</Badge>}
              {!dueReport.kyc.companySanctions && !dueReport.kyc.companyPep && dueReport.kyc.ownersPep?.length === 0 && (
                <Badge className="bg-emerald-100 text-emerald-700 text-[9px]">KYC Limpo</Badge>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Indicator({ icon, label, value, risk }) {
  return (
    <div className="p-2 rounded-lg bg-white border border-[#002443]/5">
      <div className="flex items-center gap-1 text-[#002443]/40 mb-0.5">{icon}<span className="text-[9px] font-medium">{label}</span></div>
      <p className={`text-xs font-bold ${risk === false ? 'text-red-600' : 'text-[#002443]'}`}>{value}</p>
    </div>
  );
}