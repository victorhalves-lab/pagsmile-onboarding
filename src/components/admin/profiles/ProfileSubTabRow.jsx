import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';

/**
 * Linha de uma sub-aba com toggles Ver / Editar.
 * Props: subTab { id, name }, value { canView, canEdit }, onChange(next)
 */
export default function ProfileSubTabRow({ subTab, value, onChange, disabled }) {
  const v = value || {};
  const handleView = (checked) => {
    const next = { ...v, canView: !!checked };
    if (!checked) next.canEdit = false; // desmarcar Ver força Editar:false
    onChange(next);
  };
  const handleEdit = (checked) => {
    const next = { ...v, canEdit: !!checked };
    if (checked) next.canView = true; // marcar Editar força Ver:true
    onChange(next);
  };

  return (
    <div className={`flex items-center justify-between py-1.5 px-3 rounded-md hover:bg-slate-50 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <span className="text-sm text-slate-700">• {subTab.name}</span>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <Checkbox checked={!!v.canView} onCheckedChange={handleView} />
          <span className="text-xs text-slate-500">Ver</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <Checkbox checked={!!v.canEdit} onCheckedChange={handleEdit} />
          <span className="text-xs text-slate-500">Editar</span>
        </label>
      </div>
    </div>
  );
}