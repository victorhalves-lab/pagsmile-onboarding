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
    <div className={cn("space-y-6", className)}>
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="p-3 rounded-xl bg-[var(--pagsmile-green)]/10 text-[var(--pagsmile-green)]">
            <Icon className="w-6 h-6" />
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          {subtitle && (
            <p className="text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}