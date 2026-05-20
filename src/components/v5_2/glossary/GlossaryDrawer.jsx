import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Search, Scale, X } from 'lucide-react';
import { GLOSSARY_V5_2, TERM_CATEGORIES, GLOSSARY_TERM_COUNT, searchTerms, getTermsByCategory } from '@/lib/v5_2/glossary';

/**
 * [V5.2 Fase 6.5.4] Drawer lateral com o gloss\u00e1rio V5.2 completo.
 *
 * \u00darea de uso: \u00edcone de livro no canto sup. dir. das telas V5.2 (ComparatorV4V5_2,
 * CadastroV5_2Tab, AnaliseManual quando filtrando V5.2). Permite o analista
 * consultar o cat\u00e1logo inteiro com busca + filtros por categoria.
 *
 * Props:
 *   - trigger: ReactNode custom para o gatilho (default = bot\u00e3o "Gloss\u00e1rio V5.2")
 *   - variant: 'button' (default) | 'icon' (s\u00f3 \u00edcone, compacto)
 */
export default function GlossaryDrawer({ trigger, variant = 'button' }) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const allCategories = useMemo(() => Object.keys(TERM_CATEGORIES), []);
  const groupedTerms = useMemo(() => getTermsByCategory(), []);

  const visibleTerms = useMemo(() => {
    let terms;
    if (query.trim().length >= 2) {
      terms = searchTerms(query);
    } else if (activeCategory === 'all') {
      terms = Object.entries(GLOSSARY_V5_2).map(([code, t]) => ({ code, ...t }));
    } else {
      terms = groupedTerms[activeCategory] || [];
    }
    return terms.sort((a, b) => a.label.localeCompare(b.label));
  }, [query, activeCategory, groupedTerms]);

  const defaultTrigger = variant === 'icon' ? (
    <Button variant="outline" size="icon" className="h-9 w-9" title="Gloss\u00e1rio V5.2">
      <BookOpen className="w-4 h-4" />
    </Button>
  ) : (
    <Button variant="outline" size="sm" className="gap-2">
      <BookOpen className="w-4 h-4" />
      <span>Gloss\u00e1rio V5.2</span>
      <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">{GLOSSARY_TERM_COUNT}</Badge>
    </Button>
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col">
        {/* Header fixo */}
        <SheetHeader className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-[#2bc196]/5 to-transparent">
          <SheetTitle className="flex items-center gap-2 text-[#002443]">
            <BookOpen className="w-5 h-5 text-[#2bc196]" />
            <span>Gloss\u00e1rio V5.2</span>
            <Badge variant="secondary" className="ml-auto">
              {GLOSSARY_TERM_COUNT} termos
            </Badge>
          </SheetTitle>
          <p className="text-xs text-[#002443]/60 mt-1">
            Cat\u00e1logo can\u00f4nico DOC6 \u00a72.5.6 — termos t\u00e9cnicos do framework V5.2 com fundamenta\u00e7\u00e3o regulat\u00f3ria.
          </p>
        </SheetHeader>

        {/* Busca + Filtros */}
        <div className="px-6 py-3 border-b border-slate-200 space-y-2 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar termo (ex: patch, tier, B-FIN-1)..."
              className="pl-9 pr-9 h-9 text-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtros de categoria — desabilitados quando h\u00e1 busca ativa */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveCategory('all')}
              disabled={query.trim().length >= 2}
              className={`text-[10px] font-semibold px-2 py-1 rounded-md transition-colors ${
                activeCategory === 'all' && query.trim().length < 2
                  ? 'bg-[#002443] text-white'
                  : 'bg-slate-100 text-[#002443] hover:bg-slate-200 disabled:opacity-40'
              }`}
            >
              Todos ({GLOSSARY_TERM_COUNT})
            </button>
            {allCategories.map((catCode) => {
              const cat = TERM_CATEGORIES[catCode];
              const count = (groupedTerms[catCode] || []).length;
              if (count === 0) return null;
              const isActive = activeCategory === catCode && query.trim().length < 2;
              return (
                <button
                  key={catCode}
                  onClick={() => setActiveCategory(catCode)}
                  disabled={query.trim().length >= 2}
                  className={`text-[10px] font-semibold px-2 py-1 rounded-md transition-colors disabled:opacity-40 ${
                    isActive ? 'text-white' : 'hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: isActive ? cat.color : `${cat.color}15`,
                    color: isActive ? '#fff' : cat.color,
                  }}
                >
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de termos — scroll */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-3">
          {visibleTerms.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Nenhum termo encontrado para "{query}"
            </div>
          ) : (
            visibleTerms.map((term) => {
              const cat = TERM_CATEGORIES[term.category] || TERM_CATEGORIES.outros;
              return (
                <div
                  key={term.code}
                  className="border border-slate-200 rounded-lg overflow-hidden hover:border-[#2bc196]/40 hover:shadow-sm transition-all"
                >
                  <div
                    className="px-3 py-2 flex items-center gap-2 border-b border-slate-100"
                    style={{ backgroundColor: `${cat.color}08` }}
                  >
                    <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cat.color }}>
                      {cat.label}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 ml-auto">{term.code}</span>
                  </div>
                  <div className="p-3">
                    <h4 className="text-sm font-bold text-[#002443] mb-1">{term.label}</h4>
                    <p className="text-[12px] font-semibold text-[#002443]/90 mb-2">{term.short}</p>
                    {term.full && (
                      <p className="text-[11px] text-[#002443]/70 leading-relaxed">{term.full}</p>
                    )}
                    {term.regulatory && (
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-start gap-1.5">
                        <Scale className="w-3 h-3 text-amber-700 flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-900/80 font-mono leading-tight">
                          {term.regulatory}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-2 border-t border-slate-200 bg-slate-50/50 text-[10px] text-slate-500 text-center">
          Gloss\u00e1rio can\u00f4nico V5.2 \u00b7 Fonte: DOC6 \u00a72.5.6 + DELTA_SEGMENTOS \u00b7 Fase 6.5.4
        </div>
      </SheetContent>
    </Sheet>
  );
}