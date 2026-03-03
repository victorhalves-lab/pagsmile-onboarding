import React from 'react';
import { CreditCard } from 'lucide-react';

const BANDEIRAS = [
  { id: 'mastercard', label: 'Master', color: '#EB001B', secondColor: '#F79E1B' },
  { id: 'visa', label: 'Visa', color: '#1A1F71', secondColor: '#F7B600' },
  { id: 'elo', label: 'Elo', color: '#00A4E0', secondColor: '#FFCB05' },
  { id: 'amex', label: 'Amex', color: '#006FCF', secondColor: '#006FCF' },
  { id: 'outras', label: 'Outras', color: '#6B7280', secondColor: '#6B7280' },
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
  for (let parcela = 1; parcela <= 12; parcela++) {
    let taxaBase = 0, faixaLabel = '', faixaColor = '';
    if (parcela === 1) { taxaBase = parseVal(taxas.avista); faixaLabel = '1x'; faixaColor = '#2bc196'; }
    else if (parcela <= 6) { taxaBase = parseVal(taxas.de2a6x); faixaLabel = '2-6x'; faixaColor = '#5cf7cf'; }
    else { taxaBase = parseVal(taxas.de7a12x); faixaLabel = '7-12x'; faixaColor = '#36706c'; }

    let taxaAntecipacao = 0;
    if (prazo !== 'FLUXO' && taxaRAV > 0) {
      const diasAntecipados = (parcela * 30) - prazoDias;
      if (diasAntecipados > 0) taxaAntecipacao = (diasAntecipados / 30) * taxaRAV;
    }
    rows.push({ parcela, faixaLabel, faixaColor, taxaBase, taxaAntecipacao, taxaFinal: taxaBase + taxaAntecipacao });
  }

  const activeBrand = BANDEIRAS.find(b => b.id === selectedBrand);

  return (
    <div className="h-full flex flex-col">
      {/* Title */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-bold text-white">Preview</h2>
        <span className="text-[10px] text-[#2bc196]/50 font-mono">{form.clienteNome || '—'}</span>
      </div>

      {/* Brand Selector Mini */}
      <div className="flex gap-1.5 mb-5">
        {BANDEIRAS.map(b => (
          <button key={b.id} onClick={() => onBandeiraChange(b.id)}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
              selectedBrand === b.id
                ? 'bg-[#2bc196] text-[#002443]'
                : 'bg-white/5 text-white/20 hover:text-white/40 hover:bg-white/[0.08]'
            }`}>{b.label}</button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white/[0.03] border border-white/5 overflow-hidden mb-5 max-h-[500px] overflow-y-auto">
        {/* Header */}
        <div className="grid grid-cols-5 text-[9px] text-white/20 font-bold uppercase tracking-wider py-2 px-3 bg-white/[0.02]">
          <div>Parc.</div><div>Faixa</div><div className="text-right">Base</div><div className="text-right">RAV</div><div className="text-right">Final</div>
        </div>
        {/* Rows */}
        {rows.map(row => (
          <div key={row.parcela} className="grid grid-cols-5 items-center px-3 py-2 border-t border-white/[0.03] hover:bg-[#2bc196]/[0.03] transition-colors">
            <div className="text-sm font-bold text-white">{row.parcela}x</div>
            <div><span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold" style={{ backgroundColor: `${row.faixaColor}15`, color: row.faixaColor }}>{row.faixaLabel}</span></div>
            <div className="text-xs text-right text-white/40 font-mono">{fmtPct(row.taxaBase)}</div>
            <div className="text-xs text-right font-mono">
              {row.taxaAntecipacao > 0 ? <span className="text-[#5cf7cf]">+{fmtPct(row.taxaAntecipacao)}</span> : <span className="text-white/10">—</span>}
            </div>
            <div className="text-sm text-right font-bold text-[#2bc196]">{fmtPct(row.taxaFinal)}</div>
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="space-y-3 mt-auto">
        {/* Summary Row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Prazo', value: prazo, color: 'text-white' },
            { label: 'RAV', value: `${fmtPct(taxaRAV)} a.m.`, color: 'text-[#2bc196]' },
            { label: 'PIX', value: rates.pix?.tipo === 'fixo' ? `R$ ${parseVal(rates.pix?.valor).toFixed(2)}` : fmtPct(rates.pix?.valor), color: 'text-white' },
          ].map((s, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center">
              <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest">{s.label}</p>
              <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* TPV Mínimo */}
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
          <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest text-center mb-2">TPV Mínimo Garantido</p>
          <div className="flex items-center justify-center gap-2 text-[10px]">
            <span className="text-white/50">Mês 1: <span className="font-bold text-white">R$ {parseVal(rates.minimoGarantido?.mes1).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></span>
            <span className="text-white/10">→</span>
            <span className="text-white/50">Mês 2: <span className="font-bold text-white">R$ {parseVal(rates.minimoGarantido?.mes2).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></span>
            <span className="text-white/10">→</span>
            <span className="text-[#2bc196] font-bold">Mês 3+: R$ {parseVal(rates.minimoGarantido?.mes3).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
          </div>
        </div>
      </div>
    </div>
  );
}