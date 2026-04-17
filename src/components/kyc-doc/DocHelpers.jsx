import React from 'react';

export const S = ({ children }) => <div className="kyc-s bg-white rounded-2xl border border-[#002443]/8 px-8 py-6">{children}</div>;
export const H1 = ({ children, id }) => <h1 id={id} className="text-2xl font-black text-[#002443] mb-4 pb-2 border-b-2 border-[#2bc196]">{children}</h1>;
export const H2 = ({ children }) => <h2 className="text-lg font-bold text-[#002443] mt-6 mb-3">{children}</h2>;
export const H3 = ({ children }) => <h3 className="text-base font-semibold text-[#002443]/80 mt-4 mb-2">{children}</h3>;
export const P = ({ children }) => <p className="text-[13px] text-[#002443]/80 leading-[1.8] mb-3">{children}</p>;
export const Li = ({ children, className = '' }) => <li className={`text-[13px] text-[#002443]/80 leading-[1.7] ${className}`}>{children}</li>;
export const Bold = ({ children }) => <strong className="text-[#002443] font-semibold">{children}</strong>;

export const Table = ({ headers, rows }) => (
  <div className="overflow-x-auto my-4">
    <table className="w-full text-xs border-collapse border border-[#002443]/10">
      <thead><tr className="bg-[#002443] text-white">{headers.map((h,i) => <th key={i} className="px-3 py-2 text-left font-semibold border border-[#002443]/20 text-white">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r,i) => <tr key={i} className={i%2===0 ? 'bg-white' : 'bg-[#f4f4f4]'}>{r.map((c,j) => <td key={j} className="px-3 py-2 border border-[#002443]/5 align-top">{c}</td>)}</tr>)}</tbody>
    </table>
  </div>
);

export const InfoBox = ({ title, children, color = 'blue' }) => {
  const c = { blue: 'bg-blue-50 border-blue-200', green: 'bg-emerald-50 border-emerald-200', red: 'bg-red-50 border-red-200', amber: 'bg-amber-50 border-amber-200', purple: 'bg-purple-50 border-purple-200' };
  return <div className={`kyc-info p-4 rounded-xl border ${c[color]||c.blue} my-4`}><p className="text-xs font-bold text-[#002443] mb-1.5">{title}</p><div className="text-xs text-[#002443]/70 leading-relaxed space-y-1">{children}</div></div>;
};

export const QuestionTable = ({ questions }) => (
  <Table
    headers={['#', 'Pergunta', 'Tipo', 'Obrigatória', 'Peso Risco', 'Ajuda / Critério de Análise', 'Opções (se aplicável)']}
    rows={questions.map((q, i) => [
      String(q.order || i + 1),
      q.text,
      typeLabel(q.type),
      q.isRequired ? '✅ Sim' : 'Não',
      q.riskWeight ? `${q.riskWeight}` : '0',
      q.helpText || '—',
      q.options?.length > 0 ? q.options.join(' | ') : (q.type === 'BOOLEAN' ? 'Sim | Não' : '—'),
    ])}
  />
);

function typeLabel(type) {
  const map = { TEXT: 'Texto livre', NUMBER: 'Número', DATE: 'Data', SELECT: 'Seleção única', MULTI_SELECT: 'Seleção múltipla', BOOLEAN: 'Sim/Não', EMAIL: 'E-mail', PHONE: 'Telefone', CPF_CNPJ: 'CPF/CNPJ (autocomplete)', FILE_UPLOAD: 'Upload arquivo' };
  return map[type] || type;
}