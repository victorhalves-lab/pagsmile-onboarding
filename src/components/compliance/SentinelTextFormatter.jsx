import React from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * SentinelTextFormatter v2 — transforms raw SENTINEL AI output into a professional,
 * easy-to-scan structured document.
 *
 * Handles:
 *  - Structural markers: "Conclusão:", "Evidências:", "Recomendação:", "Próximos Passos:",
 *    "Justificativa:", "Impacto:", "Contexto:", "Análise:", "Parecer:" → styled callouts
 *  - Source citations [FONTE: ...] → inline badges
 *  - Severity words (CRÍTICO / ALTO / BLOQUEANTE / APROVAR / RECUSAR / RISCO ELEVADO) → coloured chips
 *  - Monetary values (R$ 1.000,00), percentages, CNPJ/CPF, dates → monospace highlights
 *  - Numbered items "1." "2." → bulleted list
 *  - Dimension headers "Dimensão X:" → proper headings
 *  - Bold **text** & italic *text* preserved
 *  - Paragraph spacing that actually breathes
 */

// ────────────────────────────────────────────────────────────────────────────
// Lexicon
// ────────────────────────────────────────────────────────────────────────────
const STRUCTURAL_HEADERS = [
  'conclusão', 'conclusao',
  'evidências', 'evidencias',
  'recomendação', 'recomendacao',
  'próximos passos', 'proximos passos',
  'justificativa',
  'impacto',
  'contexto',
  'análise', 'analise',
  'parecer',
  'resumo',
  'sumário executivo', 'sumario executivo',
  'pontos positivos',
  'pontos de atenção', 'pontos de atencao',
  'pontos de risco',
  'risco',
  'decisão sugerida', 'decisao sugerida',
  'ação do analista', 'acao do analista',
];

const SEVERITY_CHIP = {
  'CRÍTICO': 'bg-red-100 text-red-800 border-red-200',
  'CRITICO': 'bg-red-100 text-red-800 border-red-200',
  'CRITICAL': 'bg-red-100 text-red-800 border-red-200',
  'BLOQUEANTE': 'bg-red-700 text-white border-red-800',
  'BLOQUEIO': 'bg-red-700 text-white border-red-800',
  'ALTO': 'bg-orange-100 text-orange-800 border-orange-200',
  'HIGH': 'bg-orange-100 text-orange-800 border-orange-200',
  'MÉDIO': 'bg-amber-100 text-amber-800 border-amber-200',
  'MEDIO': 'bg-amber-100 text-amber-800 border-amber-200',
  'MEDIUM': 'bg-amber-100 text-amber-800 border-amber-200',
  'BAIXO': 'bg-blue-100 text-blue-800 border-blue-200',
  'LOW': 'bg-blue-100 text-blue-800 border-blue-200',
  'APROVAR': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'APROVADO': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'APROVAÇÃO': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'RECUSAR': 'bg-red-100 text-red-800 border-red-200',
  'RECUSADO': 'bg-red-100 text-red-800 border-red-200',
  'REVISÃO MANUAL': 'bg-amber-100 text-amber-900 border-amber-300',
  'REVISAO MANUAL': 'bg-amber-100 text-amber-900 border-amber-300',
  'RISCO ELEVADO': 'bg-red-100 text-red-700 border-red-200',
};

const HEADER_ICONS = {
  'conclusão': '🎯', 'conclusao': '🎯',
  'evidências': '📋', 'evidencias': '📋',
  'recomendação': '💡', 'recomendacao': '💡',
  'próximos passos': '👉', 'proximos passos': '👉',
  'justificativa': '🧠',
  'impacto': '⚠️',
  'contexto': '📍',
  'análise': '🔍', 'analise': '🔍',
  'parecer': '⚖️',
  'resumo': '📝',
  'sumário executivo': '📝', 'sumario executivo': '📝',
  'pontos positivos': '✅',
  'pontos de atenção': '⚠️', 'pontos de atencao': '⚠️',
  'pontos de risco': '🚨',
  'risco': '🚨',
  'decisão sugerida': '🎯', 'decisao sugerida': '🎯',
  'ação do analista': '👤', 'acao do analista': '👤',
};

// ────────────────────────────────────────────────────────────────────────────
// Normalisation
// ────────────────────────────────────────────────────────────────────────────
function normalise(text) {
  if (!text) return '';
  let out = String(text);

  // Convert [FONTE: ...] → (*FONTE: ...*) so markdown renders as <em> — handled by component
  out = out.replace(/\[FONTE:\s*([^\]]+)\]/gi, '(*FONTE: $1*)');
  out = out.replace(/\[fonte\s+([^\]]+)\]/gi, '(*FONTE: $1*)');

  // Convert structural headers at start of line (with or without bold markers, with or without colon)
  const headerPattern = new RegExp(
    `^\\s*\\*{0,2}\\s*(${STRUCTURAL_HEADERS.join('|')})\\s*\\*{0,2}\\s*:\\s*`,
    'gim'
  );
  out = out.replace(headerPattern, (_m, h) => {
    const key = h.toLowerCase();
    const icon = HEADER_ICONS[key] || '▸';
    const title = h.charAt(0).toUpperCase() + h.slice(1).toLowerCase();
    return `\n\n### ${icon} ${title}\n\n`;
  });

  // Dimension headers: "Dimensão X:" or "Seção Y:"
  out = out.replace(
    /^\s*\*{0,2}(Dimensão|Dimensao|Seção|Secao|Análise|Analise)\s+(\d+|[A-Z])[.:]\s*\*{0,2}\s*/gim,
    '\n\n## $1 $2\n\n'
  );

  // Bold headers at start "**Título:**" — convert to subheading
  out = out.replace(/^\s*\*\*([^*\n]{3,80}):\*\*\s*/gim, '\n\n#### $1\n\n');

  // ─── Inline Sentinel markers → break into labeled paragraphs ───
  // When Sentinel writes a condition, it uses inline labels like
  // "O QUE: ... POR QUÊ: ... DURAÇÃO: ... CRITÉRIO DE REMOÇÃO: ..."
  // We convert each of them into its own paragraph with a small bold label.
  const INLINE_LABELS = [
    'O\\s*QUE',
    'POR\\s*QU[ÊE]',
    'DURA[ÇC][ÃA]O',
    'CRIT[ÉE]RIO\\s+DE\\s+REMO[ÇC][ÃA]O',
    'ONDE',
    'EVID[ÊE]NCIA',
    'IMPACTO',
    'RISCO',
    'PRAZO',
    'A[ÇC][ÃA]O',
    'RESPONS[ÁA]VEL',
  ];
  const inlineLabelsGroup = INLINE_LABELS.join('|');
  // Break BEFORE each occurrence (unless it's already at line start) with two newlines + bold label
  const inlineRe = new RegExp(`\\s*\\b(${inlineLabelsGroup})\\s*[:：]\\s*`, 'gi');
  out = out.replace(inlineRe, (_m, label) => {
    // Normalize label capitalization: "O QUE", "Por quê", "Duração", "Critério de Remoção"
    const clean = label.replace(/\s+/g, ' ').trim();
    const pretty = clean.toUpperCase() === 'O QUE'
      ? 'O que'
      : /^POR\s*QU/i.test(clean)
      ? 'Por quê'
      : /^DURA/i.test(clean)
      ? 'Duração'
      : /^CRIT/i.test(clean)
      ? 'Critério de remoção'
      : /^ONDE$/i.test(clean)
      ? 'Onde'
      : /^EVID/i.test(clean)
      ? 'Evidência'
      : /^IMPACTO$/i.test(clean)
      ? 'Impacto'
      : /^RISCO$/i.test(clean)
      ? 'Risco'
      : /^PRAZO$/i.test(clean)
      ? 'Prazo'
      : /^A[ÇC]/i.test(clean)
      ? 'Ação'
      : /^RESPONS/i.test(clean)
      ? 'Responsável'
      : clean;
    return `\n\n**${pretty}:** `;
  });

  // Numbered list "1. " or "1) " at line start → markdown list
  out = out.replace(/^\s*(\d+)[.)]\s+/gm, '- **$1.** ');

  // Ensure blank line between paragraphs
  out = out.replace(/([^\n])\n([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ])/g, '$1\n\n$2');

  // Collapse 4+ newlines
  out = out.replace(/\n{4,}/g, '\n\n\n');

  return out.trim();
}

// ────────────────────────────────────────────────────────────────────────────
// Inline decorators — transform plain text inside a paragraph/list item
// ────────────────────────────────────────────────────────────────────────────
const MONEY_RE = /R\$\s?[\d.,]+/g;
const PERCENT_RE = /\b\d{1,3}(?:[.,]\d+)?\s?%/g;
const CNPJ_RE = /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g;
const CPF_RE = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g;
const DATE_RE = /\b\d{2}\/\d{2}\/\d{4}\b/g;
const SEVERITY_RE = new RegExp(
  `\\b(${Object.keys(SEVERITY_CHIP).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
  'gi'
);

function decorateInline(node) {
  if (typeof node !== 'string') return node;
  // Each decorator returns an array of React elements / strings
  const parts = [];
  let remaining = node;
  let keyCounter = 0;

  // Run one regex at a time, composing results
  const apply = (input, re, render) => {
    const output = [];
    let last = 0;
    let m;
    const str = typeof input === 'string' ? input : '';
    if (!str) return [input];
    while ((m = re.exec(str)) !== null) {
      if (m.index > last) output.push(str.slice(last, m.index));
      output.push(render(m[0], keyCounter++));
      last = m.index + m[0].length;
    }
    if (last < str.length) output.push(str.slice(last));
    return output;
  };

  // Start with the string, apply each decorator. After the first pass we get a
  // mixed array (strings + elements) — subsequent decorators only process strings.
  let chain = [remaining];
  const runDecorator = (re, render) => {
    const next = [];
    for (const item of chain) {
      if (typeof item === 'string') {
        re.lastIndex = 0;
        next.push(...apply(item, re, render));
      } else {
        next.push(item);
      }
    }
    chain = next;
  };

  runDecorator(SEVERITY_RE, (t, k) => {
    const upper = t.toUpperCase();
    const cls = SEVERITY_CHIP[upper] || SEVERITY_CHIP[t.toUpperCase()] || 'bg-slate-100 text-slate-700 border-slate-200';
    return (
      <span
        key={`sev-${k}`}
        className={`inline-flex items-center px-1.5 py-0 rounded text-[10px] font-bold uppercase tracking-wide border ${cls} mx-0.5 align-middle`}
      >
        {t}
      </span>
    );
  });
  runDecorator(MONEY_RE, (t, k) => (
    <span key={`m-${k}`} className="font-mono text-[#0A0A0A] font-semibold bg-slate-50 px-1 rounded">{t}</span>
  ));
  runDecorator(PERCENT_RE, (t, k) => (
    <span key={`p-${k}`} className="font-mono text-[#0A0A0A] font-semibold">{t}</span>
  ));
  runDecorator(CNPJ_RE, (t, k) => (
    <span key={`cnpj-${k}`} className="font-mono text-[#0A0A0A] text-[0.95em] bg-slate-50 px-1 rounded">{t}</span>
  ));
  runDecorator(CPF_RE, (t, k) => (
    <span key={`cpf-${k}`} className="font-mono text-[#0A0A0A] text-[0.95em] bg-slate-50 px-1 rounded">{t}</span>
  ));
  runDecorator(DATE_RE, (t, k) => (
    <span key={`d-${k}`} className="font-mono text-[#0A0A0A]/70">{t}</span>
  ));
  parts.push(...chain);
  return parts;
}

function decorateChildren(children) {
  if (!children) return children;
  if (Array.isArray(children)) {
    const out = [];
    children.forEach((c, i) => {
      if (typeof c === 'string') {
        out.push(...decorateInline(c).map((el, j) => typeof el === 'string' ? el : React.cloneElement(el, { key: `dec-${i}-${j}` })));
      } else {
        out.push(c);
      }
    });
    return out;
  }
  if (typeof children === 'string') return decorateInline(children);
  return children;
}

// ────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────
export default function SentinelTextFormatter({ text, variant = 'default' }) {
  if (!text) return null;
  const formatted = normalise(text);
  const baseClasses = variant === 'compact' ? 'text-xs leading-relaxed' : 'text-sm leading-relaxed';

  return (
    <div className={`sentinel-formatted ${baseClasses} space-y-1`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className="mb-3 last:mb-0 text-[#0A0A0A]/85">{decorateChildren(children)}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-[#0A0A0A]">{decorateChildren(children)}</strong>
          ),
          em: ({ children }) => {
            const raw = String(children);
            // Source citations: starts with "FONTE:"
            if (/^FONTE:/i.test(raw)) {
              const label = raw.replace(/^FONTE:\s*/i, '').trim();
              return (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-[10px] font-semibold text-indigo-700 border border-indigo-100 mx-1 align-middle">
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  {label}
                </span>
              );
            }
            return <em className="text-[#0A0A0A]/70 not-italic">{decorateChildren(children)}</em>;
          },
          ul: ({ children }) => <ul className="space-y-1.5 my-3 ml-1">{children}</ul>,
          ol: ({ children }) => <ol className="space-y-1.5 my-3 ml-4 list-decimal list-outside">{children}</ol>,
          li: ({ children }) => (
            <li className="flex items-start gap-2.5 pl-2 py-1 text-[#0A0A0A]/85 leading-relaxed border-l-2 border-slate-100 hover:border-[#1356E2] hover:bg-slate-50/30 transition-colors rounded-r">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1356E2] flex-shrink-0 mt-2" />
              <span className="flex-1">{decorateChildren(children)}</span>
            </li>
          ),
          h1: ({ children }) => (
            <h3 className="text-base font-bold text-[#0A0A0A] mt-5 mb-2 pb-1.5 border-b-2 border-[#1356E2]/30">
              {decorateChildren(children)}
            </h3>
          ),
          h2: ({ children }) => (
            <h4 className="text-[13px] font-bold text-[#0A0A0A] mt-4 mb-2 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#1356E2] rounded-full" />
              {decorateChildren(children)}
            </h4>
          ),
          h3: ({ children }) => {
            // Structural header with emoji — render as a "callout heading"
            return (
              <div className="mt-4 mb-2 first:mt-0">
                <h5 className="text-[11px] font-bold text-[#0A0A0A] uppercase tracking-wider flex items-center gap-1.5">
                  {decorateChildren(children)}
                </h5>
              </div>
            );
          },
          h4: ({ children }) => (
            <h6 className="text-xs font-semibold text-[#0A0A0A]/70 mt-3 mb-1 uppercase tracking-wide">
              {decorateChildren(children)}
            </h6>
          ),
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-slate-100 text-[11px] font-mono text-[#0A0A0A]">
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-[#1356E2] bg-slate-50/60 pl-3 py-1 my-3 italic text-[#0A0A0A]/70">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-4 border-slate-100" />,
        }}
      >
        {formatted}
      </ReactMarkdown>
    </div>
  );
}