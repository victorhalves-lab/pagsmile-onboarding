import React from 'react';
import { cn } from '@/lib/utils';

export default function FormSection({ 
  title, 
  subtitle, 
  icon: Icon, 
  children, 
  className 
}) {
  return (
    <div className={cn("space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500", className)}>
      <div className="flex items-start gap-5 pb-6 border-b border-slate-100">
        {Icon && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--pagsmile-green)] to-[var(--pagsmile-blue)] text-white shadow-lg shadow-green-900/10">
            <Icon className="w-7 h-7" />
          </div>
        )}
        <div className="flex-1 pt-1">
          <h2 className="text-2xl font-bold text-[var(--pagsmile-blue)] tracking-tight">{title}</h2>
          {subtitle && (
            <p className="text-slate-500 mt-2 text-base leading-relaxed max-w-2xl">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}