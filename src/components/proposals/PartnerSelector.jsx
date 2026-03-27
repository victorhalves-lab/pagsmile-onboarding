import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Handshake, Brain, Loader2, Sparkles, Star, AlertTriangle } from 'lucide-react';

export default function PartnerSelector({ selectedPartnerId, onSelectPartner, leadMcc, leadBusinessType, leadTpv }) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const { data: partners = [] } = useQuery({
    queryKey: ['partners-active'],
    queryFn: async () => {
      const all = await base44.entities.Partner.filter({ isActive: true });
      return all;
    },
  });

  const selectedPartner = partners.find(p => p.id === selectedPartnerId);

  const handleAISuggest = async () => {
    if (!leadMcc && !leadBusinessType) return;
    setAiLoading(true);
    const partnerSummaries = partners.map(p => ({
      id: p.id, name: p.name, modelo: p.modelo, parcelasMax: p.parcelasMax,
      transactionFee: p.transactionFee, antifraudCost: p.antifraudCost,
      threeDSCost: p.threeDSCost, percentualAntecipacao: p.percentualAntecipacao,
      mccCount: (p.mdrByMcc || []).length,
      mccs: (p.mdrByMcc || []).map(m => ({ code: m.mccCode, desc: m.mccDescription })),
      notes: p.notes,
    }));

    const prompt = `Você é um consultor especialista em meios de pagamento no Brasil.
Analise os parceiros (adquirentes/subadquirentes) abaixo e sugira o MELHOR parceiro para este cliente:

MCC do cliente: ${leadMcc || 'Não informado'}
Tipo de negócio: ${leadBusinessType || 'Não informado'}
TPV mensal estimado: R$ ${leadTpv ? Number(leadTpv).toLocaleString('pt-BR') : 'Não informado'}

Parceiros disponíveis:
${JSON.stringify(partnerSummaries, null, 2)}

Critérios de avaliação:
1. Parceiro que tenha o MCC específico cadastrado (melhor match)
2. Menores taxas base de MDR para o MCC
3. Menores custos fixos (transactionFee, antifraudCost, threeDSCost)
4. Adequação ao modelo de negócio

Responda em português do Brasil.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          recommendedPartnerId: { type: "string", description: "ID do parceiro mais recomendado" },
          recommendedPartnerName: { type: "string" },
          reasoning: { type: "string", description: "Justificativa curta (2-3 frases)" },
          alternatives: {
            type: "array",
            items: {
              type: "object",
              properties: {
                partnerId: { type: "string" },
                partnerName: { type: "string" },
                note: { type: "string" }
              }
            }
          }
        }
      }
    });
    setAiSuggestion(result);
    setAiLoading(false);
  };

  const labelCls = "text-[10px] text-[#2bc196]/70 font-semibold uppercase tracking-wider";

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#2bc196]/10 flex items-center justify-center">
            <Handshake className="w-3.5 h-3.5 text-[#2bc196]" />
          </div>
          <h2 className="text-sm font-bold text-white">Parceiro / Adquirente</h2>
        </div>
        <Button
          variant="ghost" size="sm"
          onClick={handleAISuggest}
          disabled={aiLoading || (!leadMcc && !leadBusinessType)}
          className="text-[10px] text-[#5cf7cf] hover:text-[#2bc196] hover:bg-[#2bc196]/5 h-7 rounded-lg gap-1"
        >
          {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
          Sugestão IA
        </Button>
      </div>

      {/* AI Suggestion */}
      {aiSuggestion && (
        <div className="rounded-xl bg-[#2bc196]/5 border border-[#2bc196]/20 p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#2bc196]" />
            <span className="text-[10px] font-bold text-[#2bc196] uppercase tracking-wider">Recomendação da IA</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-sm font-bold text-white">{aiSuggestion.recommendedPartnerName}</span>
            <Button variant="ghost" size="sm"
              onClick={() => onSelectPartner(aiSuggestion.recommendedPartnerId)}
              className="ml-auto text-[10px] h-6 bg-[#2bc196]/10 text-[#2bc196] hover:bg-[#2bc196]/20 rounded-lg px-2">
              Usar este
            </Button>
          </div>
          <p className="text-[11px] text-white/60 leading-relaxed">{aiSuggestion.reasoning}</p>
          {aiSuggestion.alternatives?.length > 0 && (
            <div className="pt-2 border-t border-[#2bc196]/10 space-y-1">
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider">Alternativas</p>
              {aiSuggestion.alternatives.map((alt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] text-white/50">{alt.partnerName}</span>
                  <span className="text-[9px] text-white/30">— {alt.note}</span>
                  <Button variant="ghost" size="sm"
                    onClick={() => onSelectPartner(alt.partnerId)}
                    className="ml-auto text-[9px] h-5 text-white/40 hover:text-[#2bc196] rounded px-1.5">
                    Selecionar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Partner Select */}
      <div className="space-y-1.5">
        <label className={labelCls}>Selecionar Parceiro *</label>
        <Select value={selectedPartnerId || ''} onValueChange={onSelectPartner}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white h-11 rounded-xl focus:border-[#2bc196]">
            <SelectValue placeholder="Escolha o parceiro..." />
          </SelectTrigger>
          <SelectContent>
            {partners.map(p => (
              <SelectItem key={p.id} value={p.id}>
                <div className="flex items-center gap-2">
                  {p.isPrincipal && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                  <span>{p.name}</span>
                  {p.modelo && <span className="text-[10px] text-muted-foreground">({p.modelo})</span>}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Selected Partner Info */}
      {selectedPartner && (
        <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">{selectedPartner.name}</span>
            {selectedPartner.isPrincipal && <Badge className="bg-amber-500/20 text-amber-400 border-0 text-[9px]">Principal</Badge>}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { l: 'Fee Transação', v: selectedPartner.transactionFee, prefix: 'R$' },
              { l: 'Antifraude', v: selectedPartner.antifraudCost, prefix: 'R$' },
              { l: '3DS', v: selectedPartner.threeDSCost, prefix: 'R$' },
              { l: 'Antecipação', v: selectedPartner.percentualAntecipacao, suffix: '%' },
            ].map(item => (
              <div key={item.l} className="text-center">
                <p className="text-[8px] text-white/30 uppercase tracking-wider">{item.l}</p>
                <p className="text-[11px] font-bold text-white">
                  {item.v ? `${item.prefix || ''}${String(item.v).replace('.', ',')}${item.suffix || ''}` : '—'}
                </p>
              </div>
            ))}
          </div>
          {!selectedPartner.mdrByMcc?.length && (
            <div className="flex items-center gap-1.5 text-amber-400/80">
              <AlertTriangle className="w-3 h-3" />
              <span className="text-[10px]">Parceiro sem taxas MDR cadastradas</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}