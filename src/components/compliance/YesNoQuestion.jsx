import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

export default function YesNoQuestion({ 
  question, 
  value, 
  onChange, 
  detailValue, 
  onDetailChange,
  detailLabel = "Por favor, detalhe sua resposta:",
  detailPlaceholder = "Digite aqui mais informações...",
  required = false,
  showDetailOn = true,
  className 
}) {
  return (
    <div className={cn(
      "p-6 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md", 
      className
    )}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1">
          <p className="text-[var(--pagsmile-blue)] font-semibold text-lg leading-snug">
            {question}
            {required && <span className="text-red-500 ml-1">*</span>}
          </p>
        </div>
        
        <div className="flex gap-3 flex-shrink-0 w-full md:w-auto">
          <button
            type="button"
            onClick={() => onChange(true)}
            className={cn(
              "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 border-2",
              value === true 
                ? "border-[var(--pagsmile-green)] bg-[var(--pagsmile-green)] text-white shadow-md transform -translate-y-0.5" 
                : "border-slate-100 bg-slate-50 text-slate-600 hover:border-[var(--pagsmile-green)] hover:text-[var(--pagsmile-green)]"
            )}
          >
            <Check className="w-4 h-4" />
            Sim
          </button>
          
          <button
            type="button"
            onClick={() => onChange(false)}
            className={cn(
              "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 border-2",
              value === false 
                ? "border-slate-600 bg-slate-600 text-white shadow-md transform -translate-y-0.5" 
                : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-400 hover:text-slate-800"
            )}
          >
            <X className="w-4 h-4" />
            Não
          </button>
        </div>
      </div>
      
      <div className={cn(
        "overflow-hidden transition-all duration-500 ease-in-out",
        value === showDetailOn ? "max-h-[500px] opacity-100 mt-6" : "max-h-0 opacity-0"
      )}>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <Label className="text-sm font-medium text-slate-700 mb-2 block pl-1">
            {detailLabel}
          </Label>
          <Textarea
            value={detailValue || ''}
            onChange={(e) => onDetailChange(e.target.value)}
            placeholder={detailPlaceholder}
            rows={3}
            className="bg-white resize-none border-slate-200 focus:border-[var(--pagsmile-green)] focus:ring-[var(--pagsmile-green)]"
          />
        </div>
      </div>
    </div>
  );
}