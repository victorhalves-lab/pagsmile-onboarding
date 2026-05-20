import React from 'react';
import { Keyboard } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

/**
 * [V5.2 Fase 6.5.5] Badge discreto que indica disponibilidade de atalhos.
 * Sticky bottom-right. Click abre o painel; tooltip lembra o atalho "?".
 */
export default function ShortcutsHintBadge({ onClick }) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            aria-label="Abrir painel de atalhos (?)"
            className="fixed bottom-4 right-4 z-30 inline-flex items-center gap-2 px-3 py-2 rounded-full bg-[#002443] text-white shadow-lg hover:bg-[#002443]/90 hover:shadow-xl transition-all border border-[#2bc196]/30"
          >
            <Keyboard className="w-3.5 h-3.5 text-[#2bc196]" />
            <span className="text-[11px] font-semibold tracking-wide">Atalhos</span>
            <kbd className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded bg-white/10 border border-white/20 text-[10px] font-mono font-bold">
              ?
            </kbd>
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="bg-[#002443] text-white border-white/10 text-xs">
          Pressione <strong>?</strong> para ver todos os atalhos
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}