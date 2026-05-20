// V5.2 — Modalidade E: Upload de documento puro
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileCheck2, X } from 'lucide-react';
import { getMicrocopy } from '@/lib/v5_2/microcopy';

export default function DocumentUploadCard({ question, fileMeta, onUpload, onRemove, disabled }) {
  const [busy, setBusy] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      await onUpload?.(file);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{question.text}</CardTitle>
        <p className="text-xs text-slate-600">{question.helpText || getMicrocopy('modalidade_e.subtitle')}</p>
      </CardHeader>
      <CardContent>
        {!fileMeta && (
          <label className="block">
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} disabled={disabled || busy} className="hidden" />
            <div className={`flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition ${busy ? 'border-slate-200 bg-slate-50' : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/30'}`}>
              <Upload className="w-5 h-5 text-slate-500" />
              <span className="text-sm text-slate-700">
                {busy ? 'Enviando…' : 'Clique para anexar o documento'}
              </span>
            </div>
          </label>
        )}

        {fileMeta && (
          <div className="flex items-center justify-between gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileCheck2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-emerald-900 truncate">{fileMeta.fileName || 'Arquivo anexado'}</div>
                {fileMeta.fileSize && (
                  <div className="text-[11px] text-emerald-700">{Math.round(fileMeta.fileSize / 1024)} KB</div>
                )}
              </div>
            </div>
            <Button type="button" size="sm" variant="ghost" onClick={onRemove} disabled={disabled || busy}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}