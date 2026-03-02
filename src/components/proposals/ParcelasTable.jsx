import React from 'react';

const FAIXAS_LABELS = { 1: 'Cash', 2: '2x-6x', 3: '2x-6x', 4: '2x-6x', 5: '2x-6x', 6: '2x-6x', 7: '7x-12x', 8: '7x-12x', 9: '7x-12x', 10: '7x-12x', 11: '7x-12x', 12: '7x-12x' };

export function calcularTabelaParcelas(taxas, taxaRAV, prazo) {
  const prazoDias = prazo === 'FLUXO' ? 0 : (parseInt(String(prazo).replace('D+', '')) || 1);
  const rows = [];

  for (let parcela = 1; parcela <= 12; parcela++) {
    let taxaBase = 0;
    if (parcela === 1) {
      taxaBase = parseFloat(taxas?.avista || taxas?.vista || 0) || 0;
    } else if (parcela <= 6) {
      taxaBase = parseFloat(taxas?.de2a6x || taxas?.parcelado_2_6 || 0) || 0;
    } else {
      taxaBase = parseFloat(taxas?.de7a12x || taxas?.parcelado_7_12 || 0) || 0;
    }

    let taxaAntecipacao = 0;
    if (prazo !== 'FLUXO' && taxaRAV > 0) {
      const diasVencimento = parcela * 30;
      const diasAntecipados = diasVencimento - prazoDias;
      if (diasAntecipados > 0) {
        const mesesAntecipados = diasAntecipados / 30;
        taxaAntecipacao = mesesAntecipados * taxaRAV;
      }
    }

    rows.push({
      parcela,
      faixa: FAIXAS_LABELS[parcela],
      taxaBase,
      taxaAntecipacao,
      taxaFinal: taxaBase + taxaAntecipacao,
    });
  }
  return rows;
}

export default function ParcelasTable({ taxas, taxaRAV = 0, prazo = 'D+1', compact = false }) {
  const rows = calcularTabelaParcelas(taxas, taxaRAV, prazo);

  if (!taxas || (!taxas.avista && !taxas.vista && !taxas.de2a6x && !taxas.parcelado_2_6)) {
    return <p className="text-xs text-[var(--pagsmile-blue)]/40 text-center py-2">Preencha as taxas de cartão</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${compact ? 'text-[10px]' : 'text-xs'}`}>
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-1.5 px-2 font-semibold text-[var(--pagsmile-blue)]/70">Parcela</th>
            <th className="text-left py-1.5 px-2 font-semibold text-[var(--pagsmile-blue)]/70">Faixa</th>
            <th className="text-right py-1.5 px-2 font-semibold text-[var(--pagsmile-blue)]/70">Base</th>
            {taxaRAV > 0 && prazo !== 'FLUXO' && (
              <th className="text-right py-1.5 px-2 font-semibold text-[var(--pagsmile-blue)]/70">RAV</th>
            )}
            <th className="text-right py-1.5 px-2 font-semibold text-[var(--pagsmile-green)]">Final</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.parcela} className="border-b border-slate-50 hover:bg-slate-50/50">
              <td className="py-1.5 px-2 font-medium">{r.parcela}x</td>
              <td className="py-1.5 px-2 text-[var(--pagsmile-blue)]/50">{r.faixa}</td>
              <td className="py-1.5 px-2 text-right">{r.taxaBase.toFixed(2)}%</td>
              {taxaRAV > 0 && prazo !== 'FLUXO' && (
                <td className="py-1.5 px-2 text-right text-amber-600">
                  {r.taxaAntecipacao > 0 ? `+${r.taxaAntecipacao.toFixed(2)}%` : '-'}
                </td>
              )}
              <td className="py-1.5 px-2 text-right font-bold text-[var(--pagsmile-green)]">
                {r.taxaFinal.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}