import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Handshake } from 'lucide-react';

export default function AssignCaseToPartnerModal({ open, onClose, onboardingCaseId, onAssigned }) {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [partnerId, setPartnerId] = useState('');
  const [visibilityLevel, setVisibilityLevel] = useState('full');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const list = await base44.entities.CompliancePartner.filter({ isActive: true });
        setPartners(list || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  const selectedPartner = partners.find(p => p.id === partnerId);

  const handleSubmit = async () => {
    if (!partnerId) {
      toast.error('Selecione um parceiro.');
      return;
    }
    setSaving(true);
    try {
      const res = await base44.functions.invoke('adminAssignCaseToPartner', {
        onboardingCaseId,
        partnerId,
        visibilityLevel,
        reason
      });
      if (res.data?.success) {
        toast.success('Caso atribuído ao parceiro.');
        onAssigned?.();
        onClose();
        setPartnerId('');
        setReason('');
      } else {
        toast.error(res.data?.error || 'Falha ao atribuir.');
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Handshake className="w-5 h-5 text-[#2bc196]" />
            Atribuir caso a parceiro
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>Parceiro *</Label>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
              </div>
            ) : partners.length === 0 ? (
              <p className="text-sm text-slate-500 py-2">Nenhum parceiro ativo cadastrado.</p>
            ) : (
              <Select value={partnerId} onValueChange={(v) => {
                setPartnerId(v);
                const p = partners.find(x => x.id === v);
                if (p?.defaultVisibilityLevel) setVisibilityLevel(p.defaultVisibilityLevel);
              }}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {partners.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}{p.allowedOnboardingCaseModels?.length ? ` (${p.allowedOnboardingCaseModels.length} modelos)` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedPartner && (
              <div className="text-xs text-slate-500 mt-1">
                SLA: {selectedPartner.slaHours || 48}h ·
                Modelos permitidos: {selectedPartner.allowedOnboardingCaseModels?.join(', ') || 'Nenhum'}
              </div>
            )}
          </div>

          <div>
            <Label>Nível de visibilidade</Label>
            <Select value={visibilityLevel} onValueChange={setVisibilityLevel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Completo — parceiro vê tudo</SelectItem>
                <SelectItem value="redacted">Restrita — CPF/CNPJ e contatos mascarados</SelectItem>
                <SelectItem value="summary_only">Apenas resumo — sem respostas nem documentos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Motivo da atribuição</Label>
            <Textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex: Cliente pediu análise deste parceiro específico." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving || !partnerId} className="bg-[#2bc196] hover:bg-[#2bc196]/90">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Atribuir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}