import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, FileText, HelpCircle, Sparkles } from 'lucide-react';

const ANSWER_TYPES = [
  { value: 'text', label: 'Texto curto' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'number', label: 'Número' },
  { value: 'yes_no', label: 'Sim / Não' },
  { value: 'date', label: 'Data' },
];

/**
 * Edita UM item (documento OU pergunta) da PendencyRequest.
 * Controlado: recebe `item`, dispara `onChange(updatedItem)` e `onRemove()`.
 */
export default function PendencyItemEditor({ item, index, onChange, onRemove }) {
  const isDoc = item.kind === 'document';
  const isQuestion = item.kind === 'question';
  const isOther = !!item.isOther;

  const update = (patch) => onChange({ ...item, ...patch });

  const toggleFileType = (type) => {
    const current = Array.isArray(item.acceptedFileTypes) ? item.acceptedFileTypes : [];
    const next = current.includes(type) ? current.filter(t => t !== type) : [...current, type];
    update({ acceptedFileTypes: next });
  };

  const HeaderIcon = isDoc ? FileText : HelpCircle;
  const headerColor = isDoc
    ? (isOther ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-blue-50 border-blue-200 text-blue-700')
    : 'bg-violet-50 border-violet-200 text-violet-700';

  return (
    <div className={`rounded-lg border-2 ${isOther ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200 bg-white'} p-4 space-y-3`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={`${headerColor} border gap-1 px-2 py-0.5 text-xs font-semibold`}>
            <HeaderIcon className="w-3 h-3" />
            Item {index + 1} — {isDoc ? (isOther ? 'OUTROS (livre)' : 'Documento') : 'Pergunta'}
          </Badge>
          {isOther && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
        </div>
        <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Label */}
      <div>
        <Label className="text-xs font-semibold text-[var(--pagsmile-blue)] mb-1">
          {isDoc ? 'Nome do documento *' : 'Pergunta *'}
        </Label>
        <Input
          value={item.label || ''}
          onChange={(e) => update({ label: e.target.value })}
          placeholder={isDoc ? 'Ex.: Contrato Social atualizado' : 'Ex.: Qual o faturamento dos últimos 6 meses?'}
          className="text-sm"
        />
      </div>

      {/* Description */}
      <div>
        <Label className="text-xs font-semibold text-[var(--pagsmile-blue)] mb-1">Descrição (opcional)</Label>
        <Textarea
          value={item.description || ''}
          onChange={(e) => update({ description: e.target.value })}
          placeholder={isDoc ? 'Detalhes sobre o que esperamos receber' : 'Contexto ou critérios da resposta'}
          rows={2}
          className="text-sm"
        />
      </div>

      {/* Doc-specific fields */}
      {isDoc && (
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <Label className="text-xs font-semibold text-[var(--pagsmile-blue)] mb-1">Tipos aceitos *</Label>
            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox
                  checked={(item.acceptedFileTypes || []).includes('pdf')}
                  onCheckedChange={() => toggleFileType('pdf')}
                />
                <span className="text-sm font-medium">PDF</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox
                  checked={(item.acceptedFileTypes || []).includes('image')}
                  onCheckedChange={() => toggleFileType('image')}
                />
                <span className="text-sm font-medium">Imagem</span>
              </label>
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold text-[var(--pagsmile-blue)] mb-1">Quantidade mínima</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={item.requiredQuantity || 1}
              onChange={(e) => update({ requiredQuantity: Math.max(1, parseInt(e.target.value) || 1) })}
              className="text-sm"
            />
          </div>
        </div>
      )}

      {/* Question-specific fields */}
      {isQuestion && (
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <Label className="text-xs font-semibold text-[var(--pagsmile-blue)] mb-1">Tipo de resposta *</Label>
            <Select
              value={item.answerType || 'text'}
              onValueChange={(v) => update({ answerType: v })}
            >
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ANSWER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={item.isRequired !== false}
                onCheckedChange={(v) => update({ isRequired: !!v })}
              />
              <span className="text-sm font-medium">Resposta obrigatória</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}