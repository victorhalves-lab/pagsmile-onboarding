import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  Users, Building2 
} from 'lucide-react';
import { toast } from 'sonner';

export default function TemplatesQuestionarios() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState(null);

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
          <p className="text-[var(--pagsmile-blue)]/70">Gerencie os templates de questionário de compliance</p>
        </div>
        <Link to={createPageUrl('EditorQuestionario')}>
          <Button className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90">
            <Plus className="w-4 h-4 mr-2" />
            Novo Questionário
          </Button>
        </Link>
      </div>

      {/* Lista de Templates */}
      {templates.length === 0 ? (
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
          {templates.map((template) => (
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
                    <div className="flex items-center gap-2 mt-3">
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