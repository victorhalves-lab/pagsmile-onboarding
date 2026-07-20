import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
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
} from "@/components/ui/alert-dialog";
import { 
  Plus, GripVertical, Pencil, Copy, Trash2, Loader2,
  Type, Hash, Calendar, List, CheckSquare, Upload, ToggleLeft,
  Mail, Phone, CreditCard, AlertCircle, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

const typeIcons = {
  TEXT: Type,
  NUMBER: Hash,
  DATE: Calendar,
  SELECT: List,
  MULTI_SELECT: CheckSquare,
  FILE_UPLOAD: Upload,
  BOOLEAN: ToggleLeft,
  EMAIL: Mail,
  PHONE: Phone,
  CPF_CNPJ: CreditCard
};

const typeLabels = {
  TEXT: 'Texto',
  NUMBER: 'Número',
  DATE: 'Data',
  SELECT: 'Seleção',
  MULTI_SELECT: 'Múltipla Escolha',
  FILE_UPLOAD: 'Upload de Arquivo',
  BOOLEAN: 'Sim/Não',
  EMAIL: 'E-mail',
  PHONE: 'Telefone',
  CPF_CNPJ: 'CPF/CNPJ'
};

export default function QuestionList({ questions, templateId, onAddQuestion, onEditQuestion, isLoading }) {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = React.useState(null);

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (reorderedQuestions) => {
      const updates = reorderedQuestions.map((q, index) => 
        base44.entities.Question.update(q.id, { order: index + 1 })
      );
      return Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', templateId] });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Question.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', templateId] });
      toast.success('Pergunta excluída');
      setDeleteId(null);
    }
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: async (question) => {
      const { id, created_date, updated_date, created_by, ...data } = question;
      return base44.entities.Question.create({
        ...data,
        text: `${data.text} (cópia)`,
        order: questions.length + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', templateId] });
      toast.success('Pergunta duplicada');
    }
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    reorderMutation.mutate(items);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--pinbank-blue)]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[var(--pinbank-blue)]">Perguntas do Questionário</h3>
          <p className="text-sm text-[var(--pinbank-blue)]/70 font-medium">
            Arraste para reordenar. {questions.length} pergunta(s) cadastrada(s).
          </p>
        </div>
        <Button onClick={onAddQuestion} className="bg-[var(--pinbank-blue)] hover:bg-[var(--pinbank-blue)]/90">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Pergunta
        </Button>
      </div>

      {/* Question List */}
      {questions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <List className="w-12 h-12 mx-auto text-[var(--pinbank-blue)]/40 mb-4" />
          <h3 className="text-lg font-bold text-[var(--pinbank-blue)] mb-2">
            Nenhuma pergunta cadastrada
          </h3>
          <p className="text-[var(--pinbank-blue)]/70 font-medium mb-6">
            Adicione perguntas para construir seu questionário.
          </p>
          <Button onClick={onAddQuestion} className="bg-[var(--pinbank-blue)] hover:bg-[var(--pinbank-blue)]/90">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Primeira Pergunta
          </Button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="questions">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {questions.map((question, index) => {
                  const TypeIcon = typeIcons[question.type] || Type;
                  return (
                    <Draggable key={question.id} draggableId={question.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`bg-white rounded-xl border ${
                            snapshot.isDragging ? 'border-[var(--pinbank-blue)] shadow-lg' : 'border-slate-200'
                          } p-4 transition-all`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Drag Handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="mt-1 cursor-grab active:cursor-grabbing text-[var(--pinbank-blue)]/50 hover:text-[var(--pinbank-blue)]/80"
                            >
                              <GripVertical className="w-5 h-5" />
                            </div>

                            {/* Order Number */}
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-[var(--pinbank-blue)]/80">
                              {index + 1}
                            </div>

                            {/* Question Content */}
                            <div className="flex-1 min-w-0">
                              <p className="text-[var(--pinbank-blue)] font-semibold line-clamp-2">
                                {question.text}
                              </p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge variant="outline" className="gap-1">
                                  <TypeIcon className="w-3 h-3" />
                                  {typeLabels[question.type] || question.type}
                                </Badge>
                                {question.isRequired && (
                                  <Badge className="bg-red-100 text-red-700">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Obrigatória
                                  </Badge>
                                )}
                                {question.riskWeight > 0 && (
                                  <Badge className="bg-amber-100 text-amber-700">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Peso: {question.riskWeight}
                                  </Badge>
                                )}
                                {question.conditionalLogic?.dependsOn && (
                                  <Badge variant="secondary">
                                    Condicional
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEditQuestion(question)}
                                className="h-8 w-8"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => duplicateMutation.mutate(question)}
                                disabled={duplicateMutation.isPending}
                                className="h-8 w-8"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteId(question.id)}
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pergunta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A pergunta será permanentemente removida do questionário.
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