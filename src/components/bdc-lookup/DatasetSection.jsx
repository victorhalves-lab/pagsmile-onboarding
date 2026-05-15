import React from 'react';
import { AlertCircle } from 'lucide-react';

// Helper visual genérico — exibe um dataset BDC como tabela key/value.
// Use quando não houver visualização customizada.
function flatten(obj) {
  if (obj == null) return [];
  if (Array.isArray(obj)) {
    return obj.flatMap((item, idx) => flatten(item).map(row => ({ ...row, _group: `[${idx}]` })));
  }
  if (typeof obj !== 'object') return [{ key: '', value: String(obj) }];
  return Object.entries(obj).map(([k, v]) => ({ key: k, value: v }));
}

function renderValue(value) {
  if (value == null || value === '') return <span className="text-slate-400">—</span>;
  if (typeof value === 'boolean') return value ? <span className="text-emerald-700 font-medium">Sim</span> : <span className="text-slate-500">Não</span>;
  if (typeof value === 'number') return <span className="font-mono">{value.toLocaleString('pt-BR')}</span>;
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      try { return <span>{new Date(value).toLocaleString('pt-BR')}</span>; } catch { return value; }
    }
    return <span className="break-words">{value}</span>;
  }
  if (Array.isArray(value)) {
    return <span className="text-slate-500 text-xs">{value.length} item(s)</span>;
  }
  if (typeof value === 'object') {
    return <span className="text-slate-500 text-xs italic">{Object.keys(value).length} chave(s)</span>;
  }
  return String(value);
}

export default function DatasetSection({ title, data, emptyMessage, children }) {
  if (children) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-semibold text-[#002443]">{title}</h3>
        </div>
        <div className="p-4">{children}</div>
      </div>
    );
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-semibold text-[#002443]">{title}</h3>
        </div>
        <div className="p-6 text-center">
          <AlertCircle className="w-5 h-5 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-400">{emptyMessage || 'Sem dados retornados'}</p>
        </div>
      </div>
    );
  }

  const rows = flatten(data);

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-semibold text-[#002443]">{title}</h3>
      </div>
      <div className="divide-y divide-slate-50">
        {rows.slice(0, 50).map((row, i) => (
          <div key={i} className="px-4 py-2 flex items-start gap-3 text-xs hover:bg-slate-50/50">
            <span className="text-slate-500 font-medium min-w-[180px]">{row._group ? `${row._group} ` : ''}{row.key}</span>
            <span className="text-[#002443] flex-1">{renderValue(row.value)}</span>
          </div>
        ))}
        {rows.length > 50 && (
          <div className="px-4 py-2 text-xs text-slate-400 italic">+{rows.length - 50} chaves omitidas — veja aba Raw JSON</div>
        )}
      </div>
    </div>
  );
}