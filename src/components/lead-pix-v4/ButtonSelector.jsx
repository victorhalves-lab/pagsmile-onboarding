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
                ? 'border-[#1356E2] bg-[#1356E2]/10 text-[#0A0A0A] ring-1 ring-[#1356E2]/30'
                : 'border-[#0A0A0A]/10 bg-white text-[#0A0A0A]/70 hover:border-[#1356E2]/40'
              }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}