// V5.2 — Modalidade B: Input híbrido (sugere BDC mas aceita override)
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, Sparkles } from 'lucide-react';
import { getMicrocopy } from '@/lib/v5_2/microcopy';

export default function HybridInputCard({ question, bdcSuggestion, value, onChange, datasetNomeAmigavel }) {
  const showOverrideHint = value && bdcSuggestion && String(value).trim() !== String(bdcSuggestion).trim();

  const acceptSuggestion = () => onChange?.(bdcSuggestion);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">{question.text}</CardTitle>
          {bdcSuggestion !== undefined && bdcSuggestion !== null && (
            <Badge variant="outline" className="text-[10px] gap-1 shrink-0">
              <Database className="w-3 h-3" />
              {datasetNomeAmigavel || 'BDC'}
            </Badge>
          )}
        </div>
        {question.helpText && <p className="text-xs text-slate-600">{question.helpText}</p>}
      </CardHeader>
      <CardContent className="space-y-3">
        {bdcSuggestion !== undefined && bdcSuggestion !== null && bdcSuggestion !== '' && (
          <div className="flex items-center justify-between gap-2 rounded-md bg-blue-50 border border-blue-100 px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-blue-900 min-w-0">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {getMicrocopy('modalidade_b.suggestion_label', { value: bdcSuggestion })}
              </span>
            </div>
            <Button type="button" size="sm" variant="ghost" onClick={acceptSuggestion} className="shrink-0">
              Usar sugestão
            </Button>
          </div>
        )}

        <Input
          type={question.type === 'NUMBER' ? 'number' : 'text'}
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={question.placeholder || 'Digite ou ajuste'}
          required={question.isRequired}
        />

        {showOverrideHint && (
          <p className="text-xs text-slate-600">{getMicrocopy('modalidade_b.override_note')}</p>
        )}
      </CardContent>
    </Card>
  );
}