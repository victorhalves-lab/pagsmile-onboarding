import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldAlert, XCircle, TrendingDown } from 'lucide-react';

function cleanText(text) {
  if (!text) return '';
  return text.replace(/^(SENTINEL|V4|CAF):\s*/i, '').replace(/\[FONTE:\s*[^\]]+\]\s*/gi, '').replace(/\[([^\]]+)\]/g, '($1)').trim();
}

function parseFlag(text) {
  if (!text) return { source: '', text: '' };
  const pm = text.match(/^(SENTINEL|V4|CAF):\s*/i);
  const prefix = pm ? pm[1].toUpperCase() : '';
  let cleaned = pm ? text.slice(pm[0].length) : text;
  let source = prefix;
  const fm = cleaned.match(/\[FONTE:\s*([^\]]+)\]/i);
  if (fm) { source = (prefix ? prefix + ' — ' : '') + fm[1].trim(); cleaned = cleaned.replace(fm[0], '').trim(); }
  cleaned = cleaned.replace(/\[([^\]]+)\]/g, '($1)').trim();
  return { source, text: cleaned };
}

export default function PointsAndFlags({ score }) {
  const pos = score?.pontos_positivos || [];
  const attn = score?.pontos_atencao || [];
  const flags = score?.red_flags || [];
  if (!pos.length && !attn.length && !flags.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {pos.length > 0 && (
        <div className="bg-green-50 rounded-xl border-2 border-green-200 p-5">
          <h3 className="text-sm font-bold text-green-700 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4.5 h-4.5" />Pontos Positivos ({pos.length})
          </h3>
          <p className="text-[11px] text-green-600/60 mb-3">Fatores que reduzem o risco e favorecem a aprovação.</p>
          <ul className="space-y-2">
            {pos.map((p, i) => (
              <li key={i} className="flex items-start gap-2.5 p-2.5 bg-green-100/40 rounded-lg text-xs text-green-700/80 leading-relaxed">
                <TrendingDown className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-green-500" />
                <span>{cleanText(p)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {attn.length > 0 && (
        <div className="bg-amber-50 rounded-xl border-2 border-amber-200 p-5">
          <h3 className="text-sm font-bold text-amber-700 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4.5 h-4.5" />Pontos de Atenção ({attn.length})
          </h3>
          <p className="text-[11px] text-amber-600/60 mb-3">Requerem análise mas não impedem aprovação sozinhos.</p>
          <ul className="space-y-2">
            {attn.map((p, i) => (
              <li key={i} className="flex items-start gap-2.5 p-2.5 bg-amber-100/40 rounded-lg text-xs text-amber-700/80 leading-relaxed">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
                <span>{cleanText(p)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {flags.length > 0 && (
        <div className="bg-red-50 rounded-xl border-2 border-red-200 p-5 md:col-span-2">
          <h3 className="text-sm font-bold text-red-700 mb-3 flex items-center gap-2">
            <ShieldAlert className="w-4.5 h-4.5" />Red Flags ({flags.length})
          </h3>
          <p className="text-[11px] text-red-600/60 mb-3">Sinalizações graves que requerem atenção imediata.</p>
          <div className="space-y-2">
            {flags.map((r, i) => {
              const { source, text } = parseFlag(r);
              return (
                <div key={i} className="flex items-start gap-3 p-3 bg-red-100/40 rounded-lg">
                  <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-red-700/90 leading-relaxed">{text}</p>
                    {source && (
                      <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded bg-red-100 text-[9px] font-bold text-red-600 border border-red-200">
                        Fonte: {source}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}