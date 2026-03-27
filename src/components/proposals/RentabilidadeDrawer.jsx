import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Minus,
  Loader2, AlertTriangle, Building2, DollarSign, CheckCircle2
} from 'lucide-react';

const PRAZOS = [
  { value: 'D+1', label: 'D+1' },
  { value: 'D+2', label: 'D+2' },
  { value: 'D+7', label: 'D+7' },
  { value: 'D+15', label: 'D+15' },
  { value: 'D+30', label: 'D+30' },
  { value: 'Fluxo', label: 'Fluxo' },
];

const parseTaxa = (val) => {
  if (!val && val !== 0) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

const fmtBRL = (val) => `R$ ${Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtPct = (val) => `${Number(val || 0).toFixed(2).replace('.', ',')}%`;

function calculateProfitability(proposal, partner, prazoAntecipacao) {
  if (!partner || !proposal?.rates) return null;

  const rates = proposal.rates;
  const tpv = parseTaxa(proposal.estimatedRevenue) || parseTaxa(rates.minimoGarantido?.mes1) * 10 || 100000;
  const txMes = Math.round(tpv / 150) || 1000;

  // MDR
  const mixWeights = { avista: 0.60, de2a6x: 0.25, de7a12x: 0.10, de13a21x: 0.05 };
  const bandeiras = ['visa', 'mastercard', 'elo', 'amex', 'outras'];
  const bandeiraPeso = { mastercard: 0.35, visa: 0.35, elo: 0.15, amex: 0.10, outras: 0.05 };

  let mdrMedioProposta = 0;
  let mdrMedioParceiro = 0;

  const clientMcc = proposal.clienteMcc || '';
  const partnerMccBlock = partner.mdrByMcc?.find(m => m.mccCode === clientMcc)
    || partner.mdrByMcc?.find(m => ['Demais', 'demais', 'DEMAIS'].includes(m.mccCode))
    || partner.mdrByMcc?.[0];

  // MDR detalhado por bandeira
  const mdrDetalhado = {};

  bandeiras.forEach(b => {
    const peso = bandeiraPeso[b] || 0.05;
    let receitaBandeira = 0;
    let custoBandeira = 0;

    Object.entries(mixWeights).forEach(([faixa, faixaPeso]) => {
      const taxaProposta = parseTaxa(rates.cartao?.[b]?.[faixa]) / 100;
      const taxaParceiro = partnerMccBlock?.rates?.[b]?.[faixa] || 0;
      const rec = tpv * taxaProposta * peso * faixaPeso;
      const cst = tpv * taxaParceiro * peso * faixaPeso;
      mdrMedioProposta += taxaProposta * peso * faixaPeso;
      mdrMedioParceiro += taxaParceiro * peso * faixaPeso;
      receitaBandeira += rec;
      custoBandeira += cst;
    });

    mdrDetalhado[b] = {
      receita: receitaBandeira,
      custo: custoBandeira,
      margem: receitaBandeira - custoBandeira,
    };
  });

  const receitaMDR = tpv * mdrMedioProposta;
  const custoMDR = tpv * mdrMedioParceiro;

  // Fees fixas
  const feeTransacaoProposta = parseTaxa(rates.feeTransacao);
  const antifraudeProposta = parseTaxa(rates.antifraude);
  const taxa3dsProposta = parseTaxa(rates.taxa3ds);
  const feeTransacaoParceiro = partner.transactionFee || 0;
  const antifraudeParceiro = partner.antifraudCost || 0;
  const taxa3dsParceiro = partner.threeDSCost || 0;

  const receitaFees = (feeTransacaoProposta + antifraudeProposta + taxa3dsProposta) * txMes;
  const custoFees = (feeTransacaoParceiro + antifraudeParceiro + taxa3dsParceiro) * txMes;

  // Antecipação - baseada no prazo escolhido
  const taxaAntecipProposta = parseTaxa(rates.rav?.taxa) / 100;
  const taxaAntecipParceiro = (partner.percentualAntecipacao || 0) / 100;

  // Fator de custo financeiro do prazo de antecipação
  const prazoFator = {
    'D+1': 1.0,
    'D+2': 0.95,
    'D+7': 0.80,
    'D+15': 0.60,
    'D+30': 0.30,
    'Fluxo': 0.0,
  };
  const fatorPrazo = prazoFator[prazoAntecipacao] ?? 1.0;

  // Percentual do TPV antecipado (estimativa: 70% do TPV é antecipado, exceto em Fluxo)
  const pctAntecipado = prazoAntecipacao === 'Fluxo' ? 0 : 0.70;
  const tpvAntecipado = tpv * pctAntecipado;

  const receitaAntecip = tpvAntecipado * taxaAntecipProposta * fatorPrazo;
  const custoAntecip = tpvAntecipado * taxaAntecipParceiro * fatorPrazo;

  const receitaTotal = receitaMDR + receitaFees + receitaAntecip;
  const custoTotal = custoMDR + custoFees + custoAntecip;
  const margem = receitaTotal - custoTotal;
  const margemPct = receitaTotal > 0 ? (margem / receitaTotal) * 100 : 0;

  // Alertas de taxas abaixo do mínimo do parceiro
  const alertas = [];
  bandeiras.forEach(b => {
    ['avista', 'de2a6x', 'de7a12x', 'de13a21x'].forEach(faixa => {
      const taxaProposta = parseTaxa(rates.cartao?.[b]?.[faixa]);
      const faixaParceiro = faixa === 'de13a21x' ? 'de13a24x' : faixa;
      const taxaParceiro = (partnerMccBlock?.rates?.[b]?.[faixaParceiro] || 0) * 100;
      if (taxaProposta > 0 && taxaParceiro > 0 && taxaProposta < taxaParceiro) {
        alertas.push(`${b.toUpperCase()} ${faixa}: ${taxaProposta.toFixed(2)}% < mín. ${taxaParceiro.toFixed(2)}%`);
      }
    });
  });

  // Alertas de fees fixas
  const isTuna = (partner.name || '').toLowerCase().includes('tuna');
  if (!isTuna) {
    if (feeTransacaoProposta > 0 && feeTransacaoProposta < feeTransacaoParceiro) {
      alertas.push(`Fee transação: R$ ${feeTransacaoProposta.toFixed(2)} < mín. R$ ${feeTransacaoParceiro.toFixed(2)}`);
    }
    if (antifraudeProposta > 0 && antifraudeProposta < antifraudeParceiro) {
      alertas.push(`Antifraude: R$ ${antifraudeProposta.toFixed(2)} < mín. R$ ${antifraudeParceiro.toFixed(2)}`);
    }
    if (taxa3dsProposta > 0 && taxa3dsProposta < taxa3dsParceiro) {
      alertas.push(`3DS: R$ ${taxa3dsProposta.toFixed(2)} < mín. R$ ${taxa3dsParceiro.toFixed(2)}`);
    }
  }

  return {
    tpv, txMes, prazoAntecipacao,
    receitaMDR, custoMDR, margemMDR: receitaMDR - custoMDR,
    receitaFees, custoFees, margemFees: receitaFees - custoFees,
    receitaAntecip, custoAntecip, margemAntecip: receitaAntecip - custoAntecip,
    receitaTotal, custoTotal, margem, margemPct,
    mdrDetalhado,
    alertas,
    feesProposta: { feeTransacao: feeTransacaoProposta, antifraude: antifraudeProposta, taxa3ds: taxa3dsProposta },
    feesParceiro: { feeTransacao: feeTransacaoParceiro, antifraude: antifraudeParceiro, taxa3ds: taxa3dsParceiro },
  };
}

function ProfitabilityResult({ profitability, partnerName }) {
  if (!profitability) return null;

  const isPositive = profitability.margem > 0;
  const MarginIcon = isPositive ? ArrowUpRight : profitability.margem < 0 ? ArrowDownRight : Minus;
  const marginColor = isPositive ? 'text-emerald-600' : profitability.margem < 0 ? 'text-red-600' : 'text-slate-500';
  const marginBg = isPositive ? 'bg-emerald-50 border-emerald-200' : profitability.margem < 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200';

  return (
    <div className="space-y-4">
      {/* Big Margin Card */}
      <div className={`rounded-xl border-2 p-4 text-center ${marginBg}`}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Margem Líquida Mensal Estimada</p>
        <div className="flex items-center justify-center gap-2">
          <MarginIcon className={`w-6 h-6 ${marginColor}`} />
          <span className={`text-2xl font-bold ${marginColor}`}>{fmtBRL(profitability.margem)}</span>
        </div>
        <p className={`text-sm font-semibold ${marginColor} mt-1`}>{fmtPct(profitability.margemPct)} de margem</p>
        <p className="text-[10px] text-slate-400 mt-2">
          TPV: {fmtBRL(profitability.tpv)}/mês · {profitability.txMes.toLocaleString('pt-BR')} tx/mês · Prazo: {profitability.prazoAntecipacao}
        </p>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
          <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Receita</p>
          <p className="text-sm font-bold text-emerald-700 mt-1">{fmtBRL(profitability.receitaTotal)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
          <p className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Custo</p>
          <p className="text-sm font-bold text-red-600 mt-1">{fmtBRL(profitability.custoTotal)}</p>
        </div>
        <div className={`rounded-xl p-3 text-center border ${isPositive ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
          <p className={`text-[9px] font-bold uppercase tracking-wider ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>Margem</p>
          <p className={`text-sm font-bold mt-1 ${marginColor}`}>{fmtBRL(profitability.margem)}</p>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="rounded-xl border overflow-hidden">
        <div className="grid grid-cols-4 text-[10px] font-bold uppercase tracking-wider py-2.5 px-4 bg-slate-50 text-slate-500">
          <div>Categoria</div><div className="text-right">Receita</div><div className="text-right">Custo</div><div className="text-right">Margem</div>
        </div>
        {[
          { label: 'MDR Cartão', receita: profitability.receitaMDR, custo: profitability.custoMDR, margem: profitability.margemMDR },
          { label: 'Fees (Tx, AF, 3DS)', receita: profitability.receitaFees, custo: profitability.custoFees, margem: profitability.margemFees },
          { label: 'Antecipação', receita: profitability.receitaAntecip, custo: profitability.custoAntecip, margem: profitability.margemAntecip },
        ].map(row => (
          <div key={row.label} className="grid grid-cols-4 items-center px-4 py-2.5 border-t text-xs">
            <div className="font-medium text-slate-700">{row.label}</div>
            <div className="text-right text-emerald-600 font-mono">{fmtBRL(row.receita)}</div>
            <div className="text-right text-red-500 font-mono">{fmtBRL(row.custo)}</div>
            <div className={`text-right font-bold font-mono ${row.margem >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtBRL(row.margem)}</div>
          </div>
        ))}
        <div className="grid grid-cols-4 items-center px-4 py-2.5 border-t bg-slate-50 text-xs font-bold">
          <div className="text-slate-800">TOTAL</div>
          <div className="text-right text-emerald-700 font-mono">{fmtBRL(profitability.receitaTotal)}</div>
          <div className="text-right text-red-600 font-mono">{fmtBRL(profitability.custoTotal)}</div>
          <div className={`text-right font-mono ${profitability.margem >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{fmtBRL(profitability.margem)}</div>
        </div>
      </div>

      {/* Fees Detail */}
      <div className="rounded-xl border p-4">
        <h4 className="text-xs font-bold text-slate-700 mb-3">Detalhe de Fees por Transação</h4>
        <div className="space-y-2">
          {[
            { label: 'Fee Transação', proposta: profitability.feesProposta.feeTransacao, parceiro: profitability.feesParceiro.feeTransacao },
            { label: 'Antifraude', proposta: profitability.feesProposta.antifraude, parceiro: profitability.feesParceiro.antifraude },
            { label: '3DS', proposta: profitability.feesProposta.taxa3ds, parceiro: profitability.feesParceiro.taxa3ds },
          ].map(fee => {
            const margem = fee.proposta - fee.parceiro;
            return (
              <div key={fee.label} className="flex items-center justify-between text-xs">
                <span className="text-slate-600">{fee.label}</span>
                <div className="flex items-center gap-4">
                  <span className="text-emerald-600 font-mono">R$ {fee.proposta.toFixed(2)}</span>
                  <span className="text-slate-300">→</span>
                  <span className="text-red-500 font-mono">R$ {fee.parceiro.toFixed(2)}</span>
                  <span className={`font-bold font-mono ${margem >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {margem >= 0 ? '+' : ''}R$ {margem.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MDR by Brand */}
      <div className="rounded-xl border p-4">
        <h4 className="text-xs font-bold text-slate-700 mb-3">MDR por Bandeira (Estimado)</h4>
        <div className="space-y-2">
          {Object.entries(profitability.mdrDetalhado).map(([b, data]) => (
            <div key={b} className="flex items-center justify-between text-xs">
              <span className="text-slate-600 capitalize font-medium">{b}</span>
              <div className="flex items-center gap-3">
                <span className="text-emerald-600 font-mono text-[11px]">{fmtBRL(data.receita)}</span>
                <span className="text-red-500 font-mono text-[11px]">{fmtBRL(data.custo)}</span>
                <span className={`font-bold font-mono text-[11px] min-w-[80px] text-right ${data.margem >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {fmtBRL(data.margem)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {profitability.alertas.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h4 className="text-xs font-bold text-amber-800">Alertas de Taxas ({profitability.alertas.length})</h4>
          </div>
          <div className="space-y-1">
            {profitability.alertas.map((alerta, i) => (
              <p key={i} className="text-[11px] text-amber-700">• {alerta}</p>
            ))}
          </div>
        </div>
      )}

      {profitability.alertas.length === 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <p className="text-[11px] text-emerald-700 font-medium">Todas as taxas da proposta estão dentro dos limites do parceiro</p>
        </div>
      )}
    </div>
  );
}


export default function RentabilidadeDrawer({ open, onClose, proposal }) {
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [prazo, setPrazo] = useState('D+1');

  const { data: partners = [], isLoading: loadingPartners } = useQuery({
    queryKey: ['partners-for-rent'],
    queryFn: () => base44.entities.Partner.filter({ isActive: true }),
    enabled: open,
  });

  const selectedPartner = partners.find(p => p.id === selectedPartnerId) || null;

  const profitability = useMemo(() => {
    if (!selectedPartner || !proposal) return null;
    return calculateProfitability(proposal, selectedPartner, prazo);
  }, [selectedPartner, proposal, prazo]);

  // Reset on proposal change
  React.useEffect(() => {
    if (open) {
      setSelectedPartnerId(proposal?.chosenPartnerId || '');
      setPrazo(proposal?.rates?.rav?.prazo || 'D+1');
    }
  }, [open, proposal]);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-[560px] overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-white border-b px-6 py-4">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-base">
              <DollarSign className="w-5 h-5 text-[#2bc196]" />
              Simulação de Rentabilidade
            </SheetTitle>
          </SheetHeader>
          
          {/* Proposal Info */}
          {proposal && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <Badge className="bg-[#2bc196]/10 text-[#2bc196] border-0 text-[10px]">{proposal.codigo}</Badge>
              <span className="text-sm font-semibold text-[#002443]">{proposal.clienteNome || 'Sem nome'}</span>
              {proposal.businessSubCategory && (
                <Badge className={`text-[9px] border-0 ${
                  proposal.businessSubCategory === 'GATEWAY' ? 'bg-indigo-100 text-indigo-700' :
                  proposal.businessSubCategory === 'MARKETPLACE' ? 'bg-amber-100 text-amber-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {proposal.businessSubCategory === 'MERCHAN' ? 'Merchant' : proposal.businessSubCategory}
                </Badge>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {/* Partner Select */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Parceiro</label>
              <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder={loadingPartners ? 'Carregando...' : 'Selecione um parceiro'} />
                </SelectTrigger>
                <SelectContent>
                  {partners.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {p.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prazo Select */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Prazo Antecipação</label>
              <Select value={prazo} onValueChange={setPrazo}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRAZOS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {!selectedPartnerId ? (
            <div className="text-center py-16">
              <Building2 className="w-10 h-10 mx-auto text-slate-200 mb-3" />
              <p className="text-sm text-slate-400">Selecione um parceiro para visualizar a rentabilidade</p>
            </div>
          ) : loadingPartners ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-[#2bc196]" />
            </div>
          ) : (
            <ProfitabilityResult profitability={profitability} partnerName={selectedPartner?.name} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}