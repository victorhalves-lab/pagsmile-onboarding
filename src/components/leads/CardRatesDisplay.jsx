import React from 'react';
import { CreditCard } from 'lucide-react';

const CARD_RATE_QUESTION_IDS = [
  '69a5cd44afab70a7ca218502', '69a5cd44afab70a7ca218503',
  '69a8621316a6e3a86682f6e3', '69a8621316a6e3a86682f6e4',
  '69a5cd45afab70a7ca218504', '69a5cd45afab70a7ca218505',
  '69a5cd45afab70a7ca218506', '69a8621316a6e3a86682f6e5',
  '69a8621316a6e3a86682f6e6', '69a5cd45afab70a7ca218507',
  '69a5cd45afab70a7ca218508', '69a5cd45afab70a7ca218509',
  '69a8621316a6e3a86682f6e7', '69a8621316a6e3a86682f6e8',
  '69a5cd45afab70a7ca21850a',
];

const BANDEIRAS = ['Visa', 'Mastercard', 'Amex', 'Elo', 'Outras'];
const CATEGORIAS = [
  { label: 'À Vista (1x)', prefix: 'Taxa de Cartão à Vista (1x)' },
  { label: '2-6x', prefix: 'Taxa de Cartão 2-6x' },
  { label: '7-12x', prefix: 'Taxa de Cartão 7-12x' },
];

export { CARD_RATE_QUESTION_IDS };

export default function CardRatesDisplay({ questions, questionnaireData }) {
  const rateQuestions = questions.filter(q => CARD_RATE_QUESTION_IDS.includes(q.id));
  if (rateQuestions.length === 0) return null;

  const grid = CATEGORIAS.map(cat => {
    const row = BANDEIRAS.map(bandeira => {
      const q = rateQuestions.find(rq =>
        rq.text.startsWith(cat.prefix) && rq.text.includes(bandeira)
      );
      if (!q) return { bandeira, value: null, questionId: null };
      const raw = questionnaireData[q.id];
      const val = raw !== undefined && raw !== null && raw !== '' ? parseFloat(raw) : null;
      return { bandeira, value: val, questionId: q.id };
    });
    return { ...cat, rates: row };
  });

  const hasAnyValue = grid.some(cat => cat.rates.some(r => r.value !== null));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <CreditCard className="w-4 h-4 text-rose-500" />
        <span className="text-xs font-bold text-[#002443]/70 uppercase tracking-wider">Taxas de Cartão de Crédito por Bandeira</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b-2 border-[#e2e8f0]">
              <th className="text-left py-2.5 px-3 text-[#002443]/50 font-bold uppercase text-[10px]">Parcelamento</th>
              {BANDEIRAS.map(b => (
                <th key={b} className="text-center py-2.5 px-3 text-[#002443]/50 font-bold uppercase text-[10px]">{b}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map(cat => (
              <tr key={cat.prefix} className="border-b border-[#e2e8f0] hover:bg-[#f1f5f9] transition-colors">
                <td className="py-3 px-3 text-[#002443]/70 font-semibold text-xs">{cat.label}</td>
                {cat.rates.map((r, i) => (
                  <td key={i} className="text-center py-3 px-3">
                    {r.value !== null ? (
                      <span className="text-sm font-bold text-indigo-600">{r.value.toFixed(2).replace('.', ',')}%</span>
                    ) : (
                      <span className="text-[#002443]/15 font-bold">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!hasAnyValue && (
        <p className="text-[11px] text-amber-600 italic text-center py-2 bg-amber-50 rounded-lg border border-amber-100">
          Nenhuma taxa de cartão foi informada pelo lead
        </p>
      )}
    </div>
  );
}