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
  Loader2, Users, Key, Globe, Mail, Bell
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n/LanguageContext';

function ComplianceConfigRow({ config, onUpdate }) {
  const [value, setValue] = React.useState(config.configValue);
  const [editing, setEditing] = React.useState(false);
  const changed = value !== config.configValue;

  return (
    <div className="p-4 rounded-xl border border-[#0A0A0A]/5 hover:border-[#1356E2]/30 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-semibold text-[#0A0A0A]">{config.configKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
            <Badge variant="outline" className="text-[10px] border-[#0A0A0A]/10">{config.category}</Badge>
          </div>
          <p className="text-xs text-[#0A0A0A]/40 mt-0.5">{config.description}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {config.configType === 'boolean' ? (
            <Switch
              checked={value === 'true'}
              onCheckedChange={(checked) => { setValue(String(checked)); onUpdate(String(checked)); }}
              className="data-[state=checked]:bg-[#1356E2]"
            />
          ) : (
            <>
              <Input
                type={config.configType === 'number' ? 'number' : 'text'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-24 border-[#0A0A0A]/10 text-right font-bold"
              />
              {changed && (
                <Button size="sm" onClick={() => onUpdate(value)} className="bg-[#1356E2] text-white rounded-lg h-8 px-3">
                  <Save className="w-3 h-3" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Configuracoes() {
  const { t } = useTranslation();
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

  const { data: complianceConfigs = [], isLoading: loadingConfigs } = useQuery({
    queryKey: ['complianceConfigs'],
    queryFn: () => base44.entities.ComplianceConfig.list('-created_date', 50)
  });

  const updateConfigMutation = useMutation({
    mutationFn: async ({ id, value }) => base44.entities.ComplianceConfig.update(id, { configValue: value }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['complianceConfigs'] }); toast.success('Configuração atualizada!'); },
    onError: (err) => toast.error('Erro: ' + err.message),
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
      toast.success(editingDocType ? t('cfg.doc_type_updated') : t('cfg.doc_type_created'));
      setShowDocTypeDialog(false); setEditingDocType(null); resetDocTypeForm();
    },
    onError: (error) => toast.error('Erro: ' + error.message)
  });

  const deleteDocTypeMutation = useMutation({
    mutationFn: (id) => base44.entities.DocumentType.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['documentTypes'] }); toast.success(t('cfg.doc_type_deleted')); }
  });

  const resetDocTypeForm = () => setDocTypeForm({ name: '', description: '', allowedFormats: ['PDF', 'JPG', 'JPEG', 'PNG'], maxSizeMB: 10, merchantType: 'BOTH', isRequired: true, instructions: '' });

  const handleEditDocType = (docType) => {
    setEditingDocType(docType);
    setDocTypeForm({ name: docType.name || '', description: docType.description || '', allowedFormats: docType.allowedFormats || ['PDF', 'JPG', 'JPEG', 'PNG'], maxSizeMB: docType.maxSizeMB || 10, merchantType: docType.merchantType || 'BOTH', isRequired: docType.isRequired !== false, instructions: docType.instructions || '' });
    setShowDocTypeDialog(true);
  };

  const handleSaveSettings = (section) => toast.success(t('cfg.settings_saved', { section }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#0A0A0A]/5 flex items-center justify-center">
          <Settings className="w-5 h-5 text-[#0A0A0A]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#0A0A0A]">{t('cfg.title')}</h1>
          <p className="text-sm text-[#0A0A0A]/60">{t('cfg.subtitle')}</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-[#f4f4f4] border border-[#0A0A0A]/5 flex-wrap h-auto p-1">
          {[
            { v: 'general', icon: Settings, label: t('cfg.tab_general') },
            { v: 'documents', icon: FileText, label: t('cfg.tab_documents') },
            { v: 'risk', icon: AlertTriangle, label: t('cfg.tab_risk') },
            { v: 'integrations', icon: Globe, label: t('cfg.tab_integrations') },
            { v: 'notifications', icon: Bell, label: t('cfg.tab_notifications') },
          ].map(tab => (
            <TabsTrigger key={tab.v} value={tab.v} className="gap-1.5 data-[state=active]:bg-white data-[state=active]:text-[#0A0A0A] data-[state=active]:shadow-sm text-[#0A0A0A]/50">
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* General */}
        <TabsContent value="general">
          <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 p-6 space-y-5">
            <h2 className="text-base font-bold text-[#0A0A0A]">{t('cfg.general_title')}</h2>
            {[
              { label: t('cfg.email_notifications'), desc: t('cfg.email_notifications_desc'), key: 'emailNotifications' },
              { label: t('cfg.auto_approval'), desc: t('cfg.auto_approval_desc', { threshold: generalSettings.approvalThreshold }), key: 'autoApproval' },
              { label: t('cfg.auto_rejection'), desc: t('cfg.auto_rejection_desc', { threshold: generalSettings.manualThreshold }), key: 'autoRejection' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-[#0A0A0A]/5">
                <div>
                  <Label className="text-sm font-semibold text-[#0A0A0A]">{item.label}</Label>
                  <p className="text-xs text-[#0A0A0A]/40">{item.desc}</p>
                </div>
                <Switch checked={generalSettings[item.key]} onCheckedChange={(checked) => setGeneralSettings(prev => ({...prev, [item.key]: checked}))} className="data-[state=checked]:bg-[#1356E2]" />
              </div>
            ))}
            <Button onClick={() => handleSaveSettings('geral')} className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white rounded-xl">
              <Save className="w-4 h-4 mr-2" /> {t('cfg.save')}
            </Button>
          </div>
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 p-6 space-y-5">
              <h2 className="text-base font-bold text-[#0A0A0A]">{t('cfg.upload_title')}</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#0A0A0A]/50">{t('cfg.max_size')}</Label>
                  <Input type="number" value={documentSettings.maxFileSizeMB} onChange={(e) => setDocumentSettings(prev => ({...prev, maxFileSizeMB: parseInt(e.target.value)}))} className="border-[#0A0A0A]/10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#0A0A0A]/50">{t('cfg.accepted_formats')}</Label>
                  <div className="flex gap-2 flex-wrap">
                    {['PDF', 'JPG', 'JPEG', 'PNG'].map(format => (
                      <Badge key={format} className={`cursor-pointer border-0 ${documentSettings.allowedFormats.includes(format) ? 'bg-[#1356E2]/10 text-[#1356E2]' : 'bg-[#f4f4f4] text-[#0A0A0A]/40'}`}
                        onClick={() => setDocumentSettings(prev => ({ ...prev, allowedFormats: prev.allowedFormats.includes(format) ? prev.allowedFormats.filter(f => f !== format) : [...prev.allowedFormats, format] }))}
                      >{format}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Button onClick={() => handleSaveSettings('documentos')} className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white rounded-xl"><Save className="w-4 h-4 mr-2" /> {t('cfg.save')}</Button>
            </div>

            <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 p-6 space-y-5">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-[#0A0A0A]">{t('cfg.doc_types_title')}</h2>
                  <p className="text-xs text-[#0A0A0A]/40">{t('cfg.doc_types_desc')}</p>
                </div>
                <Button onClick={() => { resetDocTypeForm(); setEditingDocType(null); setShowDocTypeDialog(true); }} className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white rounded-xl">
                  <Plus className="w-4 h-4 mr-2" /> {t('cfg.new_type')}
                </Button>
              </div>

              {loadingDocTypes ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#1356E2]" /></div>
              ) : documentTypes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-[#f4f4f4] flex items-center justify-center mx-auto mb-4"><FileText className="w-7 h-7 text-[#0A0A0A]/20" /></div>
                  <p className="text-sm text-[#0A0A0A]/50">{t('cfg.no_doc_types')}</p>
                </div>
              ) : (
                <div className="rounded-xl border border-[#0A0A0A]/5 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#f4f4f4]">
                        {[t('cfg.col_name'), t('cfg.col_merchant_type'), t('cfg.col_formats'), t('cfg.col_required'), ''].map((h, i) => (
                          <TableHead key={i} className={`text-[10px] font-bold text-[#0A0A0A]/40 uppercase ${i === 4 ? 'text-right' : ''}`}>{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documentTypes.map((docType) => (
                        <TableRow key={docType.id}>
                          <TableCell>
                            <p className="font-semibold text-sm text-[#0A0A0A]">{docType.name}</p>
                            {docType.description && <p className="text-xs text-[#0A0A0A]/40 truncate max-w-xs">{docType.description}</p>}
                          </TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px] border-[#0A0A0A]/10 text-[#0A0A0A]/50">{docType.merchantType === 'BOTH' ? 'PF & PJ' : docType.merchantType}</Badge></TableCell>
                          <TableCell><div className="flex gap-1 flex-wrap">{docType.allowedFormats?.map(f => <Badge key={f} className="text-[10px] bg-[#f4f4f4] text-[#0A0A0A]/50 border-0">{f}</Badge>)}</div></TableCell>
                          <TableCell>{docType.isRequired ? <CheckCircle2 className="w-4 h-4 text-[#1356E2]" /> : <XCircle className="w-4 h-4 text-[#0A0A0A]/20" />}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditDocType(docType)}><Edit className="w-4 h-4 text-[#0A0A0A]/40" /></Button>
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
          <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 p-6 space-y-5">
            <h2 className="text-base font-bold text-[#0A0A0A]">{t('cfg.risk_title')}</h2>
            {[
              { label: t('cfg.approval_threshold'), desc: t('cfg.approval_threshold_desc'), key: 'approvalThreshold', color: '#1356E2', max: 100 },
              { label: t('cfg.manual_threshold'), desc: t('cfg.manual_threshold_desc'), key: 'manualThreshold', color: '#E84B1C', max: 100 },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl border border-[#0A0A0A]/5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Label className="text-sm font-semibold text-[#0A0A0A]">{item.label}</Label>
                    <p className="text-xs text-[#0A0A0A]/40">{item.desc}</p>
                  </div>
                  <span className="text-2xl font-bold" style={{ color: item.color }}>{generalSettings[item.key]}</span>
                </div>
                <Slider value={[generalSettings[item.key]]} onValueChange={(value) => setGeneralSettings(prev => ({...prev, [item.key]: value[0]}))} max={item.max} step={1} />
                <div className="flex justify-between text-[10px] text-[#0A0A0A]/30 mt-1"><span>0</span><span>{item.max}</span></div>
              </div>
            ))}

            <div className="p-4 rounded-xl bg-[#f4f4f4] border border-[#0A0A0A]/5">
              <Label className="text-xs font-bold text-[#0A0A0A]/40 uppercase tracking-wider mb-3 block">{t('cfg.decision_bands')}</Label>
              <div className="space-y-2">
                {[
                  { icon: CheckCircle2, color: '#1356E2', bg: 'bg-[#1356E2]', label: `≥ ${generalSettings.approvalThreshold}: Aprovado` },
                  { icon: AlertTriangle, color: '#E84B1C', bg: 'bg-[#E84B1C]', label: `${generalSettings.manualThreshold}–${generalSettings.approvalThreshold - 1}: Manual` },
                  { icon: XCircle, color: '#0A0A0A', bg: 'bg-red-400', label: `< ${generalSettings.manualThreshold}: Recusado` },
                ].map((band, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <band.icon className="w-4 h-4" style={{ color: band.color }} />
                    <div className={`flex-1 h-2.5 ${band.bg} rounded-full`}></div>
                    <span className="text-xs text-[#0A0A0A]/60 w-40">{band.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={() => handleSaveSettings('risco')} className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white rounded-xl"><Save className="w-4 h-4 mr-2" /> {t('cfg.save')}</Button>
          </div>

          {/* Compliance Configs */}
          <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 p-6 space-y-5 mt-6">
            <div>
              <h2 className="text-base font-bold text-[#0A0A0A] flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#1356E2]" />
                Parâmetros Regulatórios & Compliance
              </h2>
              <p className="text-xs text-[#0A0A0A]/40">Configurações ajustáveis do motor de risco e validações de identidade</p>
            </div>
            {loadingConfigs ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#1356E2]" /></div>
            ) : complianceConfigs.length === 0 ? (
              <p className="text-sm text-[#0A0A0A]/40 text-center py-8">Nenhuma configuração de compliance cadastrada</p>
            ) : (
              <div className="space-y-3">
                {complianceConfigs.map(cfg => (
                  <ComplianceConfigRow key={cfg.id} config={cfg} onUpdate={(value) => updateConfigMutation.mutate({ id: cfg.id, value })} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations">
          <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 p-6 space-y-5">
            <h2 className="text-base font-bold text-[#0A0A0A]">{t('cfg.integrations_title')}</h2>
            <div className="bg-[#E84B1C]/5 border border-[#E84B1C]/10 rounded-xl p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-[#E84B1C] mt-0.5 shrink-0" />
              <p className="text-xs text-[#0A0A0A]/60">{t('cfg.integrations_hint')}</p>
            </div>
            {[
              { icon: Shield, color: '#0A0A0A', label: 'Big Data Corp', desc: 'Validação de CNPJ/CPF e dados empresariais', fields: [{ type: 'password', placeholder: 'API Key' }] },
              { icon: Users, color: '#1356E2', label: 'CAF (Combate à Fraude)', desc: 'KYC, Liveness e Facematch', fields: [{ type: 'password', placeholder: 'API Key' }, { type: 'text', placeholder: 'Policy ID', w: 'w-40' }] },
              { icon: FileText, color: '#E84B1C', label: 'Doc', desc: 'OCR e validação de documentos', fields: [{ type: 'password', placeholder: 'API Key' }] },
            ].map((provider, i) => (
              <div key={i} className="p-4 rounded-xl border border-[#0A0A0A]/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${provider.color}10` }}>
                      <provider.icon className="w-4 h-4" style={{ color: provider.color }} />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-[#0A0A0A]">{provider.label}</Label>
                      <p className="text-xs text-[#0A0A0A]/40">{provider.desc}</p>
                    </div>
                  </div>
                  <Badge className="bg-[#0A0A0A]/5 text-[#0A0A0A]/40 text-[10px] border-0">{t('cfg.pending')}</Badge>
                </div>
                <div className="flex gap-2">
                  {provider.fields.map((f, j) => <Input key={j} type={f.type} placeholder={f.placeholder} className={`border-[#0A0A0A]/10 ${f.w || 'flex-1'}`} />)}
                  <Button variant="outline" className="border-[#0A0A0A]/10 rounded-xl"><Key className="w-4 h-4 mr-2 text-[#0A0A0A]/40" /> {t('cfg.configure')}</Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 p-6 space-y-5">
            <h2 className="text-base font-bold text-[#0A0A0A]">{t('cfg.notifications_title')}</h2>
            {[
              { label: t('cfg.notif_new_case'), desc: t('cfg.notif_new_case_desc'), checked: true },
              { label: t('cfg.notif_manual_review'), desc: t('cfg.notif_manual_review_desc'), checked: true },
              { label: t('cfg.notif_decision'), desc: t('cfg.notif_decision_desc'), checked: true },
              { label: t('cfg.notif_error'), desc: t('cfg.notif_error_desc'), checked: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-[#0A0A0A]/5">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#0A0A0A]/30" />
                  <div>
                    <Label className="text-sm font-semibold text-[#0A0A0A]">{item.label}</Label>
                    <p className="text-xs text-[#0A0A0A]/40">{item.desc}</p>
                  </div>
                </div>
                <Switch defaultChecked={item.checked} className="data-[state=checked]:bg-[#1356E2]" />
              </div>
            ))}
            <Button onClick={() => handleSaveSettings('notificações')} className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white rounded-xl"><Save className="w-4 h-4 mr-2" /> {t('cfg.save')}</Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Doc Type Dialog */}
      <Dialog open={showDocTypeDialog} onOpenChange={setShowDocTypeDialog}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#0A0A0A]">{editingDocType ? t('cfg.dialog_title_edit') : t('cfg.dialog_title_new')}</DialogTitle>
            <DialogDescription className="text-[#0A0A0A]/50">{t('cfg.dialog_desc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label className="text-xs text-[#0A0A0A]/50">Nome <span className="text-red-400">*</span></Label><Input value={docTypeForm.name} onChange={(e) => setDocTypeForm(prev => ({...prev, name: e.target.value}))} placeholder="Ex: RG Frente" className="border-[#0A0A0A]/10" /></div>
            <div className="space-y-1.5"><Label className="text-xs text-[#0A0A0A]/50">Descrição</Label><Textarea value={docTypeForm.description} onChange={(e) => setDocTypeForm(prev => ({...prev, description: e.target.value}))} placeholder="Descrição..." rows={2} className="border-[#0A0A0A]/10" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#0A0A0A]/50">Tipo de Merchant</Label>
                <Select value={docTypeForm.merchantType} onValueChange={(value) => setDocTypeForm(prev => ({...prev, merchantType: value}))}>
                  <SelectTrigger className="border-[#0A0A0A]/10"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="BOTH">PF & PJ</SelectItem><SelectItem value="PF">Pessoa Física</SelectItem><SelectItem value="PJ">Pessoa Jurídica</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs text-[#0A0A0A]/50">Tamanho Máximo (MB)</Label><Input type="number" value={docTypeForm.maxSizeMB} onChange={(e) => setDocTypeForm(prev => ({...prev, maxSizeMB: parseInt(e.target.value)}))} className="border-[#0A0A0A]/10" /></div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#0A0A0A]/50">Formatos</Label>
              <div className="flex gap-2 flex-wrap">
                {['PDF', 'JPG', 'JPEG', 'PNG'].map(format => (
                  <Badge key={format} className={`cursor-pointer border-0 ${docTypeForm.allowedFormats.includes(format) ? 'bg-[#1356E2]/10 text-[#1356E2]' : 'bg-[#f4f4f4] text-[#0A0A0A]/40'}`}
                    onClick={() => setDocTypeForm(prev => ({ ...prev, allowedFormats: prev.allowedFormats.includes(format) ? prev.allowedFormats.filter(f => f !== format) : [...prev.allowedFormats, format] }))}>{format}</Badge>
                ))}
              </div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs text-[#0A0A0A]/50">Instruções</Label><Textarea value={docTypeForm.instructions} onChange={(e) => setDocTypeForm(prev => ({...prev, instructions: e.target.value}))} placeholder="Instruções para o merchant..." rows={2} className="border-[#0A0A0A]/10" /></div>
            <div className="flex items-center gap-2"><Switch checked={docTypeForm.isRequired} onCheckedChange={(checked) => setDocTypeForm(prev => ({...prev, isRequired: checked}))} className="data-[state=checked]:bg-[#1356E2]" /><Label className="text-sm text-[#0A0A0A]">Obrigatório</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDocTypeDialog(false)} className="rounded-xl border-[#0A0A0A]/10">{t('cfg.cancel')}</Button>
            <Button onClick={() => saveDocTypeMutation.mutate(docTypeForm)} disabled={saveDocTypeMutation.isPending || !docTypeForm.name} className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white rounded-xl">
              {saveDocTypeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingDocType ? t('cfg.update') : t('cfg.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}