import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function nameToReferralCode(name) {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove caracteres especiais
    .replace(/\s+/g, '-') // espaços → hifens
    .replace(/-+/g, '-') // hifens duplicados
    .replace(/^-|-$/g, ''); // remove hifens no início/fim
}

export default function IntroducerFormModal({ open, onClose, introducer, onSave, isSaving }) {
  const [form, setForm] = useState({ name: '', referralCode: '', contactEmail: '', contactPhone: '', status: 'active', notes: '' });
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);

  useEffect(() => {
    if (introducer) {
      setForm({
        name: introducer.name || '',
        referralCode: introducer.referralCode || '',
        contactEmail: introducer.contactEmail || '',
        contactPhone: introducer.contactPhone || '',
        status: introducer.status || 'active',
        notes: introducer.notes || '',
      });
      setCodeManuallyEdited(true); // ao editar, não sobrescrever o código existente
    } else {
      setForm({ name: '', referralCode: '', contactEmail: '', contactPhone: '', status: 'active', notes: '' });
      setCodeManuallyEdited(false);
    }
  }, [introducer, open]);

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return; }
    if (!form.referralCode.trim()) { toast.error('Código de referência é obrigatório'); return; }
    // Sanitize referralCode: lowercase, no spaces, no special chars
    const sanitized = form.referralCode.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (sanitized !== form.referralCode) {
      toast.error('Código de referência deve conter apenas letras minúsculas, números, - e _');
      return;
    }
    onSave({ ...form, referralCode: sanitized });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#002443]">{introducer ? 'Editar Introducer' : 'Novo Introducer'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#002443]/50">Nome *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Nome do parceiro" className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#002443]/50">Código UTM *</Label>
              <Input value={form.referralCode} onChange={e => setForm(p => ({ ...p, referralCode: e.target.value.toLowerCase().replace(/\s/g, '') }))} placeholder="ex: agenciax" className="h-10 rounded-xl font-mono" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#002443]/50">E-mail</Label>
              <Input type="email" value={form.contactEmail} onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))} placeholder="email@parceiro.com" className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#002443]/50">Telefone</Label>
              <Input value={form.contactPhone} onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))} placeholder="(11) 99999-9999" className="h-10 rounded-xl" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#002443]/50">Status</Label>
            <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
              <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#002443]/50">Observações</Label>
            <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notas internas sobre o parceiro..." className="min-h-[80px] rounded-xl resize-none" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {introducer ? 'Salvar' : 'Criar Introducer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}