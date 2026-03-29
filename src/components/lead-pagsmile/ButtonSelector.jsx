import React from 'react';

/**
 * UI "BOTÕES" — substitui dropdowns/radios/checkboxes.
 * Renderiza botões clicáveis, seleção única por padrão.
 * Se allowOther=true, último botão é "Outro" com campo de texto.
 */
export default function ButtonSelector({ options, value, onChange, allowOther, otherValue, onOtherChange, columns = 3 }) {
  const isOtherSelected = allowOther && value === '__other__';
  
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3',
  };

  return (
    <div className="space-y-2">
      <div className={`grid ${gridCols[columns] || 'grid-cols-2 sm:grid-cols-3'} gap-2`}>
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all duration-200 text-left
              ${value === opt 
                ? 'border-[#2bc196] bg-[#2bc196]/10 text-[#002443] shadow-sm' 
                : 'border-[#002443]/10 bg-white text-[#002443]/70 hover:border-[#2bc196]/40 hover:bg-[#2bc196]/5'
              }`}
          >
            {opt}
          </button>
        ))}
        {allowOther && (
          <button
            type="button"
            onClick={() => onChange('__other__')}
            className={`px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all duration-200 text-left
              ${isOtherSelected
                ? 'border-[#2bc196] bg-[#2bc196]/10 text-[#002443] shadow-sm' 
                : 'border-[#002443]/10 bg-white text-[#002443]/70 hover:border-[#2bc196]/40 hover:bg-[#2bc196]/5'
              }`}
          >
            Outro
          </button>
        )}
      </div>
      {isOtherSelected && (
        <input
          type="text"
          value={otherValue || ''}
          onChange={(e) => onOtherChange?.(e.target.value)}
          placeholder="Especifique..."
          className="w-full h-11 px-4 rounded-xl border-2 border-[#2bc196]/30 bg-[#2bc196]/5 text-sm focus:outline-none focus:border-[#2bc196]"
          autoFocus
        />
      )}
    </div>
  );
}