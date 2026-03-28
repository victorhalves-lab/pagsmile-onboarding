import React from 'react';
import { Card } from '@/components/ui/card';

export default function StatCard({ label, value, subtitle, icon: Icon, color = 'text-[#002443]' }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-[#002443]/50 uppercase tracking-wider">{label}</p>
          <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
          {subtitle && <p className="text-[11px] text-[#002443]/40 mt-0.5">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-[#2bc196]/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-[#2bc196]" />
          </div>
        )}
      </div>
    </Card>
  );
}