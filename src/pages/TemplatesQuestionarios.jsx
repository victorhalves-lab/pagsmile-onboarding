import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Plus, FileText, Edit, Trash2, Loader2, 
  Users, Building2, Briefcase, Shield, ShoppingCart, Network, Copy, ExternalLink, Download
} from 'lucide-react';
import { toast } from 'sonner';

export default function TemplatesQuestionarios() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['questionnaireTemplates'],
    queryFn: () => base44.entities.QuestionnaireTemplate.list('-created_date')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.QuestionnaireTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaireTemplates'] });
      toast.success('Questionário excluído');
      setDeleteId(null);
    }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => 
      base44.entities.QuestionnaireTemplate.update(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaireTemplates'] });
    }
  });

  const handleDownloadPdf = async (template) => {
    try {
      toast.loading('Gerando PDF...', { id: 'pdf-toast' });
      const { data } = await base44.functions.invoke('generateQuestionnairePdf', { 
        questionnaireTemplateId: template.id 
      });
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `questionario_${template.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Download concluído', { id: 'pdf-toast' });
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar PDF', { id: 'pdf-toast' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--pagsmile-blue)]">Questionários</h1>
          <p className="text-[var(--pagsmile-blue)]/70">Gerencie templates de questionário de leads e compliance</p>
        </div>
        <Link to={createPageUrl('EditorQuestionario')}>
          <Button className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90">
            <Plus className="w-4 h-4 mr-2" />
            Novo Questionário
          </Button>
        </Link>
      </div>

      {/* Tabs de Filtro */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todos ({templates.length})</TabsTrigger>
          <TabsTrigger value="LEAD_GENERATION" className="gap-1">
            <Briefcase className="w-3 h-3" />
            Leads ({templates.filter(t => t.category === 'LEAD_GENERATION').length})
          </TabsTrigger>
          <TabsTrigger value="COMPLIANCE" className="gap-1">
            <Shield className="w-3 h-3" />
            Compliance ({templates.filter(t => t.category === 'COMPLIANCE' || !t.category).length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Lista de Templates */}
      {(() => {
        const filtered = activeTab === 'all' ? templates :
          activeTab === 'LEAD_GENERATION' ? templates.filter(t => t.category === 'LEAD_GENERATION') :
          templates.filter(t => t.category === 'COMPLIANCE' || !t.category);
        return filtered;
      })().length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-[var(--pagsmile-blue)]/40 mb-4" />
          <h3 className="text-lg font-medium text-[var(--pagsmile-blue)] mb-2">
            Nenhum questionário criado
          </h3>
          <p className="text-[var(--pagsmile-blue)]/70 mb-6">
            Crie seu primeiro template de questionário para começar.
          </p>
          <Link to={createPageUrl('EditorQuestionario')}>
            <Button className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90">
              <Plus className="w-4 h-4 mr-2" />
              Criar Questionário
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {(() => {
            const filtered = activeTab === 'all' ? templates :
              activeTab === 'LEAD_GENERATION' ? templates.filter(t => t.category === 'LEAD_GENERATION') :
              templates.filter(t => t.category === 'COMPLIANCE' || !t.category);
            return filtered;
          })().map((template) => (
            <div 
              key={template.id} 
              className="bg-white rounded-xl border border-slate-200 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${
                    template.merchantType === 'PF' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-purple-100 text-purple-600'
                  }`}>
                    {template.merchantType === 'PF' ? (
                      <Users className="w-6 h-6" />
                    ) : (
                      <Building2 className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--pagsmile-blue)]">
                      {template.name}
                    </h3>
                    <p className="text-sm text-[var(--pagsmile-blue)]/70 mt-1">
                      {template.description || 'Sem descrição'}
                    </p>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {/* Categoria */}
                      <Badge className={
                        template.category === 'LEAD_GENERATION' 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-indigo-100 text-indigo-800'
                      }>
                        {template.category === 'LEAD_GENERATION' ? '🎯 Lead' : '🛡️ Compliance'}
                      </Badge>
                      {/* SubCategoria para Leads */}
                      {template.category === 'LEAD_GENERATION' && template.subCategory && template.subCategory !== 'GENERAL' && (
                        <Badge className="bg-orange-100 text-orange-700">
                          {template.subCategory === 'MERCHAN' ? 'Merchant' : 
                           template.subCategory === 'GATEWAY' ? 'Gateway' : 
                           template.subCategory === 'MARKETPLACE' ? 'Marketplace' : template.subCategory}
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {template.merchantType === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                      </Badge>
                      {template.model && (
                        <Badge className={
                          template.model === 'lite' ? 'bg-teal-100 text-teal-700' :
                          template.model === 'pix' ? 'bg-blue-100 text-blue-700' :
                          template.model === 'full' ? 'bg-purple-100 text-purple-700' :
                          'bg-slate-100 text-slate-700'
                        }>
                          {template.model.charAt(0).toUpperCase() + template.model.slice(1)}
                        </Badge>
                      )}
                      <Badge className={template.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-[var(--pagsmile-blue)]/80'}>
                        {template.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--pagsmile-blue)]/70">Ativo</span>
                    <Switch
                      checked={template.isActive}
                      onCheckedChange={(checked) => 
                        toggleMutation.mutate({ id: template.id, isActive: checked })
                      }
                    />
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      const baseUrl = window.location.origin;
                      const path = template.category === 'LEAD_GENERATION' 
                        ? createPageUrl('LeadQuestionnaire')
                        : createPageUrl('ComplianceOnboardingStart');
                      const url = `${baseUrl}${path}?templateId=${template.id}`;
                      navigator.clipboard.writeText(url);
                      toast.success('Link público copiado!');
                    }}
                    title="Copiar Link Público"
                  >
                    <Copy className="w-4 h-4 text-[var(--pagsmile-green)]" />
                  </Button>

                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      const baseUrl = window.location.origin;
                      const path = template.category === 'LEAD_GENERATION' 
                        ? createPageUrl('LeadQuestionnaire')
                        : createPageUrl('ComplianceOnboardingStart');
                      const url = `${baseUrl}${path}?templateId=${template.id}`;
                      window.open(url, '_blank');
                    }}
                    title="Abrir Link Público"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-500" />
                  </Button>

                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDownloadPdf(template)}
                    title="Baixar PDF do Questionário"
                  >
                    <Download className="w-4 h-4 text-purple-500" />
                  </Button>

                  <Link to={createPageUrl('EditorQuestionario') + `?id=${template.id}`}>
                    <Button variant="ghost" size="icon">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setDeleteId(template.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir questionário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O questionário será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}