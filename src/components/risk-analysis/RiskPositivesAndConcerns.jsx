import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Link2 } from 'lucide-react';

/**
 * RiskPositivesAndConcerns v2 — each item has an always-visible "Why" inline
 * explanation. If we can match it with evidence from red_flags or variables,
 * we show the source chip too.
 */

const SOURCE_TONES = {
  'Questionário': 'bg-blue-50 text-blue-700 border-blue-200',
  'BDC':          'bg-indigo-50 text-indigo-700 border-indigo-200',
  'CAF':          'bg-purple-50 text-purple-700 border-purple-200',
  'Compliance':   'bg-red-50 text-red-700 border-red-200',
  'Merchant':     'bg-slate-50 text-slate-700 border-slate-200',
  'Sentinel':     'bg-teal-50 text-teal-700 border-teal-200',
};

/**
 * Normalizes many source labels into our 6 canonical buckets + returns tone.
 */
function normalizeSource(rawLabel) {
  if (!rawLabel) return null;
  const l = rawLabel.toLowerCase();
  if (l.includes('question')) return { label: 'Questionário', tone: SOURCE_TONES['Questionário'] };
  if (l.includes('bdc') || l.includes('bigdatacorp') || l.includes('receita') || l.includes('cnpj')) return { label: 'BDC', tone: SOURCE_TONES['BDC'] };
  if (l.includes('caf') || l.includes('liveness') || l.includes('biometri') || l.includes('facematch') || l.includes('kyb')) return { label: 'CAF', tone: SOURCE_TONES['CAF'] };
  if (l.includes('merchant') || l.includes('dados do cliente')) return { label: 'Merchant', tone: SOURCE_TONES['Merchant'] };
  if (l.includes('process') || l.includes('sanç') || l.includes('sanc') || l.includes('pep') || l.includes('interpol')) return { label: 'Compliance', tone: SOURCE_TONES['Compliance'] };
  if (l.includes('sentinel') || l.includes('análise') || l.includes('analise')) return { label: 'Sentinel', tone: SOURCE_TONES['Sentinel'] };
  return { label: rawLabel.trim(), tone: 'bg-slate-50 text-slate-700 border-slate-200' };
}

/**
 * Parse a Sentinel text block which comes in the shape:
 *   "[FONTE: X] O QUE: título. POR QUÊ: explicação. ONDE: evidência."
 * The real output is sloppy — labels appear in any order, brackets mid-line,
 * dots missing. We strip all the tags and reassemble a clean {title, why, where, source}.
 */
function parseSentinelItem(raw) {
  if (!raw || typeof raw !== 'string') return { title: String(raw || ''), why: null, where: null, source: null };

  let text = raw.trim();

  // 1) Extract "[FONTE: ...]" or "[FONTE ..." (possibly unclosed bracket).
  let source = null;
  const sourceMatch = text.match(/\[FONTE[:\s]+([^\]\[\n]+?)(?:\]|$)/i);
  if (sourceMatch) {
    source = normalizeSource(sourceMatch[1]);
    text = text.replace(sourceMatch[0], '').trim();
  }

  // 2) Remove any leftover stray "[FONTE" tokens (broken brackets from the LLM)
  text = text.replace(/\[FONTE[:\s]*/gi, '').replace(/^\]\s*/, '').trim();

  // 3) Extract the three labeled sections. They may be in any order and the
  //    label itself should be stripped from the final content.
  const extract = (label) => {
    //  match "LABEL: ... (up to next label or end)"
    const re = new RegExp(`${label}\\s*[:：]\\s*([\\s\\S]*?)(?=\\s*(?:O\\s*QUE|POR\\s*QU[ÊE]|ONDE)\\s*[:：]|$)`, 'i');
    const m = text.match(re);
    return m ? m[1].trim().replace(/^[.\s]+|[.\s]+$/g, '') : null;
  };

  let title = extract('O\\s*QUE');
  let why   = extract('POR\\s*QU[ÊE]');
  let where = extract('ONDE');

  // 4) If no labels found at all, fall back to the raw text as the title.
  if (!title && !why && !where) {
    // Try a colon-based "title: explanation" split
    const colonMatch = text.match(/^(.{10,120}?)[:—–-]\s+(.+)$/);
    if (colonMatch && colonMatch[2].length > 15) {
      title = colonMatch[1].trim();
      why   = colonMatch[2].trim();
    } else {
      title = text;
    }
  }

  // 5) Infer source if not provided explicitly
  if (!source) {
    const blob = [title, why, where].filter(Boolean).join(' ').toLowerCase();
    source = normalizeSource(blob);
  }

  return {
    title: title || raw,
    why,
    where,
    source,
  };
}

function EnrichedItem({ text, tone }) {
  const [open, setOpen] = useState(false);
  const { title, why, where, source } = parseSentinelItem(text);
  const Icon = tone === 'positive' ? CheckCircle2 : AlertTriangle;
  const iconColor = tone === 'positive' ? 'text-emerald-500' : 'text-amber-500';
  const titleColor = tone === 'positive' ? 'text-emerald-900' : 'text-amber-900';
  const softColor = tone === 'positive' ? 'text-emerald-800/75' : 'text-amber-800/75';
  const labelColor = tone === 'positive' ? 'text-emerald-700' : 'text-amber-700';
  const borderColor = tone === 'positive' ? 'border-emerald-100' : 'border-amber-100';
  const dividerColor = tone === 'positive' ? 'border-emerald-100' : 'border-amber-100';

  return (
    <div className={`rounded-lg border ${borderColor} bg-white p-3`}>
      <div className="flex items-start gap-2">
        <Icon className={`w-4 h-4 ${iconColor} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">

          {/* TITLE — the "O QUE" only, no prefix */}
          <p className={`text-[13px] font-bold ${titleColor} leading-snug`}>
            {title}
          </p>

          {/* Source tag (top-right style) */}
          {source && (
            <div className="mt-1.5 flex items-center gap-1">
              <Link2 className="w-2.5 h-2.5 text-[#002443]/30" />
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${source.tone}`}>
                {source.label}
              </span>
            </div>
          )}

          {/* POR QUÊ — the real explanation */}
          {why && (
            <div className={`mt-2 pt-2 border-t ${dividerColor}`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${labelColor} mb-1`}>
                Por quê?
              </p>
              <p className={`text-[12px] ${softColor} leading-relaxed`}>{why}</p>
            </div>
          )}

          {/* ONDE — the evidence location */}
          {where && (
            <div className="mt-2">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${labelColor} mb-1`}>
                Onde encontramos
              </p>
              <p className={`text-[11px] ${softColor} leading-relaxed italic`}>{where}</p>
            </div>
          )}

          {/* Expand to see raw Sentinel output (audit only) */}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className={`mt-2 text-[10px] ${softColor} hover:underline flex items-center gap-0.5`}
          >
            {open ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
            {open ? 'Ocultar texto bruto' : 'Ver texto bruto (auditoria)'}
          </button>
          {open && (
            <code className={`block mt-1.5 p-2 rounded bg-slate-50 text-[10px] font-mono ${softColor} leading-relaxed border ${borderColor} whitespace-pre-wrap break-words`}>
              {text}
            </code>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RiskPositivesAndConcerns({ complianceScore }) {
  const positives = complianceScore?.pontos_positivos || [];
  const concerns = complianceScore?.pontos_atencao || [];

  if (positives.length === 0 && concerns.length === 0) return null;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {positives.length > 0 && (
        <div className="bg-white rounded-2xl border border-emerald-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-emerald-800">Pontos Positivos ({positives.length})</h4>
          </div>
          <p className="text-[10px] text-emerald-700/50 mb-3">
            Fatores que reduzem risco e suportam aprovação.
          </p>
          <div className="space-y-2">
            {positives.map((p, i) => <EnrichedItem key={i} text={p} tone="positive" />)}
          </div>
        </div>
      )}
      {concerns.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h4 className="text-sm font-bold text-amber-800">Pontos de Atenção ({concerns.length})</h4>
          </div>
          <p className="text-[10px] text-amber-700/50 mb-3">
            Fatores qualitativos identificados pela IA que merecem investigação.
          </p>
          <div className="space-y-2">
            {concerns.map((c, i) => <EnrichedItem key={i} text={c} tone="concern" />)}
          </div>
        </div>
      )}
    </div>
  );
}