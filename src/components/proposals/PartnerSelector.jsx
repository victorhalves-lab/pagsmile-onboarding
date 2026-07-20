import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Handshake, Brain, Loader2, Sparkles, Star, AlertTriangle, Check } from 'lucide-react';

export default function PartnerSelector({ selectedPartnerId, onSelectPartner, selectedMccCode, onSelectMcc, leadMcc, leadBusinessType, leadTpv }) {
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiSuggestion, setAiSuggestion] = React.useState(null);

  const { data: partners = [] } = useQuery({
    queryKey: ['partners-active'],
    queryFn: () => base44.entities.Partner.filter({ isActive: true }),
  });

  const selectedPartner = partners.find(p => p.id === selectedPartnerId);
  const mccOptions = selectedPartner?.mdrByMcc || [];

  // Auto-select MCC when partner changes
  React.useEffect(() => {
    if (!onSelectMcc) return;
    if (selectedPartner && mccOptions.length > 0) {
      const matching = mccOptions.find(m => m.mccCode === leadMcc);
      const demais = mccOptions.find(m => ['Demais', 'demais', 'DEMAIS'].includes(m.mccCode));
      const autoMcc = matching?.mccCode || demais?.mccCode || mccOptions[0]?.mccCode || '';
      onSelectMcc(autoMcc);
    } else {
      onSelectMcc('');
    }
  }, [selectedPartner?.id, mccOptions.length, leadMcc]);

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
Analise os parceiros abaixo e sugira o MELHOR parceiro para este cliente:

MCC do cliente: ${leadMcc || 'Não informado'}
Tipo de negócio: ${leadBusinessType || 'Não informado'}
TPV mensal estimado: R$ ${leadTpv ? Number(leadTpv).toLocaleString('pt-BR') : 'Não informado'}

Parceiros disponíveis:
${JSON.stringify(partnerSummaries, null, 2)}

Critérios: 1. MCC match 2. Menores MDR 3. Menores custos fixos 4. Modelo de negócio

Responda em português do Brasil.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          recommendedPartnerId: { type: "string" },
          recommendedPartnerName: { type: "string" },
          reasoning: { type: "string" },
          alternatives: { type: "array", items: { type: "object", properties: { partnerId: { type: "string" }, partnerName: { type: "string" }, note: { type: "string" } } } }
        }
      }
    });
    setAiSuggestion(result);
    setAiLoading(false);
  };

  const labelCls = "text-[10px] text-[#1356E2]/70 font-semibold uppercase tracking-wider";

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#1356E2]/10 flex items-center justify-center">
            <Handshake className="w-3.5 h-3.5 text-[#1356E2]" />
          </div>
          <h2 className="text-sm font-bold text-white">Parceiro / Adquirente</h2>
        </div>
        <Button
          variant="ghost" size="sm"
          onClick={handleAISuggest}
          disabled={aiLoading || (!leadMcc && !leadBusinessType)}
          className="text-[10px] text-[#E84B1C] hover:text-[#1356E2] hover:bg-[#1356E2]/5 h-7 rounded-lg gap-1"
        >
          {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
          Sugestão IA
        </Button>
      </div>

      {/* AI Suggestion */}
      {aiSuggestion && (
        <div className="rounded-xl bg-[#1356E2]/5 border border-[#1356E2]/20 p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#1356E2]" />
            <span className="text-[10px] font-bold text-[#1356E2] uppercase tracking-wider">Recomendação da IA</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-sm font-bold text-white">{aiSuggestion.recommendedPartnerName}</span>
            <Button variant="ghost" size="sm"
              onClick={() => onSelectPartner(aiSuggestion.recommendedPartnerId)}
              className="ml-auto text-[10px] h-6 bg-[#1356E2]/10 text-[#1356E2] hover:bg-[#1356E2]/20 rounded-lg px-2">
              Usar este
            </Button>
          </div>
          <p className="text-[11px] text-white/60 leading-relaxed">{aiSuggestion.reasoning}</p>
          {aiSuggestion.alternatives?.length > 0 && (
            <div className="pt-2 border-t border-[#1356E2]/10 space-y-1">
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider">Alternativas</p>
              {aiSuggestion.alternatives.map((alt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] text-white/50">{alt.partnerName}</span>
                  <span className="text-[9px] text-white/30">— {alt.note}</span>
                  <Button variant="ghost" size="sm"
                    onClick={() => onSelectPartner(alt.partnerId)}
                    className="ml-auto text-[9px] h-5 text-white/40 hover:text-[#1356E2] rounded px-1.5">
                    Selecionar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Partner Buttons */}
      <div className="space-y-1.5">
        <label className={labelCls}>Selecionar Parceiro *</label>
        <div className="grid grid-cols-2 gap-2">
          {partners.map(p => (
            <button key={p.id} onClick={() => onSelectPartner(p.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border-2 text-left ${
                selectedPartnerId === p.id
                  ? 'bg-[#1356E2] border-[#1356E2] text-[#0A0A0A] shadow-lg shadow-[#1356E2]/20'
                  : 'bg-white/5 border-white/5 text-white/50 hover:text-white hover:border-[#1356E2]/30'
              }`}>
              {selectedPartnerId === p.id && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
              {p.isPrincipal && selectedPartnerId !== p.id && <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />}
              <span className="truncate">{p.name}</span>
              {p.modelo && <span className={`text-[9px] ml-auto flex-shrink-0 ${selectedPartnerId === p.id ? 'text-[#0A0A0A]/60' : 'text-white/25'}`}>({p.modelo})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Partner Info */}
      {selectedPartner && (
        <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3 space-y-3">
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

          {/* MCC Buttons */}
          {mccOptions.length > 0 ? (
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <label className={labelCls}>MCC do Parceiro (custo base) *</label>
              <div className="flex flex-wrap gap-1.5">
                {mccOptions.map(m => (
                  <button key={m.mccCode} onClick={() => onSelectMcc && onSelectMcc(m.mccCode)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                      selectedMccCode === m.mccCode
                        ? 'bg-[#1356E2] border-[#1356E2] text-[#0A0A0A] shadow-md shadow-[#1356E2]/20'
                        : 'bg-white/5 border-white/5 text-white/40 hover:text-white hover:border-[#1356E2]/30'
                    }`}>
                    {selectedMccCode === m.mccCode && <Check className="w-2.5 h-2.5 inline mr-1" />}
                    {m.mccCode} {m.mccDescription ? `— ${m.mccDescription}` : ''}
                  </button>
                ))}
              </div>
            </div>
          ) : (
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