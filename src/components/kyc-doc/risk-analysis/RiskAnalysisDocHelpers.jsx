import React from 'react';

/* ───────────────────────────────────────────────────────────
 * Primitives — print-friendly atoms shared across all blocks
 * of the Risk Analysis Documentation tab.
 * ─────────────────────────────────────────────────────────── */

export function DocH1({ num, children }) {
  return (
    <h1 className="text-[18pt] font-black text-[#0A0A0A] mt-8 mb-3 pb-2 border-b-2 border-[#1356E2] leading-tight print-h1">
      {num && <span className="text-[#1356E2] font-mono text-[11pt] mr-2">{num}</span>}
      {children}
    </h1>
  );
}

export function DocH2({ num, children }) {
  return (
    <h2 className="text-[14pt] font-black text-[#0A0A0A] mt-6 mb-2 leading-tight">
      {num && <span className="text-[#1356E2] font-mono text-[10pt] mr-2">{num}</span>}
      {children}
    </h2>
  );
}

export function DocH3({ children }) {
  return <h3 className="text-[12pt] font-bold text-[#1356E2] mt-4 mb-1.5">{children}</h3>;
}

export function DocP({ children }) {
  return <p className="text-[10.5pt] text-[#1a1a1a] leading-[1.6] mb-2">{children}</p>;
}

export function DocLi({ children }) {
  return <li className="text-[10.5pt] text-[#1a1a1a] leading-[1.6] mb-1">{children}</li>;
}

export function DocCode({ children }) {
  return (
    <code className="font-mono text-[9.5pt] bg-[#f0f4f8] text-[#0A0A0A] px-1 py-0.5 rounded">
      {children}
    </code>
  );
}

export function DocBold({ children }) {
  return <strong className="font-bold text-[#0A0A0A]">{children}</strong>;
}

export function DocCallout({ kind = 'info', title, children }) {
  const styles = {
    info: 'bg-blue-50 border-blue-300 text-blue-900',
    warn: 'bg-amber-50 border-amber-300 text-amber-900',
    danger: 'bg-red-50 border-red-300 text-red-900',
    rule: 'bg-green-50 border-green-300 text-green-900',
  };
  const labels = { info: 'INFO', warn: 'ATENÇÃO', danger: 'CRÍTICO', rule: 'REGRA' };
  return (
    <div className={`my-3 border-l-[3px] rounded-r p-3 ${styles[kind]} print-avoid-break`}>
      <div className="text-[8pt] font-bold uppercase tracking-[0.15em] mb-1 opacity-70">
        {labels[kind]} {title && `— ${title}`}
      </div>
      <div className="text-[10pt] leading-[1.55]">{children}</div>
    </div>
  );
}

export function DocTable({ headers, rows }) {
  return (
    <div className="my-3 overflow-x-auto print-avoid-break">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-[#1356E2]">
            {headers.map((h, i) => (
              <th
                key={i}
                className="text-left text-[9pt] font-bold text-[#0A0A0A] uppercase tracking-wider py-2 px-2 align-bottom"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-[#e8e8e8]">
              {row.map((cell, ci) => (
                <td key={ci} className="text-[9.5pt] text-[#1a1a1a] py-2 px-2 align-top leading-[1.45]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* Tarjeta de bloco (numerada) — mostra um dos 12 blocos da página de Análise de Risco */
export function BlockCard({ n, title, source, children }) {
  return (
    <div className="my-4 border border-[#e8e8e8] rounded-lg overflow-hidden print-avoid-break">
      <div className="bg-[#0A0A0A] text-white px-4 py-2.5 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-[#1356E2] text-white font-black text-[12pt] flex items-center justify-center shrink-0">
          {n}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11pt] font-bold leading-tight">{title}</p>
          {source && <p className="text-[8.5pt] text-[#E84B1C] font-mono mt-0.5">↳ {source}</p>}
        </div>
      </div>
      <div className="p-4 bg-white">{children}</div>
    </div>
  );
}