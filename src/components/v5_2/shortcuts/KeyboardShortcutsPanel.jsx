import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Keyboard, Sparkles } from 'lucide-react';
import { SHORTCUTS_V5_2, formatKey, EXPECTED_SHORTCUT_COUNT } from './shortcutsCatalog';

/**
 * [V5.2 Fase 6.5.5] Painel "?" — lista os 15 atalhos por categoria.
 * Marcado com data-shortcut-panel="true" para o hook ignorar quando decide se
 * outros modais devem bloquear teclas.
 */
export default function KeyboardShortcutsPanel({ open, onOpenChange }) {
  const grouped = useMemo(() => {
    const map = {};
    for (const s of SHORTCUTS_V5_2) {
      if (!map[s.category]) map[s.category] = [];
      map[s.category].push(s);
    }
    return map;
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl"
        data-shortcut-panel="true"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#002443]">
            <Keyboard className="w-5 h-5 text-[#2bc196]" />
            Atalhos de Teclado · V5.2
          </DialogTitle>
          <DialogDescription className="text-[#002443]/60">
            {EXPECTED_SHORTCUT_COUNT} atalhos disponíveis na tela de análise V5.2.
            Pressione <Kbd>Esc</Kbd> para fechar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2 max-h-[60vh] overflow-y-auto pr-1">
          {Object.entries(grouped).map(([category, items]) => (
            <CategoryBlock key={category} title={category} items={items} />
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-[#002443]/8 flex items-center gap-2 text-[11px] text-[#002443]/50">
          <Sparkles className="w-3.5 h-3.5 text-[#2bc196]" />
          <span>
            Atalhos são ignorados quando você está digitando em um campo de texto.
            Sequências (ex: <Kbd>G</Kbd> <Kbd>C</Kbd>) precisam ser pressionadas em até 1s.
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CategoryBlock({ title, items }) {
  return (
    <div>
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#002443]/40 mb-2">
        {title}
      </h3>
      <div className="space-y-1">
        {items.map(item => (
          <div
            key={item.id}
            className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-[#2bc196]/5 transition-colors"
          >
            <span className="text-sm text-[#002443]">{item.label}</span>
            <div className="flex items-center gap-1">
              {item.keys.map((k, idx) => (
                <React.Fragment key={idx}>
                  <Kbd>{formatKey(k)}</Kbd>
                  {idx < item.keys.length - 1 && (
                    <span className="text-[#002443]/30 text-xs px-0.5">depois</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Kbd({ children }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 rounded border border-[#002443]/15 bg-white text-[11px] font-mono font-semibold text-[#002443] shadow-[0_1px_0_rgba(0,36,67,0.1)]">
      {children}
    </kbd>
  );
}