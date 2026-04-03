import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Globe, Zap, Check, ChevronDown, ChevronUp, Loader2, X } from 'lucide-react';

const BANDEIRAS = ['visa', 'mastercard', 'elo', 'amex', 'outras'];

function buildRatesFromStandardProposal(sp) {
  const r = sp.rates || {};
  return {
    cartao: r.cartao || {},
    debito: r.debito || {},
    pix: r.pix || { tipo: 'percentual', valor: null },
    boleto: r.boleto || null,
    antifraude: r.antifraude || null,
    feeTransacao: r.feeTransacao || null,
    rav: r.rav || { taxa: null, prazo: '' },
    percentualAntecipacao: r.percentualAntecipacao || null,
    alertaPreChargeback: r.alertaPreChargeback || null,
  };
}

function buildRatesFromSegmentDefaults(sdr) {
  // SegmentDefaultRates has flat MDR fields — map them to all bandeiras equally
  const mdr = {
    avista: sdr.mdrAvista || null,
    de2a6x: sdr.mdr2a6x || null,
    de7a12x: sdr.mdr7a12x || null,
    de13a21x: sdr.mdr13a21x || null,
  };
  const cartao = {};
  BANDEIRAS.forEach(b => { cartao[b] = { ...mdr }; });

  return {
    cartao,
    debito: {},
    pix: { tipo: 'percentual', valor: sdr.pixTaxaPercentual || null },
    boleto: sdr.boleto || null,
    antifraude: sdr.antifraude || null,
    feeTransacao: sdr.feeTransacao || null,
    rav: { taxa: null, prazo: '' },
    percentualAntecipacao: sdr.percentualAntecipacao || null,
    alertaPreChargeback: null,
  };
}

export default function RatesSourceSelector({ contract, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const currentSource = contract.ratesSourceType || 'manual';
  const currentSourceName = contract.ratesSourceName || null;

  const { data: standardProposals = [], isLoading: loadingSP } = useQuery({
    queryKey: ['std-proposals-for-contract'],
    queryFn: () => base44.entities.StandardProposal.filter({ status: 'ativa' }),
    enabled: expanded,
  });

  const { data: segmentRates = [], isLoading: loadingSDR } = useQuery({
    queryKey: ['segment-default-rates-for-contract'],
    queryFn: () => base44.entities.SegmentDefaultRates.list(),
    enabled: expanded,
  });

  const isLoading = loadingSP || loadingSDR;

  const handleSelectStandardProposal = (sp) => {
    const rates = buildRatesFromStandardProposal(sp);
    onChange('rates', rates);
    onChange('ratesSourceType', 'standard_proposal');
    onChange('ratesSourceId', sp.id);
    onChange('ratesSourceName', `${sp.templateName} (${sp.segment})`);
    if (sp.rates?.setup) onChange('setupFee', sp.rates.setup);
    if (sp.rates?.rav?.prazo) onChange('paymentTerm', sp.rates.rav.prazo);
    if (sp.rates?.minimoGarantido) {
      if (sp.rates.minimoGarantido.mes1) onChange('projectedTpvMonth1', sp.rates.minimoGarantido.mes1);
      if (sp.rates.minimoGarantido.mes2) onChange('projectedTpvMonth2', sp.rates.minimoGarantido.mes2);
      if (sp.rates.minimoGarantido.mes3) onChange('projectedTpvMonth3', sp.rates.minimoGarantido.mes3);
    }
    setExpanded(false);
  };

  const handleSelectSegmentRates = (sdr) => {
    const rates = buildRatesFromSegmentDefaults(sdr);
    onChange('rates', rates);
    onChange('ratesSourceType', 'segment_default_rates');
    onChange('ratesSourceId', sdr.id);
    onChange('ratesSourceName', `Taxas Padrão — ${sdr.segmentName}`);
    onChange('setupFee', 6000);
    setExpanded(false);
  };

  const handleClearSource = () => {
    onChange('ratesSourceType', 'manual');
    onChange('ratesSourceId', '');
    onChange('ratesSourceName', '');
  };

  return (
    <div className="mb-6">
      {/* Current source badge */}
      {currentSource !== 'manual' && currentSourceName && (
        <div className="flex items-center gap-2 mb-3 p-3 bg-[#2bc196]/5 border border-[#2bc196]/20 rounded-xl">
          {currentSource === 'standard_proposal' ? (
            <FileText className="w-4 h-4 text-[#2bc196]" />
          ) : currentSource === 'segment_default_rates' ? (
            <Globe className="w-4 h-4 text-[#2bc196]" />
          ) : (
            <Zap className="w-4 h-4 text-[#2bc196]" />
          )}
          <span className="text-xs font-medium text-[#002443] flex-1">
            Taxas importadas de: <strong>{currentSourceName}</strong>
          </span>
          <Badge className="bg-[#2bc196]/10 text-[#2bc196] text-[10px]">
            {currentSource === 'standard_proposal' ? 'Proposta Padrão' : 
             currentSource === 'segment_default_rates' ? 'Taxas Landing Page' : 
             currentSource === 'proposal' ? 'Proposta Aceita' : 'Manual'}
          </Badge>
          {!contract.proposalLocked && (
            <button onClick={handleClearSource} className="p-1 rounded hover:bg-red-50">
              <X className="w-3 h-3 text-red-400" />
            </button>
          )}
        </div>
      )}

      {/* Toggle button */}
      {!contract.proposalLocked && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full justify-between rounded-xl border-dashed border-[#002443]/15 text-xs font-medium text-[#002443]/60 hover:border-[#2bc196] hover:text-[#2bc196]"
        >
          <span className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5" />
            Importar taxas de Proposta Padrão ou Segmento
          </span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </Button>
      )}

      {/* Expanded panel */}
      {expanded && (
        <div className="mt-3 border border-[#002443]/10 rounded-xl bg-white overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-[#2bc196]" />
            </div>
          ) : (
            <div className="divide-y divide-[#002443]/5">
              {/* Section: Propostas Padrão */}
              {standardProposals.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-[#002443]/50" />
                    <h4 className="text-xs font-bold text-[#002443] uppercase tracking-wide">Propostas Padrão</h4>
                    <Badge className="bg-blue-50 text-blue-600 text-[10px]">{standardProposals.length}</Badge>
                  </div>
                  <div className="grid gap-2">
                    {standardProposals.map(sp => (
                      <button
                        key={sp.id}
                        onClick={() => handleSelectStandardProposal(sp)}
                        className={`w-full text-left p-3 rounded-lg border transition-all hover:border-[#2bc196] hover:bg-[#2bc196]/5 ${
                          contract.ratesSourceId === sp.id ? 'border-[#2bc196] bg-[#2bc196]/5' : 'border-[#002443]/8'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-[#002443]">{sp.templateName}</p>
                            <p className="text-[10px] text-[#002443]/50">{sp.segment} • {sp.codigo || 'Sem código'}</p>
                          </div>
                          {contract.ratesSourceId === sp.id && (
                            <Check className="w-4 h-4 text-[#2bc196]" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Section: Taxas Padrão por Segmento (Landing Page) */}
              {segmentRates.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-[#002443]/50" />
                    <h4 className="text-xs font-bold text-[#002443] uppercase tracking-wide">Taxas Padrão por Segmento (Landing Page)</h4>
                    <Badge className="bg-purple-50 text-purple-600 text-[10px]">{segmentRates.length}</Badge>
                  </div>
                  <div className="grid gap-2">
                    {segmentRates.map(sdr => (
                      <button
                        key={sdr.id}
                        onClick={() => handleSelectSegmentRates(sdr)}
                        className={`w-full text-left p-3 rounded-lg border transition-all hover:border-[#2bc196] hover:bg-[#2bc196]/5 ${
                          contract.ratesSourceId === sdr.id ? 'border-[#2bc196] bg-[#2bc196]/5' : 'border-[#002443]/8'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-[#002443]">{sdr.segmentName}</p>
                            <p className="text-[10px] text-[#002443]/50">
                              MDR 1x: {sdr.mdrAvista ?? '—'}% • PIX: {sdr.pixTaxaPercentual ?? '—'}% • Fee: R${sdr.feeTransacao ?? '—'}
                            </p>
                          </div>
                          {contract.ratesSourceId === sdr.id && (
                            <Check className="w-4 h-4 text-[#2bc196]" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {standardProposals.length === 0 && segmentRates.length === 0 && (
                <div className="p-6 text-center text-xs text-[#002443]/40">
                  Nenhuma proposta padrão ativa ou taxas por segmento cadastradas.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}