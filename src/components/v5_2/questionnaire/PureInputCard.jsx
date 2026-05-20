// V5.2 — Modalidade C: Input puro (sem BDC)
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { getMicrocopy } from '@/lib/v5_2/microcopy';

export default function PureInputCard({ question, value, onChange }) {
  const t = question.type;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{question.text}</CardTitle>
        {question.helpText && <p className="text-xs text-slate-600">{question.helpText}</p>}
      </CardHeader>
      <CardContent>
        {t === 'TEXT' && (
          <Input value={value ?? ''} onChange={(e) => onChange?.(e.target.value)} placeholder={question.placeholder} required={question.isRequired} />
        )}
        {t === 'NUMBER' && (
          <Input type="number" value={value ?? ''} onChange={(e) => onChange?.(e.target.value)} placeholder={question.placeholder} required={question.isRequired} />
        )}
        {t === 'DATE' && (
          <Input type="date" value={value ?? ''} onChange={(e) => onChange?.(e.target.value)} required={question.isRequired} />
        )}
        {t === 'EMAIL' && (
          <Input type="email" value={value ?? ''} onChange={(e) => onChange?.(e.target.value)} placeholder={question.placeholder || 'email@exemplo.com'} required={question.isRequired} />
        )}
        {t === 'PHONE' && (
          <Input type="tel" value={value ?? ''} onChange={(e) => onChange?.(e.target.value)} placeholder={question.placeholder || '(11) 99999-9999'} required={question.isRequired} />
        )}
        {t === 'CPF_CNPJ' && (
          <Input value={value ?? ''} onChange={(e) => onChange?.(e.target.value)} placeholder={question.placeholder || '00.000.000/0000-00'} required={question.isRequired} />
        )}

        {t === 'SELECT' && (
          <Select value={value ?? ''} onValueChange={(v) => onChange?.(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
            <SelectContent>
              {(question.options || []).map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {t === 'MULTI_SELECT' && (
          <div className="space-y-2 max-h-56 overflow-auto pr-2">
            {(question.options || []).map((opt) => {
              const arr = Array.isArray(value) ? value : [];
              const checked = arr.includes(opt);
              return (
                <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(c) => {
                      const next = c ? [...arr, opt] : arr.filter((x) => x !== opt);
                      onChange?.(next);
                    }}
                  />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
        )}

        {t === 'BOOLEAN' && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onChange?.(true)}
              className={`flex-1 px-4 py-2 rounded-md border transition ${value === true ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
            >Sim</button>
            <button
              type="button"
              onClick={() => onChange?.(false)}
              className={`flex-1 px-4 py-2 rounded-md border transition ${value === false ? 'bg-rose-600 text-white border-rose-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
            >Não</button>
          </div>
        )}

        {!['TEXT','NUMBER','DATE','EMAIL','PHONE','CPF_CNPJ','SELECT','MULTI_SELECT','BOOLEAN'].includes(t) && (
          <Textarea value={value ?? ''} onChange={(e) => onChange?.(e.target.value)} placeholder={question.placeholder} required={question.isRequired} />
        )}

        {question.isRequired && (
          <p className="mt-2 text-[11px] text-slate-500">{getMicrocopy('validation.required')} *</p>
        )}
      </CardContent>
    </Card>
  );
}