import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import SelectionButton from '../components/compliance/SelectionButton';
import { 
  ArrowLeft, Save, User, Building2, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function EditorQuestionario() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const templateId = urlParams.get('id');
  const isEditing = !!templateId;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    merchantType: null,
    isActive: true
  });

  const { data: template, isLoading } = useQuery({
    queryKey: ['questionnaireTemplate', templateId],
    queryFn: () => base44.entities.QuestionnaireTemplate.filter({ id: templateId }),
    enabled: isEditing,
    select: (data) => data[0]
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        description: template.description || '',
        merchantType: template.merchantType || null,
        isActive: template.isActive !== false
      });
    }
  }, [template]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (isEditing) {
        return base44.entities.QuestionnaireTemplate.update(templateId, data);
      } else {
        return base44.entities.QuestionnaireTemplate.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaireTemplates'] });
      toast.success(isEditing ? 'Questionário atualizado!' : 'Questionário criado!');
      navigate(createPageUrl('TemplatesQuestionarios'));
    },
    onError: (error) => {
      toast.error('Erro ao salvar: ' + error.message);
    }
  });

  const handleSave = () => {
    if (!formData.name || !formData.merchantType) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('TemplatesQuestionarios'))}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar aos Questionários
        </Button>
        <h1 className="text-2xl font-bold text-slate-800">
          {isEditing ? 'Editar Questionário' : 'Novo Questionário'}
        </h1>
        <p className="text-slate-500">
          {isEditing ? 'Atualize as configurações do questionário' : 'Configure um novo template de questionário'}
        </p>
      </div>

      {/* Formulário */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Nome do Questionário <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Ex: Compliance PJ Completo"
          />
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Descreva o propósito deste questionário..."
            rows={3}
          />
        </div>

        {/* Tipo de Merchant */}
        <div className="space-y-2">
          <Label>
            Tipo de Merchant <span className="text-red-500">*</span>
          </Label>
          <SelectionButton
            options={[
              { 
                value: 'PF', 
                label: 'Pessoa Física', 
                description: 'Para CPF',
                icon: <User className="w-5 h-5" />
              },
              { 
                value: 'PJ', 
                label: 'Pessoa Jurídica', 
                description: 'Para CNPJ',
                icon: <Building2 className="w-5 h-5" />
              }
            ]}
            value={formData.merchantType}
            onChange={(value) => handleChange('merchantType', value)}
            columns={2}
          />
        </div>

        {/* Ativo */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
          <div>
            <Label className="font-medium">Questionário Ativo</Label>
            <p className="text-sm text-slate-500">
              Questionários inativos não podem ser selecionados para novos onboardings
            </p>
          </div>
          <Switch
            checked={formData.isActive}
            onCheckedChange={(checked) => handleChange('isActive', checked)}
          />
        </div>

        {/* Botões */}
        <div className="flex gap-4 pt-4">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl('TemplatesQuestionarios'))}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex-1 bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEditing ? 'Atualizar' : 'Criar'} Questionário
          </Button>
        </div>
      </div>
    </div>
  );
}