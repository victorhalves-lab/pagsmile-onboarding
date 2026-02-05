import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Loader2, ChevronDown, Settings2 } from 'lucide-react';
import { toast } from 'sonner';

const questionTypes = [
  { value: 'TEXT', label: 'Texto' },
  { value: 'NUMBER', label: 'Número' },
  { value: 'DATE', label: 'Data' },
  { value: 'SELECT', label: 'Seleção Única' },
  { value: 'MULTI_SELECT', label: 'Múltipla Escolha' },
  { value: 'FILE_UPLOAD', label: 'Upload de Arquivo' },
  { value: 'BOOLEAN', label: 'Sim/Não' },
  { value: 'EMAIL', label: 'E-mail' },
  { value: 'PHONE', label: 'Telefone' },
  { value: 'CPF_CNPJ', label: 'CPF/CNPJ' }
];

const operators = [
  { value: 'equals', label: 'É igual a' },
  { value: 'not_equals', label: 'É diferente de' },
  { value: 'contains', label: 'Contém' },
  { value: 'greater_than', label: 'Maior que' },
  { value: 'less_than', label: 'Menor que' }
];

const initialFormData = {
  text: '',
  type: 'TEXT',
  isRequired: false,
  options: [],
  helpText: '',
  placeholder: '',
  riskWeight: 0,
  riskValues: {},
  validationRules: {},
  conditionalLogic: null
};

export default function QuestionFormDialog({ open, onOpenChange, question, templateId, allQuestions }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(initialFormData);
  const [optionsText, setOptionsText] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [conditionalOpen, setConditionalOpen] = useState(false);

  const isEditing = !!question;

  useEffect(() => {
    if (question) {
      setFormData({
        text: question.text || '',
        type: question.type || 'TEXT',
        isRequired: question.isRequired || false,
        options: question.options || [],
        helpText: question.helpText || '',
        placeholder: question.placeholder || '',
        riskWeight: question.riskWeight || 0,
        riskValues: question.riskValues || {},
        validationRules: question.validationRules || {},
        conditionalLogic: question.conditionalLogic || null
      });
      setOptionsText((question.options || []).join('\n'));
      setAdvancedOpen(!!question.riskWeight || !!question.helpText);
      setConditionalOpen(!!question.conditionalLogic?.dependsOn);
    } else {
      setFormData(initialFormData);
      setOptionsText('');
      setAdvancedOpen(false);
      setConditionalOpen(false);
    }
  }, [question, open]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (isEditing) {
        return base44.entities.Question.update(question.id, data);
      } else {
        return base44.entities.Question.create({
          ...data,
          questionnaireTemplateId: templateId,
          order: allQuestions.length + 1
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', templateId] });
      toast.success(isEditing ? 'Pergunta atualizada!' : 'Pergunta criada!');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Erro ao salvar: ' + error.message);
    }
  });

  const handleSave = () => {
    if (!formData.text.trim()) {
      toast.error('O texto da pergunta é obrigatório');
      return;
    }

    const dataToSave = {
      ...formData,
      options: ['SELECT', 'MULTI_SELECT'].includes(formData.type) 
        ? optionsText.split('\n').filter(o => o.trim()) 
        : []
    };

    // Clean conditional logic if not configured
    if (!dataToSave.conditionalLogic?.dependsOn) {
      dataToSave.conditionalLogic = null;
    }

    saveMutation.mutate(dataToSave);
  };

  const showOptions = ['SELECT', 'MULTI_SELECT'].includes(formData.type);
  const otherQuestions = allQuestions.filter(q => q.id !== question?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Pergunta' : 'Nova Pergunta'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Texto da Pergunta */}
          <div className="space-y-2">
            <Label htmlFor="text">Texto da Pergunta *</Label>
            <Textarea
              id="text"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              placeholder="Digite o texto da pergunta..."
              rows={2}
            />
          </div>

          {/* Tipo e Obrigatoriedade */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Resposta</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {questionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Obrigatória</Label>
              <div className="flex items-center gap-3 h-12 px-4 bg-slate-50 rounded-xl">
                <Switch
                  checked={formData.isRequired}
                  onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })}
                />
                <span className="text-sm text-[var(--pagsmile-blue)]/80">
                  {formData.isRequired ? 'Sim, é obrigatória' : 'Não, é opcional'}
                </span>
              </div>
            </div>
          </div>

          {/* Opções (para SELECT e MULTI_SELECT) */}
          {showOptions && (
            <div className="space-y-2">
              <Label htmlFor="options">Opções de Resposta</Label>
              <Textarea
                id="options"
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                placeholder="Digite uma opção por linha..."
                rows={4}
              />
              <p className="text-xs text-[var(--pagsmile-blue)]/70 font-medium">
                Digite uma opção por linha. Cada linha será uma opção de resposta.
              </p>
            </div>
          )}

          {/* Configurações Avançadas */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  Configurações Avançadas
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="helpText">Texto de Ajuda</Label>
                <Textarea
                  id="helpText"
                  value={formData.helpText}
                  onChange={(e) => setFormData({ ...formData, helpText: e.target.value })}
                  placeholder="Instruções adicionais para o merchant..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="placeholder">Placeholder</Label>
                <Input
                  id="placeholder"
                  value={formData.placeholder}
                  onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                  placeholder="Texto exibido quando o campo está vazio"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="riskWeight">Peso no Cálculo de Risco (0-100)</Label>
                <Input
                  id="riskWeight"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.riskWeight}
                  onChange={(e) => setFormData({ ...formData, riskWeight: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-[var(--pagsmile-blue)]/70 font-medium">
                  Define o impacto desta pergunta no score de risco geral.
                </p>
              </div>

              {/* Validation Rules */}
              {['TEXT', 'NUMBER'].includes(formData.type) && (
                <div className="grid grid-cols-2 gap-4">
                  {formData.type === 'TEXT' && (
                    <>
                      <div className="space-y-2">
                        <Label>Mín. Caracteres</Label>
                        <Input
                          type="number"
                          min={0}
                          value={formData.validationRules.minLength || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            validationRules: { ...formData.validationRules, minLength: parseInt(e.target.value) || undefined }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Máx. Caracteres</Label>
                        <Input
                          type="number"
                          min={0}
                          value={formData.validationRules.maxLength || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            validationRules: { ...formData.validationRules, maxLength: parseInt(e.target.value) || undefined }
                          })}
                        />
                      </div>
                    </>
                  )}
                  {formData.type === 'NUMBER' && (
                    <>
                      <div className="space-y-2">
                        <Label>Valor Mínimo</Label>
                        <Input
                          type="number"
                          value={formData.validationRules.minValue || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            validationRules: { ...formData.validationRules, minValue: parseFloat(e.target.value) || undefined }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Valor Máximo</Label>
                        <Input
                          type="number"
                          value={formData.validationRules.maxValue || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            validationRules: { ...formData.validationRules, maxValue: parseFloat(e.target.value) || undefined }
                          })}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Lógica Condicional */}
          {otherQuestions.length > 0 && (
            <Collapsible open={conditionalOpen} onOpenChange={setConditionalOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4" />
                    Lógica Condicional
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${conditionalOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <p className="text-sm text-[var(--pagsmile-blue)]/70 font-medium">
                  Exibir esta pergunta somente quando outra pergunta tiver uma resposta específica.
                </p>

                <div className="space-y-2">
                  <Label>Depende da Pergunta</Label>
                  <Select
                    value={formData.conditionalLogic?.dependsOn || ''}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      conditionalLogic: { ...formData.conditionalLogic, dependsOn: value || null }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma pergunta..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Nenhuma (sempre exibir)</SelectItem>
                      {otherQuestions.map((q) => (
                        <SelectItem key={q.id} value={q.id}>
                          {q.order}. {q.text.substring(0, 50)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.conditionalLogic?.dependsOn && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Operador</Label>
                      <Select
                        value={formData.conditionalLogic?.operator || 'equals'}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          conditionalLogic: { ...formData.conditionalLogic, operator: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {operators.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Valor</Label>
                      <Input
                        value={formData.conditionalLogic?.value || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          conditionalLogic: { ...formData.conditionalLogic, value: e.target.value }
                        })}
                        placeholder="Valor esperado..."
                      />
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90"
          >
            {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? 'Salvar Alterações' : 'Criar Pergunta'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}