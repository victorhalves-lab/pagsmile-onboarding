import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  ArrowLeft, Save, Loader2, Settings, ListChecks, 
  FileText, AlertTriangle, Users, Building2, Info,
  Briefcase, ShoppingCart, Network, Link as LinkIcon
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import SelectionButton from '@/components/compliance/SelectionButton';
import QuestionList from '@/components/editor/QuestionList';
import QuestionFormDialog from '@/components/editor/QuestionFormDialog';
import TemplateDocumentsList from '@/components/editor/TemplateDocumentsList';
import DocumentFormDialog from '@/components/editor/DocumentFormDialog';
import QuestionnairePreview from '@/components/editor/QuestionnairePreview';
import QuestionLibraryModal from '@/components/editor/QuestionLibraryModal';
import AISuggestionsModal from '@/components/editor/AISuggestionsModal';
import TemplateVersionHistory from '@/components/editor/TemplateVersionHistory';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function EditorQuestionario() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const templateId = urlParams.get('id');
  const isEditing = !!templateId;

  const [activeTab, setActiveTab] = useState('config');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    merchantType: 'PJ',
    category: 'COMPLIANCE',
    subCategory: 'GENERAL',
    linkedComplianceTemplateId: '',
    isActive: true,
    riskThresholds: {
      autoApproveAbove: 80,
      autoRejectBelow: 30,
      manualReviewMin: 30,
      manualReviewMax: 80
    }
  });

  // Dialog states
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [editingDocumentLink, setEditingDocumentLink] = useState(null);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [aiSuggestionsOpen, setAISuggestionsOpen] = useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);

  // Fetch template data
  const { data: template, isLoading: loadingTemplate } = useQuery({
    queryKey: ['template', templateId],
    queryFn: async () => {
      if (!templateId) return null;
      const templates = await base44.entities.QuestionnaireTemplate.filter({ id: templateId });
      return templates[0] || null;
    },
    enabled: isEditing
  });

  // Fetch questions for this template
  const { data: questions = [], isLoading: loadingQuestions } = useQuery({
    queryKey: ['questions', templateId],
    queryFn: () => base44.entities.Question.filter({ questionnaireTemplateId: templateId }, 'order'),
    enabled: isEditing
  });

  // Fetch all document types
  const { data: documentTypes = [] } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: () => base44.entities.DocumentType.list()
  });

  // Fetch compliance templates for linking
  const { data: complianceTemplates = [] } = useQuery({
    queryKey: ['complianceTemplates'],
    queryFn: () => base44.entities.QuestionnaireTemplate.filter({ category: 'COMPLIANCE', isActive: true })
  });

  // Update form when template loads
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        description: template.description || '',
        merchantType: template.merchantType || 'PJ',
        category: template.category || 'COMPLIANCE',
        subCategory: template.subCategory || 'GENERAL',
        linkedComplianceTemplateId: template.linkedComplianceTemplateId || '',
        isActive: template.isActive !== false,
        riskThresholds: template.riskThresholds || {
          autoApproveAbove: 80,
          autoRejectBelow: 30,
          manualReviewMin: 30,
          manualReviewMax: 80
        },
        requiredDocuments: template.requiredDocuments || []
      });
    }
  }, [template]);

  // Save template mutation
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (isEditing) {
        return base44.entities.QuestionnaireTemplate.update(templateId, data);
      } else {
        return base44.entities.QuestionnaireTemplate.create(data);
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['questionnaireTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
      toast.success(isEditing ? t('eq.questionnaire_updated') : t('eq.questionnaire_created'));
      if (!isEditing && result?.id) {
        navigate(createPageUrl('EditorQuestionario') + `?id=${result.id}`);
      }
    },
    onError: (error) => {
      toast.error(t('eq.save_error') + error.message);
    }
  });

  // Save as new version
  const saveNewVersionMutation = useMutation({
    mutationFn: async () => {
      // Archive current
      await base44.entities.QuestionnaireTemplate.update(templateId, { isArchived: true });
      // Create new version
      const { id, created_date, updated_date, created_by, ...data } = template;
      const newTemplate = await base44.entities.QuestionnaireTemplate.create({
        ...data,
        ...formData,
        version: (template.version || 1) + 1,
        previousVersionId: templateId,
        isArchived: false,
      });
      // Copy questions
      for (const q of questions) {
        const { id: qId, created_date: cd, updated_date: ud, created_by: cb, ...qData } = q;
        await base44.entities.Question.create({ ...qData, questionnaireTemplateId: newTemplate.id });
      }
      return newTemplate;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['questionnaireTemplates'] });
      toast.success(t('eq.new_version_created'));
      navigate(createPageUrl('EditorQuestionario') + `?id=${result.id}`);
    }
  });

  const handleRestoreVersion = async (oldVersion) => {
    const { id, created_date, updated_date, created_by, ...data } = oldVersion;
    const newTemplate = await base44.entities.QuestionnaireTemplate.create({
      ...data,
      version: (template?.version || oldVersion.version || 1) + 1,
      previousVersionId: oldVersion.id,
      isArchived: false,
    });
    const oldQuestions = await base44.entities.Question.filter({ questionnaireTemplateId: oldVersion.id });
    for (const q of oldQuestions) {
      const { id: qId, created_date: cd, updated_date: ud, created_by: cb, ...qData } = q;
      await base44.entities.Question.create({ ...qData, questionnaireTemplateId: newTemplate.id });
    }
    if (template) await base44.entities.QuestionnaireTemplate.update(templateId, { isArchived: true });
    toast.success(t('eq.version_restored'));
    navigate(createPageUrl('EditorQuestionario') + `?id=${newTemplate.id}`);
    setVersionHistoryOpen(false);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error(t('eq.name_required'));
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleOpenQuestionDialog = (question = null) => {
    setEditingQuestion(question);
    setQuestionDialogOpen(true);
  };

  const handleOpenDocumentDialog = (docLink = null) => {
    setEditingDocumentLink(docLink);
    setDocumentDialogOpen(true);
  };

  if (loadingTemplate) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl('TemplatesQuestionarios'))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--pagsmile-blue)]">
              {isEditing ? t('eq.title_edit') : t('eq.title_new')}
            </h1>
            {isEditing && template && (
              <p className="text-[var(--pagsmile-blue)]/70">{template.name}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing && (
            <>
              <Button variant="outline" onClick={() => setVersionHistoryOpen(true)}>
                {t('eq.versions')}
              </Button>
              <Button
                variant="outline"
                onClick={() => saveNewVersionMutation.mutate()}
                disabled={saveNewVersionMutation.isPending}
              >
                {saveNewVersionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {t('eq.new_version')}
              </Button>
            </>
          )}
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {t('eq.save')}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="config" className="gap-2">
            <Settings className="w-4 h-4" />
            {t('eq.tab_config')}
          </TabsTrigger>
          <TabsTrigger value="questions" className="gap-2" disabled={!isEditing}>
            <ListChecks className="w-4 h-4" />
            {t('eq.tab_questions')}
            {questions.length > 0 && (
              <Badge variant="secondary" className="ml-1">{questions.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2" disabled={!isEditing}>
            <FileText className="w-4 h-4" />
            {t('eq.tab_documents')}
          </TabsTrigger>
          <TabsTrigger value="risk" className="gap-2" disabled={!isEditing}>
            <AlertTriangle className="w-4 h-4" />
            {t('eq.tab_risk')}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Configurações Básicas */}
        <TabsContent value="config" className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Questionário *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Compliance Pix - PJ"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o propósito deste questionário..."
                rows={3}
              />
            </div>

            {/* Categoria do Questionário */}
            <div className="space-y-3">
              <Label>Categoria do Questionário *</Label>
              <SelectionButton
                options={[
                  { value: 'LEAD_GENERATION', label: 'Geração de Leads', icon: <Briefcase className="w-5 h-5" />, description: 'Questionário comercial para novos clientes' },
                  { value: 'COMPLIANCE', label: 'Compliance', icon: <FileText className="w-5 h-5" />, description: 'KYC/KYB para onboarding regulatório' }
                ]}
                value={formData.category}
                onChange={(value) => setFormData({ ...formData, category: value })}
                columns={2}
                helperText=""
              />
            </div>

            {/* Link para template de compliance (só para LEAD_GENERATION) */}
            {formData.category === 'LEAD_GENERATION' && complianceTemplates.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-[var(--pagsmile-green)]" />
                  Vincular a Template de Compliance
                </Label>
                <p className="text-xs text-[var(--pagsmile-blue)]/60">
                  Ao vincular, quando o lead for qualificado, o sistema recomendará este questionário de compliance.
                </p>
                <Select
                  value={formData.linkedComplianceTemplateId || '_none'}
                  onValueChange={(v) => setFormData({ ...formData, linkedComplianceTemplateId: v === '_none' ? '' : v })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione um template de compliance..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Nenhum (definir manualmente depois)</SelectItem>
                    {complianceTemplates.map(ct => (
                      <SelectItem key={ct.id} value={ct.id}>
                        {ct.name} {ct.model ? `(${ct.model})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <Label className="text-base">Questionário Ativo</Label>
                <p className="text-sm text-[var(--pagsmile-blue)]/70">
                  Questionários inativos não podem ser usados em novos onboardings
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            {!isEditing && (
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Salve para desbloquear mais opções
                  </p>
                  <p className="text-sm text-blue-600">
                    Após salvar as configurações básicas, você poderá adicionar perguntas, documentos e configurar limiares de risco.
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab: Perguntas */}
        <TabsContent value="questions" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div>
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={() => setLibraryModalOpen(true)}>
                  📚 Da Biblioteca
                </Button>
                <Button variant="outline" size="sm" onClick={() => setAISuggestionsOpen(true)} className="text-purple-700">
                  🤖 Sugestões IA
                </Button>
              </div>
              <QuestionList
                questions={questions}
                templateId={templateId}
                onAddQuestion={() => handleOpenQuestionDialog()}
                onEditQuestion={(q) => handleOpenQuestionDialog(q)}
                isLoading={loadingQuestions}
              />
            </div>
            <div className="hidden xl:block sticky top-4">
              <h3 className="text-sm font-semibold text-[var(--pagsmile-blue)]/70 mb-3">Pré-visualização</h3>
              <QuestionnairePreview template={formData} questions={questions} />
            </div>
          </div>
        </TabsContent>

        {/* Tab: Documentos */}
        <TabsContent value="documents" className="space-y-6">
          <TemplateDocumentsList
            template={template}
            templateId={templateId}
            documentTypes={documentTypes}
            onAddDocument={() => handleOpenDocumentDialog()}
            onEditDocumentLink={(docLink) => handleOpenDocumentDialog(docLink)}
          />
        </TabsContent>

        {/* Tab: Limiares de Risco */}
        <TabsContent value="risk" className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-[var(--pagsmile-blue)] mb-2">Limiares de Decisão Automática</h3>
              <p className="text-sm text-[var(--pagsmile-blue)]/70">
                Configure os limites de score para aprovação/rejeição automática e revisão manual.
              </p>
            </div>

            {/* Visual representation */}
            <div className="space-y-6">
              <div className="h-8 rounded-full overflow-hidden flex">
                <div 
                  className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${formData.riskThresholds?.autoRejectBelow || 30}%` }}
                >
                  Rejeitar
                </div>
                <div 
                  className="bg-yellow-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${(formData.riskThresholds?.autoApproveAbove || 80) - (formData.riskThresholds?.autoRejectBelow || 30)}%` }}
                >
                  Revisão Manual
                </div>
                <div 
                  className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${100 - (formData.riskThresholds?.autoApproveAbove || 80)}%` }}
                >
                  Aprovar
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    Rejeitar automaticamente abaixo de
                  </Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[formData.riskThresholds?.autoRejectBelow || 30]}
                      onValueChange={([value]) => setFormData({
                        ...formData,
                        riskThresholds: { ...formData.riskThresholds, autoRejectBelow: value, manualReviewMin: value }
                      })}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-lg font-semibold w-12 text-right">
                      {formData.riskThresholds?.autoRejectBelow || 30}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    Aprovar automaticamente acima de
                  </Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[formData.riskThresholds?.autoApproveAbove || 80]}
                      onValueChange={([value]) => setFormData({
                        ...formData,
                        riskThresholds: { ...formData.riskThresholds, autoApproveAbove: value, manualReviewMax: value }
                      })}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-lg font-semibold w-12 text-right">
                      {formData.riskThresholds?.autoApproveAbove || 80}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Revisão Manual:</strong> Casos com score entre{' '}
                  <span className="font-semibold">{formData.riskThresholds?.autoRejectBelow || 30}</span> e{' '}
                  <span className="font-semibold">{formData.riskThresholds?.autoApproveAbove || 80}</span>{' '}
                  serão enviados para análise manual.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <QuestionFormDialog
        open={questionDialogOpen}
        onOpenChange={setQuestionDialogOpen}
        question={editingQuestion}
        templateId={templateId}
        allQuestions={questions}
      />

      <DocumentFormDialog
        open={documentDialogOpen}
        onOpenChange={setDocumentDialogOpen}
        documentLink={editingDocumentLink}
        template={template}
        templateId={templateId}
        documentTypes={documentTypes}
      />

      <QuestionLibraryModal
        open={libraryModalOpen}
        onClose={() => setLibraryModalOpen(false)}
        templateId={templateId}
        existingQuestionCount={questions.length}
      />

      <AISuggestionsModal
        open={aiSuggestionsOpen}
        onClose={() => setAISuggestionsOpen(false)}
        templateId={templateId}
        template={template || formData}
        existingQuestions={questions}
      />

      <TemplateVersionHistory
        open={versionHistoryOpen}
        onClose={() => setVersionHistoryOpen(false)}
        templateName={template?.name || formData.name}
        currentVersion={template?.version || 1}
        onRestore={handleRestoreVersion}
      />
    </div>
  );
}