import React from 'react';
import { getOverridesForPrazo } from '@/lib/overridesUtils';

const FAIXAS_LABELS = { 1: 'Cash', 2: '2x-6x', 3: '2x-6x', 4: '2x-6x', 5: '2x-6x', 6: '2x-6x', 7: '7x-12x', 8: '7x-12x', 9: '7x-12x', 10: '7x-12x', 11: '7x-12x', 12: '7x-12x', 13: '13x-21x', 14: '13x-21x', 15: '13x-21x', 16: '13x-21x', 17: '13x-21x', 18: '13x-21x', 19: '13x-21x', 20: '13x-21x', 21: '13x-21x' };

export function calcularTabelaParcelas(taxas, taxaRAV, prazo) {
  const prazoDias = prazo === 'FLUXO' ? 0 : (parseInt(String(prazo).replace('D+', '')) || 1);
  const rows = [];
  const maxParcelas = 21;

  for (let parcela = 1; parcela <= maxParcelas; parcela++) {
    let taxaBase = 0;
    if (parcela === 1) {
      taxaBase = parseFloat(taxas?.avista || taxas?.vista || 0) || 0;
    } else if (parcela <= 6) {
      taxaBase = parseFloat(taxas?.de2a6x || taxas?.parcelado_2_6 || 0) || 0;
    } else if (parcela <= 12) {
      taxaBase = parseFloat(taxas?.de7a12x || taxas?.parcelado_7_12 || 0) || 0;
    } else {
      taxaBase = parseFloat(taxas?.de13a21x || 0) || 0;
    }

    // Antecipação: cada sub-parcela i (de 1 a N) vence em D+(i*30).
    // Custo de antecipar sub-parcela i para D+prazo = RAV * max(0, i*30 - prazo) / 30
    // CET antecipação = média das N sub-parcelas
    let taxaAntecipacao = 0;
    if (prazo !== 'FLUXO' && taxaRAV > 0) {
      let somaAntecip = 0;
      for (let i = 1; i <= parcela; i++) {
        const diasVencimento = i * 30;
        const diasAntecipados = diasVencimento - prazoDias;
        if (diasAntecipados > 0) {
          somaAntecip += (diasAntecipados / 30) * taxaRAV;
        }
      }
      taxaAntecipacao = somaAntecip / parcela;
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

export default function ParcelasTable({ taxas, taxaRAV = 0, prazo = 'D+1', compact = false, taxaFinalOverrides = {} }) {
  const rows = calcularTabelaParcelas(taxas, taxaRAV, prazo);
  const prazoOverrides = getOverridesForPrazo(taxaFinalOverrides, prazo);

  if (!taxas || (!taxas.avista && !taxas.vista && !taxas.de2a6x && !taxas.parcelado_2_6)) {
    return <p className="text-xs text-[var(--pinbank-blue)]/40 text-center py-2">Preencha as taxas de cartão</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${compact ? 'text-[10px]' : 'text-xs'}`}>
        <thead>
          <tr className="border-b border-[#0A0A0A]/10">
            <th className="text-left py-1.5 px-2 font-semibold text-[#0A0A0A]/70">Parcela</th>
            <th className="text-left py-1.5 px-2 font-semibold text-[#0A0A0A]/70">Faixa</th>
            <th className="text-right py-1.5 px-2 font-semibold text-[#0A0A0A]/70">Base</th>
            {taxaRAV > 0 && prazo !== 'FLUXO' && (
              <th className="text-right py-1.5 px-2 font-semibold text-[#0A0A0A]/70">Antecipação</th>
            )}
            <th className="text-right py-1.5 px-2 font-semibold text-[#FEA500]">Final</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.parcela} className="border-b border-[#0A0A0A]/5 hover:bg-[#1356E2]/5">
              <td className="py-1.5 px-2 font-medium">{r.parcela}x</td>
              <td className="py-1.5 px-2 text-[#0A0A0A]/50">{r.faixa}</td>
              <td className="py-1.5 px-2 text-right">{r.taxaBase.toFixed(2)}%</td>
              {taxaRAV > 0 && prazo !== 'FLUXO' && (
                <td className="py-1.5 px-2 text-right text-amber-600">
                  {r.taxaAntecipacao > 0 ? `+${r.taxaAntecipacao.toFixed(2)}%` : '-'}
                </td>
              )}
              <td className={`py-1.5 px-2 text-right font-bold ${prazoOverrides[String(r.parcela)] != null ? 'text-amber-600' : 'text-[var(--pinbank-blue)]'}`}>
                {(prazoOverrides[String(r.parcela)] != null ? prazoOverrides[String(r.parcela)] : r.taxaFinal).toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}