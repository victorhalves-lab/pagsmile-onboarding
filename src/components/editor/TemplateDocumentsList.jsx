import React, { useState } from 'react';
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
  Plus, GripVertical, Pencil, Trash2, FileText,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function TemplateDocumentsList({ template, templateId, documentTypes, onAddDocument, onEditDocumentLink }) {
  const queryClient = useQueryClient();
  const [deleteIndex, setDeleteIndex] = useState(null);

  const requiredDocuments = template?.requiredDocuments || [];

  // Get document type details
  const getDocumentType = (docLink) => {
    return documentTypes.find(dt => dt.id === docLink.documentTypeId) || null;
  };

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: (newRequiredDocs) => 
      base44.entities.QuestionnaireTemplate.update(templateId, { requiredDocuments: newRequiredDocs }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
    }
  });

  // Remove document
  const handleRemove = () => {
    if (deleteIndex === null) return;
    const newDocs = requiredDocuments.filter((_, i) => i !== deleteIndex);
    updateMutation.mutate(newDocs);
    toast.success('Documento removido do questionário');
    setDeleteIndex(null);
  };

  // Reorder
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(requiredDocuments);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    updateMutation.mutate(items);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--pagsmile-blue)]">Documentos Exigidos</h3>
          <p className="text-sm text-[var(--pagsmile-blue)]/70">
            Documentos que serão solicitados neste questionário. {requiredDocuments.length} documento(s).
          </p>
        </div>
        <Button onClick={onAddDocument} className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Documento
        </Button>
      </div>

      {/* Documents List */}
      {requiredDocuments.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-[var(--pagsmile-blue)]/40 mb-4" />
          <h3 className="text-lg font-medium text-[var(--pagsmile-blue)] mb-2">
            Nenhum documento vinculado
          </h3>
          <p className="text-[var(--pagsmile-blue)]/70 mb-6">
            Adicione documentos que serão solicitados durante o onboarding.
          </p>
          <Button onClick={onAddDocument} className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Primeiro Documento
          </Button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="documents">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {requiredDocuments.map((docLink, index) => {
                  const docType = getDocumentType(docLink);
                  return (
                    <Draggable key={`${docLink.documentTypeId}-${index}`} draggableId={`${docLink.documentTypeId}-${index}`} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`bg-white rounded-xl border ${
                            snapshot.isDragging ? 'border-[var(--pagsmile-green)] shadow-lg' : 'border-slate-200'
                          } p-4 transition-all`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Drag Handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="mt-1 cursor-grab active:cursor-grabbing text-[var(--pagsmile-blue)]/50 hover:text-[var(--pagsmile-blue)]/80"
                            >
                              <GripVertical className="w-5 h-5" />
                            </div>

                            {/* Icon */}
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p className="text-[var(--pagsmile-blue)] font-medium">
                                {docLink.label || docType?.name || 'Documento'}
                              </p>
                              {docType && (
                                <p className="text-sm text-[var(--pagsmile-blue)]/70 mt-0.5">
                                  {docType.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {docLink.required !== false && (
                                  <Badge className="bg-red-100 text-red-700">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Obrigatório
                                  </Badge>
                                )}
                                {docType?.allowedFormats && (
                                  <Badge variant="outline">
                                    {docType.allowedFormats.join(', ')}
                                  </Badge>
                                )}
                                {docType?.maxSizeMB && (
                                  <Badge variant="secondary">
                                    Máx. {docType.maxSizeMB}MB
                                  </Badge>
                                )}
                                {docLink.conditionalLogic?.dependsOn && (
                                  <Badge className="bg-amber-100 text-amber-700">
                                    <AlertCircle className="w-3 h-3 mr-1" />
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
                                onClick={() => onEditDocumentLink({ ...docLink, index })}
                                className="h-8 w-8"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteIndex(index)}
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
      <AlertDialog open={deleteIndex !== null} onOpenChange={() => setDeleteIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover documento?</AlertDialogTitle>
            <AlertDialogDescription>
              O documento será removido deste questionário. O tipo de documento continuará existindo no sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-red-600 hover:bg-red-700"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}