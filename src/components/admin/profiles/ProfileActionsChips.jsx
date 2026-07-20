import React from 'react';

/**
 * Chips de ações permitidas. Clique alterna on/off.
 * Props: actions [{id,label}], value {actionId: bool}, onChange(next)
 */
export default function ProfileActionsChips({ actions, value, onChange, disabled }) {
  if (!actions || actions.length === 0) return null;
  const v = value || {};

  const toggle = (actionId) => {
    onChange({ ...v, [actionId]: !v[actionId] });
  };

  return (
    <div className={`flex flex-wrap gap-1.5 mt-2 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <span className="text-[11px] text-slate-400 uppercase tracking-wider self-center mr-1">Ações:</span>
      {actions.map(a => {
        const on = !!v[a.id];
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => toggle(a.id)}
            disabled={disabled}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
              on
                ? 'bg-[#1356E2]/10 border-[#1356E2] text-[#1356E2] font-medium'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            {on ? '✓ ' : ''}{a.label}
          </button>
        );
      })}
    </div>
  );
}