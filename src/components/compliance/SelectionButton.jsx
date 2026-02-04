import React from 'react';
import { cn } from '@/lib/utils';

export default function SelectionButton({ 
  options, 
  value, 
  onChange, 
  className,
  columns = 2 
}) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  };

  return (
    <div className={cn(`grid gap-3 ${gridCols[columns] || 'grid-cols-2'}`, className)}>
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "p-4 rounded-xl border-2 text-left transition-all",
              isSelected 
                ? "border-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/5 shadow-sm" 
                : "border-slate-200 hover:border-slate-300 bg-white"
            )}
          >
            <div className="flex items-start gap-3">
              {option.icon && (
                <div className={cn(
                  "p-2 rounded-lg",
                  isSelected ? "bg-[var(--pagsmile-green)] text-white" : "bg-slate-100 text-slate-600"
                )}>
                  {option.icon}
                </div>
              )}
              <div className="flex-1">
                <div className={cn(
                  "font-semibold",
                  isSelected ? "text-[var(--pagsmile-green)]" : "text-slate-800"
                )}>
                  {option.label}
                </div>
                {option.description && (
                  <div className="text-sm text-slate-500 mt-1">{option.description}</div>
                )}
              </div>
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1",
                isSelected 
                  ? "border-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]" 
                  : "border-slate-300"
              )}>
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}