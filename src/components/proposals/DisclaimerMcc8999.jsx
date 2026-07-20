import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * Disclaimer público de reclassificação para MCC 8999.
 *
 * Regra: toda proposta cuja segmento ≠ 'gateway' deve avisar o cliente que
 * transações em MCCs incompatíveis com o segmento contratado serão
 * reclassificadas para MCC 8999 e cobradas com as taxas abaixo.
 *
 * Taxas vêm de SegmentDefaultRates (segmentName = 'Gateway'),
 * mas o componente NÃO menciona a palavra "Gateway" — só "MCC 8999".
 *
 * Props:
 *  - businessSubCategory: string (slug do segmento, ex.: 'infoprodutos').
 *  - mccEsperado: string opcional (ex.: '8299') — se não vier, é omitido.
 *  - compact: boolean (modo compacto p/ preview lateral interno).
 *  - publicProvidedRates: opcional, taxas já vindas de uma função pública
 *    (evita chamar SDK em páginas anônimas).
 */
export default function DisclaimerMcc8999({
  businessSubCategory,
  mccEsperado,
  compact = false,
  publicProvidedRates = null,
}) {
  const [rates, setRates] = useState(publicProvidedRates);
  const isGateway = String(businessSubCategory || '').toLowerCase() === 'gateway';

  useEffect(() => {
    // Se a página é autenticada (admin), busca via SDK.
    // Se a página for pública e quem chama já passou as taxas, usa direto.
    if (isGateway) return;
    if (publicProvidedRates) { setRates(publicProvidedRates); return; }
    let cancelled = false;
    (async () => {
      try {
        const list = await base44.entities.SegmentDefaultRates.filter({ segmentName: 'Gateway' });
        if (!cancelled && list && list[0]) setRates(list[0]);
      } catch {
        // página pública sem permissão de SDK — fica sem mostrar taxas (mas mostra aviso textual)
      }
    })();
    return () => { cancelled = true; };
  }, [isGateway, publicProvidedRates]);

  if (isGateway) return null;

  const fmtPct = (v) => (v == null || v === '' ? '—' : `${Number(v).toFixed(2).replace('.', ',')}%`);
  const fmtBrl = (v) => (v == null || v === '' ? '—' : `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

  return (
    <div className={`rounded-2xl border-2 border-amber-400/40 bg-amber-50 ${compact ? 'p-3' : 'p-5'} mb-6`}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-700" />
        </div>
        <div className="flex-1">
          <h3 className={`font-bold text-amber-900 ${compact ? 'text-xs' : 'text-sm'} mb-1.5`}>
            Aviso sobre reclassificação de MCC
          </h3>
          <p className={`text-amber-900/80 leading-relaxed ${compact ? 'text-[11px]' : 'text-xs'}`}>
            As taxas desta proposta foram dimensionadas para o
            {mccEsperado ? <strong className="mx-1">MCC {mccEsperado}</strong> : ' MCC contratado'}
            do seu segmento. Caso a Pin Bank identifique transações operadas em MCCs incompatíveis com o segmento contratado,
            essas transações específicas serão <strong>reclassificadas automaticamente para o MCC 8999</strong> e
            cobradas com as taxas padrão abaixo:
          </p>

          {rates && (
            <div className={`mt-3 grid ${compact ? 'grid-cols-2 gap-1.5' : 'grid-cols-2 md:grid-cols-5 gap-2'}`}>
              <RateBox compact={compact} label="MDR à vista" value={fmtPct(rates.mdrAvista)} />
              <RateBox compact={compact} label="MDR 2-6x" value={fmtPct(rates.mdr2a6x)} />
              <RateBox compact={compact} label="MDR 7-12x" value={fmtPct(rates.mdr7a12x)} />
              <RateBox compact={compact} label="MDR 13-21x" value={fmtPct(rates.mdr13a21x)} />
              <RateBox compact={compact} label="Antecipação" value={`${fmtPct(rates.percentualAntecipacao).replace('%', '')}% a.m.`} />
              <RateBox compact={compact} label="PIX" value={`${fmtPct(rates.pixTaxaPercentual).replace('%', '')}% + ${fmtBrl(rates.pixTaxaFixa)}`} />
              <RateBox compact={compact} label="Boleto" value={fmtBrl(rates.boleto)} />
              <RateBox compact={compact} label="Antifraude" value={fmtBrl(rates.antifraude)} />
              <RateBox compact={compact} label="Fee transação" value={fmtBrl(rates.feeTransacao)} />
              <RateBox compact={compact} label="3DS" value={fmtBrl(rates.taxa3ds)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RateBox({ label, value, compact }) {
  return (
    <div className={`bg-white border border-amber-200 rounded-lg ${compact ? 'px-2 py-1' : 'px-2.5 py-1.5'} text-center`}>
      <p className={`text-amber-900/60 font-semibold uppercase tracking-wider ${compact ? 'text-[8px]' : 'text-[9px]'}`}>{label}</p>
      <p className={`font-bold text-amber-900 ${compact ? 'text-[10px]' : 'text-xs'} mt-0.5`}>{value}</p>
    </div>
  );
}