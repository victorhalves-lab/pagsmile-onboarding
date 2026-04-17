import React from 'react';

/* ─────────────────────────────────────────────────────────
   DocHelpers — Document-style primitives
   Designed to look good on screen AND print identically.
   NO cards, NO rounded corners, NO shadows, NO borders.
   Clean report / whitepaper aesthetic.
   ───────────────────────────────────────────────────────── */

export const S = ({ children }) => (
  <section className="mb-10">{children}</section>
);

export const H1 = ({ children, id }) => (
  <h1 id={id} className="text-[22px] font-extrabold text-[#002443] mt-10 mb-5 pb-2 border-b-[3px] border-[#2bc196]">
    {children}
  </h1>
);

export const H2 = ({ children }) => (
  <h2 className="text-[17px] font-bold text-[#002443] mt-8 mb-3 pl-3 border-l-[3px] border-[#2bc196]">
    {children}
  </h2>
);

export const H3 = ({ children }) => (
  <h3 className="text-[15px] font-semibold text-[#002443] mt-5 mb-2">
    {children}
  </h3>
);

export const P = ({ children }) => (
  <p className="text-[13px] text-[#002443]/80 leading-[1.85] mb-3">
    {children}
  </p>
);

export const Li = ({ children, className = '' }) => (
  <li className={`text-[13px] text-[#002443]/80 leading-[1.75] ${className}`}>
    {children}
  </li>
);

export const Bold = ({ children }) => (
  <strong className="text-[#002443] font-semibold">{children}</strong>
);

export const Table = ({ headers, rows }) => (
  <div className="my-5 overflow-x-auto">
    <table className="w-full text-xs border-collapse">
      <thead>
        <tr className="bg-[#002443]">
          {headers.map((h, i) => (
            <th key={i} className="px-3 py-2.5 text-left text-white font-semibold border border-[#002443]">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f6f8fa]'}>
            {r.map((c, j) => (
              <td key={j} className="px-3 py-2 border border-[#e0e0e0] align-top text-[#333]">
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const InfoBox = ({ title, children, color = 'blue' }) => {
  const colors = {
    blue:   'border-l-blue-500 bg-blue-50/60',
    green:  'border-l-emerald-500 bg-emerald-50/60',
    red:    'border-l-red-500 bg-red-50/60',
    amber:  'border-l-amber-500 bg-amber-50/60',
    purple: 'border-l-purple-500 bg-purple-50/60',
  };
  return (
    <div className={`border-l-4 ${colors[color] || colors.blue} pl-4 pr-4 py-3 my-5`}>
      <p className="text-xs font-bold text-[#002443] mb-1">{title}</p>
      <div className="text-xs text-[#002443]/70 leading-relaxed space-y-1">{children}</div>
    </div>
  );
};

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