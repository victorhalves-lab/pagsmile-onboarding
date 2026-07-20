import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Search } from 'lucide-react';

/**
 * [V5.2 Fase 6.5.5] Busca leve no caso (atalho "/").
 * Faz scrollIntoView nos elementos `[data-shortcut-item]` cujo `data-shortcut-label`
 * contém o termo (case-insensitive). Quando o usuário pressiona Enter, salta para
 * o primeiro hit; setas ↑/↓ navegam entre hits.
 */
export default function SearchOverlay({ open, onOpenChange }) {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setHits([]);
      setActiveIdx(0);
    } else {
      // garantir foco no input ao abrir
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Coleta de elementos focáveis ocorre on-demand a cada digitação
  const search = (q) => {
    if (!q || q.trim().length < 2) {
      setHits([]);
      setActiveIdx(0);
      return;
    }
    const term = q.trim().toLowerCase();
    const nodes = Array.from(document.querySelectorAll('[data-shortcut-item]'));
    const filtered = nodes.filter(n => {
      const label = (n.getAttribute('data-shortcut-label') || n.textContent || '').toLowerCase();
      return label.includes(term);
    });
    setHits(filtered);
    setActiveIdx(0);
    if (filtered[0]) {
      filtered[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      flashHighlight(filtered[0]);
    }
  };

  const flashHighlight = (el) => {
    el.classList.add('ring-2', 'ring-[#1356E2]', 'ring-offset-2');
    setTimeout(() => el.classList.remove('ring-2', 'ring-[#1356E2]', 'ring-offset-2'), 1400);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (hits.length === 0) return;
      const next = (activeIdx + 1) % hits.length;
      setActiveIdx(next);
      hits[next].scrollIntoView({ behavior: 'smooth', block: 'center' });
      flashHighlight(hits[next]);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (hits.length === 0) return;
      const next = (activeIdx - 1 + hits.length) % hits.length;
      setActiveIdx(next);
      hits[next].scrollIntoView({ behavior: 'smooth', block: 'center' });
      flashHighlight(hits[next]);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (hits[activeIdx]) {
        hits[activeIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
        flashHighlight(hits[activeIdx]);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xl p-0 gap-0 overflow-hidden"
        data-shortcut-panel="true"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#0A0A0A]/8">
          <Search className="w-4 h-4 text-[#0A0A0A]/40" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar no caso (mín 2 caracteres) — ↑↓ navega, Enter pula"
            className="flex-1 bg-transparent outline-none text-sm text-[#0A0A0A] placeholder:text-[#0A0A0A]/30"
          />
          <kbd className="text-[10px] font-mono font-semibold text-[#0A0A0A]/40 px-1.5 py-0.5 rounded border border-[#0A0A0A]/10">Esc</kbd>
        </div>
        <div className="px-4 py-2.5 text-[11px] text-[#0A0A0A]/50 bg-[#f4f4f4]">
          {query.trim().length < 2
            ? 'Digite ao menos 2 caracteres para buscar elementos visíveis na tela.'
            : hits.length === 0
              ? 'Nenhum elemento encontrado.'
              : `${hits.length} resultado${hits.length > 1 ? 's' : ''} · item ${activeIdx + 1}`}
        </div>
      </DialogContent>
    </Dialog>
  );
}