import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calcularTabelaParcelas } from './ParcelasTable';

const BANDEIRAS = [
  { id: 'mastercard', label: 'Mastercard' },
  { id: 'visa', label: 'Visa' },
  { id: 'elo', label: 'Elo' },
  { id: 'amex', label: 'Amex' },
];

function getTaxasForBandeira(taxas, bandeira) {
  if (!taxas) return {};
  // Novo formato granular
  if (taxas.credito_1x) {
    return {
      avista: taxas.credito_1x?.[bandeira] || 0,
      de2a6x: taxas.credito_2_6x?.[bandeira] || 0,
      de7a12x: taxas.credito_7_12x?.[bandeira] || 0,
    };
  }
  // Formato cartao compat
  if (taxas.cartao?.[bandeira]) {
    return taxas.cartao[bandeira];
  }
  return {};
}

export default function ParcelasTableDetalhada({ taxas, taxaRAV = 0, prazo = 'D+1' }) {
  const [activeBandeira, setActiveBandeira] = useState('mastercard');
  const currentTaxas = getTaxasForBandeira(taxas, activeBandeira);
  const rows = calcularTabelaParcelas(currentTaxas, taxaRAV, prazo);

  return (
    <div>
      <Tabs value={activeBandeira} onValueChange={setActiveBandeira}>
        <TabsList className="grid grid-cols-4 mb-4">
          {BANDEIRAS.map(b => (
            <TabsTrigger key={b.id} value={b.id} className="text-xs">{b.label}</TabsTrigger>
          ))}
        </TabsList>

        {BANDEIRAS.map(b => (
          <TabsContent key={b.id} value={b.id}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[#2bc196]/20">
                    <th className="text-left py-2 px-3 font-semibold text-[#002443]/70">Parcelas</th>
                    <th className="text-right py-2 px-3 font-semibold text-[#002443]/70">Base</th>
                    {taxaRAV > 0 && prazo !== 'FLUXO' && (
                      <th className="text-right py-2 px-3 font-semibold text-amber-600">RAV</th>
                    )}
                    <th className="text-right py-2 px-3 font-semibold text-[#2bc196]">Final</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.parcela} className="border-b border-slate-100">
                      <td className="py-2 px-3 font-medium">{r.parcela}x</td>
                      <td className="py-2 px-3 text-right">{r.taxaBase.toFixed(2)}%</td>
                      {taxaRAV > 0 && prazo !== 'FLUXO' && (
                        <td className="py-2 px-3 text-right text-amber-600">
                          {r.taxaAntecipacao > 0 ? `+${r.taxaAntecipacao.toFixed(2)}%` : '-'}
                        </td>
                      )}
                      <td className="py-2 px-3 text-right font-bold text-[#2bc196]">{r.taxaFinal.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}