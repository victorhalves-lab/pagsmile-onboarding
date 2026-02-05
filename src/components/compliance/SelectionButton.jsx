import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

export default function SelectionButton({ 
  options, 
  value, 
  onChange, 
  className,
  columns = 2,
  isMulti = false,
  helperText = "Clique para selecionar"
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
    <div className={cn("flex flex-col gap-2", className)}>
      {helperText && (
        <span className="text-xs font-medium text-[var(--pagsmile-blue)]/60 uppercase tracking-wider ml-1 mb-1">
          {helperText}
        </span>
      )}
      <div className={cn(`grid gap-3 ${gridCols[columns] || 'grid-cols-1 md:grid-cols-2'}`)}>
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
                  "group relative p-4 rounded-xl text-left transition-all duration-300 ease-out",
                  "border-2 flex flex-col h-full",
                  isSelected 
                    ? "border-[var(--pagsmile-green)] bg-[var(--pagsmile-green)] shadow-md" 
                    : "border-[var(--pagsmile-blue)]/20 bg-white hover:border-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/5 hover:shadow-sm"
                )}
              >
                <div className="flex justify-between items-start w-full mb-4">
                  <div className={cn(
                    "p-2 rounded-lg transition-colors duration-300",
                    isSelected 
                      ? "bg-white/20 text-white" 
                      : "bg-[var(--pagsmile-blue)]/5 text-[var(--pagsmile-blue)] group-hover:text-[var(--pagsmile-blue)] group-hover:bg-[var(--pagsmile-blue)]/10"
                  )}>
                    {option.icon}
                  </div>
                  
                  {isSelected && (
                    <div className="transition-colors duration-300 text-white">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  )}
                </div>

                <div className="mt-auto">
                  <h3 className={cn(
                    "font-bold text-base mb-1 transition-colors",
                    isSelected ? "text-white" : "text-[var(--pagsmile-blue)]"
                  )}>
                    {option.label}
                  </h3>
                  {option.description && (
                    <p className={cn(
                      "text-sm leading-relaxed transition-colors",
                      isSelected ? "text-white/90" : "text-[var(--pagsmile-blue)]/70"
                    )}>
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
                "group relative px-3 py-2 rounded-lg text-left transition-all duration-200",
                "border flex items-center gap-3",
                isSelected 
                ? "border-[var(--pagsmile-green)] bg-[var(--pagsmile-green)] shadow-sm" 
                : "border-[var(--pagsmile-blue)]/20 bg-white hover:border-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/5"
              )}
            >
               {isSelected && (
                 <div className="transition-colors duration-200 shrink-0 text-white">
                   <CheckCircle2 className="w-5 h-5" />
                 </div>
               )}

                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "font-medium text-sm transition-colors",
                    isSelected ? "text-white" : "text-[var(--pagsmile-blue)]"
                  )}>
                    {option.label}
                  </h3>
                  {option.description && (
                    <p className={cn(
                      "text-xs mt-0.5 truncate transition-colors",
                      isSelected ? "text-white/80" : "text-[var(--pagsmile-blue)]/60"
                    )}>
                      {option.description}
                    </p>
                  )}
                </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}