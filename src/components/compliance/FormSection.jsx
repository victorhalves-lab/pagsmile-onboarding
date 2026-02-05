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
    <div className={cn("space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500", className)}>
      <div className="flex items-center gap-4 pb-3 border-b border-[var(--pagsmile-blue)]/10">
        {Icon && (
          <div className="p-2.5 rounded-xl bg-[var(--pagsmile-blue)] text-white shadow-md">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1">
          <h2 className="text-lg font-bold text-[var(--pagsmile-blue)] tracking-tight">{title}</h2>
          {subtitle && (
            <p className="text-[var(--pagsmile-blue)]/60 mt-1 text-sm max-w-2xl">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}