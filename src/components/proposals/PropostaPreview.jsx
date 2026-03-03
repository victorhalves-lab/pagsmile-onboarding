import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const BANDEIRAS = [
  { id: 'mastercard', label: 'Mastercard' },
  { id: 'visa', label: 'Visa' },
  { id: 'elo', label: 'Elo' },
  { id: 'amex', label: 'Amex' },
  { id: 'outras', label: 'Outras' },
];

export default function PropostaPreview({ form, rates, selectedBrand, onBandeiraChange }) {
  // Parsing helpers
  const parseVal = (val) => {
      if (!val) return 0;
      return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  };
  
  const fmtPct = (val) => {
      const num = typeof val === 'number' ? val : parseVal(val);
      if (isNaN(num)) return '0.00%';
      return `${num.toFixed(2)}%`;
  };

  const taxas = rates.cartao?.[selectedBrand] || {};
  const taxaRAV = parseVal(form.taxaAntecipacao);
  const prazo = form.prazoRecebimento || 'D+1';
  
  // Convert prazo to days
  const getPrazoDias = (p) => {
      if (p === 'FLUXO') return 0;
      if (p.startsWith('D+')) return parseInt(p.split('+')[1]);
      return 1; // default
  };
  const prazoDias = getPrazoDias(prazo);

  // Generate rows
  const rows = [];
  for (let parcela = 1; parcela <= 12; parcela++) {
      let faixa = '';
      let taxaBase = 0;
      let badgeColor = '';
      let badgeLabel = '';

      if (parcela === 1) {
          faixa = 'avista';
          badgeLabel = 'Cash';
          badgeColor = 'bg-blue-500/20 text-blue-400';
          taxaBase = parseVal(taxas.avista);
      } else if (parcela >= 2 && parcela <= 6) {
          faixa = 'de2a6x';
          badgeLabel = '2x-6x';
          badgeColor = 'bg-purple-500/20 text-purple-400';
          taxaBase = parseVal(taxas.de2a6x);
      } else {
          faixa = 'de7a12x';
          badgeLabel = '7x-12x';
          badgeColor = 'bg-amber-500/20 text-amber-400';
          taxaBase = parseVal(taxas.de7a12x);
      }

      // Calculate Antecipation
      let taxaAntecipacao = 0;
      if (prazo !== 'FLUXO' && taxaRAV > 0) {
          const diasVencimento = parcela * 30;
          const diasAntecipados = diasVencimento - prazoDias;
          // Only if positive anticipation
          if (diasAntecipados > 0) {
              const mesesAntecipados = diasAntecipados / 30;
              taxaAntecipacao = mesesAntecipados * taxaRAV;
          }
      }

      const taxaFinal = taxaBase + taxaAntecipacao;

      rows.push({
          parcela,
          badgeLabel,
          badgeColor,
          taxaBase,
          taxaAntecipacao,
          taxaFinal
      });
  }

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-base font-semibold text-white mb-4">Preview - Tabela de Parcelas</h2>
      
      {/* Brand Selector */}
      <div className="mb-4">
        <Select value={selectedBrand} onValueChange={onBandeiraChange}>
            <SelectTrigger className="bg-[#18181b] border-white/10 text-white h-10">
                <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#18181b] border-white/10 text-white">
                {BANDEIRAS.map(b => (
                    <SelectItem key={b.id} value={b.id} className="focus:bg-white/10 focus:text-white cursor-pointer">
                        {b.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>
      
      {/* Table Header */}
      <div className="grid grid-cols-5 text-xs text-slate-500 mb-2 px-2">
          <div>Parcela</div>
          <div>Faixa</div>
          <div className="text-right">Base</div>
          <div className="text-right">RAV</div>
          <div className="text-right">Final</div>
      </div>
      
      {/* Rows */}
      <div className="space-y-1">
          {rows.map(row => (
              <div key={row.parcela} className="grid grid-cols-5 items-center px-2 py-2 rounded-md hover:bg-white/5 transition-colors">
                  <div className="text-sm font-medium text-white">{row.parcela}x</div>
                  <div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${row.badgeColor}`}>
                          {row.badgeLabel}
                      </span>
                  </div>
                  <div className="text-sm text-right text-slate-300">{fmtPct(row.taxaBase)}</div>
                  <div className="text-sm text-right text-slate-400">
                      {row.taxaAntecipacao > 0 ? (
                          <span className="text-emerald-500">+{fmtPct(row.taxaAntecipacao)}</span>
                      ) : (
                          <span className="text-slate-600">-</span>
                      )}
                  </div>
                  <div className="text-sm font-bold text-right text-yellow-500">
                      {fmtPct(row.taxaFinal)}
                  </div>
              </div>
          ))}
      </div>
      
      {/* Footer Stats */}
      <div className="grid grid-cols-3 gap-2 mt-6 p-4 bg-[#18181b] rounded-lg border border-white/5">
          <div className="text-center">
              <p className="text-[10px] text-slate-500 uppercase">Prazo</p>
              <p className="text-sm font-bold text-white">{prazo}</p>
          </div>
          <div className="text-center border-l border-white/5">
              <p className="text-[10px] text-slate-500 uppercase">RAV</p>
              <p className="text-sm font-bold text-[#2bc196]">{fmtPct(taxaRAV)} a.m.</p>
          </div>
          <div className="text-center border-l border-white/5">
              <p className="text-[10px] text-slate-500 uppercase">PIX</p>
              <p className="text-sm font-bold text-white">
                  {rates.pix?.tipo === 'fixo' 
                      ? `R$ ${parseVal(rates.pix?.valor).toFixed(2)}` 
                      : fmtPct(rates.pix?.valor)
                  }
              </p>
          </div>
      </div>
    </div>
  );
}