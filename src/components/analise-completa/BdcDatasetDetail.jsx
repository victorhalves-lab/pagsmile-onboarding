import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function BdcDatasetDetail({ records, info, merchant }) {
  return (
    <div className="p-4 space-y-4">
      {/* Description */}
      <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
        <p className="text-xs text-blue-800 leading-relaxed">{info.desc}</p>
      </div>

      {/* Each record */}
      {records.map(record => (
        <RecordView key={record.id} record={record} merchant={merchant} />
      ))}
    </div>
  );
}

function RecordView({ record, merchant }) {
  const [showRaw, setShowRaw] = useState(false);
  const data = record.resultData || record.response_payload || {};
  const date = new Date(record.created_date || record.timestamp);
  const hasData = data && Object.keys(data).length > 0;

  // Try to extract key-value pairs from the data for readable display
  const readableFields = extractReadableFields(data);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="p-3 bg-slate-50/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="text-[10px]">{record.status || 'N/D'}</Badge>
            <span className="text-[var(--pagsmile-blue)]/40">
              {date.toLocaleDateString('pt-BR')} {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {record.duration_ms && <span className="text-[var(--pagsmile-blue)]/40">• {record.duration_ms}ms</span>}
            {record.responseTime && <span className="text-[var(--pagsmile-blue)]/40">• {record.responseTime}ms</span>}
          </div>
          {record.score != null && <Badge variant="outline" className="text-[10px]">Score: {record.score}</Badge>}
        </div>

        {/* Red flags */}
        {record.red_flags?.length > 0 && (
          <div className="mb-3 p-2.5 bg-red-50 rounded-lg border border-red-200">
            <p className="text-[10px] font-bold text-red-700 mb-1">Sinalizações de Risco</p>
            {record.red_flags.map((f, i) => (
              <p key={i} className="text-[11px] text-red-700/80">• {f}</p>
            ))}
          </div>
        )}

        {/* Readable fields */}
        {readableFields.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {readableFields.map(({ key, value, isNested }, i) => (
              <div key={i} className={`text-xs p-2 rounded bg-white border border-slate-100 ${isNested ? 'col-span-full' : ''}`}>
                <span className="text-[var(--pagsmile-blue)]/40 text-[10px] font-semibold">{humanizeKey(key)}: </span>
                {isNested ? (
                  <pre className="text-[10px] text-[var(--pagsmile-blue)]/70 mt-1 whitespace-pre-wrap font-mono">{JSON.stringify(value, null, 2)}</pre>
                ) : (
                  <span className="text-[var(--pagsmile-blue)] font-medium">{String(value)}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {!hasData && (
          <p className="text-xs text-[var(--pagsmile-blue)]/30 italic">Nenhum dado retornado nesta consulta.</p>
        )}
      </div>

      {/* Raw JSON toggle */}
      {hasData && (
        <div className="px-3 pb-3">
          <button onClick={() => setShowRaw(!showRaw)} className="text-[10px] text-[var(--pagsmile-blue)]/40 hover:text-[var(--pagsmile-blue)]/60 flex items-center gap-1 mt-2">
            <Eye className="w-3 h-3" />
            {showRaw ? 'Ocultar JSON bruto' : 'Ver JSON bruto completo'}
          </button>
          {showRaw && (
            <pre className="mt-2 p-3 bg-slate-900 text-green-300 text-[10px] rounded-lg overflow-auto max-h-[400px] font-mono">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function extractReadableFields(data, prefix = '', depth = 0) {
  if (!data || depth > 2) return [];
  const fields = [];
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && !Array.isArray(value)) {
      if (Object.keys(value).length <= 6) {
        fields.push(...extractReadableFields(value, fullKey, depth + 1));
      } else {
        fields.push({ key: fullKey, value, isNested: true });
      }
    } else if (Array.isArray(value)) {
      if (value.length === 0) continue;
      if (typeof value[0] === 'string' || typeof value[0] === 'number') {
        fields.push({ key: fullKey, value: value.join(', '), isNested: false });
      } else {
        fields.push({ key: fullKey, value, isNested: true });
      }
    } else {
      fields.push({ key: fullKey, value, isNested: false });
    }
  }
  return fields;
}

function humanizeKey(key) {
  const parts = key.split('.');
  const last = parts[parts.length - 1];
  return last
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, s => s.toUpperCase());
}