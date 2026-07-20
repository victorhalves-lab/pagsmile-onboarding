import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Info, BookOpen, Scale } from 'lucide-react';
import { getTerm, TERM_CATEGORIES } from '@/lib/v5_2/glossary';
import { cn } from '@/lib/utils';

/**
 * [V5.2 Fase 6.5.4] Componente <Term> reutiliz\u00e1vel para gloss\u00e1rio inline.
 *
 * Renderiza o termo como texto sublinhado pontilhado + \u00edcone de info. Ao clicar,
 * abre um popover com:
 *   - Categoria + label oficial
 *   - Defini\u00e7\u00e3o curta (short)
 *   - Explica\u00e7\u00e3o completa (full)
 *   - Fundamenta\u00e7\u00e3o regulat\u00f3ria (se houver)
 *
 * Uso:
 *   <Term code="tier_1" />                  // usa o label do cat\u00e1logo
 *   <Term code="tier_1">Tier 1</Term>       // texto custom
 *   <Term code="patch_verde" inline />       // sem \u00edcone, s\u00f3 sublinhado
 *   <Term code="b_fin_1" icon="only" />     // s\u00f3 \u00edcone (\u24d8) sem texto
 *
 * Props:
 *   - code: c\u00f3digo do termo no GLOSSARY_V5_2 (obrigat\u00f3rio)
 *   - children: texto custom a renderizar (default = term.label)
 *   - inline: bool — esconde o \u00edcone, mostra apenas sublinhado pontilhado
 *   - icon: 'only' (s\u00f3 \u00edcone, sem texto) | 'after' (default, ap\u00f3s o texto)
 *   - className: classes extras para o gatilho
 */
export default function Term({ code, children, inline = false, icon = 'after', className = '' }) {
  const term = getTerm(code);

  // Se o termo n\u00e3o existe no cat\u00e1logo, renderiza apenas o texto sem tooltip
  // (gra\u00e7a-falha — nunca quebra a tela).
  if (!term) {
    return <span className={className}>{children || code}</span>;
  }

  const categoryMeta = TERM_CATEGORIES[term.category] || TERM_CATEGORIES.outros;
  const displayText = children || term.label;
  const showText = icon !== 'only';
  const showIcon = !inline;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1 align-baseline cursor-help transition-colors',
            showText && 'underline decoration-dotted decoration-[#1356E2]/60 underline-offset-2 hover:decoration-[#1356E2]',
            'hover:text-[#1356E2] focus:outline-none focus:ring-2 focus:ring-[#1356E2]/30 focus:ring-offset-1 rounded-sm',
            className
          )}
          aria-label={`Defini\u00e7\u00e3o de ${term.label}`}
        >
          {showText && <span>{displayText}</span>}
          {showIcon && (
            <Info className={cn(
              'flex-shrink-0',
              icon === 'only' ? 'w-3.5 h-3.5' : 'w-3 h-3',
              'text-[#1356E2]/70'
            )} />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-[360px] p-0 border border-slate-200 shadow-xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header colorido por categoria */}
        <div
          className="px-4 py-2.5 border-b border-slate-200 flex items-center gap-2"
          style={{ backgroundColor: `${categoryMeta.color}10` }}
        >
          <div
            className="w-1 h-5 rounded-full"
            style={{ backgroundColor: categoryMeta.color }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: categoryMeta.color }}>
                {categoryMeta.label}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{code}</span>
            </div>
            <h4 className="text-sm font-bold text-[#0A0A0A] mt-0.5 truncate">{term.label}</h4>
          </div>
        </div>

        {/* Defini\u00e7\u00e3o curta */}
        <div className="px-4 py-3 bg-white">
          <p className="text-[13px] font-semibold text-[#0A0A0A] leading-snug">
            {term.short}
          </p>
        </div>

        {/* Explica\u00e7\u00e3o completa */}
        {term.full && (
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-start gap-2">
              <BookOpen className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-[#0A0A0A]/80 leading-relaxed">
                {term.full}
              </p>
            </div>
          </div>
        )}

        {/* Fundamenta\u00e7\u00e3o regulat\u00f3ria */}
        {term.regulatory && (
          <div className="px-4 py-2.5 border-t border-slate-100 bg-amber-50/40">
            <div className="flex items-start gap-2">
              <Scale className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-0.5">
                  Fundamenta\u00e7\u00e3o
                </div>
                <p className="text-[11px] text-amber-900/90 font-mono leading-tight">
                  {term.regulatory}
                </p>
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}