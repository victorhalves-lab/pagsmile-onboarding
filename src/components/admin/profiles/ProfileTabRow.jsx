import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronRight } from 'lucide-react';
import ProfileSubTabRow from './ProfileSubTabRow';
import { Button } from '@/components/ui/button';

/**
 * Linha de uma aba com toggles Ver / Editar + sub-abas aninhadas.
 * Props:
 *   tab { id, name, subTabs? }
 *   value { canView, canEdit, subTabs: { [id]: {canView,canEdit} } }
 *   onChange(next)
 *   disabled
 */
export default function ProfileTabRow({ tab, value, onChange, disabled }) {
  const [expanded, setExpanded] = useState(false);
  const v = value || {};
  const hasSubTabs = Array.isArray(tab.subTabs) && tab.subTabs.length > 0;

  const handleView = (checked) => {
    const next = { ...v, canView: !!checked };
    if (!checked) { next.canEdit = false; } // se não pode ver, não pode editar
    onChange(next);
  };
  const handleEdit = (checked) => {
    const next = { ...v, canEdit: !!checked };
    if (checked) next.canView = true;
    onChange(next);
  };

  const updateSubTab = (subTabId, subValue) => {
    const next = { ...v, subTabs: { ...(v.subTabs || {}), [subTabId]: subValue } };
    onChange(next);
  };

  const markAllSubTabs = (canView, canEdit) => {
    if (!hasSubTabs) return;
    const subTabs = {};
    for (const st of tab.subTabs) subTabs[st.id] = { canView, canEdit };
    onChange({ ...v, subTabs });
  };

  const subTabsCount = hasSubTabs ? tab.subTabs.length : 0;
  const viewedCount = hasSubTabs
    ? tab.subTabs.filter(st => v.subTabs?.[st.id]?.canView).length
    : 0;

  return (
    <div className={`border border-slate-200 rounded-lg ${disabled ? 'opacity-40' : ''}`}>
      <div className="flex items-center justify-between py-2 px-3 bg-slate-50/50 rounded-t-lg">
        <div className="flex items-center gap-2 flex-1">
          {hasSubTabs ? (
            <button type="button" onClick={() => setExpanded(!expanded)} className="text-slate-500 hover:text-slate-800" disabled={disabled}>
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : <span className="w-4" />}
          <span className="font-medium text-sm text-slate-800">📑 {tab.name}</span>
          {hasSubTabs && (
            <span className="text-[11px] text-slate-400 ml-2">
              ({viewedCount}/{subTabsCount} sub-abas)
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer" onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={!!v.canView} onCheckedChange={handleView} disabled={disabled} />
            <span className="text-xs text-slate-600">Ver</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer" onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={!!v.canEdit} onCheckedChange={handleEdit} disabled={disabled} />
            <span className="text-xs text-slate-600">Editar</span>
          </label>
        </div>
      </div>

      {hasSubTabs && expanded && (
        <div className={`px-3 py-2 border-t border-slate-200 space-y-1 ${!v.canView ? 'opacity-40 pointer-events-none' : ''}`}>
          <div className="flex items-center gap-2 pb-2 mb-1 border-b border-slate-100">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider">Sub-abas:</span>
            <Button type="button" size="sm" variant="ghost" className="h-6 text-[11px]" onClick={() => markAllSubTabs(true, false)}>Todas Ver</Button>
            <Button type="button" size="sm" variant="ghost" className="h-6 text-[11px]" onClick={() => markAllSubTabs(true, true)}>Todas Editar</Button>
            <Button type="button" size="sm" variant="ghost" className="h-6 text-[11px]" onClick={() => markAllSubTabs(false, false)}>Limpar</Button>
          </div>
          {tab.subTabs.map(st => (
            <ProfileSubTabRow
              key={st.id}
              subTab={st}
              value={v.subTabs?.[st.id]}
              onChange={(next) => updateSubTab(st.id, next)}
              disabled={!v.canView}
            />
          ))}
        </div>
      )}
    </div>
  );
}