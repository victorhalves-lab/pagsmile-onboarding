import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarPlus, Loader2 } from 'lucide-react';
import moment from 'moment';

/**
 * Modal simples para o admin estender a validade de uma proposta.
 * - Pré-preenche com validade atual + 30 dias (ou hoje + 30 dias se já expirou).
 * - Se a proposta estiver `expirada`, reverte status para `enviada` automaticamente.
 * - Registra no AuditLog e cria LeadActivity (feito no onConfirm do caller).
 */
export default function ExtendValidityModal({ open, onClose, proposta, onConfirm, isPending }) {
  const defaultDate = (() => {
    const base = proposta?.validUntil ? moment(proposta.validUntil) : moment();
    const future = base.isBefore(moment()) ? moment() : base;
    return future.add(30, 'days').format('YYYY-MM-DD');
  })();

  const [newDate, setNewDate] = useState(defaultDate);

  const handleConfirm = () => {
    if (!newDate) return;
    // Set expiry at end of day in local timezone
    const iso = moment(newDate).endOf('day').toISOString();
    onConfirm(iso);
  };

  const isExpired = proposta?.status === 'expirada';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-amber-500" />
            Estender validade da proposta
          </DialogTitle>
          <DialogDescription>
            {isExpired
              ? 'Esta proposta está expirada. Ao estender a validade, ela volta para o status "Enviada" e o cliente poderá aceitá-la normalmente.'
              : 'Defina a nova data de validade. O cliente poderá aceitar a proposta até essa data.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs text-slate-500">Validade atual</Label>
            <p className="text-sm font-semibold text-[#002443]">
              {proposta?.validUntil ? moment(proposta.validUntil).format('DD/MM/YYYY') : '—'}
            </p>
          </div>
          <div>
            <Label htmlFor="newValidUntil" className="text-sm font-semibold text-[#002443]">
              Nova validade
            </Label>
            <Input
              id="newValidUntil"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={moment().format('YYYY-MM-DD')}
              className="mt-1"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Sugerido: 30 dias a partir de hoje.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!newDate || isPending}
            className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />}
            Confirmar nova validade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}