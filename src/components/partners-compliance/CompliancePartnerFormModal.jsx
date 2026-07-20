import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Modelos disponíveis para o parceiro ver
const AVAILABLE_MODELS = [
  { value: 'pix_merchant', label: 'PIX Merchant' },
  { value: 'pix_intermediario', label: 'PIX Intermediário' },
  { value: 'pix_api_enterprise', label: 'PIX API Enterprise' },
  { value: 'CompliancePixMerchantV4', label: 'Compliance PIX Merchant V4' },
  { value: 'CompliancePixIntermediarioV4', label: 'Compliance PIX Intermediário V4' },
  { value: 'ComplianceEcommerceV4', label: 'Compliance E-commerce V4' },
  { value: 'ComplianceSaaSV4', label: 'Compliance SaaS V4' },
  { value: 'ComplianceEducacaoV4', label: 'Compliance Educação V4' },
  { value: 'ComplianceInfoprodutosV4', label: 'Compliance Infoprodutos V4' },
  { value: 'ComplianceGatewayV4', label: 'Compliance Gateway V4' },
  { value: 'ComplianceMarketplaceV4', label: 'Compliance Marketplace V4' },
  { value: 'ComplianceDropshippingV4', label: 'Compliance Dropshipping V4' },
  { value: 'ComplianceMPEV4', label: 'Compliance MPE V4' },
  { value: 'ComplianceLinkPagamentoV4', label: 'Compliance Link Pagamento V4' },
  { value: 'CompliancePlataformasVerticaisV4', label: 'Compliance Plataformas Verticais V4' }
];

export default function CompliancePartnerFormModal({ open, onClose, partner, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    legalName: '',
    cnpj: '',
    contactEmail: '',
    contactPhone: '',
    isActive: true,
    slaHours: 48,
    allowedOnboardingCaseModels: [],
    defaultVisibilityLevel: 'full',
    notificationChannels: { slack: { channelId: '', userIds: [] } },
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (partner) {
      setForm({
        name: partner.name || '',
        legalName: partner.legalName || '',
        cnpj: partner.cnpj || '',
        contactEmail: partner.contactEmail || '',
        contactPhone: partner.contactPhone || '',
        isActive: partner.isActive !== false,
        slaHours: partner.slaHours || 48,
        allowedOnboardingCaseModels: partner.allowedOnboardingCaseModels || [],
        defaultVisibilityLevel: partner.defaultVisibilityLevel || 'full',
        notificationChannels: partner.notificationChannels || { slack: { channelId: '', userIds: [] } },
        notes: partner.notes || ''
      });
    } else {
      setForm({
        name: '', legalName: '', cnpj: '', contactEmail: '', contactPhone: '',
        isActive: true, slaHours: 48, allowedOnboardingCaseModels: [],
        defaultVisibilityLevel: 'full',
        notificationChannels: { slack: { channelId: '', userIds: [] } }, notes: ''
      });
    }
  }, [partner, open]);

  const toggleModel = (model) => {
    setForm(f => ({
      ...f,
      allowedOnboardingCaseModels: f.allowedOnboardingCaseModels.includes(model)
        ? f.allowedOnboardingCaseModels.filter(m => m !== model)
        : [...f.allowedOnboardingCaseModels, model]
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Nome é obrigatório.');
      return;
    }
    setSaving(true);
    try {
      if (partner?.id) {
        await base44.entities.CompliancePartner.update(partner.id, form);
        toast.success('Parceiro atualizado.');
      } else {
        await base44.entities.CompliancePartner.create(form);
        toast.success('Parceiro criado.');
      }
      onSaved?.();
      onClose();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{partner ? 'Editar Parceiro' : 'Novo Parceiro de Compliance'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nome Fantasia *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Razão Social</Label>
              <Input value={form.legalName} onChange={e => setForm({ ...form, legalName: e.target.value })} />
            </div>
            <div>
              <Label>CNPJ</Label>
              <Input value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} />
            </div>
            <div>
              <Label>E-mail de Contato</Label>
              <Input type="email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} />
            </div>
            <div>
              <Label>SLA (horas)</Label>
              <Input type="number" value={form.slaHours} onChange={e => setForm({ ...form, slaHours: Number(e.target.value) })} />
            </div>
          </div>

          <div className="border-t pt-4">
            <Label className="mb-2 block font-semibold">Notificações via Slack</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Canal Slack (channel_id)</Label>
                <Input
                  placeholder="C0123ABC"
                  value={form.notificationChannels?.slack?.channelId || ''}
                  onChange={e => setForm({
                    ...form,
                    notificationChannels: {
                      ...form.notificationChannels,
                      slack: { ...form.notificationChannels?.slack, channelId: e.target.value }
                    }
                  })}
                />
              </div>
              <div>
                <Label className="text-xs">Nível de Visibilidade Padrão</Label>
                <Select value={form.defaultVisibilityLevel} onValueChange={v => setForm({ ...form, defaultVisibilityLevel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Completo</SelectItem>
                    <SelectItem value="redacted">Dados sensíveis mascarados</SelectItem>
                    <SelectItem value="summary_only">Apenas resumo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <Label className="mb-2 block font-semibold">
              Modelos de questionário permitidos <span className="text-xs text-slate-500 font-normal">(o parceiro só verá casos cujo modelo estiver selecionado)</span>
            </Label>
            <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto border rounded-lg p-3 bg-slate-50">
              {AVAILABLE_MODELS.map(m => (
                <label key={m.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={form.allowedOnboardingCaseModels.includes(m.value)}
                    onCheckedChange={() => toggleModel(m.value)}
                  />
                  <span>{m.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
            <Label>Parceiro ativo</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[#1356E2] hover:bg-[#1356E2]/90">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}