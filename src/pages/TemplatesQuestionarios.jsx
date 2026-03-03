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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Plus, FileText, Edit, Trash2, Loader2, 
  Users, Building2, Briefcase, Shield, Copy, ExternalLink, Download
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" />
      </div>
    );
  }

  const filtered = activeTab === 'all' ? templates :
    activeTab === 'LEAD_GENERATION' ? templates.filter(t => t.category === 'LEAD_GENERATION') :
    templates.filter(t => t.category === 'COMPLIANCE' || !t.category);

  const stats = [
    { label: 'Total', value: templates.length, color: '#002443' },
    { label: 'Leads', value: templates.filter(t => t.category === 'LEAD_GENERATION').length, color: '#2bc196' },
    { label: 'Compliance', value: templates.filter(t => t.category === 'COMPLIANCE' || !t.category).length, color: '#36706c' },
    { label: 'Ativos', value: templates.filter(t => t.isActive).length, color: '#2bc196' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#002443]">Questionários</h1>
          <p className="text-sm text-[#002443]/60">Gerencie templates de questionário de leads e compliance</p>
        </div>
        <Link to={createPageUrl('EditorQuestionario')}>
          <Button className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            Novo Questionário
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#002443]/5 p-4">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-[#002443]/50">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#f4f4f4] border border-[#002443]/5">
          <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-[#002443] data-[state=active]:shadow-sm">
            Todos ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="LEAD_GENERATION" className="gap-1.5 data-[state=active]:bg-white data-[state=active]:text-[#002443] data-[state=active]:shadow-sm">
            <Briefcase className="w-3 h-3" />
            Leads ({templates.filter(t => t.category === 'LEAD_GENERATION').length})
          </TabsTrigger>
          <TabsTrigger value="COMPLIANCE" className="gap-1.5 data-[state=active]:bg-white data-[state=active]:text-[#002443] data-[state=active]:shadow-sm">
            <Shield className="w-3 h-3" />
            Compliance ({templates.filter(t => t.category === 'COMPLIANCE' || !t.category).length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#002443]/5 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#f4f4f4] flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-[#002443]/20" />
          </div>
          <h3 className="text-base font-semibold text-[#002443] mb-1">Nenhum questionário criado</h3>
          <p className="text-sm text-[#002443]/50 mb-6">Crie seu primeiro template de questionário para começar.</p>
          <Link to={createPageUrl('EditorQuestionario')}>
            <Button className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Criar Questionário
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((template) => (
            <div 
              key={template.id} 
              className="bg-white rounded-2xl border border-[#002443]/5 p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    template.merchantType === 'PF' 
                      ? 'bg-[#2bc196]/10' 
                      : 'bg-[#002443]/5'
                  }`}>
                    {template.merchantType === 'PF' ? (
                      <Users className="w-5 h-5 text-[#2bc196]" />
                    ) : (
                      <Building2 className="w-5 h-5 text-[#002443]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-[#002443] truncate">
                      {template.name}
                    </h3>
                    <p className="text-sm text-[#002443]/50 mt-0.5 line-clamp-1">
                      {template.description || 'Sem descrição'}
                    </p>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <Badge className={
                        template.category === 'LEAD_GENERATION' 
                          ? 'bg-[#2bc196]/10 text-[#2bc196] border-0' 
                          : 'bg-[#002443]/5 text-[#002443] border-0'
                      }>
                        {template.category === 'LEAD_GENERATION' ? '🎯 Lead' : '🛡️ Compliance'}
                      </Badge>
                      {template.category === 'LEAD_GENERATION' && template.subCategory && template.subCategory !== 'GENERAL' && (
                        <Badge className="bg-[#36706c]/10 text-[#36706c] border-0">
                          {template.subCategory === 'MERCHAN' ? 'Merchant' : 
                           template.subCategory === 'GATEWAY' ? 'Gateway' : 
                           template.subCategory === 'MARKETPLACE' ? 'Marketplace' : template.subCategory}
                        </Badge>
                      )}
                      <Badge variant="outline" className="border-[#002443]/10 text-[#002443]/60">
                        {template.merchantType === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                      </Badge>
                      {template.model && (
                        <Badge className="bg-[#5cf7cf]/10 text-[#36706c] border-0">
                          {template.model.charAt(0).toUpperCase() + template.model.slice(1)}
                        </Badge>
                      )}
                      <Badge className={template.isActive 
                        ? 'bg-[#2bc196]/10 text-[#2bc196] border-0' 
                        : 'bg-[#f4f4f4] text-[#002443]/40 border-0'
                      }>
                        {template.isActive ? '● Ativo' : '○ Inativo'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#002443]/40">Ativo</span>
                    <Switch
                      checked={template.isActive}
                      onCheckedChange={(checked) => 
                        toggleMutation.mutate({ id: template.id, isActive: checked })
                      }
                      className="data-[state=checked]:bg-[#2bc196]"
                    />
                  </div>
                  
                  <div className="h-6 w-px bg-[#002443]/5" />

                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0"
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
                    <Copy className="w-4 h-4 text-[#2bc196]" />
                  </Button>

                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0"
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
                    <ExternalLink className="w-4 h-4 text-[#002443]/40" />
                  </Button>

                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleDownloadPdf(template)}
                    title="Baixar PDF"
                  >
                    <Download className="w-4 h-4 text-[#002443]/40" />
                  </Button>

                  <Link to={createPageUrl('EditorQuestionario') + `?id=${template.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Edit className="w-4 h-4 text-[#002443]/40" />
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
                    onClick={() => setDeleteId(template.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#002443]">Excluir questionário?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#002443]/60">
              Esta ação não pode ser desfeita. O questionário será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteId)}
              className="bg-red-500 hover:bg-red-600 rounded-xl"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}