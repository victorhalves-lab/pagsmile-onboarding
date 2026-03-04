import React from 'react';

const BANDEIRAS = [
  { id: 'mastercard', label: 'Master' },
  { id: 'visa', label: 'Visa' },
  { id: 'elo', label: 'Elo' },
  { id: 'amex', label: 'Amex' },
  { id: 'outras', label: 'Outras' },
];

export default function PropostaPreview({ form, rates, selectedBrand, onBandeiraChange }) {
  const parseVal = (val) => { if (!val) return 0; return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val; };
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
      const diasAntecipados = (parcela * 30) - prazoDias;
      if (diasAntecipados > 0) taxaAntecipacao = (diasAntecipados / 30) * taxaRAV;
    }
    rows.push({ parcela, faixaLabel, taxaBase, taxaAntecipacao, taxaFinal: taxaBase + taxaAntecipacao });
  }

  return (
    <div>
      {/* Title */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-white">Preview</h2>
        <span className="text-[10px] text-[#2bc196]/50 font-mono">{form.clienteNome || '—'}</span>
      </div>

      {/* Brand Selector */}
      <div className="flex gap-1.5 mb-3">
        {BANDEIRAS.map(b => (
          <button key={b.id} onClick={() => onBandeiraChange(b.id)}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
              selectedBrand === b.id
                ? 'bg-[#2bc196] text-[#002443]'
                : 'bg-white/5 text-white/20 hover:text-white/40 hover:bg-white/[0.08]'
            }`}>{b.label}</button>
        ))}
      </div>

      {/* Compact table - ALL 21 rows visible */}
      <div className="rounded-xl bg-white/[0.03] border border-white/5 overflow-hidden mb-4">
        <div className="grid grid-cols-5 text-[8px] text-white/20 font-bold uppercase tracking-wider py-1.5 px-2 bg-white/[0.02]">
          <div>Parc.</div><div>Faixa</div><div className="text-right">Base</div><div className="text-right">Antecip.</div><div className="text-right">Final</div>
        </div>
        {rows.map(row => (
          <div key={row.parcela} className="grid grid-cols-5 items-center px-2 py-[5px] border-t border-white/[0.03]">
            <div className="text-[11px] font-bold text-white">{row.parcela}x</div>
            <div><span className="text-[8px] px-1 py-0.5 rounded bg-white/5 text-white/40 font-semibold">{row.faixaLabel}</span></div>
            <div className="text-[10px] text-right text-white/40 font-mono">{fmtPct(row.taxaBase)}</div>
            <div className="text-[10px] text-right font-mono">
              {row.taxaAntecipacao > 0 ? <span className="text-[#5cf7cf]">+{fmtPct(row.taxaAntecipacao)}</span> : <span className="text-white/10">—</span>}
            </div>
            <div className="text-[11px] text-right font-bold text-[#2bc196]">{fmtPct(row.taxaFinal)}</div>
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Prazo', value: prazo, color: 'text-[#2bc196]' },
            { label: 'Taxa de Antecipação', value: `${fmtPct(taxaRAV)} a.m.`, color: 'text-white' },
            { label: 'PIX', value: rates.pix?.tipo === 'fixo' ? `R$ ${parseVal(rates.pix?.valor).toFixed(2)}` : fmtPct(rates.pix?.valor), color: 'text-[#2bc196]' },
          ].map((s, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-2 text-center">
              <p className="text-[8px] text-white font-bold uppercase tracking-widest">{s.label}</p>
              <p className={`text-xs font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2">
          <p className="text-[8px] text-[#2bc196] font-bold uppercase tracking-widest text-center mb-1">TPV Mínimo Mensal Garantido</p>
          <div className="flex items-center justify-center gap-2 text-[9px]">
            <span className="text-white">Mês 1: <span className="font-bold text-white">R$ {parseVal(rates.minimoGarantido?.mes1).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></span>
            <span className="text-white/40">→</span>
            <span className="text-white">Mês 2: <span className="font-bold text-white">R$ {parseVal(rates.minimoGarantido?.mes2).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></span>
            <span className="text-white/40">→</span>
            <span className="text-[#2bc196] font-bold">Mês 3 em diante: R$ {parseVal(rates.minimoGarantido?.mes3).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
          </div>
        </div>
      </div>
    </div>
  );
}