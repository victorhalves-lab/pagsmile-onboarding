import React, { useState } from 'react';
import { Pencil, X, Check, Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AVAILABLE_PRAZOS, normalizeOverrides, getOverridesForPrazo } from '@/lib/overridesUtils';

export default function FinalRateOverridesEditor({ overrides = {}, onChange, hideCalculationColumns = false, onToggleHideColumns, defaultPrazo = 'D+1' }) {
  const [activePrazo, setActivePrazo] = useState(defaultPrazo);
  const [editingParcela, setEditingParcela] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showAddPrazo, setShowAddPrazo] = useState(false);

  // Normalize to new format internally
  const normalized = normalizeOverrides(overrides, defaultPrazo);
  const definedPrazos = Object.keys(normalized).filter(k => {
    const inner = normalized[k];
    return inner && typeof inner === 'object' && Object.keys(inner).length > 0;
  });

  // Ensure activePrazo is valid
  const currentPrazoOverrides = normalized[activePrazo] || {};
  const overrideKeys = Object.keys(currentPrazoOverrides)
    .filter(k => currentPrazoOverrides[k] != null)
    .sort((a, b) => Number(a) - Number(b));

  const allPrazosWithOverrides = [...new Set([...definedPrazos, activePrazo])].sort();

  const startEdit = (parcela) => {
    setEditingParcela(parcela);
    setEditValue(currentPrazoOverrides[String(parcela)] != null ? String(currentPrazoOverrides[String(parcela)]).replace('.', ',') : '');
  };

  const confirmEdit = () => {
    if (editingParcela == null) return;
    const cleaned = editValue.replace(',', '.');
    const num = parseFloat(cleaned);
    const newPrazoOverrides = { ...currentPrazoOverrides };
    if (editValue === '' || isNaN(num)) {
      delete newPrazoOverrides[String(editingParcela)];
    } else {
      newPrazoOverrides[String(editingParcela)] = num;
    }
    const newOverrides = { ...normalized, [activePrazo]: newPrazoOverrides };
    // Clean empty prazos
    Object.keys(newOverrides).forEach(k => {
      if (!newOverrides[k] || Object.keys(newOverrides[k]).length === 0) {
        delete newOverrides[k];
      }
    });
    onChange(newOverrides);
    setEditingParcela(null);
    setEditValue('');
  };

  const removeOverride = (parcela) => {
    const newPrazoOverrides = { ...currentPrazoOverrides };
    delete newPrazoOverrides[String(parcela)];
    const newOverrides = { ...normalized, [activePrazo]: newPrazoOverrides };
    Object.keys(newOverrides).forEach(k => {
      if (!newOverrides[k] || Object.keys(newOverrides[k]).length === 0) {
        delete newOverrides[k];
      }
    });
    onChange(newOverrides);
  };

  const addPrazo = (prazo) => {
    setActivePrazo(prazo);
    setShowAddPrazo(false);
  };

  const totalOverridesCount = definedPrazos.reduce((sum, p) => sum + Object.keys(normalized[p] || {}).length, 0);
  const unusedPrazos = AVAILABLE_PRAZOS.filter(p => !definedPrazos.includes(p));

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Pencil className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-white">Sobrescrever Taxa Final por Prazo</h2>
          <p className="text-[10px] text-white/30">
            Aplica-se apenas às bandeiras <span className="text-amber-400/70 font-semibold">Mastercard</span> e <span className="text-amber-400/70 font-semibold">Visa</span> · Cada prazo de recebimento tem suas próprias taxas
          </p>
        </div>
      </div>

      {/* Prazo Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {allPrazosWithOverrides.map(prazo => {
          const count = Object.keys(normalized[prazo] || {}).length;
          const isActive = prazo === activePrazo;
          return (
            <button
              key={prazo}
              onClick={() => setActivePrazo(prazo)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#2bc196] text-[#002443]'
                  : count > 0
                  ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
                  : 'bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.08]'
              }`}
            >
              {prazo}
              {count > 0 && (
                <span className={`text-[9px] rounded-full px-1.5 py-0.5 ${
                  isActive ? 'bg-[#002443]/20 text-[#002443]' : 'bg-amber-500/20 text-amber-400'
                }`}>{count}</span>
              )}
            </button>
          );
        })}

        {/* Add Prazo Button */}
        <div className="relative">
          <button
            onClick={() => setShowAddPrazo(!showAddPrazo)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/5 text-white/30 hover:text-white/60 hover:bg-white/[0.08] transition-all flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <ChevronDown className="w-3 h-3" />
          </button>
          {showAddPrazo && unusedPrazos.length > 0 && (
            <div className="absolute top-full mt-1 left-0 z-10 bg-[#001a33] border border-white/10 rounded-lg shadow-xl py-1 min-w-[100px]">
              {unusedPrazos.map(p => (
                <button
                  key={p}
                  onClick={() => addPrazo(p)}
                  className="w-full text-left px-3 py-1.5 text-xs text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active overrides for selected prazo */}
      {overrideKeys.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-white/25 font-semibold uppercase tracking-wider">Taxas definidas para {activePrazo}</p>
          {overrideKeys.map(k => (
            <div key={k} className="flex items-center gap-2 bg-amber-500/10 rounded-lg px-3 py-2">
              <span className="text-xs font-bold text-amber-400 w-8">{k}x</span>
              <span className="text-xs text-white flex-1">→ {currentPrazoOverrides[k].toFixed(2).replace('.', ',')}%</span>
              <button onClick={() => removeOverride(k)} className="text-white/30 hover:text-red-400 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {overrideKeys.length === 0 && (
        <p className="text-[10px] text-white/20 text-center py-2">Nenhuma taxa sobrescrita para {activePrazo}</p>
      )}

      {/* Hide calculation columns option */}
      {totalOverridesCount > 0 && onToggleHideColumns && (
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

      {/* Add/Edit override */}
      <div className="flex items-end gap-2">
        <div className="space-y-1 flex-1">
          <label className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Parcela (1-21)</label>
          <select
            value={editingParcela || ''}
            onChange={(e) => startEdit(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 text-white h-9 rounded-lg text-xs px-2 focus:border-[#2bc196] focus:ring-1 focus:ring-[#2bc196]"
          >
            <option value="">Selecionar...</option>
            {Array.from({ length: 21 }, (_, i) => i + 1).map(p => (
              <option key={p} value={p}>{p}x</option>
            ))}
          </select>
        </div>
        {editingParcela && (
          <>
            <div className="space-y-1 flex-1">
              <label className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Taxa Final (%)</label>
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="0,00"
                className="bg-white/5 border-white/10 text-white h-9 rounded-lg text-xs text-right focus:border-[#2bc196] focus:ring-1 focus:ring-[#2bc196]"
                onKeyDown={(e) => e.key === 'Enter' && confirmEdit()}
              />
            </div>
            <Button size="sm" onClick={confirmEdit} className="bg-[#2bc196] hover:bg-[#2bc196]/80 text-[#002443] h-9 px-3 rounded-lg">
              <Check className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      {/* Summary */}
      {totalOverridesCount > 0 && definedPrazos.length > 1 && (
        <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
          <p className="text-[10px] text-white/25 font-semibold uppercase tracking-wider mb-2">Resumo por Prazo</p>
          <div className="flex flex-wrap gap-2">
            {definedPrazos.sort().map(p => {
              const count = Object.keys(normalized[p] || {}).length;
              return (
                <span key={p} className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-1 rounded-md font-semibold">
                  {p}: {count} parcela{count !== 1 ? 's' : ''}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}