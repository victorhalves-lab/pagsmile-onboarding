import * as React from 'react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Settings, FileText, AlertTriangle, Save, Shield,
  CheckCircle2, XCircle, Info, Plus, Trash2, Edit,
  Loader2, Users, Key, Globe, Mail, Bell
} from 'lucide-react';
import { toast } from 'sonner';

export default function Configuracoes() {
  const queryClient = useQueryClient();
  
  const [generalSettings, setGeneralSettings] = useState({
    emailNotifications: true,
    autoApproval: true,
    autoRejection: false,
    approvalThreshold: 75,
    manualThreshold: 40
  });

  const [documentSettings, setDocumentSettings] = useState({
    maxFileSizeMB: 10,
    allowedFormats: ['PDF', 'JPG', 'JPEG', 'PNG']
  });

  const { data: documentTypes = [], isLoading: loadingDocTypes } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: () => base44.entities.DocumentType.list()
  });

  const [showDocTypeDialog, setShowDocTypeDialog] = useState(false);
  const [editingDocType, setEditingDocType] = useState(null);
  const [docTypeForm, setDocTypeForm] = useState({
    name: '',
    description: '',
    allowedFormats: ['PDF', 'JPG', 'JPEG', 'PNG'],
    maxSizeMB: 10,
    merchantType: 'BOTH',
    isRequired: true,
    instructions: ''
  });

  const saveDocTypeMutation = useMutation({
    mutationFn: async (data) => {
      if (editingDocType) {
        return base44.entities.DocumentType.update(editingDocType.id, data);
      }
      return base44.entities.DocumentType.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTypes'] });
      toast.success(editingDocType ? 'Tipo de documento atualizado!' : 'Tipo de documento criado!');
      setShowDocTypeDialog(false);
      setEditingDocType(null);
      resetDocTypeForm();
    },
    onError: (error) => {
      toast.error('Erro: ' + error.message);
    }
  });

  const deleteDocTypeMutation = useMutation({
    mutationFn: (id) => base44.entities.DocumentType.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTypes'] });
      toast.success('Tipo de documento excluído!');
    }
  });

  const resetDocTypeForm = () => {
    setDocTypeForm({
      name: '',
      description: '',
      allowedFormats: ['PDF', 'JPG', 'JPEG', 'PNG'],
      maxSizeMB: 10,
      merchantType: 'BOTH',
      isRequired: true,
      instructions: ''
    });
  };

  const handleEditDocType = (docType) => {
    setEditingDocType(docType);
    setDocTypeForm({
      name: docType.name || '',
      description: docType.description || '',
      allowedFormats: docType.allowedFormats || ['PDF', 'JPG', 'JPEG', 'PNG'],
      maxSizeMB: docType.maxSizeMB || 10,
      merchantType: docType.merchantType || 'BOTH',
      isRequired: docType.isRequired !== false,
      instructions: docType.instructions || ''
    });
    setShowDocTypeDialog(true);
  };

  const handleSaveSettings = (section) => {
    toast.success(`Configurações de ${section} salvas!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--pagsmile-blue)]">Configurações</h1>
        <p className="text-[var(--pagsmile-blue)]/70 font-medium">Configure as regras e parâmetros do sistema de compliance</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 flex-wrap h-auto p-1">
          <TabsTrigger value="general" className="gap-2 font-semibold text-[var(--pagsmile-blue)]/70 data-[state=active]:text-[var(--pagsmile-blue)]">
            <Settings className="w-4 h-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2 font-semibold text-[var(--pagsmile-blue)]/70 data-[state=active]:text-[var(--pagsmile-blue)]">
            <FileText className="w-4 h-4" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="risk" className="gap-2 font-semibold text-[var(--pagsmile-blue)]/70 data-[state=active]:text-[var(--pagsmile-blue)]">
            <AlertTriangle className="w-4 h-4" />
            Regras de Risco
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2 font-semibold text-[var(--pagsmile-blue)]/70 data-[state=active]:text-[var(--pagsmile-blue)]">
            <Globe className="w-4 h-4" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 font-semibold text-[var(--pagsmile-blue)]/70 data-[state=active]:text-[var(--pagsmile-blue)]">
            <Bell className="w-4 h-4" />
            Notificações
          </TabsTrigger>
        </TabsList>

        {/* Tab: Geral */}
        <TabsContent value="general">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <h2 className="text-lg font-bold text-[var(--pagsmile-blue)]">Configurações Gerais</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                <div>
                  <Label className="font-semibold">Notificações por E-mail</Label>
                  <p className="text-sm text-[var(--pagsmile-blue)]/70 font-medium">Enviar e-mails automáticos sobre status do onboarding</p>
                </div>
                <Switch 
                  checked={generalSettings.emailNotifications}
                  onCheckedChange={(checked) => setGeneralSettings(prev => ({...prev, emailNotifications: checked}))}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                <div>
                  <Label className="font-semibold">Aprovação Automática</Label>
                  <p className="text-sm text-[var(--pagsmile-blue)]/70 font-medium">Aprovar automaticamente casos com score ≥ {generalSettings.approvalThreshold}</p>
                </div>
                <Switch 
                  checked={generalSettings.autoApproval}
                  onCheckedChange={(checked) => setGeneralSettings(prev => ({...prev, autoApproval: checked}))}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                <div>
                  <Label className="font-semibold">Rejeição Automática</Label>
                  <p className="text-sm text-[var(--pagsmile-blue)]/70 font-medium">Rejeitar automaticamente casos com score &lt; {generalSettings.manualThreshold}</p>
                </div>
                <Switch 
                  checked={generalSettings.autoRejection}
                  onCheckedChange={(checked) => setGeneralSettings(prev => ({...prev, autoRejection: checked}))}
                />
              </div>
            </div>

            <Button 
              onClick={() => handleSaveSettings('geral')}
              className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </TabsContent>

        {/* Tab: Documentos */}
        <TabsContent value="documents">
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
              <h2 className="text-lg font-bold text-[var(--pagsmile-blue)]">Configurações de Upload</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Tamanho Máximo de Arquivo (MB)</Label>
                  <Input 
                    type="number" 
                    value={documentSettings.maxFileSizeMB}
                    onChange={(e) => setDocumentSettings(prev => ({...prev, maxFileSizeMB: parseInt(e.target.value)}))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Formatos Aceitos</Label>
                  <div className="flex gap-2 flex-wrap">
                    {['PDF', 'JPG', 'JPEG', 'PNG'].map(format => (
                      <Badge 
                        key={format} 
                        variant={documentSettings.allowedFormats.includes(format) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          setDocumentSettings(prev => ({
                            ...prev,
                            allowedFormats: prev.allowedFormats.includes(format)
                              ? prev.allowedFormats.filter(f => f !== format)
                              : [...prev.allowedFormats, format]
                          }));
                        }}
                      >
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => handleSaveSettings('documentos')}
                className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </Button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-[var(--pagsmile-blue)]">Tipos de Documento</h2>
                  <p className="text-sm text-[var(--pagsmile-blue)]/70 font-medium">Gerencie os tipos de documentos aceitos no onboarding</p>
                </div>
                <Button 
                  onClick={() => {
                    resetDocTypeForm();
                    setEditingDocType(null);
                    setShowDocTypeDialog(true);
                  }}
                  className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Tipo
                </Button>
              </div>

              {loadingDocTypes ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--pagsmile-green)]" />
                </div>
              ) : documentTypes.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-[var(--pagsmile-blue)]/40 mb-4" />
                  <p className="text-[var(--pagsmile-blue)]/70 font-medium">Nenhum tipo de documento cadastrado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold text-[var(--pagsmile-blue)]">Nome</TableHead>
                      <TableHead className="font-semibold text-[var(--pagsmile-blue)]">Tipo Merchant</TableHead>
                      <TableHead className="font-semibold text-[var(--pagsmile-blue)]">Formatos</TableHead>
                      <TableHead className="font-semibold text-[var(--pagsmile-blue)]">Obrigatório</TableHead>
                      <TableHead className="text-right font-semibold text-[var(--pagsmile-blue)]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documentTypes.map((docType) => (
                      <TableRow key={docType.id}>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-[var(--pagsmile-blue)]">{docType.name}</p>
                            {docType.description && (
                              <p className="text-sm text-[var(--pagsmile-blue)]/70 font-medium truncate max-w-xs">{docType.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium text-[var(--pagsmile-blue)]/80">
                            {docType.merchantType === 'BOTH' ? 'PF & PJ' : docType.merchantType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {docType.allowedFormats?.map(f => (
                              <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {docType.isRequired ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-[var(--pagsmile-blue)]/40" />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditDocType(docType)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => deleteDocTypeMutation.mutate(docType.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab: Regras de Risco */}
        <TabsContent value="risk">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <h2 className="text-lg font-bold text-[var(--pagsmile-blue)]">Regras de Risco e Scoring</h2>
            
            <div className="space-y-6">
              <div className="p-4 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label className="font-semibold">Threshold de Aprovação</Label>
                    <p className="text-sm text-[var(--pagsmile-blue)]/70 font-medium">Score mínimo para aprovação automática</p>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{generalSettings.approvalThreshold}</span>
                </div>
                <Slider 
                  value={[generalSettings.approvalThreshold]} 
                  onValueChange={(value) => setGeneralSettings(prev => ({...prev, approvalThreshold: value[0]}))}
                  max={100} 
                  step={1} 
                  className="w-full" 
                />
                <div className="flex justify-between text-xs text-[var(--pagsmile-blue)]/60 font-medium mt-2">
                  <span>0</span>
                  <span>100</span>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label className="font-semibold">Threshold de Revisão Manual</Label>
                    <p className="text-sm text-[var(--pagsmile-blue)]/70 font-medium">Score mínimo para enviar à revisão manual</p>
                  </div>
                  <span className="text-2xl font-bold text-orange-600">{generalSettings.manualThreshold}</span>
                </div>
                <Slider 
                  value={[generalSettings.manualThreshold]} 
                  onValueChange={(value) => setGeneralSettings(prev => ({...prev, manualThreshold: value[0]}))}
                  max={100} 
                  step={1} 
                  className="w-full" 
                />
                <div className="flex justify-between text-xs text-[var(--pagsmile-blue)]/60 font-medium mt-2">
                  <span>0</span>
                  <span>100</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <Label className="font-semibold mb-4 block">Faixas de Decisão</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div className="flex-1 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-[var(--pagsmile-blue)]/80 font-medium w-40">≥ {generalSettings.approvalThreshold}: Aprovado</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <div className="flex-1 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-[var(--pagsmile-blue)]/80 font-medium w-40">{generalSettings.manualThreshold}-{generalSettings.approvalThreshold - 1}: Manual</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <div className="flex-1 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-[var(--pagsmile-blue)]/80 font-medium w-40">&lt; {generalSettings.manualThreshold}: Recusado</span>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => handleSaveSettings('risco')}
              className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </TabsContent>

        {/* Tab: Integrações */}
        <TabsContent value="integrations">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <h2 className="text-lg font-bold text-[var(--pagsmile-blue)]">Integrações Externas</h2>
            
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-[var(--pagsmile-blue)]/80 font-medium">
                Configure as chaves de API para as integrações de validação externa.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <Label className="font-semibold">Big Data Corp</Label>
                      <p className="text-sm text-[var(--pagsmile-blue)]/70 font-medium">Validação de CNPJ/CPF e dados empresariais</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-300 font-medium">Pendente</Badge>
                </div>
                <div className="flex gap-2">
                  <Input type="password" placeholder="API Key" className="flex-1" />
                  <Button variant="outline">
                    <Key className="w-4 h-4 mr-2" />
                    Configurar
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <Label className="font-semibold">CAF (Combate à Fraude)</Label>
                      <p className="text-sm text-[var(--pagsmile-blue)]/70 font-medium">KYC, Liveness e Facematch</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-300 font-medium">Pendente</Badge>
                </div>
                <div className="flex gap-2">
                  <Input type="password" placeholder="API Key" className="flex-1" />
                  <Input type="text" placeholder="Policy ID" className="w-40" />
                  <Button variant="outline">
                    <Key className="w-4 h-4 mr-2" />
                    Configurar
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-teal-100">
                      <FileText className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <Label className="font-semibold">Doc</Label>
                      <p className="text-sm text-[var(--pagsmile-blue)]/70 font-medium">OCR e validação de documentos</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-300 font-medium">Pendente</Badge>
                </div>
                <div className="flex gap-2">
                  <Input type="password" placeholder="API Key" className="flex-1" />
                  <Button variant="outline">
                    <Key className="w-4 h-4 mr-2" />
                    Configurar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Notificações */}
        <TabsContent value="notifications">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <h2 className="text-lg font-bold text-[var(--pagsmile-blue)]">Configurações de Notificações</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[var(--pagsmile-blue)]/50" />
                  <div>
                    <Label className="font-semibold">Novo Caso Recebido</Label>
                    <p className="text-sm text-[var(--pagsmile-blue)]/70 font-medium">Notificar quando um novo caso de onboarding for criado</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[var(--pagsmile-blue)]/50" />
                  <div>
                    <Label className="font-semibold">Caso Requer Revisão Manual</Label>
                    <p className="text-sm text-[var(--pagsmile-blue)]/70 font-medium">Notificar quando um caso for encaminhado para revisão manual</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[var(--pagsmile-blue)]/50" />
                  <div>
                    <Label className="font-semibold">Caso Aprovado/Recusado</Label>
                    <p className="text-sm text-[var(--pagsmile-blue)]/70 font-medium">Notificar merchant sobre a decisão final</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[var(--pagsmile-blue)]/50" />
                  <div>
                    <Label className="font-semibold">Erro em Validação Externa</Label>
                    <p className="text-sm text-[var(--pagsmile-blue)]/70 font-medium">Notificar quando uma integração falhar</p>
                  </div>
                </div>
                <Switch />
              </div>
            </div>

            <Button 
              onClick={() => handleSaveSettings('notificações')}
              className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de Tipo de Documento */}
      <Dialog open={showDocTypeDialog} onOpenChange={setShowDocTypeDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingDocType ? 'Editar Tipo de Documento' : 'Novo Tipo de Documento'}
            </DialogTitle>
            <DialogDescription className="text-[var(--pagsmile-blue)]/70 font-medium">
              Configure os detalhes do tipo de documento aceito no onboarding.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome <span className="text-red-600">*</span></Label>
              <Input 
                value={docTypeForm.name}
                onChange={(e) => setDocTypeForm(prev => ({...prev, name: e.target.value}))}
                placeholder="Ex: RG Frente"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea 
                value={docTypeForm.description}
                onChange={(e) => setDocTypeForm(prev => ({...prev, description: e.target.value}))}
                placeholder="Descrição do documento..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Merchant</Label>
                <Select 
                  value={docTypeForm.merchantType}
                  onValueChange={(value) => setDocTypeForm(prev => ({...prev, merchantType: value}))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BOTH">PF & PJ</SelectItem>
                    <SelectItem value="PF">Pessoa Física</SelectItem>
                    <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tamanho Máximo (MB)</Label>
                <Input 
                  type="number"
                  value={docTypeForm.maxSizeMB}
                  onChange={(e) => setDocTypeForm(prev => ({...prev, maxSizeMB: parseInt(e.target.value)}))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Formatos Aceitos</Label>
              <div className="flex gap-2 flex-wrap">
                {['PDF', 'JPG', 'JPEG', 'PNG'].map(format => (
                  <Badge 
                    key={format} 
                    variant={docTypeForm.allowedFormats.includes(format) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      setDocTypeForm(prev => ({
                        ...prev,
                        allowedFormats: prev.allowedFormats.includes(format)
                          ? prev.allowedFormats.filter(f => f !== format)
                          : [...prev.allowedFormats, format]
                      }));
                    }}
                  >
                    {format}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Instruções para o Merchant</Label>
              <Textarea 
                value={docTypeForm.instructions}
                onChange={(e) => setDocTypeForm(prev => ({...prev, instructions: e.target.value}))}
                placeholder="Instruções de como enviar o documento..."
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch 
                checked={docTypeForm.isRequired}
                onCheckedChange={(checked) => setDocTypeForm(prev => ({...prev, isRequired: checked}))}
              />
              <Label>Documento obrigatório</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDocTypeDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => saveDocTypeMutation.mutate(docTypeForm)}
              disabled={saveDocTypeMutation.isPending || !docTypeForm.name}
              className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90"
            >
              {saveDocTypeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingDocType ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}