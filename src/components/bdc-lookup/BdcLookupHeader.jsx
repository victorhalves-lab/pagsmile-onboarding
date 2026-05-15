import React from 'react';
import { Building2, User, Calendar, Activity, AlertTriangle, Shield, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function extractFirst(arr) {
  if (!arr) return null;
  if (Array.isArray(arr)) return arr[0] || null;
  return arr;
}

export default function BdcLookupHeader({ result, docType, elapsedMs, datasetsOk, datasetsError }) {
  if (!result) return null;

  const bd = extractFirst(result.BasicData) || result.BasicData || {};
  const name = bd.OfficialName || bd.CompanyName || bd.Name || 'Sem nome';
  const tradeName = bd.TradeName || bd.FantasyName || '';
  const status = bd.TaxIdStatus || bd.TaxIdStatusDescription || '';
  const founded = bd.FoundedDate;
  const cnae = bd.MainEconomicActivity || bd.MainActivityCode;
  const cnaeDesc = bd.MainEconomicActivityDescription || bd.MainActivityDescription || '';
  const capital = bd.ShareCapital || bd.Capital;

  let ageDisplay = '';
  if (founded) {
    const years = (Date.now() - new Date(founded).getTime()) / (365.25 * 24 * 3600 * 1000);
    ageDisplay = years >= 1 ? `${Math.floor(years)} anos` : `${(years * 12).toFixed(0)} meses`;
  }

  // Sanções / PEP detection (KYC + ownersKyc)
  const kycItems = Array.isArray(result.Kyc) ? result.Kyc : (result.Kyc ? [result.Kyc] : []);
  const ownersKycItems = Array.isArray(result.OwnersKyc) ? result.OwnersKyc : (result.OwnersKyc ? [result.OwnersKyc] : []);
  const hasSanctions = [...kycItems, ...ownersKycItems].some(k => Array.isArray(k?.Sanctions) && k.Sanctions.length > 0);
  const hasPep = [...kycItems, ...ownersKycItems].some(k => k?.IsPEP || k?.IsPep);

  const Icon = docType === 'cnpj' ? Building2 : User;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header principal */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2.5 rounded-lg bg-[#2bc196]/10">
              <Icon className="w-6 h-6 text-[#2bc196]" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-[#002443] truncate">{name}</h1>
              {tradeName && <p className="text-sm text-slate-500 truncate">{tradeName}</p>}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-600">
                {status && (
                  <span className="flex items-center gap-1">
                    <span className={`inline-block w-2 h-2 rounded-full ${String(status).toUpperCase().includes('ATIV') || String(status).toUpperCase().includes('REGULAR') ? 'bg-green-500' : 'bg-red-500'}`} />
                    {status}
                  </span>
                )}
                {ageDisplay && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {ageDisplay}</span>}
                {cnae && <span>CNAE {cnae}{cnaeDesc ? ` — ${cnaeDesc}` : ''}</span>}
                {capital != null && <span>Capital R$ {Number(capital).toLocaleString('pt-BR')}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        <KpiCard
          icon={Shield}
          label="Compliance"
          value={hasSanctions ? 'SANÇÕES' : hasPep ? 'PEP IDENTIFICADO' : 'Limpo'}
          color={hasSanctions ? 'red' : hasPep ? 'amber' : 'green'}
        />
        <KpiCard
          icon={Activity}
          label="Datasets consultados"
          value={`${datasetsOk?.length || 0} OK · ${datasetsError?.length || 0} erro`}
          color="blue"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Tempo de resposta"
          value={`${elapsedMs ? (elapsedMs / 1000).toFixed(1) + 's' : '—'}`}
          color="slate"
        />
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color }) {
  const colorMap = {
    red: 'text-red-600 bg-red-50',
    amber: 'text-amber-600 bg-amber-50',
    green: 'text-emerald-600 bg-emerald-50',
    blue: 'text-blue-600 bg-blue-50',
    slate: 'text-slate-600 bg-slate-50',
  };
  return (
    <div className="p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-[#002443]">{value}</p>
      </div>
    </div>
  );
}