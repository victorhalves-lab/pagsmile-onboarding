import React from 'react';
import { Eye } from 'lucide-react';
import { PAGES_REGISTRY } from '@/lib/permissionsRegistry';
import { getIcon } from '@/lib/iconMap';

export default function SidebarPreview({ pagePermissions }) {
  const pageMap = {};
  for (const p of pagePermissions || []) pageMap[p.pageId] = p;

  const visibleSections = PAGES_REGISTRY
    .map(section => ({
      ...section,
      visiblePages: section.pages.filter(p => pageMap[p.id]?.canView)
    }))
    .filter(s => s.visiblePages.length > 0);

  return (
    <div className="bg-[#0A0A0A] rounded-xl p-4 text-white min-h-[300px] sticky top-4">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
        <Eye className="w-4 h-4 text-[#1356E2]" />
        <span className="text-xs font-semibold text-[#1356E2] uppercase tracking-wider">Preview do Sidebar</span>
      </div>
      {visibleSections.length === 0 ? (
        <p className="text-white/40 text-sm italic">Nenhuma página selecionada ainda.</p>
      ) : (
        <div className="space-y-3">
          {visibleSections.map(section => {
            const SectionIcon = getIcon(section.sectionIcon);
            return (
              <div key={section.section}>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-white/40 mb-1.5">
                  <SectionIcon className="w-3 h-3" />
                  {section.sectionLabel}
                </div>
                <div className="space-y-0.5 ml-2">
                  {section.visiblePages.map(page => (
                    <div key={page.id} className="text-xs text-white/70 py-1 pl-2 border-l-2 border-white/10">
                      {page.name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}