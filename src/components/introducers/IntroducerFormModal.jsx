import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, User, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import IntroducerCompanyFields from './IntroducerCompanyFields';
import StandardRatesEditor from './StandardRatesEditor';

function nameToReferralCode(name) {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const EMPTY_FORM = {
  name: '', referralCode: '', contactEmail: '', contactPhone: '',
  status: 'active', notes: '', commissionRate: '', type: 'individual',
  cpf: '',
  cnpj: '', companyName: '', companyLogoUrl: '', contactEmailCompany: '',
  contactPhoneCompany: '', uniqueLandingPageSlug: '', landingPageActive: true,
  standardRates: [],
};

export default function IntroducerFormModal({ open, onClose, introducer, onSave, isSaving }) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);

  useEffect(() => {
    if (introducer) {
      setForm({
        name: introducer.name || '',
        referralCode: introducer.referralCode || '',
        contactEmail: introducer.contactEmail || '',
        contactPhone: introducer.contactPhone || '',
        cpf: introducer.cpf || '',
        status: introducer.status || 'active',
        notes: introducer.notes || '',
        commissionRate: introducer.commissionRate || '',
        type: introducer.type || 'individual',
        cnpj: introducer.cnpj || '',
        companyName: introducer.companyName || '',
        companyLogoUrl: introducer.companyLogoUrl || '',
        contactEmailCompany: introducer.contactEmailCompany || '',
        contactPhoneCompany: introducer.contactPhoneCompany || '',
        uniqueLandingPageSlug: introducer.uniqueLandingPageSlug || '',
        landingPageActive: introducer.landingPageActive !== false,
        standardRates: introducer.standardRates || [],
      });
      setCodeManuallyEdited(true);
    } else {
      setForm({ ...EMPTY_FORM });
      setCodeManuallyEdited(false);
    }
  }, [introducer, open]);

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return; }
    if (!form.referralCode.trim()) { toast.error('Código de referência é obrigatório'); return; }
    const sanitized = form.referralCode.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (sanitized !== form.referralCode) {
      toast.error('Código de referência deve conter apenas letras minúsculas, números, - e _');
      return;
    }
    if (form.type === 'company') {
      if (!form.companyName?.trim()) { toast.error('Nome da empresa é obrigatório'); return; }
      if (!form.uniqueLandingPageSlug?.trim()) { toast.error('Slug da Landing Page é obrigatório'); return; }
    }
    onSave({ ...form, referralCode: sanitized });
  };

  const isCompany = form.type === 'company';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`${isCompany ? 'sm:max-w-3xl max-h-[90vh] overflow-y-auto' : 'sm:max-w-lg'}`}>
        <DialogHeader>
          <DialogTitle className="text-[#0A0A0A]">{introducer ? 'Editar Introducer' : 'Novo Introducer'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Type selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#0A0A0A]/50">Tipo de Introducer</Label>
            <RadioGroup
              value={form.type}
              onValueChange={v => setForm(p => ({ ...p, type: v }))}
              className="flex gap-4"
            >
              <label className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${form.type === 'individual' ? 'border-[#1356E2] bg-[#1356E2]/5' : 'border-[#0A0A0A]/10 hover:border-[#0A0A0A]/20'}`}>
                <RadioGroupItem value="individual" />
                <User className="w-4 h-4 text-[#0A0A0A]/60" />
                <span className="text-sm font-medium">Individual</span>
              </label>
              <label className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${form.type === 'company' ? 'border-[#1356E2] bg-[#1356E2]/5' : 'border-[#0A0A0A]/10 hover:border-[#0A0A0A]/20'}`}>
                <RadioGroupItem value="company" />
                <Building2 className="w-4 h-4 text-[#0A0A0A]/60" />
                <span className="text-sm font-medium">Empresa</span>
              </label>
            </RadioGroup>
          </div>

          {/* Common fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#0A0A0A]/50">Nome *</Label>
              <Input value={form.name} onChange={e => {
                const newName = e.target.value;
                const updates = { name: newName };
                if (!codeManuallyEdited) {
                  updates.referralCode = nameToReferralCode(newName);
                }
                setForm(p => ({ ...p, ...updates }));
              }} placeholder="Nome do parceiro" className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#0A0A0A]/50">{isCompany ? 'CNPJ' : 'CPF'}</Label>
              {isCompany ? (
                <Input value={form.cnpj} onChange={e => setForm(p => ({ ...p, cnpj: e.target.value }))} placeholder="00.000.000/0001-00" className="h-10 rounded-xl font-mono" />
              ) : (
                <Input value={form.cpf} onChange={e => setForm(p => ({ ...p, cpf: e.target.value }))} placeholder="000.000.000-00" className="h-10 rounded-xl font-mono" />
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#0A0A0A]/50">Código UTM *</Label>
              <Input value={form.referralCode} onChange={e => {
                setCodeManuallyEdited(true);
                setForm(p => ({ ...p, referralCode: e.target.value.toLowerCase().replace(/\s/g, '') }));
              }} placeholder="ex: agenciax" className="h-10 rounded-xl font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#0A0A0A]/50">E-mail</Label>
              <Input type="email" value={form.contactEmail} onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))} placeholder="email@parceiro.com" className="h-10 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#0A0A0A]/50">Telefone</Label>
              <Input value={form.contactPhone} onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))} placeholder="(11) 99999-9999" className="h-10 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#0A0A0A]/50">Comissão (%)</Label>
              <Input type="number" step="0.1" value={form.commissionRate} onChange={e => setForm(p => ({ ...p, commissionRate: e.target.value ? parseFloat(e.target.value) : '' }))} placeholder="Ex: 1.5" className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#0A0A0A]/50">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#0A0A0A]/50">Observações</Label>
            <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notas internas sobre o parceiro..." className="min-h-[80px] rounded-xl resize-none" />
          </div>

          {/* Company-specific fields */}
          {isCompany && (
            <>
              <IntroducerCompanyFields form={form} setForm={setForm} />
              <StandardRatesEditor
                rates={form.standardRates}
                onChange={(rates) => setForm(p => ({ ...p, standardRates: rates }))}
              />
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white rounded-xl">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {introducer ? 'Salvar' : 'Criar Introducer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}