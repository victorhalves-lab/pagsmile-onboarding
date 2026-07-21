import React from 'react';
import { getOverridesForPrazo } from '@/lib/overridesUtils';
import DisclaimerMcc8999 from './DisclaimerMcc8999';

const BANDEIRAS = [
  { id: 'mastercard', label: 'Master' },
  { id: 'visa', label: 'Visa' },
  { id: 'elo', label: 'Elo' },
  { id: 'amex', label: 'Amex' },
  { id: 'outras', label: 'Outras' },
];

export default function PropostaPreview({ form, rates, selectedBrand, onBandeiraChange, taxaFinalOverrides = {}, hideRange13a21 = false }) {
  const prazoOverrides = getOverridesForPrazo(taxaFinalOverrides, form.prazoRecebimento || 'D+1');
  const parseVal = (val) => { if (!val && val !== 0) return 0; if (typeof val === 'number') return isNaN(val) ? 0 : val; const cleaned = String(val).replace(/\./g, '').replace(',', '.'); const num = parseFloat(cleaned); return isNaN(num) ? 0 : num; };
  const fmtPct = (val) => { const num = typeof val === 'number' ? val : parseVal(val); return isNaN(num) ? '0.00%' : `${num.toFixed(2)}%`; };

  const taxas = rates.cartao?.[selectedBrand] || {};
  const taxaRAV = parseVal(form.taxaAntecipacao);
  const prazo = form.prazoRecebimento || 'D+1';
  const getPrazoDias = (p) => { if (p === 'FLUXO') return 0; if (p.startsWith('D+')) return parseInt(p.split('+')[1]); return 1; };
  const prazoDias = getPrazoDias(prazo);

  const rows = [];
  for (let parcela = 1; parcela <= 21; parcela++) {
    let taxaBase = 0, faixaLabel = '';
    if (parcela === 1) { taxaBase = parseVal(taxas.avista); faixaLabel = '1x'; }
    else if (parcela <= 6) { taxaBase = parseVal(taxas.de2a6x); faixaLabel = '2-6x'; }
    else if (parcela <= 12) { taxaBase = parseVal(taxas.de7a12x); faixaLabel = '7-12x'; }
    else { taxaBase = parseVal(taxas.de13a21x); faixaLabel = '13-21x'; }

    let taxaAntecipacao = 0;
    if (prazo !== 'FLUXO' && taxaRAV > 0) {
      let somaAntecip = 0;
      for (let i = 1; i <= parcela; i++) {
        const diasVencimento = i * 30;
        const diasAntecipados = diasVencimento - prazoDias;
        if (diasAntecipados > 0) somaAntecip += (diasAntecipados / 30) * taxaRAV;
      }
      taxaAntecipacao = somaAntecip / parcela;
    }
    const overrideVal = prazoOverrides[String(parcela)];
    const taxaFinal = overrideVal != null ? overrideVal : taxaBase + taxaAntecipacao;
    rows.push({ parcela, faixaLabel, taxaBase, taxaAntecipacao, taxaFinal, hasOverride: overrideVal != null });
  }
  const visibleRows = hideRange13a21 ? rows.filter(r => r.parcela <= 12) : rows;

  // Maquininha (presencial) — só renderiza se ativa
  const usaMaquininha = !!rates.usaMaquininha;
  const mqCredito = rates.maquininha?.credito?.[selectedBrand] || {};
  const mqDebito = rates.maquininha?.debito?.[selectedBrand];

  return (
    <div>
      {/* Title */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-white">Preview</h2>
        <span className="text-[10px] text-[#FEA500]/50 font-mono">{form.clienteNome || '—'}</span>
      </div>

      {/* Brand Selector */}
      <div className="flex gap-1.5 mb-3">
        {BANDEIRAS.map(b => (
          <button key={b.id} onClick={() => onBandeiraChange(b.id)}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
              selectedBrand === b.id
                ? 'bg-[#1356E2] text-[#0A0A0A]'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/[0.08]'
            }`}>{b.label}</button>
        ))}
      </div>

      {/* Compact table - ALL 21 rows visible */}
      <div className="rounded-xl bg-white/[0.03] border border-white/5 overflow-hidden mb-4">
        <div className="grid grid-cols-5 text-[8px] text-white font-bold uppercase tracking-wider py-1.5 px-2 bg-white/[0.02]">
          <div>Parc.</div><div>Faixa</div><div className="text-right">Base</div><div className="text-right">Antecip.</div><div className="text-right">Final</div>
        </div>
        {visibleRows.map(row => (
          <div key={row.parcela} className="grid grid-cols-5 items-center px-2 py-[5px] border-t border-white/[0.03]">
            <div className="text-[11px] font-bold text-white">{row.parcela}x</div>
            <div><span className="text-[8px] px-1 py-0.5 rounded bg-white/5 text-white/70 font-semibold">{row.faixaLabel}</span></div>
            <div className="text-[10px] text-right text-white/70 font-mono">{fmtPct(row.taxaBase)}</div>
            <div className="text-[10px] text-right font-mono">
              {row.taxaAntecipacao > 0 ? <span className="text-[#FEA500]">+{fmtPct(row.taxaAntecipacao)}</span> : <span className="text-white/30">—</span>}
            </div>
            <div className={`text-[11px] text-right font-bold ${row.hasOverride ? 'text-amber-400' : 'text-[#FEA500]'}`}>{fmtPct(row.taxaFinal)}</div>
          </div>
        ))}
      </div>

      {/* Maquininha (presencial) — só se ativa */}
      {usaMaquininha && (
        <div className="rounded-xl bg-[#1356E2]/[0.04] border border-[#1356E2]/10 overflow-hidden mb-4">
          <div className="px-2 py-1.5 bg-[#1356E2]/[0.06] flex items-center justify-between">
            <span className="text-[9px] text-[#FEA500] font-bold uppercase tracking-widest">📱 Maquininha (Presencial)</span>
            <span className="text-[8px] text-white/40 font-mono">{selectedBrand.toUpperCase()}</span>
          </div>
          <div className="grid grid-cols-4 text-[8px] text-white font-bold uppercase tracking-wider py-1.5 px-2 bg-white/[0.02]">
            <div className="text-center">1x</div>
            <div className="text-center">2-6x</div>
            <div className="text-center">7-12x</div>
            <div className="text-center">Débito</div>
          </div>
          <div className="grid grid-cols-4 items-center px-2 py-1.5 border-t border-white/[0.03]">
            <div className="text-[11px] text-center font-bold text-[#FEA500]">{fmtPct(mqCredito.avista)}</div>
            <div className="text-[11px] text-center font-bold text-[#FEA500]">{fmtPct(mqCredito.de2a6x)}</div>
            <div className="text-[11px] text-center font-bold text-[#FEA500]">{fmtPct(mqCredito.de7a12x)}</div>
            <div className="text-[11px] text-center font-bold text-[#FEA500]">{fmtPct(mqDebito)}</div>
          </div>
        </div>
      )}

      {/* Disclaimer MCC 8999 — só aparece se o segmento não for Gateway.
          Mostra ao vendedor exatamente o que o cliente verá na proposta pública. */}
      <DisclaimerMcc8999
        businessSubCategory={form.businessSubCategory}
        mccEsperado={form.clienteMcc}
        compact
      />

      {/* Footer Stats */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Prazo', value: prazo, color: 'text-[#FEA500]' },
            { label: 'Antecipação', value: `${fmtPct(taxaRAV)} a.m.`, color: 'text-white' },
            { label: 'PIX', value: rates.pix?.tipo === 'fixo' ? `R$ ${parseVal(rates.pix?.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : fmtPct(rates.pix?.valor), color: 'text-[#FEA500]' },
            { label: '3DS', value: `R$ ${parseVal(rates.taxa3ds).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, color: 'text-white' },
            { label: 'Setup', value: `R$ ${parseVal(rates.setup).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, color: 'text-white' },
          ].map((s, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-2 text-center">
              <p className="text-[8px] text-white font-bold uppercase tracking-widest">{s.label}</p>
              <p className={`text-xs font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2">
          <p className="text-[8px] text-[#FEA500] font-bold uppercase tracking-widest text-center mb-1">TPV Mínimo Mensal Garantido</p>
          <div className="flex items-center justify-center gap-2 text-[9px]">
            <span className="text-white">Mês 1: <span className="font-bold text-white">R$ {parseVal(rates.minimoGarantido?.mes1).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></span>
            <span className="text-white/40">→</span>
            <span className="text-white">Mês 2: <span className="font-bold text-white">R$ {parseVal(rates.minimoGarantido?.mes2).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></span>
            <span className="text-white/40">→</span>
            <span className="text-[#FEA500] font-bold">Mês 3 em diante: R$ {parseVal(rates.minimoGarantido?.mes3).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
          </div>
        </div>
      </div>
    </div>
  );
}