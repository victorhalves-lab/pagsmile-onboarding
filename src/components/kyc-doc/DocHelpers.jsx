import React from 'react';

/* ─────────────────────────────────────────────────────────
   DocHelpers — Clean document primitives
   100% white bg, black text, green/blue accents on text only
   ───────────────────────────────────────────────────────── */

export const S = ({ children }) => (
  <section className="mb-8">{children}</section>
);

export const H1 = ({ children, id }) => (
  <div id={id} className="mt-12 mb-5">
    <h1 className="text-xl font-extrabold text-[#0A0A0A]">{children}</h1>
    <div className="w-16 h-[2px] bg-[#1356E2] mt-2" />
  </div>
);

export const H2 = ({ children }) => (
  <h2 className="text-base font-bold text-[#0A0A0A] mt-8 mb-3">{children}</h2>
);

export const H3 = ({ children }) => (
  <h3 className="text-sm font-semibold text-[#1356E2] mt-6 mb-2">{children}</h3>
);

export const P = ({ children }) => (
  <p className="text-[13px] text-[#1a1a1a]/80 leading-[1.85] mb-3">{children}</p>
);

export const Li = ({ children, className = '' }) => (
  <li className={`text-[13px] text-[#1a1a1a]/80 leading-[1.75] marker:text-[#1356E2] ${className}`}>{children}</li>
);

export const Bold = ({ children }) => (
  <strong className="text-[#0A0A0A] font-semibold">{children}</strong>
);

export const Table = ({ headers, rows }) => (
  <div className="my-5 overflow-x-auto">
    <table className="w-full text-xs border-collapse">
      <thead>
        <tr className="border-b-2 border-[#1356E2]">
          {headers.map((h, i) => (
            <th key={i} className="px-3 py-2.5 text-left text-[#0A0A0A] font-bold bg-white border-b-2 border-[#1356E2]">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}>
            {r.map((c, j) => (
              <td key={j} className="px-3 py-2 border-b border-[#e8e8e8] align-top text-[#1a1a1a]">
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const InfoBox = ({ title, children }) => (
  <div className="border border-[#e8e8e8] border-l-[3px] border-l-[#1356E2] bg-white pl-4 pr-4 py-3 my-5">
    <p className="text-xs font-bold text-[#0A0A0A] mb-1">{title}</p>
    <div className="text-xs text-[#1a1a1a]/70 leading-relaxed space-y-1">{children}</div>
  </div>
);

export const QuestionTable = ({ questions }) => (
  <Table
    headers={['#', 'Pergunta', 'Tipo', 'Obrig.', 'Risco', 'Critério de Análise', 'Opções']}
    rows={questions.map((q, i) => [
      String(q.order || i + 1),
      q.text,
      typeLabel(q.type),
      q.isRequired ? '✅' : '—',
      q.riskWeight ? `${q.riskWeight}` : '0',
      q.helpText || '—',
      q.options?.length > 0 ? q.options.join(' | ') : (q.type === 'BOOLEAN' ? 'Sim | Não' : '—'),
    ])}
  />
);

function typeLabel(type) {
  const map = {
    TEXT: 'Texto', NUMBER: 'Número', DATE: 'Data', SELECT: 'Seleção',
    MULTI_SELECT: 'Multi-seleção', BOOLEAN: 'Sim/Não', EMAIL: 'E-mail',
    PHONE: 'Telefone', CPF_CNPJ: 'CPF/CNPJ', FILE_UPLOAD: 'Upload',
  };
  return map[type] || type;
}