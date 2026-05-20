// V5.2 — Tipo COMPOSITE: input numérico + upload no mesmo step
// Ex: q_t2_revenue_proof (declarar faturamento + anexar ECF/DEFIS/balanço)
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, FileCheck2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getMicrocopy } from '@/lib/v5_2/microcopy';

export default function CompositeCard({ question, inputValue, fileMeta, onChangeInput, onUpload, onRemoveFile, disabled }) {
  const [busy, setBusy] = useState(false);
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try { await onUpload?.(file); } finally { setBusy(false); e.target.value = ''; }
  };

  const incomplete = (!inputValue || String(inputValue).trim() === '') || !fileMeta;

  return (
    <Card className="border-emerald-100">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">{question.text}</CardTitle>
          <Badge variant="outline" className="text-[10px] shrink-0">COMPOSITE</Badge>
        </div>
        <p className="text-xs text-slate-600">{question.helpText || getMicrocopy('modalidade_e.composite_label')}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input */}
        <div>
          <label className="text-xs font-medium text-slate-700 mb-1 block">
            {getMicrocopy('composite.revenue_proof.input_label')}
          </label>
          <Input
            type="number"
            value={inputValue ?? ''}
            onChange={(e) => onChangeInput?.(e.target.value)}
            placeholder="0,00"
            disabled={disabled}
          />
        </div>

        {/* Upload */}
        <div>
          <label className="text-xs font-medium text-slate-700 mb-1 block">
            {getMicrocopy('composite.revenue_proof.upload_label')}
          </label>
          {!fileMeta && (
            <label className="block">
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} disabled={disabled || busy} className="hidden" />
              <div className={`flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed rounded-lg cursor-pointer transition ${busy ? 'border-slate-200 bg-slate-50' : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/30'}`}>
                <Upload className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-700">{busy ? 'Enviando…' : 'Anexar documento'}</span>
              </div>
            </label>
          )}
          {fileMeta && (
            <div className="flex items-center justify-between gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileCheck2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <div className="text-sm font-medium text-emerald-900 truncate">{fileMeta.fileName || 'Arquivo anexado'}</div>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={onRemoveFile}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {incomplete && question.isRequired && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            {getMicrocopy('composite.revenue_proof.both_required')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}