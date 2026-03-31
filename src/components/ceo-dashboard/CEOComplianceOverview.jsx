import React from 'react';
import { Shield, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

export default function CEOComplianceOverview({ cases }) {
  const total = cases.length;
  const approved = cases.filter(c => c.status === 'Aprovado').length;
  const manual = cases.filter(c => c.status === 'Manual').length;
  const rejected = cases.filter(c => c.status === 'Recusado').length;
  const pending = cases.filter(c => ['Pendente', 'Em Processamento'].includes(c.status)).length;

  const autoDecision = cases.filter(c => c.iaDecision === 'Aprovado' || c.iaDecision === 'Recusado').length;
  const autoRate = total > 0 ? ((autoDecision / total) * 100).toFixed(0) : 0;

  const items = [
    { label: 'Aprovados', value: approved, icon: CheckCircle2, color: 'text-[#2bc196]', bg: 'bg-[#2bc196]/10' },
    { label: 'Revisão Manual', value: manual, icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Recusados', value: rejected, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Pendentes', value: pending, icon: Clock, color: 'text-[#002443]/60', bg: 'bg-[#002443]/5' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#002443]/5 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-[#002443]/5 flex items-center justify-center">
          <Shield className="w-4 h-4 text-[#002443]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#002443]">Compliance / KYC</h3>
          <p className="text-[10px] text-[#002443]/40">{total} casos • {autoRate}% automáticos</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map(item => (
          <div key={item.label} className={`${item.bg} rounded-xl p-3 flex items-center gap-3`}>
            <item.icon className={`w-5 h-5 ${item.color}`} />
            <div>
              <p className="text-lg font-extrabold text-[#002443]">{item.value}</p>
              <p className="text-[10px] text-[#002443]/40 font-bold">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}