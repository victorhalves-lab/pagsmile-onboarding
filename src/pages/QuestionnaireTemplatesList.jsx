import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  FileText,
  Power,
  PowerOff
} from 'lucide-react';
import { toast } from 'sonner';

export default function QuestionnaireTemplatesList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [templateToDelete, setTemplateToDelete] = React.useState(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['questionnaire-templates'],
    queryFn: async () => {
      return await base44.entities.QuestionnaireTemplate.list('-created_date');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.QuestionnaireTemplate.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['questionnaire-templates']);
      toast.success('Questionário excluído com sucesso');
      setDeleteDialogOpen(false);
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }) => {
      await base44.entities.QuestionnaireTemplate.update(id, { isActive: !isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['questionnaire-templates']);
      toast.success('Status atualizado com sucesso');
    }
  });

  const handleDelete = (template) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Questionários</h1>
            <p className="text-slate-600 mt-1">Gerencie os templates de questionários de onboarding</p>
          </div>
          <Button 
            onClick={() => navigate(createPageUrl('QuestionnaireEditor'))}
            className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Questionário
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <div key={template.id} className="bg-white p-6 rounded-lg border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{template.name}</h3>
                  <Badge variant="outline" className="mt-1">{template.targetType}</Badge>
                </div>
              </div>
              <button
                onClick={() => toggleActiveMutation.mutate({ id: template.id, isActive: template.isActive })}
                className={`p-2 rounded ${template.isActive ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                {template.isActive ? <Power className="w-5 h-5" /> : <PowerOff className="w-5 h-5" />}
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-4 line-clamp-2">
              {template.description || 'Sem descrição'}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Badge className={template.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
                  {template.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
                {template.version && (
                  <span className="text-xs text-slate-500">v{template.version}</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(createPageUrl('QuestionnaireEditor') + `?id=${template.id}`)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(template)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {templates.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-12">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum questionário criado</h3>
            <p className="text-slate-600 mb-6">Comece criando seu primeiro questionário de onboarding</p>
            <Button onClick={() => navigate(createPageUrl('QuestionnaireEditor'))}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Questionário
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o questionário "{templateToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(templateToDelete?.id)}
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