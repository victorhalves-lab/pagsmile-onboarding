import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';

export default function FollowUpModal({ open, onClose, lead }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [description, setDescription] = useState('');
  const [userEmail, setUserEmail] = useState('admin');
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => setUserEmail(u?.email || 'admin')).catch(() => {});
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      const followUpDate = new Date(`${date}T${time}:00`);
      await base44.entities.LeadActivity.create({
        leadId: lead.id,
        activityType: 'nota_adicionada',
        description: `📅 Follow-up agendado para ${followUpDate.toLocaleDateString('pt-BR')} às ${time}${description ? `. ${description}` : ''}`,
        performedBy: userEmail,
        activityDate: new Date().toISOString(),
        details: { followUpDate: followUpDate.toISOString(), type: 'follow_up' }
      });
      await base44.entities.Lead.update(lead.id, {
        lastInteractionDate: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-pipeline'] });
      toast.success('Follow-up agendado!');
      onClose();
      setDate('');
      setTime('09:00');
      setDescription('');
    }
  });

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-[var(--pagsmile-green)]" />
            Agendar Follow-up
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-[var(--pagsmile-blue)]/70">
            Lead: <strong>{lead.companyName || lead.fullName}</strong>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Data *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Ligar para discutir proposta..."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!date || mutation.isPending}
            className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Agendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}