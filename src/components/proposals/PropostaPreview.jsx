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
      <h2 className="text-base font-bold text-[#002443] mb-4">Preview - Tabela de Parcelas</h2>
      
      {/* Brand Selector */}
      <div className="mb-4">
        <Select value={selectedBrand} onValueChange={onBandeiraChange}>
            <SelectTrigger className="bg-white border-[#002443]/10 text-[#002443] h-10 rounded-lg">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {BANDEIRAS.map(b => (
                    <SelectItem key={b.id} value={b.id} className="cursor-pointer">
                        {b.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>
      
      {/* Table Header */}
      <div className="grid grid-cols-5 text-xs text-[#282828]/50 mb-2 px-2 font-semibold">
          <div>Parcela</div>
          <div>Faixa</div>
          <div className="text-right">Base</div>
          <div className="text-right">RAV</div>
          <div className="text-right">Final</div>
      </div>
      
      {/* Rows */}
      <div className="space-y-0.5">
          {rows.map(row => (
              <div key={row.parcela} className="grid grid-cols-5 items-center px-2 py-2 rounded-lg hover:bg-[#2bc196]/5 transition-colors">
                  <div className="text-sm font-medium text-[#002443]">{row.parcela}x</div>
                  <div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                        row.parcela === 1 ? 'bg-[#002443]/10 text-[#002443]' :
                        row.parcela <= 6 ? 'bg-[#36706c]/10 text-[#36706c]' :
                        'bg-[#2bc196]/10 text-[#2bc196]'
                      }`}>
                          {row.badgeLabel}
                      </span>
                  </div>
                  <div className="text-sm text-right text-[#282828]/60">{fmtPct(row.taxaBase)}</div>
                  <div className="text-sm text-right">
                      {row.taxaAntecipacao > 0 ? (
                          <span className="text-[#2bc196]">+{fmtPct(row.taxaAntecipacao)}</span>
                      ) : (
                          <span className="text-[#282828]/20">-</span>
                      )}
                  </div>
                  <div className="text-sm font-bold text-right text-[#002443]">
                      {fmtPct(row.taxaFinal)}
                  </div>
              </div>
          ))}
      </div>
      
      {/* Footer Stats */}
      <div className="space-y-2 mt-6">
          <div className="p-3 bg-[#002443]/5 rounded-xl border border-[#002443]/10 flex flex-col gap-1 text-center">
              <p className="text-[10px] text-[#282828]/50 uppercase font-semibold">TPV Mínimo Garantido</p>
              <div className="flex items-center justify-center gap-2 text-[10px] font-medium text-[#002443]">
                  <span>Mês 1: R$ {parseVal(rates.minimoGarantido?.mes1).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                  <span className="text-[#282828]/20">→</span>
                  <span>Mês 2: R$ {parseVal(rates.minimoGarantido?.mes2).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                  <span className="text-[#282828]/20">→</span>
                  <span className="text-[#2bc196] font-bold">Mês 3+: R$ {parseVal(rates.minimoGarantido?.mes3).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
              </div>
          </div>
          <div className="grid grid-cols-3 gap-2 p-4 bg-[#002443]/5 rounded-xl border border-[#002443]/10">
              <div className="text-center">
                  <p className="text-[10px] text-[#282828]/50 uppercase font-semibold">Prazo</p>
                  <p className="text-sm font-bold text-[#002443]">{prazo}</p>
              </div>
              <div className="text-center border-l border-[#002443]/10">
                  <p className="text-[10px] text-[#282828]/50 uppercase font-semibold">RAV</p>
                  <p className="text-sm font-bold text-[#2bc196]">{fmtPct(taxaRAV)} a.m.</p>
              </div>
              <div className="text-center border-l border-[#002443]/10">
                  <p className="text-[10px] text-[#282828]/50 uppercase font-semibold">PIX</p>
                  <p className="text-sm font-bold text-[#002443]">
                      {rates.pix?.tipo === 'fixo' 
                          ? `R$ ${parseVal(rates.pix?.valor).toFixed(2)}` 
                          : fmtPct(rates.pix?.valor)
                      }
                  </p>
              </div>
          </div>
      </div>
    </div>
  );
}