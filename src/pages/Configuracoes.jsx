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
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { 
  Settings, FileText, AlertTriangle, Save, Shield,
  CheckCircle2, XCircle, Info, Plus, Trash2, Edit,
  Loader2, Users, Key, Globe, Mail, Bell, Handshake
} from 'lucide-react';
import PartnersTab from '@/components/partners/PartnersTab';
import { toast } from 'sonner';

export default function Configuracoes() {
  const queryClient = useQueryClient();
  
  const [generalSettings, setGeneralSettings] = useState({
    emailNotifications: true, autoApproval: true, autoRejection: false,
    approvalThreshold: 75, manualThreshold: 40
  });

  const [documentSettings, setDocumentSettings] = useState({
    maxFileSizeMB: 10, allowedFormats: ['PDF', 'JPG', 'JPEG', 'PNG']
  });

  const { data: documentTypes = [], isLoading: loadingDocTypes } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: () => base44.entities.DocumentType.list()
  });

  const [showDocTypeDialog, setShowDocTypeDialog] = useState(false);
  const [editingDocType, setEditingDocType] = useState(null);
  const [docTypeForm, setDocTypeForm] = useState({
    name: '', description: '', allowedFormats: ['PDF', 'JPG', 'JPEG', 'PNG'],
    maxSizeMB: 10, merchantType: 'BOTH', isRequired: true, instructions: ''
  });

  const saveDocTypeMutation = useMutation({
    mutationFn: async (data) => editingDocType ? base44.entities.DocumentType.update(editingDocType.id, data) : base44.entities.DocumentType.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTypes'] });
      toast.success(editingDocType ? 'Tipo de documento atualizado!' : 'Tipo de documento criado!');
      setShowDocTypeDialog(false); setEditingDocType(null); resetDocTypeForm();
    },
    onError: (error) => toast.error('Erro: ' + error.message)
  });

  const deleteDocTypeMutation = useMutation({
    mutationFn: (id) => base44.entities.DocumentType.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['documentTypes'] }); toast.success('Tipo de documento excluído!'); }
  });

  const resetDocTypeForm = () => setDocTypeForm({ name: '', description: '', allowedFormats: ['PDF', 'JPG', 'JPEG', 'PNG'], maxSizeMB: 10, merchantType: 'BOTH', isRequired: true, instructions: '' });

  const handleEditDocType = (docType) => {
    setEditingDocType(docType);
    setDocTypeForm({ name: docType.name || '', description: docType.description || '', allowedFormats: docType.allowedFormats || ['PDF', 'JPG', 'JPEG', 'PNG'], maxSizeMB: docType.maxSizeMB || 10, merchantType: docType.merchantType || 'BOTH', isRequired: docType.isRequired !== false, instructions: docType.instructions || '' });
    setShowDocTypeDialog(true);
  };

  const handleSaveSettings = (section) => toast.success(`Configurações de ${section} salvas!`);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#002443]/5 flex items-center justify-center">
          <Settings className="w-5 h-5 text-[#002443]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#002443]">Configurações</h1>
          <p className="text-sm text-[#002443]/60">Configure regras e parâmetros do sistema de compliance</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-[#f4f4f4] border border-[#002443]/5 flex-wrap h-auto p-1">
          {[
            { v: 'general', icon: Settings, label: 'Geral' },
            { v: 'documents', icon: FileText, label: 'Documentos' },
            { v: 'risk', icon: AlertTriangle, label: 'Regras de Risco' },
            { v: 'integrations', icon: Globe, label: 'Integrações' },
            { v: 'notifications', icon: Bell, label: 'Notificações' },
          ].map(tab => (
            <TabsTrigger key={tab.v} value={tab.v} className="gap-1.5 data-[state=active]:bg-white data-[state=active]:text-[#002443] data-[state=active]:shadow-sm text-[#002443]/50">
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* General */}
        <TabsContent value="general">
          <div className="bg-white rounded-2xl border border-[#002443]/5 p-6 space-y-5">
            <h2 className="text-base font-bold text-[#002443]">Configurações Gerais</h2>
            {[
              { label: 'Notificações por E-mail', desc: 'Enviar e-mails automáticos sobre status do onboarding', key: 'emailNotifications' },
              { label: 'Aprovação Automática', desc: `Aprovar automaticamente casos com score ≥ ${generalSettings.approvalThreshold}`, key: 'autoApproval' },
              { label: 'Rejeição Automática', desc: `Rejeitar automaticamente casos com score < ${generalSettings.manualThreshold}`, key: 'autoRejection' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-[#002443]/5">
                <div>
                  <Label className="text-sm font-semibold text-[#002443]">{item.label}</Label>
                  <p className="text-xs text-[#002443]/40">{item.desc}</p>
                </div>
                <Switch checked={generalSettings[item.key]} onCheckedChange={(checked) => setGeneralSettings(prev => ({...prev, [item.key]: checked}))} className="data-[state=checked]:bg-[#2bc196]" />
              </div>
            ))}
            <Button onClick={() => handleSaveSettings('geral')} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl">
              <Save className="w-4 h-4 mr-2" /> Salvar
            </Button>
          </div>
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#002443]/5 p-6 space-y-5">
              <h2 className="text-base font-bold text-[#002443]">Configurações de Upload</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#002443]/50">Tamanho Máximo (MB)</Label>
                  <Input type="number" value={documentSettings.maxFileSizeMB} onChange={(e) => setDocumentSettings(prev => ({...prev, maxFileSizeMB: parseInt(e.target.value)}))} className="border-[#002443]/10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#002443]/50">Formatos Aceitos</Label>
                  <div className="flex gap-2 flex-wrap">
                    {['PDF', 'JPG', 'JPEG', 'PNG'].map(format => (
                      <Badge key={format} className={`cursor-pointer border-0 ${documentSettings.allowedFormats.includes(format) ? 'bg-[#2bc196]/10 text-[#2bc196]' : 'bg-[#f4f4f4] text-[#002443]/40'}`}
                        onClick={() => setDocumentSettings(prev => ({ ...prev, allowedFormats: prev.allowedFormats.includes(format) ? prev.allowedFormats.filter(f => f !== format) : [...prev.allowedFormats, format] }))}
                      >{format}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Button onClick={() => handleSaveSettings('documentos')} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl"><Save className="w-4 h-4 mr-2" /> Salvar</Button>
            </div>

            <div className="bg-white rounded-2xl border border-[#002443]/5 p-6 space-y-5">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-[#002443]">Tipos de Documento</h2>
                  <p className="text-xs text-[#002443]/40">Gerencie os tipos aceitos no onboarding</p>
                </div>
                <Button onClick={() => { resetDocTypeForm(); setEditingDocType(null); setShowDocTypeDialog(true); }} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl">
                  <Plus className="w-4 h-4 mr-2" /> Novo Tipo
                </Button>
              </div>

              {loadingDocTypes ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#2bc196]" /></div>
              ) : documentTypes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-[#f4f4f4] flex items-center justify-center mx-auto mb-4"><FileText className="w-7 h-7 text-[#002443]/20" /></div>
                  <p className="text-sm text-[#002443]/50">Nenhum tipo de documento cadastrado</p>
                </div>
              ) : (
                <div className="rounded-xl border border-[#002443]/5 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#f4f4f4]">
                        {['Nome', 'Tipo Merchant', 'Formatos', 'Obrigatório', ''].map((h, i) => (
                          <TableHead key={i} className={`text-[10px] font-bold text-[#002443]/40 uppercase ${i === 4 ? 'text-right' : ''}`}>{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documentTypes.map((docType) => (
                        <TableRow key={docType.id}>
                          <TableCell>
                            <p className="font-semibold text-sm text-[#002443]">{docType.name}</p>
                            {docType.description && <p className="text-xs text-[#002443]/40 truncate max-w-xs">{docType.description}</p>}
                          </TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px] border-[#002443]/10 text-[#002443]/50">{docType.merchantType === 'BOTH' ? 'PF & PJ' : docType.merchantType}</Badge></TableCell>
                          <TableCell><div className="flex gap-1 flex-wrap">{docType.allowedFormats?.map(f => <Badge key={f} className="text-[10px] bg-[#f4f4f4] text-[#002443]/50 border-0">{f}</Badge>)}</div></TableCell>
                          <TableCell>{docType.isRequired ? <CheckCircle2 className="w-4 h-4 text-[#2bc196]" /> : <XCircle className="w-4 h-4 text-[#002443]/20" />}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditDocType(docType)}><Edit className="w-4 h-4 text-[#002443]/40" /></Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400" onClick={() => deleteDocTypeMutation.mutate(docType.id)}><Trash2 className="w-4 h-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Risk */}
        <TabsContent value="risk">
          <div className="bg-white rounded-2xl border border-[#002443]/5 p-6 space-y-5">
            <h2 className="text-base font-bold text-[#002443]">Regras de Risco e Scoring</h2>
            {[
              { label: 'Threshold de Aprovação', desc: 'Score mínimo para aprovação automática', key: 'approvalThreshold', color: '#2bc196', max: 100 },
              { label: 'Threshold de Revisão Manual', desc: 'Score mínimo para revisão manual', key: 'manualThreshold', color: '#36706c', max: 100 },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl border border-[#002443]/5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Label className="text-sm font-semibold text-[#002443]">{item.label}</Label>
                    <p className="text-xs text-[#002443]/40">{item.desc}</p>
                  </div>
                  <span className="text-2xl font-bold" style={{ color: item.color }}>{generalSettings[item.key]}</span>
                </div>
                <Slider value={[generalSettings[item.key]]} onValueChange={(value) => setGeneralSettings(prev => ({...prev, [item.key]: value[0]}))} max={item.max} step={1} />
                <div className="flex justify-between text-[10px] text-[#002443]/30 mt-1"><span>0</span><span>{item.max}</span></div>
              </div>
            ))}

            <div className="p-4 rounded-xl bg-[#f4f4f4] border border-[#002443]/5">
              <Label className="text-xs font-bold text-[#002443]/40 uppercase tracking-wider mb-3 block">Faixas de Decisão</Label>
              <div className="space-y-2">
                {[
                  { icon: CheckCircle2, color: '#2bc196', bg: 'bg-[#2bc196]', label: `≥ ${generalSettings.approvalThreshold}: Aprovado` },
                  { icon: AlertTriangle, color: '#36706c', bg: 'bg-[#36706c]', label: `${generalSettings.manualThreshold}–${generalSettings.approvalThreshold - 1}: Manual` },
                  { icon: XCircle, color: '#002443', bg: 'bg-red-400', label: `< ${generalSettings.manualThreshold}: Recusado` },
                ].map((band, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <band.icon className="w-4 h-4" style={{ color: band.color }} />
                    <div className={`flex-1 h-2.5 ${band.bg} rounded-full`}></div>
                    <span className="text-xs text-[#002443]/60 w-40">{band.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={() => handleSaveSettings('risco')} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl"><Save className="w-4 h-4 mr-2" /> Salvar</Button>
          </div>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations">
          <div className="bg-white rounded-2xl border border-[#002443]/5 p-6 space-y-5">
            <h2 className="text-base font-bold text-[#002443]">Integrações Externas</h2>
            <div className="bg-[#36706c]/5 border border-[#36706c]/10 rounded-xl p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-[#36706c] mt-0.5 shrink-0" />
              <p className="text-xs text-[#002443]/60">Configure as chaves de API para validação externa.</p>
            </div>
            {[
              { icon: Shield, color: '#002443', label: 'Big Data Corp', desc: 'Validação de CNPJ/CPF e dados empresariais', fields: [{ type: 'password', placeholder: 'API Key' }] },
              { icon: Users, color: '#2bc196', label: 'CAF (Combate à Fraude)', desc: 'KYC, Liveness e Facematch', fields: [{ type: 'password', placeholder: 'API Key' }, { type: 'text', placeholder: 'Policy ID', w: 'w-40' }] },
              { icon: FileText, color: '#36706c', label: 'Doc', desc: 'OCR e validação de documentos', fields: [{ type: 'password', placeholder: 'API Key' }] },
            ].map((provider, i) => (
              <div key={i} className="p-4 rounded-xl border border-[#002443]/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${provider.color}10` }}>
                      <provider.icon className="w-4 h-4" style={{ color: provider.color }} />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-[#002443]">{provider.label}</Label>
                      <p className="text-xs text-[#002443]/40">{provider.desc}</p>
                    </div>
                  </div>
                  <Badge className="bg-[#002443]/5 text-[#002443]/40 text-[10px] border-0">Pendente</Badge>
                </div>
                <div className="flex gap-2">
                  {provider.fields.map((f, j) => <Input key={j} type={f.type} placeholder={f.placeholder} className={`border-[#002443]/10 ${f.w || 'flex-1'}`} />)}
                  <Button variant="outline" className="border-[#002443]/10 rounded-xl"><Key className="w-4 h-4 mr-2 text-[#002443]/40" /> Configurar</Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <div className="bg-white rounded-2xl border border-[#002443]/5 p-6 space-y-5">
            <h2 className="text-base font-bold text-[#002443]">Configurações de Notificações</h2>
            {[
              { label: 'Novo Caso Recebido', desc: 'Notificar quando um novo caso de onboarding for criado', checked: true },
              { label: 'Caso Requer Revisão Manual', desc: 'Notificar quando um caso for encaminhado para revisão manual', checked: true },
              { label: 'Caso Aprovado/Recusado', desc: 'Notificar merchant sobre a decisão final', checked: true },
              { label: 'Erro em Validação Externa', desc: 'Notificar quando uma integração falhar', checked: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-[#002443]/5">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#002443]/30" />
                  <div>
                    <Label className="text-sm font-semibold text-[#002443]">{item.label}</Label>
                    <p className="text-xs text-[#002443]/40">{item.desc}</p>
                  </div>
                </div>
                <Switch defaultChecked={item.checked} className="data-[state=checked]:bg-[#2bc196]" />
              </div>
            ))}
            <Button onClick={() => handleSaveSettings('notificações')} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl"><Save className="w-4 h-4 mr-2" /> Salvar</Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Doc Type Dialog */}
      <Dialog open={showDocTypeDialog} onOpenChange={setShowDocTypeDialog}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#002443]">{editingDocType ? 'Editar' : 'Novo'} Tipo de Documento</DialogTitle>
            <DialogDescription className="text-[#002443]/50">Configure os detalhes do tipo de documento.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label className="text-xs text-[#002443]/50">Nome <span className="text-red-400">*</span></Label><Input value={docTypeForm.name} onChange={(e) => setDocTypeForm(prev => ({...prev, name: e.target.value}))} placeholder="Ex: RG Frente" className="border-[#002443]/10" /></div>
            <div className="space-y-1.5"><Label className="text-xs text-[#002443]/50">Descrição</Label><Textarea value={docTypeForm.description} onChange={(e) => setDocTypeForm(prev => ({...prev, description: e.target.value}))} placeholder="Descrição..." rows={2} className="border-[#002443]/10" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#002443]/50">Tipo de Merchant</Label>
                <Select value={docTypeForm.merchantType} onValueChange={(value) => setDocTypeForm(prev => ({...prev, merchantType: value}))}>
                  <SelectTrigger className="border-[#002443]/10"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="BOTH">PF & PJ</SelectItem><SelectItem value="PF">Pessoa Física</SelectItem><SelectItem value="PJ">Pessoa Jurídica</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs text-[#002443]/50">Tamanho Máximo (MB)</Label><Input type="number" value={docTypeForm.maxSizeMB} onChange={(e) => setDocTypeForm(prev => ({...prev, maxSizeMB: parseInt(e.target.value)}))} className="border-[#002443]/10" /></div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#002443]/50">Formatos</Label>
              <div className="flex gap-2 flex-wrap">
                {['PDF', 'JPG', 'JPEG', 'PNG'].map(format => (
                  <Badge key={format} className={`cursor-pointer border-0 ${docTypeForm.allowedFormats.includes(format) ? 'bg-[#2bc196]/10 text-[#2bc196]' : 'bg-[#f4f4f4] text-[#002443]/40'}`}
                    onClick={() => setDocTypeForm(prev => ({ ...prev, allowedFormats: prev.allowedFormats.includes(format) ? prev.allowedFormats.filter(f => f !== format) : [...prev.allowedFormats, format] }))}>{format}</Badge>
                ))}
              </div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs text-[#002443]/50">Instruções</Label><Textarea value={docTypeForm.instructions} onChange={(e) => setDocTypeForm(prev => ({...prev, instructions: e.target.value}))} placeholder="Instruções para o merchant..." rows={2} className="border-[#002443]/10" /></div>
            <div className="flex items-center gap-2"><Switch checked={docTypeForm.isRequired} onCheckedChange={(checked) => setDocTypeForm(prev => ({...prev, isRequired: checked}))} className="data-[state=checked]:bg-[#2bc196]" /><Label className="text-sm text-[#002443]">Obrigatório</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDocTypeDialog(false)} className="rounded-xl border-[#002443]/10">Cancelar</Button>
            <Button onClick={() => saveDocTypeMutation.mutate(docTypeForm)} disabled={saveDocTypeMutation.isPending || !docTypeForm.name} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl">
              {saveDocTypeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingDocType ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}