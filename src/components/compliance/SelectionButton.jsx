import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle } from 'lucide-react';

export default function SelectionButton({ 
  options, 
  value, 
  onChange, 
  className,
  columns = 2 
}) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={cn(`grid gap-3 ${gridCols[columns] || 'grid-cols-1 md:grid-cols-2'}`, className)}>
      {options.map((option) => {
        const isSelected = value === option.value;
        // Se a opção tem ícone, usa o layout Card (grande), senão usa o Compacto
        const isCardLayout = !!option.icon;

        if (isCardLayout) {
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "group relative p-6 rounded-2xl text-left transition-all duration-300 ease-out",
                "border-2 flex flex-col h-full",
                isSelected 
                  ? "border-[var(--pagsmile-green)] bg-white shadow-[0_8px_30px_rgba(43,193,150,0.15)] transform -translate-y-1" 
                  : "border-slate-100 bg-white hover:border-[var(--pagsmile-green-light)] hover:shadow-lg hover:-translate-y-1"
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
                
                <div className={cn(
                  "transition-colors duration-300",
                  isSelected ? "text-[var(--pagsmile-green)]" : "text-slate-200"
                )}>
                  {isSelected ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                </div>
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

        // Layout Compacto (para formulários)
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "group relative px-4 py-3 rounded-xl text-left transition-all duration-200",
              "border flex items-center gap-3",
              isSelected 
                ? "border-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/5 ring-1 ring-[var(--pagsmile-green)]" 
                : "border-slate-200 bg-white hover:border-[var(--pagsmile-green)]/50 hover:bg-slate-50"
            )}
          >
             <div className={cn(
                "transition-colors duration-200 shrink-0",
                isSelected ? "text-[var(--pagsmile-green)]" : "text-slate-300 group-hover:text-slate-400"
              )}>
                {isSelected ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </div>

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