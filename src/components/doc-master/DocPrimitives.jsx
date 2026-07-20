import React from 'react';

/**
 * DocPrimitives — componentes atômicos de renderização para a Documentação Master.
 *
 * TODO: O design é otimizado para LEITURA densa em tela + IMPRESSÃO PDF (A4).
 * Cada primitive aplica classes "print-*" que o page-level CSS de print sabe tratar.
 */

/* ===================== SEÇÃO RAIZ ===================== */
export function Sec({ id, children }) {
  return (
    <section id={id} className="print-section text-[#1a1a1a]">
      {children}
    </section>
  );
}

/* ===================== HEADERS ===================== */
export function H1({ num, children }) {
  return (
    <h1 className="print-h1 text-2xl md:text-3xl font-black text-[#0A0A0A] mb-2 mt-2 leading-tight border-b-2 border-[#1356E2] pb-3">
      {num && (
        <span className="text-[12px] font-mono font-bold tracking-[0.2em] text-[#1356E2] uppercase block mb-1">
          Capítulo {num}
        </span>
      )}
      {children}
    </h1>
  );
}

export function H2({ num, children }) {
  return (
    <h2 className="text-xl font-extrabold text-[#0A0A0A] mt-7 mb-3 leading-tight">
      {num && <span className="text-[#1356E2] font-mono mr-2">§{num}</span>}
      {children}
    </h2>
  );
}

export function H3({ num, children }) {
  return (
    <h3 className="text-[15.5px] font-bold text-[#0A0A0A] mt-5 mb-2 leading-snug">
      {num && <span className="text-[#1356E2]/80 font-mono mr-1.5">§{num}</span>}
      {children}
    </h3>
  );
}

export function H4({ children }) {
  return <h4 className="text-[13.5px] font-bold text-[#0A0A0A] mt-4 mb-1.5">{children}</h4>;
}

/* ===================== TEXTO ===================== */
export function P({ children, className = '' }) {
  return (
    <p className={`text-[12.5px] text-[#1a1a1a] leading-[1.7] mb-2.5 ${className}`}>
      {children}
    </p>
  );
}

export function Li({ children }) {
  return <li className="text-[12.5px] text-[#1a1a1a] leading-[1.7] mb-1">{children}</li>;
}

export function B({ children }) {
  return <strong className="font-bold text-[#0A0A0A]">{children}</strong>;
}

export function C({ children }) {
  return (
    <code className="font-mono text-[11.5px] bg-[#f4f4f4] text-[#0A0A0A] px-1.5 py-0.5 rounded border border-[#e8e8e8] whitespace-nowrap">
      {children}
    </code>
  );
}

/* ===================== BLOCO DE CÓDIGO ===================== */
export function CodeBlock({ language = 'js', children }) {
  return (
    <pre className="print-code bg-[#0f1623] text-[#e6e9ef] text-[11px] leading-[1.55] p-3.5 rounded-md overflow-x-auto my-3 border border-[#1a2436]">
      <div className="text-[9.5px] uppercase tracking-[0.18em] text-[#E84B1C]/70 font-mono mb-1.5 pb-1 border-b border-white/5">
        {language}
      </div>
      <code className="font-mono whitespace-pre">{children}</code>
    </pre>
  );
}

/* ===================== TABELA ===================== */
export function Table({ headers, rows, dense = false }) {
  return (
    <div className="print-table my-3 overflow-x-auto rounded-md border border-[#e8e8e8]">
      <table className="w-full border-collapse text-left">
        <thead className="bg-[#0A0A0A] text-white">
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className={`${dense ? 'text-[10.5px] py-1.5 px-2.5' : 'text-[11.5px] py-2 px-3'} font-bold uppercase tracking-wider`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className={ri % 2 === 0 ? 'bg-white' : 'bg-[#f4f4f4]'}
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`${dense ? 'text-[11px] py-1.5 px-2.5' : 'text-[12px] py-2 px-3'} text-[#1a1a1a] leading-[1.55] align-top border-t border-[#e8e8e8]`}
                >
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

/* ===================== NOTAS ===================== */
export function Note({ title, kind = 'info', children }) {
  const styles = {
    info: 'bg-[#e8f4fb] border-[#0a6dba] text-[#0A0A0A]',
    warn: 'bg-[#fff4e0] border-[#d97706] text-[#7c2d12]',
    rule: 'bg-[#dcfce7] border-[#15803d] text-[#14532d]',
    danger: 'bg-[#fee2e2] border-[#b91c1c] text-[#7f1d1d]',
  };
  const labels = { info: 'NOTA', warn: 'ATENÇÃO', rule: 'REGRA', danger: 'CRÍTICO' };

  return (
    <div className={`my-3 border-l-4 rounded-r-md p-3 ${styles[kind]}`}>
      <div className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] mb-1 opacity-70">
        {labels[kind]} {title && `— ${title}`}
      </div>
      <div className="text-[12.5px] leading-[1.65]">{children}</div>
    </div>
  );
}

/* ===================== PIPELINE STEPS ===================== */
export function Pipeline({ steps }) {
  return (
    <div className="my-3 space-y-2">
      {steps.map((s, i) => (
        <div
          key={i}
          className="flex gap-3 p-3 bg-white rounded-md border border-[#e8e8e8]"
        >
          <div className="flex-shrink-0 w-12 h-12 rounded-md bg-[#1356E2]/10 flex items-center justify-center font-mono text-[10.5px] font-bold text-[#1356E2] uppercase text-center leading-tight">
            {s.id}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-[13px] font-bold text-[#0A0A0A]">{s.name}</span>
              {s.duration && (
                <span className="text-[9.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 bg-[#f4f4f4] rounded text-[#1a1a1a]/60">
                  {s.duration}
                </span>
              )}
              {s.blocking && (
                <span className="text-[9.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 bg-[#fee2e2] text-[#b91c1c] rounded">
                  {typeof s.blocking === 'string' ? s.blocking : 'BLOCKING'}
                </span>
              )}
            </div>
            <div className="text-[12px] text-[#1a1a1a] leading-[1.6]">{s.desc}</div>
            {s.source && (
              <div className="text-[10.5px] text-[#1a1a1a]/50 font-mono mt-1 italic">
                ↳ {s.source}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ===================== THRESHOLD ===================== */
export function Threshold({ severity, when, points, source }) {
  const sevColors = {
    CRITICO: 'bg-[#fee2e2] text-[#b91c1c] border-[#b91c1c]',
    ALTO: 'bg-[#fed7aa] text-[#9a3412] border-[#ea580c]',
    MEDIO: 'bg-[#fef3c7] text-[#854d0e] border-[#d97706]',
    BAIXO: 'bg-[#dbeafe] text-[#1e3a8a] border-[#1d4ed8]',
    INFO: 'bg-[#e0e7ff] text-[#3730a3] border-[#4338ca]',
    OK: 'bg-[#dcfce7] text-[#14532d] border-[#15803d]',
  };
  const cls = sevColors[severity] || sevColors.INFO;

  return (
    <div className="my-1.5 flex items-start gap-2.5 text-[12px] flex-wrap">
      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls}`}>
        {severity}
      </span>
      <span className="font-mono text-[11.5px] text-[#1a1a1a] flex-1 min-w-[200px]">{when}</span>
      <span className="text-[#0A0A0A] font-bold text-[11.5px]">{points}</span>
      {source && <span className="text-[10px] text-[#1a1a1a]/50 font-mono italic w-full pl-[60px]">↳ {source}</span>}
    </div>
  );
}

/* ===================== ENDPOINT (function/API) ===================== */
export function Endpoint({ method, path, auth, description, params = [], returns, source }) {
  const methodColors = {
    GET: 'bg-[#dbeafe] text-[#1e3a8a]',
    POST: 'bg-[#dcfce7] text-[#14532d]',
    PUT: 'bg-[#fef3c7] text-[#854d0e]',
    DELETE: 'bg-[#fee2e2] text-[#b91c1c]',
    PATCH: 'bg-[#e0e7ff] text-[#3730a3]',
    UPDATE: 'bg-[#fef3c7] text-[#854d0e]',
  };
  const mc = methodColors[method] || 'bg-[#f4f4f4] text-[#0A0A0A]';

  return (
    <div className="my-3 border border-[#e8e8e8] rounded-md overflow-hidden">
      <div className="bg-[#f4f4f4] px-3 py-2 border-b border-[#e8e8e8]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${mc}`}>
            {method}
          </span>
          <code className="font-mono text-[12px] text-[#0A0A0A] font-bold break-all">{path}</code>
        </div>
        {auth && (
          <div className="mt-1 text-[10.5px] font-mono uppercase tracking-wider text-[#1a1a1a]/60">
            🔒 Auth: <span className="text-[#0A0A0A]">{auth}</span>
          </div>
        )}
      </div>
      <div className="p-3 bg-white">
        {description && (
          <p className="text-[12px] text-[#1a1a1a] leading-[1.6] mb-2">{description}</p>
        )}
        {params.length > 0 && (
          <div className="my-2">
            <div className="text-[10px] uppercase tracking-wider text-[#1356E2] font-bold mb-1">Parâmetros</div>
            <div className="space-y-1">
              {params.map((p, i) => (
                <div key={i} className="text-[11.5px] font-mono">
                  <span className="text-[#0A0A0A] font-bold">{p.name}</span>
                  <span className="text-[#1a1a1a]/50"> : </span>
                  <span className="text-[#0a6dba]">{p.type}</span>
                  {p.required && <span className="ml-1 text-[#b91c1c] font-bold">*</span>}
                  {p.desc && <span className="ml-2 text-[#1a1a1a]/70 font-sans"> — {p.desc}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
        {returns && (
          <div className="my-2">
            <div className="text-[10px] uppercase tracking-wider text-[#1356E2] font-bold mb-1">Retorno</div>
            <pre className="bg-[#0f1623] text-[#e6e9ef] text-[10.5px] leading-[1.5] p-2 rounded overflow-x-auto font-mono whitespace-pre">
{returns}
            </pre>
          </div>
        )}
        {source && (
          <div className="text-[10px] text-[#1a1a1a]/50 font-mono italic mt-1.5">↳ {source}</div>
        )}
      </div>
    </div>
  );
}

/* ===================== SCHEMA (entidade) ===================== */
export function Schema({ name, fields }) {
  return (
    <div className="my-3 border border-[#e8e8e8] rounded-md overflow-hidden">
      <div className="bg-[#0A0A0A] text-white px-3 py-2 flex items-center gap-2">
        <span className="text-[9.5px] font-mono uppercase tracking-[0.18em] text-[#E84B1C]">Entidade</span>
        <code className="font-mono text-[13px] font-bold text-white">{name}</code>
        <span className="text-[10px] text-white/50 ml-auto">{fields.length} campos</span>
      </div>
      <div className="bg-white">
        {fields.map((f, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 px-3 py-2 ${i % 2 === 0 ? 'bg-white' : 'bg-[#f4f4f4]'} border-b border-[#e8e8e8]/50 last:border-0`}
          >
            <div className="flex-shrink-0 w-44">
              <code className="font-mono text-[11.5px] text-[#0A0A0A] font-bold">{f.name}</code>
              {f.required && <span className="ml-1 text-[10px] text-[#b91c1c] font-bold">*</span>}
            </div>
            <div className="flex-shrink-0 w-32">
              <code className="font-mono text-[10.5px] text-[#0a6dba]">{f.type}</code>
            </div>
            {f.default !== undefined && (
              <div className="flex-shrink-0 w-28 text-[10.5px] font-mono text-[#1a1a1a]/60">
                = {String(f.default)}
              </div>
            )}
            <div className="flex-1 min-w-0 text-[11.5px] text-[#1a1a1a] leading-[1.55]">
              {f.desc || ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===================== SOURCES (rodapé do capítulo) ===================== */
export function Source({ files }) {
  return (
    <div className="mt-6 p-3 bg-[#f4f4f4] rounded-md border border-[#e8e8e8]">
      <div className="text-[10px] uppercase tracking-[0.18em] text-[#1a1a1a]/60 font-bold mb-1.5">
        Arquivos-Fonte Referenciados
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0.5">
        {files.map((f, i) => (
          <code key={i} className="font-mono text-[10.5px] text-[#0A0A0A] block">
            • {f}
          </code>
        ))}
      </div>
    </div>
  );
}