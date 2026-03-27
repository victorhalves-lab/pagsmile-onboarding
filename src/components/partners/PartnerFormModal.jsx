import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Save, Loader2, Star } from 'lucide-react';
import PartnerMDRTable from './PartnerMDRTable';

const EMPTY_FORM = {
  name: '', isPrincipal: false, transactionFee: 0, antifraudCost: 0,
  threeDSCost: 0, percentualAntecipacao: 0, notes: '', mdr: {}
};

export default function PartnerFormModal({ open, onOpenChange, partner, onSave, saving }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const isEditing = !!partner?.id;

  useEffect(() => {
    if (partner) {
      setForm({
        name: partner.name || '',
        isPrincipal: partner.isPrincipal || false,
        transactionFee: partner.transactionFee || 0,
        antifraudCost: partner.antifraudCost || 0,
        threeDSCost: partner.threeDSCost || 0,
        percentualAntecipacao: partner.percentualAntecipacao || 0,
        notes: partner.notes || '',
        mdr: partner.mdr || {}
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [partner, open]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!form.name) return;
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#002443]">
            {isEditing ? 'Editar Parceiro' : 'Novo Parceiro'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Dados básicos */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs text-[#002443]/50">Nome do Parceiro *</Label>
              <Input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Ex: Stone, Cielo, PagSeguro..."
                className="border-[#002443]/10"
              />
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl border border-[#002443]/5 bg-[#f4f4f4] md:col-span-2">
              <Star className={`w-4 h-4 ${form.isPrincipal ? 'text-amber-500 fill-amber-500' : 'text-[#002443]/20'}`} />
              <div className="flex-1">
                <Label className="text-sm font-semibold text-[#002443]">Parceiro Principal</Label>
                <p className="text-[10px] text-[#002443]/40">Usado como base para taxas mínimas</p>
              </div>
              <Switch
                checked={form.isPrincipal}
                onCheckedChange={(checked) => update('isPrincipal', checked)}
                className="data-[state=checked]:bg-amber-500"
              />
            </div>
          </div>

          {/* Tabela MDR */}
          <PartnerMDRTable
            mdr={form.mdr}
            onChange={(mdr) => update('mdr', mdr)}
          />

          {/* Taxas adicionais */}
          <div>
            <p className="text-[10px] text-[#002443]/40 font-bold uppercase tracking-wider mb-3">Taxas Adicionais</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#002443]/50">Antecipação (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.percentualAntecipacao || ''}
                  onChange={(e) => update('percentualAntecipacao', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="border-[#002443]/10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#002443]/50">Fee Transação (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.transactionFee || ''}
                  onChange={(e) => update('transactionFee', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="border-[#002443]/10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#002443]/50">Antifraude (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.antifraudCost || ''}
                  onChange={(e) => update('antifraudCost', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="border-[#002443]/10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#002443]/50">3DS (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.threeDSCost || ''}
                  onChange={(e) => update('threeDSCost', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="border-[#002443]/10"
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#002443]/50">Observações</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Notas internas sobre o parceiro..."
              rows={2}
              className="border-[#002443]/10"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl border-[#002443]/10">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !form.name}
            className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {isEditing ? 'Atualizar' : 'Criar Parceiro'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}