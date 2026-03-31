import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FileText, Send, PenTool, CheckCircle2 } from 'lucide-react';

const STATUS_CONFIG = {
  pre_generated: { label: 'Pré-gerado', color: 'bg-slate-100 text-slate-600' },
  under_review: { label: 'Em Revisão', color: 'bg-blue-50 text-blue-600' },
  ready: { label: 'Pronto', color: 'bg-yellow-50 text-yellow-700' },
  sent: { label: 'Enviado', color: 'bg-[#36706c]/10 text-[#36706c]' },
  signed: { label: 'Assinado', color: 'bg-[#2bc196]/10 text-[#2bc196]' },
  cancelled: { label: 'Cancelado', color: 'bg-red-50 text-red-500' },
};

export default function CEOContractsOverview({ contracts }) {
  const statusCounts = {};
  contracts.forEach(c => {
    const s = c.status || 'pre_generated';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });

  const total = contracts.length;
  const signed = statusCounts['signed'] || 0;
  const sent = statusCounts['sent'] || 0;
  const ready = statusCounts['ready'] || 0;
  const preGenerated = statusCounts['pre_generated'] || 0;
  const underReview = statusCounts['under_review'] || 0;

  return (
    <div className="bg-white rounded-2xl border border-[#002443]/5 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-[#002443]/5 flex items-center justify-center">
          <PenTool className="w-4 h-4 text-[#002443]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#002443]">Contratos</h3>
          <p className="text-[10px] text-[#002443]/40">{total} total</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 mb-4">
        <div className="text-center p-2.5 rounded-xl bg-slate-50">
          <p className="text-lg font-extrabold text-slate-500">{preGenerated}</p>
          <p className="text-[9px] text-[#002443]/40 font-bold">Pré-gerado</p>
        </div>
        <div className="text-center p-2.5 rounded-xl bg-blue-50">
          <p className="text-lg font-extrabold text-blue-500">{underReview}</p>
          <p className="text-[9px] text-[#002443]/40 font-bold">Em Revisão</p>
        </div>
        <div className="text-center p-2.5 rounded-xl bg-yellow-50">
          <p className="text-lg font-extrabold text-yellow-600">{ready}</p>
          <p className="text-[9px] text-[#002443]/40 font-bold">Prontos</p>
        </div>
        <div className="text-center p-2.5 rounded-xl bg-[#36706c]/5">
          <p className="text-lg font-extrabold text-[#36706c]">{sent}</p>
          <p className="text-[9px] text-[#002443]/40 font-bold">Enviados</p>
        </div>
        <div className="text-center p-2.5 rounded-xl bg-[#2bc196]/5">
          <p className="text-lg font-extrabold text-[#2bc196]">{signed}</p>
          <p className="text-[9px] text-[#002443]/40 font-bold">Assinados</p>
        </div>
      </div>

      <div className="space-y-2">
        {Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
          const config = STATUS_CONFIG[status] || { label: status, color: 'bg-slate-100 text-slate-600' };
          const pct = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
          return (
            <div key={status} className="flex items-center justify-between">
              <Badge className={`${config.color} text-xs border-0`}>{config.label}</Badge>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-[#002443]/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#2bc196] rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-bold text-[#002443]/50 w-8 text-right">{count}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}