import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Clock, XCircle } from 'lucide-react';

const STATUS_CONFIG = {
  'Pendente': { color: 'bg-gray-100 text-gray-700', icon: Clock },
  'Em Processamento': { color: 'bg-blue-50 text-blue-700', icon: Clock },
  'Aprovado': { color: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  'Manual': { color: 'bg-amber-50 text-amber-700', icon: AlertTriangle },
  'Recusado': { color: 'bg-red-50 text-red-700', icon: XCircle },
  'Docs Solicitados': { color: 'bg-violet-50 text-violet-700', icon: Clock },
};

const SUBFAIXA_COLORS = {
  '1A': 'bg-emerald-100 text-emerald-800', '1B': 'bg-emerald-50 text-emerald-700',
  '2A': 'bg-blue-100 text-blue-800', '2B': 'bg-blue-50 text-blue-700',
  '3A': 'bg-amber-100 text-amber-800', '3B': 'bg-amber-50 text-amber-700',
  '4': 'bg-red-100 text-red-800', '5': 'bg-red-200 text-red-900',
};

export default function CaseSelectionTable({ cases, selectedIds, onSelectionChange, processing }) {
  const allSelected = cases.length > 0 && selectedIds.length === cases.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < cases.length;

  const toggleAll = () => {
    if (allSelected) onSelectionChange([]);
    else onSelectionChange(cases.map(c => c.id));
  };

  const toggleOne = (id) => {
    if (selectedIds.includes(id)) onSelectionChange(selectedIds.filter(x => x !== id));
    else onSelectionChange([...selectedIds, id]);
  };

  const formatCpfCnpj = (doc) => {
    if (!doc) return '';
    const clean = doc.replace(/\D/g, '');
    if (clean.length === 11) return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    if (clean.length === 14) return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    return doc;
  };

  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      {/* Header */}
      <div className="grid grid-cols-[40px_1fr_140px_100px_80px_80px_90px] gap-2 px-4 py-3 bg-[#0A0A0A]/5 text-xs font-semibold text-[#0A0A0A]/70 border-b">
        <div className="flex items-center">
          <Checkbox
            checked={allSelected}
            ref={(el) => { if (el) el.dataset.indeterminate = someSelected; }}
            onCheckedChange={toggleAll}
            disabled={processing}
          />
        </div>
        <div>Merchant</div>
        <div>CPF/CNPJ</div>
        <div>Status</div>
        <div>Score</div>
        <div>Subfaixa</div>
        <div className="text-center">Flags</div>
      </div>

      {/* Body */}
      <div className="max-h-[480px] overflow-y-auto divide-y divide-[#0A0A0A]/5">
        {cases.map(c => {
          const isSelected = selectedIds.includes(c.id);
          const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG['Pendente'];
          const Icon = cfg.icon;

          return (
            <div
              key={c.id}
              className={`grid grid-cols-[40px_1fr_140px_100px_80px_80px_90px] gap-2 px-4 py-2.5 text-sm items-center transition-colors cursor-pointer hover:bg-[#1356E2]/5 ${isSelected ? 'bg-[#1356E2]/8' : ''}`}
              onClick={() => !processing && toggleOne(c.id)}
            >
              <div className="flex items-center" onClick={e => e.stopPropagation()}>
                <Checkbox checked={isSelected} onCheckedChange={() => toggleOne(c.id)} disabled={processing} />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-[#0A0A0A] truncate">{c.merchantName}</div>
                <div className="text-[10px] text-[#0A0A0A]/40 font-mono">...{c.id.slice(-8)}</div>
              </div>
              <div className="text-xs font-mono text-[#0A0A0A]/70 truncate">{formatCpfCnpj(c.merchantCpfCnpj)}</div>
              <div>
                <Badge className={`${cfg.color} text-[10px] gap-1 font-medium`}>
                  <Icon className="w-3 h-3" /> {c.status}
                </Badge>
              </div>
              <div className="text-xs font-mono font-medium text-[#0A0A0A]">
                {c.score != null ? c.score : '—'}
              </div>
              <div>
                {c.subfaixa ? (
                  <Badge className={`${SUBFAIXA_COLORS[c.subfaixa] || 'bg-gray-100'} text-[10px] font-bold`}>
                    {c.subfaixa}
                  </Badge>
                ) : <span className="text-xs text-[#0A0A0A]/30">—</span>}
              </div>
              <div className="text-center">
                {c.redFlagsCount > 0 ? (
                  <Badge variant="destructive" className="text-[10px]">{c.redFlagsCount}</Badge>
                ) : (
                  <span className="text-xs text-[#0A0A0A]/30">0</span>
                )}
              </div>
            </div>
          );
        })}
        {cases.length === 0 && (
          <div className="py-12 text-center text-sm text-[#0A0A0A]/40">Nenhum caso encontrado</div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-[#0A0A0A]/5 border-t text-xs text-[#0A0A0A]/60 flex justify-between">
        <span>{selectedIds.length} de {cases.length} selecionados</span>
        <span>{cases.filter(c => c.validationsDone).length} já processados</span>
      </div>
    </div>
  );
}