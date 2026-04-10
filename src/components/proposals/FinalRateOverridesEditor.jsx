import React, { useState } from 'react';
import { Pencil, X, Check, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AVAILABLE_PRAZOS, normalizeOverrides } from '@/lib/overridesUtils';

export default function FinalRateOverridesEditor({ overrides = {}, onChange, hideCalculationColumns = false, onToggleHideColumns, defaultPrazo = 'D+1' }) {
  // Form state for adding new override
  const [newParcela, setNewParcela] = useState('');
  const [newPrazo, setNewPrazo] = useState(defaultPrazo);
  const [newTaxa, setNewTaxa] = useState('');

  // Normalize to new per-prazo format
  const normalized = normalizeOverrides(overrides, defaultPrazo);

  // Build flat list of all overrides for display: [{ parcela, prazo, taxa }]
  const allOverrides = [];
  Object.keys(normalized).sort().forEach(prazo => {
    const inner = normalized[prazo];
    if (!inner || typeof inner !== 'object') return;
    Object.keys(inner)
      .filter(k => inner[k] != null)
      .sort((a, b) => Number(a) - Number(b))
      .forEach(parcela => {
        allOverrides.push({ parcela: Number(parcela), prazo, taxa: inner[parcela] });
      });
  });

  // Sort: by parcela first, then prazo
  allOverrides.sort((a, b) => a.parcela - b.parcela || a.prazo.localeCompare(b.prazo));

  const addOverride = () => {
    if (!newParcela || !newPrazo || !newTaxa) return;
    const cleaned = newTaxa.replace(',', '.');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return;

    const updated = { ...normalized };
    if (!updated[newPrazo]) updated[newPrazo] = {};
    updated[newPrazo] = { ...updated[newPrazo], [String(newParcela)]: num };
    onChange(updated);

    // Reset taxa only, keep parcela+prazo for quick batch entry
    setNewTaxa('');
  };

  const removeOverride = (parcela, prazo) => {
    const updated = { ...normalized };
    if (updated[prazo]) {
      const inner = { ...updated[prazo] };
      delete inner[String(parcela)];
      if (Object.keys(inner).length === 0) {
        delete updated[prazo];
      } else {
        updated[prazo] = inner;
      }
    }
    onChange(updated);
  };

  const clearAll = () => {
    onChange({});
  };

  // Group overrides by parcela for display
  const groupedByParcela = {};
  allOverrides.forEach(o => {
    if (!groupedByParcela[o.parcela]) groupedByParcela[o.parcela] = [];
    groupedByParcela[o.parcela].push(o);
  });
  const parcelaGroups = Object.keys(groupedByParcela).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Pencil className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-white">Sobrescrever Taxa Final</h2>
          <p className="text-[10px] text-white/30">
            Aplica-se a <span className="text-amber-400/70 font-semibold">Mastercard</span> e <span className="text-amber-400/70 font-semibold">Visa</span> · Escolha a parcela, o prazo de recebimento e a taxa
          </p>
        </div>
        {allOverrides.length > 0 && (
          <button onClick={clearAll} className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors flex items-center gap-1">
            <Trash2 className="w-3 h-3" /> Limpar tudo
          </button>
        )}
      </div>

      {/* Add Form — all 3 fields in one row */}
      <div className="bg-white/[0.02] border border-white/8 rounded-xl p-3">
        <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-2.5">Adicionar sobrescrita</p>
        <div className="flex items-end gap-2">
          {/* Parcela */}
          <div className="space-y-1 w-24">
            <label className="text-[10px] text-white/40 font-medium">Parcela</label>
            <select
              value={newParcela}
              onChange={(e) => setNewParcela(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white h-9 rounded-lg text-xs px-2 focus:border-[#2bc196] focus:ring-1 focus:ring-[#2bc196]"
            >
              <option value="">—</option>
              {Array.from({ length: 21 }, (_, i) => i + 1).map(p => (
                <option key={p} value={p}>{p}x</option>
              ))}
            </select>
          </div>

          {/* Prazo */}
          <div className="space-y-1 w-28">
            <label className="text-[10px] text-white/40 font-medium">Prazo</label>
            <select
              value={newPrazo}
              onChange={(e) => setNewPrazo(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white h-9 rounded-lg text-xs px-2 focus:border-[#2bc196] focus:ring-1 focus:ring-[#2bc196]"
            >
              {AVAILABLE_PRAZOS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Taxa */}
          <div className="space-y-1 flex-1">
            <label className="text-[10px] text-white/40 font-medium">Taxa Final (%)</label>
            <Input
              value={newTaxa}
              onChange={(e) => setNewTaxa(e.target.value)}
              placeholder="ex: 2,50"
              className="bg-white/5 border-white/10 text-white h-9 rounded-lg text-xs text-right focus:border-[#2bc196] focus:ring-1 focus:ring-[#2bc196]"
              onKeyDown={(e) => e.key === 'Enter' && addOverride()}
            />
          </div>

          {/* Add Button */}
          <Button
            size="sm"
            onClick={addOverride}
            disabled={!newParcela || !newPrazo || !newTaxa}
            className="bg-[#2bc196] hover:bg-[#2bc196]/80 text-[#002443] h-9 px-3 rounded-lg disabled:opacity-30"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Overrides list — grouped by parcela */}
      {parcelaGroups.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-white/25 font-semibold uppercase tracking-wider">
            {allOverrides.length} sobrescrita{allOverrides.length !== 1 ? 's' : ''} definida{allOverrides.length !== 1 ? 's' : ''}
          </p>
          {parcelaGroups.map(parcela => {
            const items = groupedByParcela[parcela];
            return (
              <div key={parcela} className="bg-white/[0.02] border border-white/5 rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border-b border-white/5">
                  <span className="text-xs font-bold text-white">{parcela}x</span>
                  <span className="text-[10px] text-white/25">parcela</span>
                </div>
                <div className="divide-y divide-white/[0.03]">
                  {items.map(o => (
                    <div key={`${o.parcela}-${o.prazo}`} className="flex items-center gap-3 px-3 py-2 group hover:bg-white/[0.02]">
                      <span className="text-[10px] font-semibold text-[#2bc196] bg-[#2bc196]/10 px-2 py-0.5 rounded-md w-14 text-center">{o.prazo}</span>
                      <span className="text-xs text-white/50">→</span>
                      <span className="text-xs font-bold text-amber-400 flex-1">{o.taxa.toFixed(2).replace('.', ',')}%</span>
                      <button
                        onClick={() => removeOverride(o.parcela, o.prazo)}
                        className="text-white/15 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {allOverrides.length === 0 && (
        <div className="text-center py-4">
          <p className="text-[10px] text-white/20">Nenhuma taxa sobrescrita</p>
          <p className="text-[9px] text-white/10 mt-1">Escolha parcela + prazo + taxa acima para começar</p>
        </div>
      )}

      {/* Hide calculation columns option */}
      {allOverrides.length > 0 && onToggleHideColumns && (
        <label className="flex items-center gap-2.5 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2.5 cursor-pointer hover:bg-white/[0.05] transition-colors">
          <input
            type="checkbox"
            checked={hideCalculationColumns}
            onChange={(e) => onToggleHideColumns(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 text-[#2bc196] focus:ring-[#2bc196] bg-white/5"
          />
          <div>
            <span className="text-xs font-medium text-white">Ocultar cálculo na proposta</span>
            <p className="text-[10px] text-white/30">Esconde as colunas Base e Antecipação, mostrando apenas a taxa final</p>
          </div>
        </label>
      )}
    </div>
  );
}