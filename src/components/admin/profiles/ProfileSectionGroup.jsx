import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import ProfilePageRow from './ProfilePageRow';
import { getIcon } from '@/lib/iconMap';

export default function ProfileSectionGroup({ section, pagePermissions, onChange, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const Icon = getIcon(section.sectionIcon);

  const pageMap = {};
  for (const p of pagePermissions) pageMap[p.pageId] = p;

  const selectedCount = section.pages.filter(p => pageMap[p.id]?.canView).length;

  return (
    <div className="border border-slate-200 rounded-xl bg-slate-50/30">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
          <Icon className="w-4 h-4 text-[#2bc196]" />
          <span className="font-semibold text-sm text-slate-800">{section.sectionLabel}</span>
        </div>
        <span className="text-xs text-slate-500">{selectedCount} de {section.pages.length} páginas</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {section.pages.map(page => (
            <ProfilePageRow
              key={page.id}
              page={page}
              value={pageMap[page.id]}
              onChange={(next) => onChange(page.id, next)}
            />
          ))}
        </div>
      )}
    </div>
  );
}