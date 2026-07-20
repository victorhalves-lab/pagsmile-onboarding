import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw, TrendingUp, TrendingDown, Minus, Shield, AlertTriangle, CheckCircle2, Clock,
} from 'lucide-react';

const SUBFAIXA_COLORS = {
  '1A': 'bg-green-100 text-green-700',
  '1B': 'bg-green-50 text-green-600',
  '2A': 'bg-blue-100 text-blue-700',
  '2B': 'bg-blue-50 text-blue-600',
  '3A': 'bg-amber-100 text-amber-700',
  '3B': 'bg-orange-100 text-orange-700',
  '4': 'bg-red-100 text-red-700',
  '5': 'bg-red-200 text-red-800',
};

export default function BDCRevalidationTimeline({ validations }) {
  // Filter only revalidation entries and sort by date desc
  const revalidations = validations
    .filter(v => v.provider === 'BigDataCorp')
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  if (revalidations.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#0A0A0A]/8 p-6 text-center">
        <Clock className="w-8 h-8 text-[#0A0A0A]/15 mx-auto mb-2" />
        <p className="text-sm text-[#0A0A0A]/50">Nenhuma consulta BDC registrada para este cliente</p>
        <p className="text-[10px] text-[#0A0A0A]/30 mt-1">Execute o Enriquecimento BDC na aba correspondente</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#0A0A0A]/8 p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 rounded-xl bg-blue-50">
          <RefreshCw className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-[#0A0A0A]">Timeline de Consultas BDC</h4>
          <p className="text-[10px] text-[#0A0A0A]/40">{revalidations.length} consulta(s) registrada(s)</p>
        </div>
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-[#0A0A0A]/8" />

        <div className="space-y-4">
          {revalidations.map((v, i) => {
            const data = v.resultData || {};
            const delta = data.scoreDelta || 0;
            const isFirst = i === 0;
            const isRevalidation = v.validationType === 'Revalidação BDC';

            return (
              <div key={v.id} className="relative flex gap-4 pl-1">
                {/* Dot */}
                <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isFirst ? 'bg-[#1356E2] ring-4 ring-[#1356E2]/20' :
                  delta > 20 ? 'bg-red-500 ring-4 ring-red-500/20' :
                  delta < -20 ? 'bg-green-500 ring-4 ring-green-500/20' :
                  'bg-[#0A0A0A]/20'
                }`}>
                  {delta > 0 ? <TrendingUp className="w-3.5 h-3.5 text-white" /> :
                   delta < 0 ? <TrendingDown className="w-3.5 h-3.5 text-white" /> :
                   isRevalidation ? <RefreshCw className="w-3.5 h-3.5 text-white" /> :
                   <Shield className="w-3.5 h-3.5 text-white" />}
                </div>

                {/* Content */}
                <div className={`flex-1 rounded-xl border p-3 ${
                  isFirst ? 'border-[#1356E2]/30 bg-[#1356E2]/5' :
                  delta > 20 ? 'border-red-200 bg-red-50/30' :
                  'border-[#0A0A0A]/8'
                }`}>
                  <div className="flex items-start justify-between mb-1.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#0A0A0A]">
                          {v.validationType || 'Consulta BDC'}
                        </span>
                        {isFirst && <Badge className="bg-[#1356E2]/20 text-[#1356E2] text-[9px] border-0">Mais recente</Badge>}
                        {v.status && (
                          <Badge className={`text-[9px] border-0 ${
                            v.status === 'Sucesso' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>{v.status}</Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-[#0A0A0A]/40 mt-0.5">
                        {v.created_date ? new Date(v.created_date).toLocaleString('pt-BR', {
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        }) : ''}
                        {data.datasetsQueried && ` • ${data.datasetsQueried} datasets`}
                        {v.responseTime && ` • ${v.responseTime}ms`}
                      </p>
                    </div>
                  </div>

                  {/* Score info */}
                  <div className="flex items-center gap-4 mt-2">
                    {data.oldScore != null && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#0A0A0A]/40">Score:</span>
                        <span className="text-xs font-mono text-[#0A0A0A]">{data.oldScore}</span>
                        <span className="text-[#0A0A0A]/30">→</span>
                        <span className="text-xs font-mono font-bold text-[#0A0A0A]">{data.newScore}</span>
                        <span className={`text-[10px] font-mono font-bold ${
                          delta > 0 ? 'text-red-600' : delta < 0 ? 'text-green-600' : 'text-[#0A0A0A]/40'
                        }`}>
                          ({delta >= 0 ? '+' : ''}{delta})
                        </span>
                      </div>
                    )}
                    {v.score != null && !data.oldScore && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#0A0A0A]/40">Score:</span>
                        <span className="text-xs font-mono font-bold text-[#0A0A0A]">{v.score}</span>
                      </div>
                    )}
                    {data.newSubfaixa && (
                      <Badge className={`${SUBFAIXA_COLORS[data.newSubfaixa] || 'bg-slate-100 text-slate-600'} text-[10px] border-0`}>
                        {data.subfaixaChanged ? `${data.oldSubfaixa} → ${data.newSubfaixa}` : data.newSubfaixa}
                      </Badge>
                    )}
                    {delta > 20 && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                        <span className="text-[10px] text-red-600 font-medium">Alerta</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}