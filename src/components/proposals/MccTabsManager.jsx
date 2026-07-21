import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Plus, X, Layers, Copy, Search } from 'lucide-react';
import { toast } from 'sonner';
import AddMccWithSourceModal from './AddMccWithSourceModal';
import CardTaxasCartao from './CardTaxasCartao';
import { getMccLabel, emptyMccCartao, makeMccEntry, cartaoFromSegmentRates } from './proposalMccHelpers';

/**
 * Gerencia tabs de MCCs adicionais com taxas de cartão por MCC.
 * Funciona junto com CardTaxasCartao:
 *  - Off (default): apenas 1 MCC (usa form.clienteMcc + rates.cartao). UX igual à atual.
 *  - On (multi): renderiza tabs para cada MCC; rates.cartaoPorMcc[] guarda as variações.
 *
 * Quando o toggle é ativado, o MCC atual (form.clienteMcc) vira o 1º item do array
 * com as taxas já existentes (rates.cartao). Demais MCCs começam vazios ou são copiados.
 */
export default function MccTabsManager({
  form,
  rates,
  onUpdateRates,
  selectedBrand,
  setSelectedBrand,
  partner,
  hideRange13a21,
  onToggleHideRange13a21,
}) {
  const cartaoPorMcc = Array.isArray(rates.cartaoPorMcc) ? rates.cartaoPorMcc : [];
  const isMulti = cartaoPorMcc.length > 0;
  const [activeIdx, setActiveIdx] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);

  // Toggle multi-MCC ON: cria a entrada inicial com o MCC atual + taxas atuais
  const enableMulti = () => {
    if (!form.clienteMcc) {
      toast.error('Defina o MCC principal do cliente antes de ativar Multi-MCC.');
      return;
    }
    const firstEntry = {
      mcc: String(form.clienteMcc),
      mccLabel: getMccLabel(form.clienteMcc),
      cartao: rates.cartao && Object.keys(rates.cartao).length > 0
        ? JSON.parse(JSON.stringify(rates.cartao))
        : emptyMccCartao(),
    };
    onUpdateRates({ ...rates, cartaoPorMcc: [firstEntry] });
    setActiveIdx(0);
    toast.success('Multi-MCC ativado. O MCC atual foi adicionado como #1.');
  };

  // Toggle OFF: descarta cartaoPorMcc, mantém apenas rates.cartao (do ativo)
  const disableMulti = () => {
    const current = cartaoPorMcc[activeIdx];
    onUpdateRates({
      ...rates,
      cartao: current?.cartao || rates.cartao,
      cartaoPorMcc: [],
    });
    toast.info('Multi-MCC desativado. As taxas do MCC ativo foram mantidas.');
  };

  // Recebe { mccCode, mccLabel, source, segmentRates } do AddMccWithSourceModal.
  // - source='active'  → copia do MCC ativo
  // - source='segment' → usa SegmentDefaultRates escolhido
  // - source='blank'   → zerado
  const addMcc = ({ mccCode, source = 'active', segmentRates = null }) => {
    if (!mccCode) return;
    if (cartaoPorMcc.some(e => e.mcc === String(mccCode))) {
      toast.error(`MCC ${mccCode} já adicionado.`);
      return;
    }
    let baseCartao;
    let sourceLabel;
    if (source === 'segment' && segmentRates) {
      baseCartao = cartaoFromSegmentRates(segmentRates);
      sourceLabel = `taxas padrão de ${segmentRates.segmentName}`;
    } else if (source === 'blank') {
      baseCartao = emptyMccCartao();
      sourceLabel = 'em branco';
    } else {
      baseCartao = cartaoPorMcc[activeIdx]?.cartao || emptyMccCartao();
      sourceLabel = `cópia do MCC ${cartaoPorMcc[activeIdx]?.mcc || ''}`;
    }
    const newEntry = makeMccEntry(mccCode, baseCartao);
    const next = [...cartaoPorMcc, newEntry];
    onUpdateRates({ ...rates, cartaoPorMcc: next });
    setActiveIdx(next.length - 1);
    toast.success(`MCC ${mccCode} – ${newEntry.mccLabel} adicionado (${sourceLabel}).`);
  };

  const removeMcc = (idx) => {
    if (cartaoPorMcc.length <= 1) {
      toast.error('Não é possível remover o último MCC. Desative o Multi-MCC para voltar ao modo simples.');
      return;
    }
    const next = cartaoPorMcc.filter((_, i) => i !== idx);
    onUpdateRates({ ...rates, cartaoPorMcc: next });
    setActiveIdx(Math.min(activeIdx, next.length - 1));
  };

  const copyFromActive = (targetIdx) => {
    const active = cartaoPorMcc[activeIdx];
    if (!active) return;
    const next = cartaoPorMcc.map((e, i) =>
      i === targetIdx ? { ...e, cartao: JSON.parse(JSON.stringify(active.cartao)) } : e
    );
    onUpdateRates({ ...rates, cartaoPorMcc: next });
    toast.success(`Taxas copiadas do MCC ${active.mcc} para o MCC ${cartaoPorMcc[targetIdx].mcc}.`);
  };

  // Quando o usuário edita o CardTaxasCartao em modo multi-MCC,
  // atualizamos a entrada ativa em cartaoPorMcc.
  const handleRatesUpdateMulti = (newRates) => {
    if (!isMulti) {
      onUpdateRates(newRates);
      return;
    }
    const next = cartaoPorMcc.map((e, i) =>
      i === activeIdx ? { ...e, cartao: newRates.cartao || {} } : e
    );
    onUpdateRates({ ...newRates, cartaoPorMcc: next });
  };

  // Em modo multi, o CardTaxasCartao "vê" um rates virtual com a `cartao` do MCC ativo
  const virtualRates = isMulti
    ? { ...rates, cartao: cartaoPorMcc[activeIdx]?.cartao || {} }
    : rates;

  return (
    <div className="space-y-3">
      {/* Toggle Multi-MCC */}
      <div className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#1356E2]/10 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 text-[#E84B1C]" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Propor para múltiplos MCCs</p>
            <p className="text-[10px] text-white/40">MDRs variam por MCC. Demais condições (PIX, antecipação, fees) seguem únicas.</p>
          </div>
        </div>
        <Switch
          checked={isMulti}
          onCheckedChange={(checked) => checked ? enableMulti() : disableMulti()}
          className="data-[state=checked]:bg-[#1356E2]"
        />
      </div>

      {/* Tabs de MCC */}
      {isMulti && (
        <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-3 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {cartaoPorMcc.map((entry, idx) => (
              <button
                key={`${entry.mcc}-${idx}`}
                onClick={() => setActiveIdx(idx)}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeIdx === idx
                    ? 'bg-[#1356E2] text-[#0A0A0A] shadow-lg shadow-[#1356E2]/20'
                    : 'bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/[0.08] border border-white/5'
                }`}
              >
                <span className="font-mono">{entry.mcc}</span>
                <span className="opacity-80 truncate max-w-[140px]">{entry.mccLabel}</span>
                {cartaoPorMcc.length > 1 && (
                  <X
                    className={`w-3 h-3 ${activeIdx === idx ? 'text-[#0A0A0A]/60 hover:text-[#0A0A0A]' : 'text-white/30 hover:text-red-400'}`}
                    onClick={(e) => { e.stopPropagation(); removeMcc(idx); }}
                  />
                )}
              </button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="h-8 text-[11px] text-[#E84B1C] hover:bg-[#1356E2]/10 rounded-xl"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar MCC
            </Button>
          </div>

          {/* Ações entre MCCs */}
          {cartaoPorMcc.length > 1 && (
            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
              <span className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Copiar taxas do MCC ativo para:</span>
              {cartaoPorMcc.map((entry, idx) => {
                if (idx === activeIdx) return null;
                return (
                  <button
                    key={`copy-${idx}`}
                    onClick={() => copyFromActive(idx)}
                    className="flex items-center gap-1 text-[10px] text-white/40 hover:text-[#E84B1C] hover:bg-[#1356E2]/5 px-2 py-1 rounded-md transition-all"
                  >
                    <Copy className="w-3 h-3" /> {entry.mcc}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* O card de taxas em si — agora editando o MCC ativo */}
      <CardTaxasCartao
        rates={virtualRates}
        onUpdateRates={handleRatesUpdateMulti}
        selectedBrand={selectedBrand}
        setSelectedBrand={setSelectedBrand}
        partner={partner}
        clientMcc={isMulti ? cartaoPorMcc[activeIdx]?.mcc : form.clienteMcc}
        hideRange13a21={hideRange13a21}
        onToggleHideRange13a21={onToggleHideRange13a21}
      />

      <AddMccWithSourceModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onConfirm={(payload) => addMcc(payload)}
      />
    </div>
  );
}