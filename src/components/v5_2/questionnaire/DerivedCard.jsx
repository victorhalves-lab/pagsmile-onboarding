// V5.2 — Modalidade D: Derivado automaticamente (read-only para o seller)
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getMicrocopy } from '@/lib/v5_2/microcopy';

export default function DerivedCard({ question, derivedValue, derivedFrom }) {
  return (
    <Card className="border-violet-100 bg-violet-50/30">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">{question.text}</CardTitle>
          <Badge variant="outline" className="text-[10px] gap-1 shrink-0 bg-white">
            <Calculator className="w-3 h-3" />
            Derivado
          </Badge>
        </div>
        <p className="text-xs text-slate-600">{getMicrocopy('modalidade_d.title')}</p>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-violet-200 bg-white px-4 py-3">
          <div className="text-lg font-semibold text-slate-900">
            {derivedValue !== undefined && derivedValue !== null && derivedValue !== ''
              ? String(derivedValue)
              : <span className="text-slate-400 italic">— ainda não calculado —</span>}
          </div>
          {derivedFrom && (
            <div className="text-[11px] text-slate-500 mt-1">
              {getMicrocopy('modalidade_d.derived_from', { source: derivedFrom })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}