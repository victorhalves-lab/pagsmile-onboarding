import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const parseTaxa = (val) => {
  if (!val && val !== 0) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

const fmtBRL = (val) => `R$ ${Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtPct = (val) => `${Number(val || 0).toFixed(2).replace('.', ',')}%`;

export default function ProfitabilityPanel({ rates, form, partner, leadTpv, leadTransacoes }) {
  const profitability = useMemo(() => {
    if (!partner) return null;

    const tpv = parseTaxa(leadTpv) || 100000;
    const txMes = parseTaxa(leadTransacoes) || 1000;

    // --- MDR: média ponderada simplificada (supondo mix: 60% crédito à vista, 25% parcelado 2-6x, 10% 7-12x, 5% 13-21x) ---
    const mixWeights = { avista: 0.60, de2a6x: 0.25, de7a12x: 0.10, de13a21x: 0.05 };
    const bandeiras = ['visa', 'mastercard', 'elo', 'amex', 'outras'];
    const bandeiraPeso = { mastercard: 0.35, visa: 0.35, elo: 0.15, amex: 0.10, outras: 0.05 };

    let mdrMedioProposta = 0;
    let mdrMedioParceiro = 0;

    // Encontrar o bloco de taxas do parceiro para o MCC do cliente
    const clientMcc = form?.clienteMcc || '';
    const partnerMccBlock = partner.mdrByMcc?.find(m => m.mccCode === clientMcc) 
      || partner.mdrByMcc?.find(m => m.mccCode === 'Demais' || m.mccCode === 'demais' || m.mccCode === 'DEMAIS')
      || partner.mdrByMcc?.[0];

    bandeiras.forEach(b => {
      const peso = bandeiraPeso[b] || 0.05;
      Object.entries(mixWeights).forEach(([faixa, faixaPeso]) => {
        const taxaProposta = parseTaxa(rates?.cartao?.[b]?.[faixa]) / 100; // % -> decimal
        const taxaParceiro = partnerMccBlock?.rates?.[b]?.[faixa] || 0; // Já em decimal no parceiro
        mdrMedioProposta += taxaProposta * peso * faixaPeso;
        mdrMedioParceiro += taxaParceiro * peso * faixaPeso;
      });
    });

    const receitaMDR = tpv * mdrMedioProposta;
    const custoMDR = tpv * mdrMedioParceiro;

    // --- Fees fixas ---
    const feeTransacaoProposta = parseTaxa(rates?.feeTransacao);
    const antifraudeProposta = parseTaxa(rates?.antifraude);
    const taxa3dsProposta = parseTaxa(rates?.taxa3ds);
    
    const feeTransacaoParceiro = partner.transactionFee || 0;
    const antifraudeParceiro = partner.antifraudCost || 0;
    const taxa3dsParceiro = partner.threeDSCost || 0;

    const receitaFees = (feeTransacaoProposta + antifraudeProposta + taxa3dsProposta) * txMes;
    const custoFees = (feeTransacaoParceiro + antifraudeParceiro + taxa3dsParceiro) * txMes;

    // --- Antecipação ---
    const taxaAntecipProposta = parseTaxa(form?.percentualAntecipacao) / 100;
    const taxaAntecipParceiro = (partner.percentualAntecipacao || 0) / 100;
    const receitaAntecip = tpv * taxaAntecipProposta * (parseTaxa(form?.taxaAntecipacao) / 100);
    const custoAntecip = tpv * taxaAntecipParceiro * (parseTaxa(form?.taxaAntecipacao) / 100);

    const receitaTotal = receitaMDR + receitaFees + receitaAntecip;
    const custoTotal = custoMDR + custoFees + custoAntecip;
    const margem = receitaTotal - custoTotal;
    const margemPct = receitaTotal > 0 ? (margem / receitaTotal) * 100 : 0;

    return {
      tpv, txMes,
      receitaMDR, custoMDR, margemMDR: receitaMDR - custoMDR,
      receitaFees, custoFees, margemFees: receitaFees - custoFees,
      receitaAntecip, custoAntecip, margemAntecip: receitaAntecip - custoAntecip,
      receitaTotal, custoTotal, margem, margemPct,
    };
  }, [rates, form, partner, leadTpv, leadTransacoes]);

  if (!profitability) {
    return (
      <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-[#2bc196]/10 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-[#2bc196]" />
          </div>
          <h2 className="text-sm font-bold text-white">Rentabilidade</h2>
        </div>
        <p className="text-xs text-white/30 text-center py-4">Selecione um parceiro para ver a simulação</p>
      </div>
    );
  }

  const isPositive = profitability.margem > 0;
  const MarginIcon = isPositive ? ArrowUpRight : profitability.margem < 0 ? ArrowDownRight : Minus;
  const marginColor = isPositive ? 'text-[#2bc196]' : profitability.margem < 0 ? 'text-red-400' : 'text-white/50';

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[#2bc196]/10 flex items-center justify-center">
          <TrendingUp className="w-3.5 h-3.5 text-[#2bc196]" />
        </div>
        <h2 className="text-sm font-bold text-white">Simulação de Rentabilidade</h2>
      </div>

      {/* Big Numbers */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#2bc196]/5 border border-[#2bc196]/10 rounded-xl p-3 text-center">
          <p className="text-[8px] text-[#2bc196]/70 font-bold uppercase tracking-wider">Receita Est.</p>
          <p className="text-sm font-bold text-[#2bc196]">{fmtBRL(profitability.receitaTotal)}</p>
        </div>
        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 text-center">
          <p className="text-[8px] text-red-400/70 font-bold uppercase tracking-wider">Custo Est.</p>
          <p className="text-sm font-bold text-red-400">{fmtBRL(profitability.custoTotal)}</p>
        </div>
        <div className={`${isPositive ? 'bg-[#2bc196]/10 border-[#2bc196]/20' : 'bg-red-500/10 border-red-500/20'} border rounded-xl p-3 text-center`}>
          <p className={`text-[8px] font-bold uppercase tracking-wider ${marginColor}/70`}>Margem</p>
          <div className="flex items-center justify-center gap-1">
            <MarginIcon className={`w-3.5 h-3.5 ${marginColor}`} />
            <p className={`text-sm font-bold ${marginColor}`}>{fmtBRL(profitability.margem)}</p>
          </div>
          <p className={`text-[10px] ${marginColor}`}>{fmtPct(profitability.margemPct)}</p>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
        <div className="grid grid-cols-4 text-[8px] text-white/40 font-bold uppercase tracking-wider py-2 px-3 bg-white/[0.02]">
          <div>Categoria</div><div className="text-right">Receita</div><div className="text-right">Custo</div><div className="text-right">Margem</div>
        </div>
        {[
          { label: 'MDR Cartão', receita: profitability.receitaMDR, custo: profitability.custoMDR, margem: profitability.margemMDR },
          { label: 'Fees (Transação, AF, 3DS)', receita: profitability.receitaFees, custo: profitability.custoFees, margem: profitability.margemFees },
          { label: 'Antecipação', receita: profitability.receitaAntecip, custo: profitability.custoAntecip, margem: profitability.margemAntecip },
        ].map(row => (
          <div key={row.label} className="grid grid-cols-4 items-center px-3 py-2 border-t border-white/[0.03]">
            <div className="text-[10px] text-white/60 font-medium">{row.label}</div>
            <div className="text-[10px] text-right text-[#2bc196] font-mono">{fmtBRL(row.receita)}</div>
            <div className="text-[10px] text-right text-red-400 font-mono">{fmtBRL(row.custo)}</div>
            <div className={`text-[10px] text-right font-bold font-mono ${row.margem >= 0 ? 'text-[#2bc196]' : 'text-red-400'}`}>{fmtBRL(row.margem)}</div>
          </div>
        ))}
        <div className="grid grid-cols-4 items-center px-3 py-2 border-t border-white/10 bg-white/[0.02]">
          <div className="text-[10px] text-white font-bold">TOTAL</div>
          <div className="text-[10px] text-right text-[#2bc196] font-bold font-mono">{fmtBRL(profitability.receitaTotal)}</div>
          <div className="text-[10px] text-right text-red-400 font-bold font-mono">{fmtBRL(profitability.custoTotal)}</div>
          <div className={`text-[10px] text-right font-bold font-mono ${profitability.margem >= 0 ? 'text-[#2bc196]' : 'text-red-400'}`}>{fmtBRL(profitability.margem)}</div>
        </div>
      </div>

      <p className="text-[9px] text-white/20 text-center">
        Simulação baseada em TPV de {fmtBRL(profitability.tpv)}/mês e {profitability.txMes.toLocaleString('pt-BR')} transações/mês (mix estimado)
      </p>
    </div>
  );
}