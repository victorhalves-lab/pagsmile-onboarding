import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';

function formatCompact(value) {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
  return `R$ ${value.toFixed(0)}`;
}

export default function TopIntroducersTable({ data }) {
  if (!data || data.length === 0) {
    return (
      <Card className="rounded-2xl border-[#002443]/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 font-bold text-[#002443]">
            <div className="p-1.5 rounded-lg bg-[#002443]/10">
              <UserPlus className="w-3.5 h-3.5 text-[#002443]" />
            </div>
            Top Introducers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#002443]/40 text-center py-6">Nenhum introducer com leads</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-[#002443]/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 font-bold text-[#002443]">
          <div className="p-1.5 rounded-lg bg-[#002443]/10">
            <UserPlus className="w-3.5 h-3.5 text-[#002443]" />
          </div>
          Top 5 Introducers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.slice(0, 5).map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#f4f4f4] hover:bg-[#002443]/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#002443] flex items-center justify-center text-white text-xs font-bold">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#002443]">{item.name}</p>
                  <p className="text-[10px] text-[#002443]/40">{item.referralCode}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div>
                  <p className="text-sm font-bold text-[#002443]">{item.leadsCount}</p>
                  <p className="text-[10px] text-[#002443]/40">leads</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#2bc196]">{item.acceptedCount}</p>
                  <p className="text-[10px] text-[#002443]/40">aceitas</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#36706c]">{formatCompact(item.tpv)}</p>
                  <p className="text-[10px] text-[#002443]/40">TPV</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}