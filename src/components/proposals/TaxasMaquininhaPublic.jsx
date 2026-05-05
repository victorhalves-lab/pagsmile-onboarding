import React from 'react';

const BANDEIRAS = [
  { id: 'visa', label: 'Visa' },
  { id: 'mastercard', label: 'Mastercard' },
  { id: 'elo', label: 'Elo' },
  { id: 'amex', label: 'Amex' },
  { id: 'outras', label: 'Outras' },
];

function fmt(val) {
  if (val === null || val === undefined || val === '') return '—';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num) || num === 0) return '—';
  return `${num.toFixed(2)}%`;
}

/**
 * Tabela pública para taxas de MAQUININHA (presencial).
 * Mostra: Bandeira × (Crédito 1x | 2-6x | 7-12x | Débito).
 */
export default function TaxasMaquininhaPublic({ maquininha }) {
  const credito = maquininha?.credito || {};
  const debito = maquininha?.debito || {};

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-[#2bc196]/20">
            <th className="text-left py-3 px-4 font-semibold text-[#002443]/70">Bandeira</th>
            <th className="text-center py-3 px-4 font-semibold text-[#002443]">Crédito 1x</th>
            <th className="text-center py-3 px-4 font-semibold text-[#002443]">2x a 6x</th>
            <th className="text-center py-3 px-4 font-semibold text-[#002443]">7x a 12x</th>
            <th className="text-center py-3 px-4 font-semibold text-[#002443]">Débito</th>
          </tr>
        </thead>
        <tbody>
          {BANDEIRAS.map(b => (
            <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50/50">
              <td className="py-3 px-4 font-medium text-[#002443]/80">{b.label}</td>
              <td className="py-3 px-4 text-center font-bold text-[#2bc196]">{fmt(credito[b.id]?.avista)}</td>
              <td className="py-3 px-4 text-center font-bold text-[#2bc196]">{fmt(credito[b.id]?.de2a6x)}</td>
              <td className="py-3 px-4 text-center font-bold text-[#2bc196]">{fmt(credito[b.id]?.de7a12x)}</td>
              <td className="py-3 px-4 text-center font-bold text-[#2bc196]">{fmt(debito[b.id])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}