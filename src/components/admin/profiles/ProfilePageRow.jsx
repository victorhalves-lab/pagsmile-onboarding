import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import ProfileTabRow from './ProfileTabRow';
import ProfileActionsChips from './ProfileActionsChips';

/**
 * Linha de uma página no editor.
 * Props:
 *   page { id, name, tabs?, actions? }
 *   value { pageId, canView, tabs, actions }
 *   onChange(next)
 */
export default function ProfilePageRow({ page, value, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const v = value || { pageId: page.id, canView: false, tabs: {}, actions: {} };
  const hasTabs = Array.isArray(page.tabs) && page.tabs.length > 0;
  const hasActions = Array.isArray(page.actions) && page.actions.length > 0;
  const hasInner = hasTabs || hasActions;

  const handleViewPage = (checked) => {
    const next = { ...v, canView: !!checked };
    if (!checked) { next.tabs = {}; next.actions = {}; }
    onChange(next);
  };

  const updateTab = (tabId, tabValue) => {
    onChange({ ...v, tabs: { ...(v.tabs || {}), [tabId]: tabValue } });
  };

  const updateActions = (next) => {
    onChange({ ...v, actions: next });
  };

  const tabsViewedCount = hasTabs ? page.tabs.filter(t => v.tabs?.[t.id]?.canView).length : 0;

  return (
    <div className="border border-slate-200 rounded-xl bg-white">
      <div className="flex items-center justify-between py-2.5 px-3">
        <div className="flex items-center gap-2 flex-1">
          {hasInner ? (
            <button type="button" onClick={() => setExpanded(!expanded)} className="text-slate-500 hover:text-slate-800">
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : <span className="w-4" />}
          <FileText className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-sm text-slate-800">{page.name}</span>
          {hasTabs && v.canView && (
            <span className="text-[11px] text-slate-400 ml-2">
              ({tabsViewedCount}/{page.tabs.length} abas)
            </span>
          )}
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <Checkbox checked={!!v.canView} onCheckedChange={handleViewPage} />
          <span className="text-xs font-medium text-slate-700">Ver página</span>
        </label>
      </div>

      {hasInner && expanded && (
        <div className={`px-3 pb-3 pt-1 border-t border-slate-100 space-y-2 ${!v.canView ? 'opacity-40 pointer-events-none' : ''}`}>
          {hasTabs && (
            <div className="space-y-1.5">
              {page.tabs.map(t => (
                <ProfileTabRow
                  key={t.id}
                  tab={t}
                  value={v.tabs?.[t.id]}
                  onChange={(next) => updateTab(t.id, next)}
                  disabled={!v.canView}
                />
              ))}
            </div>
          )}
          {hasActions && (
            <ProfileActionsChips
              actions={page.actions}
              value={v.actions}
              onChange={updateActions}
              disabled={!v.canView}
            />
          )}
        </div>
      )}
    </div>
  );
}