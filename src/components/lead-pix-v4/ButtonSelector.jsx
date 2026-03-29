import React from 'react';

export default function ButtonSelector({ options, value, onChange, multi = false, columns = 2 }) {
  const handleClick = (opt) => {
    if (multi) {
      const arr = Array.isArray(value) ? value : [];
      if (arr.includes(opt)) onChange(arr.filter(v => v !== opt));
      else onChange([...arr, opt]);
    } else {
      onChange(opt);
    }
  };

  const gridClass = columns === 1 ? 'grid-cols-1' : columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <div className={`grid ${gridClass} gap-2`}>
      {options.map(opt => {
        const label = typeof opt === 'string' ? opt : opt.label;
        const isSelected = multi ? (Array.isArray(value) && value.includes(label)) : value === label;
        return (
          <button
            key={label}
            type="button"
            onClick={() => handleClick(label)}
            className={`px-3 py-2.5 rounded-xl text-xs font-medium border-2 transition-all text-left
              ${isSelected
                ? 'border-[#2bc196] bg-[#2bc196]/10 text-[#002443] ring-1 ring-[#2bc196]/30'
                : 'border-[#002443]/10 bg-white text-[#002443]/70 hover:border-[#2bc196]/40'
              }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}