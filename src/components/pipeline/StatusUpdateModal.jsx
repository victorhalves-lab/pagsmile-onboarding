import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'questionario_preenchido', label: 'Lead Novo (Quest. Preenchido)' },
  { value: 'analisado_priscila', label: 'Analisado (Priscila)' },
  { value: 'em_contato_comercial', label: 'Em Contato Comercial' },
  { value: 'proposta_enviada', label: 'Proposta Enviada' },
  { value: 'proposta_aceita', label: 'Proposta Aceita' },
  { value: 'proposta_recusada', label: 'Proposta Recusada' },
  { value: 'kyc_iniciado', label: 'Em Compliance / KYC' },
  { value: 'kyc_aprovado', label: 'Compliance Aprovado' },
  { value: 'kyc_revisao_manual', label: 'Compliance - Revisão Manual' },
  { value: 'ativado', label: 'Contrato Gerado (Negócio Fechado)' },
  { value: 'perdido', label: 'Perdido' },
];

export default function StatusUpdateModal({ open, onClose, lead }) {
  const [newStatus, setNewStatus] = useState(lead?.status || '');
  const [note, setNote] = useState('');
  const [userEmail, setUserEmail] = useState('admin');
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(u => setUserEmail(u?.email || 'admin')).catch(() => {});
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Lead.update(lead.id, {
        status: newStatus,
        lastInteractionDate: new Date().toISOString()
      });
      await base44.entities.LeadActivity.create({
        leadId: lead.id,
        activityType: 'status_alterado_manual',
        description: `Status alterado para "${STATUS_OPTIONS.find(s => s.value === newStatus)?.label || newStatus}"${note ? `. Nota: ${note}` : ''}`,
        performedBy: userEmail,
        activityDate: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['leads-questionarios'] });
      toast.success('Status atualizado!');
      onClose();
      setNote('');
    }
  });

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Atualizar Status</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-[var(--pinbank-blue)]/70">
            Lead: <strong>{lead.companyName || lead.fullName}</strong>
          </p>
          <div className="space-y-2">
            <Label>Novo Status</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Nota (opcional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Motivo da mudança..."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!newStatus || newStatus === lead.status || mutation.isPending}
            className="bg-[var(--pinbank-blue)] hover:bg-[var(--pinbank-blue)]/90"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Atualizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}