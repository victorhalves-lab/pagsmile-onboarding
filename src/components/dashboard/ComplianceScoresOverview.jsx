import React from 'react';
import { TrendingUp, Activity, ShieldCheck, ShieldAlert } from 'lucide-react';

function ScoreCard({ title, value, subtext, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex-1">
      <div className="flex justify-between items-start mb-2">
        <div className={`p-2 rounded-lg ${color.bg}`}>
          <Icon className={`w-5 h-5 ${color.text}`} />
        </div>
        {value !== undefined && (
          <span className={`text-2xl font-bold ${color.text}`}>{value}</span>
        )}
      </div>
      <h3 className="text-sm font-medium text-slate-700">{title}</h3>
      <p className="text-xs text-slate-500 mt-1">{subtext}</p>
    </div>
  );
}

export default function ComplianceScoresOverview({ scores }) {
  // scores = { avgSQ, avgSVE, avgSGC, ... }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ScoreCard
        title="Média Score Questionário (SQ)"
        value={scores.avgSQ}
        subtext="Fase 1: Análise declaratória"
        icon={Activity}
        color={{ bg: 'bg-blue-50', text: 'text-blue-600' }}
      />
      <ScoreCard
        title="Média Validação Externa (SVE)"
        value={scores.avgSVE}
        subtext="Fase 2: BigDataCorp & CAF"
        icon={ShieldCheck}
        color={{ bg: 'bg-purple-50', text: 'text-purple-600' }}
      />
      <ScoreCard
        title="Média Score Geral (SGC)"
        value={scores.avgSGC}
        subtext="Fase 3: Consolidado Final"
        icon={ShieldAlert}
        color={{ bg: 'bg-slate-100', text: 'text-slate-800' }}
      />
    </div>
  );
}