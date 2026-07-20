import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  TrendingUp, ArrowUpRight, ArrowDownRight, Minus,
  Loader2, AlertTriangle, Building2, DollarSign, CheckCircle2, Calculator, Calendar, Check, Star
} from 'lucide-react';

const BANDEIRAS = ['mastercard', 'visa', 'elo', 'amex', 'outras'];
const FAIXAS = ['avista', 'de2a6x', 'de7a12x', 'de13a21x'];
const FAIXA_LABELS = { avista: '1x', de2a6x: '2-6x', de7a12x: '7-12x', de13a21x: '13-21x' };
const FAIXA_MAP_PARCEIRO = { avista: 'avista', de2a6x: 'de2a6x', de7a12x: 'de7a12x', de13a21x: 'de13a24x' };

// Mix de transações por faixa (sem débito)
const MIX_FAIXAS = { avista: 0.45, de2a6x: 0.35, de7a12x: 0.15, de13a21x: 0.05 };
const MIX_BANDEIRAS = { mastercard: 0.35, visa: 0.35, elo: 0.15, amex: 0.10, outras: 0.05 };

const parseTaxa = (val) => {
  if (!val && val !== 0) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

const fmtBRL = (val) => `R$ ${Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtPct = (val) => `${Number(val || 0).toFixed(2).replace('.', ',')}%`;

/**
 * Obtém a taxa do parceiro para uma bandeira e faixa.
 * Trata o caso de parceiros que usam "todas" como bandeira única.
 */
function getPartnerRate(mccBlock, bandeira, faixaProposta) {
  if (!mccBlock?.rates) return 0;
  
  const faixaParceiro = FAIXA_MAP_PARCEIRO[faixaProposta] || faixaProposta;
  
  // Primeiro tenta a bandeira específica
  if (mccBlock.rates[bandeira]?.[faixaParceiro] !== undefined) {
    return mccBlock.rates[bandeira][faixaParceiro];
  }
  
  // Fallback para "todas" (modelo ASAAS)
  if (mccBlock.rates['todas']?.[faixaParceiro] !== undefined) {
    return mccBlock.rates['todas'][faixaParceiro];
  }
  
  return 0;
}

/**
 * Calcula rentabilidade para um dado TPV
 */
function calculateProfitability(proposal, partner, selectedMccCode, tpv) {
  if (!partner || !proposal?.rates || !selectedMccCode) return null;

  const rates = proposal.rates;
  const txMes = Math.round(tpv / 150) || 1000;

  // Encontrar o bloco MCC selecionado
  const mccBlock = partner.mdrByMcc?.find(m => m.mccCode === selectedMccCode);
  if (!mccBlock) return null;

  // Calcular MDR por bandeira e faixa
  const detalheBandeiras = {};
  let receitaMDRTotal = 0;
  let custoMDRTotal = 0;

  BANDEIRAS.forEach(bandeira => {
    const pesoBandeira = MIX_BANDEIRAS[bandeira] || 0.05;
    let receitaBandeira = 0;
    let custoBandeira = 0;
    const detalheFaixas = {};

    FAIXAS.forEach(faixa => {
      const pesoFaixa = MIX_FAIXAS[faixa] || 0.10;
      const tpvFaixa = tpv * pesoBandeira * pesoFaixa;

      // Taxa da proposta (já em percentual, ex: 3.0 = 3%)
      const taxaPropostaPct = parseTaxa(rates.cartao?.[bandeira]?.[faixa]);
      const taxaPropostaDecimal = taxaPropostaPct / 100;

      // Taxa do parceiro (em decimal, ex: 0.015 = 1.5%)
      const taxaParceiroDecimal = getPartnerRate(mccBlock, bandeira, faixa);
      const taxaParceiroPct = taxaParceiroDecimal * 100;

      const receita = tpvFaixa * taxaPropostaDecimal;
      const custo = tpvFaixa * taxaParceiroDecimal;
      const margem = receita - custo;

      receitaBandeira += receita;
      custoBandeira += custo;

      detalheFaixas[faixa] = {
        taxaProposta: taxaPropostaPct,
        taxaParceiro: taxaParceiroPct,
        receita,
        custo,
        margem,
      };
    });

    detalheBandeiras[bandeira] = {
      receita: receitaBandeira,
      custo: custoBandeira,
      margem: receitaBandeira - custoBandeira,
      faixas: detalheFaixas,
    };

    receitaMDRTotal += receitaBandeira;
    custoMDRTotal += custoBandeira;
  });

  // Fees fixas (por transação)
  const feesProposta = {
    feeTransacao: parseTaxa(rates.feeTransacao),
    antifraude: parseTaxa(rates.antifraude),
    taxa3ds: parseTaxa(rates.taxa3ds),
  };
  const feesParceiro = {
    feeTransacao: partner.transactionFee || 0,
    antifraude: partner.antifraudCost || 0,
    taxa3ds: partner.threeDSCost || 0,
  };

  const totalFeeProposta = feesProposta.feeTransacao + feesProposta.antifraude + feesProposta.taxa3ds;
  const totalFeeParceiro = feesParceiro.feeTransacao + feesParceiro.antifraude + feesParceiro.taxa3ds;
  const receitaFees = totalFeeProposta * txMes;
  const custoFees = totalFeeParceiro * txMes;

  // Antecipação
  const taxaAntecipProposta = parseTaxa(rates.rav?.taxa) / 100;
  const taxaAntecipParceiro = (partner.percentualAntecipacao || 0) / 100;
  const pctAntecipado = parseTaxa(rates.percentualAntecipacao) / 100 || 0.70;
  const tpvAntecipado = tpv * pctAntecipado;
  const receitaAntecip = tpvAntecipado * taxaAntecipProposta;
  const custoAntecip = tpvAntecipado * taxaAntecipParceiro;

  // Totais
  const receitaTotal = receitaMDRTotal + receitaFees + receitaAntecip;
  const custoTotal = custoMDRTotal + custoFees + custoAntecip;
  const margem = receitaTotal - custoTotal;
  const margemPct = receitaTotal > 0 ? (margem / receitaTotal) * 100 : 0;

  // Alertas de taxas abaixo do mínimo
  const alertas = [];
  BANDEIRAS.forEach(bandeira => {
    FAIXAS.forEach(faixa => {
      const taxaProposta = parseTaxa(rates.cartao?.[bandeira]?.[faixa]);
      const taxaParceiro = getPartnerRate(mccBlock, bandeira, faixa) * 100;
      if (taxaProposta > 0 && taxaParceiro > 0 && taxaProposta < taxaParceiro) {
        alertas.push({
          bandeira,
          faixa,
          taxaProposta,
          taxaParceiro,
          diff: taxaParceiro - taxaProposta,
        });
      }
    });
  });

  // Alertas de fees
  const isTuna = (partner.name || '').toLowerCase().includes('tuna');
  if (!isTuna) {
    if (feesProposta.feeTransacao > 0 && feesProposta.feeTransacao < feesParceiro.feeTransacao) {
      alertas.push({ tipo: 'fee', campo: 'Fee Transação', proposta: feesProposta.feeTransacao, parceiro: feesParceiro.feeTransacao });
    }
    if (feesProposta.antifraude > 0 && feesProposta.antifraude < feesParceiro.antifraude) {
      alertas.push({ tipo: 'fee', campo: 'Antifraude', proposta: feesProposta.antifraude, parceiro: feesParceiro.antifraude });
    }
    if (feesProposta.taxa3ds > 0 && feesProposta.taxa3ds < feesParceiro.taxa3ds) {
      alertas.push({ tipo: 'fee', campo: '3DS', proposta: feesProposta.taxa3ds, parceiro: feesParceiro.taxa3ds });
    }
  }

  return {
    tpv, txMes,
    mccCode: selectedMccCode,
    mccDescription: mccBlock.mccDescription,
    receitaMDR: receitaMDRTotal,
    custoMDR: custoMDRTotal,
    margemMDR: receitaMDRTotal - custoMDRTotal,
    receitaFees, custoFees, margemFees: receitaFees - custoFees,
    receitaAntecip, custoAntecip, margemAntecip: receitaAntecip - custoAntecip,
    receitaTotal, custoTotal, margem, margemPct,
    detalheBandeiras,
    feesProposta, feesParceiro,
    alertas,
  };
}


function ResultCard({ profitability, label }) {
  if (!profitability) return null;

  const isPositive = profitability.margem > 0;
  const MarginIcon = isPositive ? ArrowUpRight : profitability.margem < 0 ? ArrowDownRight : Minus;
  const marginColor = isPositive ? 'text-emerald-600' : profitability.margem < 0 ? 'text-red-600' : 'text-slate-500';
  const marginBg = isPositive ? 'bg-emerald-50 border-emerald-200' : profitability.margem < 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200';

  return (
    <div className="space-y-4">
      {/* Label */}
      {label && (
        <div className="text-center">
          <Badge className="bg-[#0A0A0A] text-white">{label}</Badge>
          <p className="text-xs text-slate-500 mt-1">TPV: {fmtBRL(profitability.tpv)} · {profitability.txMes.toLocaleString('pt-BR')} tx/mês</p>
        </div>
      )}

      {/* Big Margin Card */}
      <div className={`rounded-xl border-2 p-4 text-center ${marginBg}`}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Margem Líquida</p>
        <div className="flex items-center justify-center gap-2">
          <MarginIcon className={`w-6 h-6 ${marginColor}`} />
          <span className={`text-2xl font-bold ${marginColor}`}>{fmtBRL(profitability.margem)}</span>
        </div>
        <p className={`text-sm font-semibold ${marginColor} mt-1`}>{fmtPct(profitability.margemPct)} de margem</p>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-emerald-50 rounded-lg p-2.5 text-center border border-emerald-100">
          <p className="text-[9px] font-bold text-emerald-600 uppercase">Receita</p>
          <p className="text-sm font-bold text-emerald-700">{fmtBRL(profitability.receitaTotal)}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-2.5 text-center border border-red-100">
          <p className="text-[9px] font-bold text-red-500 uppercase">Custo</p>
          <p className="text-sm font-bold text-red-600">{fmtBRL(profitability.custoTotal)}</p>
        </div>
        <div className={`rounded-lg p-2.5 text-center border ${isPositive ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
          <p className={`text-[9px] font-bold uppercase ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>Lucro</p>
          <p className={`text-sm font-bold ${marginColor}`}>{fmtBRL(profitability.margem)}</p>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="grid grid-cols-4 text-[9px] font-bold uppercase tracking-wider py-2 px-3 bg-slate-50 text-slate-500">
          <div>Categoria</div><div className="text-right">Receita</div><div className="text-right">Custo</div><div className="text-right">Margem</div>
        </div>
        {[
          { label: 'MDR Cartão', receita: profitability.receitaMDR, custo: profitability.custoMDR, margem: profitability.margemMDR },
          { label: 'Fees (Tx/AF/3DS)', receita: profitability.receitaFees, custo: profitability.custoFees, margem: profitability.margemFees },
          { label: 'Antecipação', receita: profitability.receitaAntecip, custo: profitability.custoAntecip, margem: profitability.margemAntecip },
        ].map(row => (
          <div key={row.label} className="grid grid-cols-4 items-center px-3 py-2 border-t text-[11px]">
            <div className="font-medium text-slate-700">{row.label}</div>
            <div className="text-right text-emerald-600 font-mono">{fmtBRL(row.receita)}</div>
            <div className="text-right text-red-500 font-mono">{fmtBRL(row.custo)}</div>
            <div className={`text-right font-bold font-mono ${row.margem >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtBRL(row.margem)}</div>
          </div>
        ))}
      </div>

      {/* MDR Detail by Brand */}
      <div className="rounded-lg border p-3">
        <h4 className="text-[10px] font-bold text-slate-600 uppercase mb-2">MDR por Bandeira</h4>
        <div className="space-y-1.5">
          {BANDEIRAS.map(b => {
            const data = profitability.detalheBandeiras[b];
            if (!data) return null;
            return (
              <div key={b} className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600 capitalize font-medium w-20">{b}</span>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-600 font-mono w-20 text-right">{fmtBRL(data.receita)}</span>
                  <span className="text-red-500 font-mono w-20 text-right">{fmtBRL(data.custo)}</span>
                  <span className={`font-bold font-mono w-20 text-right ${data.margem >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {fmtBRL(data.margem)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alerts */}
      {profitability.alertas.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h4 className="text-[10px] font-bold text-amber-800 uppercase">Alertas ({profitability.alertas.length})</h4>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {profitability.alertas.map((alerta, i) => (
              <p key={i} className="text-[10px] text-amber-700">
                {alerta.tipo === 'fee' 
                  ? `• ${alerta.campo}: R$ ${alerta.proposta.toFixed(2)} < mín. R$ ${alerta.parceiro.toFixed(2)}`
                  : `• ${alerta.bandeira.toUpperCase()} ${FAIXA_LABELS[alerta.faixa]}: ${alerta.taxaProposta.toFixed(2)}% < mín. ${alerta.taxaParceiro.toFixed(2)}%`
                }
              </p>
            ))}
          </div>
        </div>
      )}

      {profitability.alertas.length === 0 && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <p className="text-[10px] text-emerald-700 font-medium">Taxas dentro dos limites do parceiro</p>
        </div>
      )}
    </div>
  );
}


function MinimoGarantidoTab({ proposal, partner, selectedMccCode }) {
  const minimoGarantido = proposal?.rates?.minimoGarantido;
  
  const meses = [
    { key: 'mes1', label: 'Mês 1', tpv: parseTaxa(minimoGarantido?.mes1) },
    { key: 'mes2', label: 'Mês 2', tpv: parseTaxa(minimoGarantido?.mes2) },
    { key: 'mes3', label: 'Mês 3', tpv: parseTaxa(minimoGarantido?.mes3) },
  ];

  const resultados = meses.map(m => ({
    ...m,
    profitability: m.tpv > 0 ? calculateProfitability(proposal, partner, selectedMccCode, m.tpv) : null,
  }));

  const totalMargem = resultados.reduce((acc, r) => acc + (r.profitability?.margem || 0), 0);
  const totalReceita = resultados.reduce((acc, r) => acc + (r.profitability?.receitaTotal || 0), 0);
  const totalCusto = resultados.reduce((acc, r) => acc + (r.profitability?.custoTotal || 0), 0);

  if (!minimoGarantido || (parseTaxa(minimoGarantido.mes1) === 0 && parseTaxa(minimoGarantido.mes2) === 0 && parseTaxa(minimoGarantido.mes3) === 0)) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-10 h-10 mx-auto text-slate-200 mb-3" />
        <p className="text-sm text-slate-400">Nenhum mínimo garantido definido na proposta</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-gradient-to-r from-[#0A0A0A] to-[#E84B1C] rounded-xl p-4 text-white">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Margem Acumulada (3 meses)</p>
        <p className="text-2xl font-bold">{fmtBRL(totalMargem)}</p>
        <div className="flex gap-4 mt-2 text-xs text-white/70">
          <span>Receita: {fmtBRL(totalReceita)}</span>
          <span>Custo: {fmtBRL(totalCusto)}</span>
        </div>
      </div>

      {/* Month by month cards */}
      <div className="space-y-3">
        {resultados.map(({ key, label, tpv, profitability }) => {
          if (!profitability) {
            return (
              <div key={key} className="rounded-lg border border-dashed p-4 text-center text-slate-400 text-sm">
                {label}: Sem TPV definido
              </div>
            );
          }

          const isPositive = profitability.margem > 0;
          const marginColor = isPositive ? 'text-emerald-600' : 'text-red-600';

          return (
            <div key={key} className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-bold text-slate-800">{label}</h4>
                  <p className="text-xs text-slate-500">TPV: {fmtBRL(tpv)}</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${marginColor}`}>{fmtBRL(profitability.margem)}</p>
                  <p className={`text-xs ${marginColor}`}>{fmtPct(profitability.margemPct)} margem</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-emerald-50 rounded p-2">
                  <p className="text-[9px] text-emerald-600 font-bold uppercase">Receita</p>
                  <p className="text-xs font-bold text-emerald-700">{fmtBRL(profitability.receitaTotal)}</p>
                </div>
                <div className="bg-red-50 rounded p-2">
                  <p className="text-[9px] text-red-500 font-bold uppercase">Custo</p>
                  <p className="text-xs font-bold text-red-600">{fmtBRL(profitability.custoTotal)}</p>
                </div>
                <div className={`rounded p-2 ${isPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <p className={`text-[9px] font-bold uppercase ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>Lucro</p>
                  <p className={`text-xs font-bold ${marginColor}`}>{fmtBRL(profitability.margem)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


export default function RentabilidadeDrawer({ open, onClose, proposal }) {
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [selectedMccCode, setSelectedMccCode] = useState('');
  const [tpvManual, setTpvManual] = useState('');
  const [activeTab, setActiveTab] = useState('tpv');

  const { data: partners = [], isLoading: loadingPartners } = useQuery({
    queryKey: ['partners-for-rent'],
    queryFn: () => base44.entities.Partner.filter({ isActive: true }),
    enabled: open,
  });

  const selectedPartner = partners.find(p => p.id === selectedPartnerId) || null;
  const mccOptions = selectedPartner?.mdrByMcc || [];

  // Reset on open
  useEffect(() => {
    if (open && proposal) {
      setSelectedPartnerId(proposal.chosenPartnerId || '');
      setTpvManual('');
      setActiveTab('tpv');
    }
  }, [open, proposal]);

  // Auto-select MCC when partner changes
  useEffect(() => {
    if (selectedPartner && mccOptions.length > 0) {
      const clientMcc = proposal?.clienteMcc;
      const matchingMcc = mccOptions.find(m => m.mccCode === clientMcc);
      const demaisMcc = mccOptions.find(m => ['Demais', 'demais', 'DEMAIS'].includes(m.mccCode));
      setSelectedMccCode(matchingMcc?.mccCode || demaisMcc?.mccCode || mccOptions[0]?.mccCode || '');
    } else {
      setSelectedMccCode('');
    }
  }, [selectedPartner, mccOptions, proposal?.clienteMcc]);

  // Calculate TPV
  const tpvEstimado = useMemo(() => {
    if (tpvManual) return parseTaxa(tpvManual);
    const mg = proposal?.rates?.minimoGarantido;
    if (mg?.mes3) return parseTaxa(mg.mes3);
    if (mg?.mes2) return parseTaxa(mg.mes2);
    if (mg?.mes1) return parseTaxa(mg.mes1);
    return 100000;
  }, [tpvManual, proposal]);

  const profitability = useMemo(() => {
    if (!selectedPartner || !selectedMccCode || !proposal) return null;
    return calculateProfitability(proposal, selectedPartner, selectedMccCode, tpvEstimado);
  }, [selectedPartner, selectedMccCode, proposal, tpvEstimado]);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-[580px] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b px-5 py-4">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-base">
              <DollarSign className="w-5 h-5 text-[#1356E2]" />
              Simulação de Rentabilidade
            </SheetTitle>
          </SheetHeader>
          
          {/* Proposal Info */}
          {proposal && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <Badge className="bg-[#1356E2]/10 text-[#1356E2] border-0 text-[10px]">{proposal.codigo}</Badge>
              <span className="text-sm font-semibold text-[#0A0A0A]">{proposal.clienteNome || 'Sem nome'}</span>
              {proposal.clienteMcc && (
                <Badge variant="outline" className="text-[9px]">MCC {proposal.clienteMcc}</Badge>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="mt-4 space-y-3">
            {/* Partner Buttons */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Parceiro</label>
              <div className="flex flex-wrap gap-1.5">
                {loadingPartners ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="w-3 h-3 animate-spin" /> Carregando...</div>
                ) : partners.map(p => (
                  <button key={p.id} onClick={() => setSelectedPartnerId(p.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      selectedPartnerId === p.id
                        ? 'bg-[#1356E2] border-[#1356E2] text-white shadow-md'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-[#1356E2]/50'
                    }`}>
                    {selectedPartnerId === p.id && <Check className="w-3 h-3" />}
                    {p.isPrincipal && selectedPartnerId !== p.id && <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />}
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* MCC Buttons */}
            {selectedPartner && mccOptions.length > 0 && (
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  MCC do Parceiro (custo base)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {mccOptions.map(m => (
                    <button key={m.mccCode} onClick={() => setSelectedMccCode(m.mccCode)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                        selectedMccCode === m.mccCode
                          ? 'bg-[#1356E2] border-[#1356E2] text-white shadow-md'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-[#1356E2]/50'
                      }`}>
                      {selectedMccCode === m.mccCode && <Check className="w-2.5 h-2.5 inline mr-1" />}
                      {m.mccCode} {m.mccDescription ? `— ${m.mccDescription}` : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-4">
          {!selectedPartnerId ? (
            <div className="text-center py-16">
              <Building2 className="w-10 h-10 mx-auto text-slate-200 mb-3" />
              <p className="text-sm text-slate-400">Selecione um parceiro para simular</p>
            </div>
          ) : !selectedMccCode ? (
            <div className="text-center py-16">
              <Calculator className="w-10 h-10 mx-auto text-slate-200 mb-3" />
              <p className="text-sm text-slate-400">Parceiro sem MCCs configurados</p>
            </div>
          ) : loadingPartners ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-[#1356E2]" />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full mb-4">
                <TabsTrigger value="tpv" className="flex-1 gap-1.5 text-xs">
                  <Calculator className="w-3.5 h-3.5" />
                  TPV Estimado
                </TabsTrigger>
                <TabsTrigger value="minimo" className="flex-1 gap-1.5 text-xs">
                  <Calendar className="w-3.5 h-3.5" />
                  Mínimo Garantido
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tpv" className="mt-0">
                {/* TPV Input */}
                <div className="mb-4">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                    TPV Mensal para Simulação
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                    <Input
                      type="text"
                      value={tpvManual}
                      onChange={(e) => setTpvManual(e.target.value)}
                      placeholder={fmtBRL(tpvEstimado).replace('R$ ', '')}
                      className="pl-10 h-9 text-sm"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Deixe vazio para usar o Mínimo Garantido Mês 3 ou valor padrão
                  </p>
                </div>

                <ResultCard profitability={profitability} />
              </TabsContent>

              <TabsContent value="minimo" className="mt-0">
                <MinimoGarantidoTab 
                  proposal={proposal} 
                  partner={selectedPartner} 
                  selectedMccCode={selectedMccCode} 
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}