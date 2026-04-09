import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Info, AlertOctagon, Minus } from 'lucide-react';

const RISK_CONFIG = {
  'CRITICO': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: AlertOctagon, badgeBg: 'bg-red-100' },
  'ALTO': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: AlertTriangle, badgeBg: 'bg-orange-100' },
  'MEDIO': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: AlertTriangle, badgeBg: 'bg-amber-100' },
  'BAIXO': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: Info, badgeBg: 'bg-blue-100' },
  'OK': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2, badgeBg: 'bg-emerald-100' },
  'INFO': { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', icon: Info, badgeBg: 'bg-slate-100' },
};

function RiskIndicator({ risk }) {
  const c = RISK_CONFIG[risk] || RISK_CONFIG.INFO;
  const Icon = c.icon;
  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${c.bg} ${c.border} border`}>
      <Icon className={`w-3 h-3 ${c.text}`} />
      <span className={`text-[10px] font-semibold ${c.text}`}>{risk}</span>
    </div>
  );
}

function AnalysisItem({ item }) {
  const [showDetails, setShowDetails] = useState(false);
  const c = RISK_CONFIG[item.risk] || RISK_CONFIG.INFO;
  const hasDetails = item.details && Object.keys(item.details).length > 0;
  const hasOwners = item.owners && item.owners.length > 0;

  return (
    <div className={`px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors ${item.risk === 'CRITICO' ? 'bg-red-50/30' : item.risk === 'ALTO' ? 'bg-orange-50/20' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[#002443]">{item.label}</span>
            <RiskIndicator risk={item.risk} />
            {item.points !== 0 && (
              <span className={`text-[10px] font-mono ${item.points > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {item.points > 0 ? '+' : ''}{item.points} pts
              </span>
            )}
          </div>
          <p className={`text-[12px] mt-0.5 ${c.text} leading-relaxed`}>{item.value}</p>
        </div>
        {(hasDetails || hasOwners) && (
          <button onClick={() => setShowDetails(!showDetails)} className="text-[#002443]/30 hover:text-[#002443]/60 p-1">
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>
      {showDetails && hasDetails && (
        <div className="mt-2 ml-4 pl-3 border-l-2 border-slate-200 space-y-1">
          {Object.entries(item.details).map(([key, val]) => (
            <div key={key} className="flex items-start gap-2">
              <span className="text-[10px] text-[#002443]/40 font-medium min-w-[80px]">{key}:</span>
              <span className="text-[10px] text-[#002443]/70">
                {Array.isArray(val) ? val.join(' • ') : String(val)}
              </span>
            </div>
          ))}
        </div>
      )}
      {showDetails && hasOwners && (
        <div className="mt-2 ml-4 overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-1 px-2 text-[#002443]/50 font-semibold">Nome</th>
                <th className="text-left py-1 px-2 text-[#002443]/50 font-semibold">Documento</th>
                <th className="text-left py-1 px-2 text-[#002443]/50 font-semibold">Qualificação</th>
                <th className="text-left py-1 px-2 text-[#002443]/50 font-semibold">Part. (%)</th>
              </tr>
            </thead>
            <tbody>
              {item.owners.map((o, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-1 px-2 text-[#002443]">{o.name}</td>
                  <td className="py-1 px-2 text-[#002443]/60 font-mono">{o.doc || '—'}</td>
                  <td className="py-1 px-2 text-[#002443]/60">{o.role || '—'}</td>
                  <td className="py-1 px-2 text-[#002443]/60">{o.participation || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function BDCAnalysisSection({ title, icon: Icon, items, score, accentColor = 'indigo', defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!items || items.length === 0) return null;

  const criticalCount = items.filter(i => i.risk === 'CRITICO').length;
  const highCount = items.filter(i => i.risk === 'ALTO').length;
  const okCount = items.filter(i => i.risk === 'OK').length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 hover:bg-slate-50/50 transition-colors text-left"
      >
        <div className={`p-2 rounded-lg bg-${accentColor}-50`}>
          <Icon className={`w-4.5 h-4.5 text-${accentColor}-600`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-[#002443]">{title}</h4>
          <p className="text-[10px] text-[#002443]/40">{items.length} item(ns) analisados</p>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <Badge className="bg-red-100 text-red-700 border-red-200 border text-[10px]">{criticalCount} crítico</Badge>
          )}
          {highCount > 0 && (
            <Badge className="bg-orange-100 text-orange-700 border-orange-200 border text-[10px]">{highCount} alto</Badge>
          )}
          {okCount > 0 && (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border text-[10px]">{okCount} ok</Badge>
          )}
          {score !== undefined && (
            <span className={`text-xs font-bold ${score > 0 ? 'text-red-600' : score < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
              {score > 0 ? '+' : ''}{score} pts
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-[#002443]/30" /> : <ChevronDown className="w-4 h-4 text-[#002443]/30" />}
        </div>
      </button>
      {open && (
        <div className="border-t border-slate-100">
          {items.map((item, i) => (
            <AnalysisItem key={i} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}