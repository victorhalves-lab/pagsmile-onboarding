// V5.2 — Modalidade A: Confirmação de dado BDC
// Usuário apenas confirma ou reporta divergência. Não há campo de input livre.
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Database } from 'lucide-react';
import { getMicrocopy } from '@/lib/v5_2/microcopy';

export default function ConfirmCard({ question, bdcValue, datasetNomeAmigavel, value, onConfirm, onReportDivergence }) {
  const isConfirmed = value === 'confirmed';
  const isDivergent = value === 'divergent';

  return (
    <Card className="border-blue-100">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">{question.text}</CardTitle>
          <Badge variant="outline" className="text-[10px] gap-1 shrink-0">
            <Database className="w-3 h-3" />
            {datasetNomeAmigavel || question?.cross_check_bdc?.dataset || 'BDC'}
          </Badge>
        </div>
        {question.helpText && <p className="text-xs text-slate-600">{question.helpText}</p>}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">
            {getMicrocopy('modalidade_a.source_label', { dataset: datasetNomeAmigavel || 'BDC' })}
          </div>
          <div className="text-lg font-semibold text-slate-900 break-words">
            {bdcValue || <span className="text-slate-400 italic">— sem valor —</span>}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant={isConfirmed ? 'default' : 'outline'}
            onClick={() => onConfirm?.()}
            className="flex-1"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {getMicrocopy('modalidade_a.confirm_button')}
          </Button>
          <Button
            type="button"
            variant={isDivergent ? 'destructive' : 'outline'}
            onClick={() => onReportDivergence?.()}
            className="flex-1"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            {getMicrocopy('modalidade_a.report_divergence')}
          </Button>
        </div>

        {isDivergent && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            {getMicrocopy('modalidade_a.divergence_warning')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}