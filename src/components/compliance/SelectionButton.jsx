import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

export default function SelectionButton({ 
  options, 
  value, 
  onChange, 
  className,
  columns = 2,
  isMulti = false 
}) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  const handleClick = (optionValue) => {
    if (isMulti) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValue = currentValues.includes(optionValue) 
        ? currentValues.filter(v => v !== optionValue) 
        : [...currentValues, optionValue];
      onChange(newValue);
    } else {
      onChange(optionValue);
    }
  };

  return (
    <div className={cn(`grid gap-3 ${gridCols[columns] || 'grid-cols-1 md:grid-cols-2'}`, className)}>
      {options.map((option) => {
        const isSelected = isMulti 
          ? (Array.isArray(value) && value.includes(option.value)) 
          : (value === option.value);
        
        const isCardLayout = !!option.icon;

        if (isCardLayout) {
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleClick(option.value)}
              className={cn(
                "group relative p-6 rounded-2xl text-left transition-all duration-300 ease-out",
                "border-2 flex flex-col h-full",
                isSelected 
                  ? "border-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/5 shadow-[0_8px_30px_rgba(43,193,150,0.15)] transform -translate-y-1" 
                  : "border-slate-200 bg-white hover:border-[var(--pagsmile-green-light)] hover:shadow-lg hover:-translate-y-1"
              )}
            >
              <div className="flex justify-between items-start w-full mb-4">
                <div className={cn(
                  "p-3 rounded-xl transition-colors duration-300",
                  isSelected 
                    ? "bg-[var(--pagsmile-green)] text-white" 
                    : "bg-slate-50 text-slate-400 group-hover:text-[var(--pagsmile-green)] group-hover:bg-[var(--pagsmile-green)]/10"
                )}>
                  {option.icon}
                </div>
                
                {isSelected && (
                  <div className="transition-colors duration-300 text-[var(--pagsmile-green)]">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div className="mt-auto">
                <h3 className={cn(
                  "font-bold text-lg mb-2 transition-colors",
                  isSelected ? "text-[var(--pagsmile-blue)]" : "text-slate-700"
                )}>
                  {option.label}
                </h3>
                {option.description && (
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {option.description}
                  </p>
                )}
              </div>
            </button>
          );
        }

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleClick(option.value)}
            className={cn(
              "group relative px-4 py-3 rounded-xl text-left transition-all duration-200",
              "border flex items-center gap-3",
              isSelected 
                ? "border-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/10 ring-1 ring-[var(--pagsmile-green)] shadow-sm" 
                : "border-slate-200 bg-white hover:border-[var(--pagsmile-green)]/50 hover:bg-slate-50"
            )}
          >
             {isSelected && (
               <div className="transition-colors duration-200 shrink-0 text-[var(--pagsmile-green)]">
                 <CheckCircle2 className="w-5 h-5" />
               </div>
             )}

              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  "font-medium text-sm transition-colors",
                  isSelected ? "text-[var(--pagsmile-blue)]" : "text-slate-700"
                )}>
                  {option.label}
                </h3>
                {option.description && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {option.description}
                  </p>
                )}
              </div>
          </button>
        );
      })}
    </div>
  );
}