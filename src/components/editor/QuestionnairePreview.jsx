import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Eye, AlertCircle } from 'lucide-react';

export default function QuestionnairePreview({ template, questions }) {
  if (!template?.name && questions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
        <Eye className="w-8 h-8 mx-auto text-[var(--pinbank-blue)]/30 mb-2" />
        <p className="text-sm text-[var(--pinbank-blue)]/50">Adicione perguntas para ver a pré-visualização</p>
      </div>
    );
  }

  const renderField = (q) => {
    switch (q.type) {
      case 'TEXT': return <Input disabled placeholder={q.placeholder || 'Resposta de texto...'} />;
      case 'NUMBER': return <Input disabled type="number" placeholder={q.placeholder || '0'} />;
      case 'EMAIL': return <Input disabled type="email" placeholder={q.placeholder || 'email@exemplo.com'} />;
      case 'PHONE': return <Input disabled placeholder={q.placeholder || '(00) 00000-0000'} />;
      case 'CPF_CNPJ': return <Input disabled placeholder={q.placeholder || '000.000.000-00'} />;
      case 'DATE': return <Input disabled type="date" />;
      case 'BOOLEAN': return (
        <div className="flex items-center gap-3">
          <Switch disabled />
          <span className="text-sm text-[var(--pinbank-blue)]/50">Sim / Não</span>
        </div>
      );
      case 'SELECT': return (
        <Select disabled>
          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
          <SelectContent>
            {(q.options || []).map((o, i) => <SelectItem key={i} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      );
      case 'MULTI_SELECT': return (
        <div className="flex gap-2 flex-wrap">
          {(q.options || []).map((o, i) => (
            <Badge key={i} variant="outline" className="cursor-default">{o}</Badge>
          ))}
        </div>
      );
      case 'FILE_UPLOAD': return (
        <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center text-sm text-[var(--pinbank-blue)]/40">
          Arraste um arquivo ou clique para enviar
        </div>
      );
      default: return <Input disabled placeholder="..." />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-[#0A0A0A] to-[#003366] rounded-t-xl p-4 text-center">
        <h3 className="text-white font-bold text-sm">{template?.name || 'Questionário'}</h3>
        {template?.description && <p className="text-white/60 text-xs mt-1">{template.description}</p>}
      </div>

      <div className="space-y-3">
        {questions.map((q, idx) => (
          <Card key={q.id || idx} className="border-slate-200">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-[var(--pinbank-blue)]/40 mt-0.5">{idx + 1}.</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--pinbank-blue)]">
                    {q.text}
                    {q.isRequired && <span className="text-red-500 ml-1">*</span>}
                  </p>
                  {q.helpText && (
                    <p className="text-[10px] text-[var(--pinbank-blue)]/50 mt-0.5">{q.helpText}</p>
                  )}
                </div>
                {q.riskWeight > 0 && (
                  <Badge className="bg-amber-100 text-amber-700 text-[9px]">
                    <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
                    {q.riskWeight}
                  </Badge>
                )}
              </div>
              <div className="ml-5">{renderField(q)}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}