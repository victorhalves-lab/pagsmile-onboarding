import React from 'react';
import { SEGMENTS } from './pagsmileQuestionnaireData';

/**
 * P1 — "Sua empresa é principalmente um(a):"
 * BOTÕES CARDS com título + descrição, separados por INTERMEDIÁRIOS / MERCHANTS DIRETOS
 */
export default function SegmentCards({ value, onChange }) {
  const intermediarios = SEGMENTS.filter(s => s.group === 'intermediario');
  const merchants = SEGMENTS.filter(s => s.group === 'merchant');

  const renderCard = (seg) => (
    <button
      key={seg.id}
      type="button"
      onClick={() => onChange(seg.id)}
      className={`relative w-full text-left p-4 rounded-xl border-2 transition-all duration-200
        ${value === seg.id
          ? 'border-[#2bc196] bg-[#2bc196]/10 shadow-md ring-1 ring-[#2bc196]/20'
          : 'border-[#002443]/10 bg-white hover:border-[#2bc196]/40 hover:shadow-sm'
        }`}
    >
      {seg.isNewInV5_2 && (
        <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#2bc196] text-white tracking-wide">
          NOVO
        </span>
      )}
      <div className="flex items-start gap-3">
        <span className="text-2xl">{seg.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-sm ${value === seg.id ? 'text-[#002443]' : 'text-[#002443]/80'}`}>
            {seg.label}
          </p>
          <p className={`text-xs mt-1 leading-relaxed ${value === seg.id ? 'text-[#002443]/70' : 'text-[#002443]/50'}`}>
            {seg.description}
          </p>
        </div>
        {value === seg.id && (
          <div className="w-5 h-5 rounded-full bg-[#2bc196] flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Intermediários */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#002443]/40 mb-3">Intermediários</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {intermediarios.map(renderCard)}
        </div>
      </div>

      {/* Merchants Diretos */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#002443]/40 mb-3">Merchants Diretos</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {merchants.map(renderCard)}
        </div>
      </div>
    </div>
  );
}