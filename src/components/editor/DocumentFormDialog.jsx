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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';

const formatOptions = ['PDF', 'JPG', 'JPEG', 'PNG'];

export default function DocumentFormDialog({ open, onOpenChange, documentLink, template, templateId, documentTypes }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('select');
  
  // For selecting existing document
  const [selectedDocId, setSelectedDocId] = useState('');
  const [linkData, setLinkData] = useState({
    label: '',
    required: true,
    conditionalLogic: null
  });

  // For creating new document type
  const [newDocData, setNewDocData] = useState({
    name: '',
    description: '',
    allowedFormats: ['PDF'],
    maxSizeMB: 10,
    merchantType: 'BOTH',
    isRequired: true,
    instructions: ''
  });

  const isEditing = !!documentLink;

  useEffect(() => {
    if (documentLink) {
      setSelectedDocId(documentLink.documentTypeId || '');
      setLinkData({
        label: documentLink.label || '',
        required: documentLink.required !== false,
        conditionalLogic: documentLink.conditionalLogic || null
      });
      setActiveTab('select');
    } else {
      setSelectedDocId('');
      setLinkData({ label: '', required: true, conditionalLogic: null });
      setNewDocData({
        name: '',
        description: '',
        allowedFormats: ['PDF'],
        maxSizeMB: 10,
        merchantType: 'BOTH',
        isRequired: true,
        instructions: ''
      });
      setActiveTab('select');
    }
  }, [documentLink, open]);

  // Create new document type mutation
  const createDocTypeMutation = useMutation({
    mutationFn: (data) => base44.entities.DocumentType.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTypes'] });
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: (newRequiredDocs) => 
      base44.entities.QuestionnaireTemplate.update(templateId, { requiredDocuments: newRequiredDocs }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
      toast.success(isEditing ? 'Documento atualizado!' : 'Documento adicionado!');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Erro ao salvar: ' + error.message);
    }
  });

  const handleSaveExisting = () => {
    if (!selectedDocId) {
      toast.error('Selecione um tipo de documento');
      return;
    }

    const selectedDoc = documentTypes.find(d => d.id === selectedDocId);
    const newDocLink = {
      documentTypeId: selectedDocId,
      label: linkData.label || selectedDoc?.name || '',
      required: linkData.required,
      conditionalLogic: linkData.conditionalLogic
    };

    let newRequiredDocs;
    if (isEditing) {
      newRequiredDocs = (template?.requiredDocuments || []).map((doc, i) => 
        i === documentLink.index ? newDocLink : doc
      );
    } else {
      newRequiredDocs = [...(template?.requiredDocuments || []), newDocLink];
    }

    updateTemplateMutation.mutate(newRequiredDocs);
  };

  const handleSaveNew = async () => {
    if (!newDocData.name.trim()) {
      toast.error('Nome do documento é obrigatório');
      return;
    }

    try {
      const createdDoc = await createDocTypeMutation.mutateAsync(newDocData);
      
      const newDocLink = {
        documentTypeId: createdDoc.id,
        label: newDocData.name,
        required: newDocData.isRequired,
        conditionalLogic: null
      };

      const newRequiredDocs = [...(template?.requiredDocuments || []), newDocLink];
      updateTemplateMutation.mutate(newRequiredDocs);
    } catch (error) {
      toast.error('Erro ao criar documento: ' + error.message);
    }
  };

  const toggleFormat = (format) => {
    setNewDocData(prev => ({
      ...prev,
      allowedFormats: prev.allowedFormats.includes(format)
        ? prev.allowedFormats.filter(f => f !== format)
        : [...prev.allowedFormats, format]
    }));
  };

  const isPending = updateTemplateMutation.isPending || createDocTypeMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Documento' : 'Adicionar Documento'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="select" className="flex-1 gap-2">
              <FileText className="w-4 h-4" />
              Documento Existente
            </TabsTrigger>
            {!isEditing && (
              <TabsTrigger value="create" className="flex-1 gap-2">
                <Plus className="w-4 h-4" />
                Criar Novo
              </TabsTrigger>
            )}
          </TabsList>

          {/* Select Existing Document */}
          <TabsContent value="select" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Tipo de Documento</Label>
              <Select value={selectedDocId} onValueChange={setSelectedDocId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um documento..." />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rótulo Customizado (opcional)</Label>
              <Input
                value={linkData.label}
                onChange={(e) => setLinkData({ ...linkData, label: e.target.value })}
                placeholder="Nome alternativo para exibição..."
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <Label>Documento Obrigatório</Label>
                <p className="text-sm text-[var(--pagsmile-blue)]/70">
                  O merchant precisará enviar este documento
                </p>
              </div>
              <Switch
                checked={linkData.required}
                onCheckedChange={(checked) => setLinkData({ ...linkData, required: checked })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveExisting}
                disabled={isPending}
                className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90"
              >
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </TabsContent>

          {/* Create New Document Type */}
          <TabsContent value="create" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nome do Documento *</Label>
              <Input
                value={newDocData.name}
                onChange={(e) => setNewDocData({ ...newDocData, name: e.target.value })}
                placeholder="Ex: Balanço Patrimonial"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={newDocData.description}
                onChange={(e) => setNewDocData({ ...newDocData, description: e.target.value })}
                placeholder="Descreva o documento..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Formatos Aceitos</Label>
              <div className="flex flex-wrap gap-2">
                {formatOptions.map((format) => (
                  <label 
                    key={format}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                      newDocData.allowedFormats.includes(format) 
                        ? 'border-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/10' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Checkbox
                      checked={newDocData.allowedFormats.includes(format)}
                      onCheckedChange={() => toggleFormat(format)}
                    />
                    <span className="text-sm font-medium">{format}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tamanho Máximo (MB)</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={newDocData.maxSizeMB}
                  onChange={(e) => setNewDocData({ ...newDocData, maxSizeMB: parseInt(e.target.value) || 10 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Aplicável a</Label>
                <Select 
                  value={newDocData.merchantType} 
                  onValueChange={(value) => setNewDocData({ ...newDocData, merchantType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PF">Pessoa Física</SelectItem>
                    <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                    <SelectItem value="BOTH">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Instruções de Envio</Label>
              <Textarea
                value={newDocData.instructions}
                onChange={(e) => setNewDocData({ ...newDocData, instructions: e.target.value })}
                placeholder="Instruções para o merchant sobre como enviar..."
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <Label>Documento Obrigatório por Padrão</Label>
                <p className="text-sm text-[var(--pagsmile-blue)]/70">
                  Pode ser alterado em cada questionário
                </p>
              </div>
              <Switch
                checked={newDocData.isRequired}
                onCheckedChange={(checked) => setNewDocData({ ...newDocData, isRequired: checked })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveNew}
                disabled={isPending}
                className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90"
              >
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar e Adicionar
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}