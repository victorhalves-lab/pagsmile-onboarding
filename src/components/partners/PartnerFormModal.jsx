import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Save, Loader2, Star, Plus } from 'lucide-react';
import MCCRateEditor from './MCCRateEditor';

const EMPTY_FORM = {
  name: '', isPrincipal: false, modelo: '', parcelasMax: '',
  transactionFee: 0, antifraudCost: 0, threeDSCost: 0,
  percentualAntecipacao: 0, antecipacaoInfo: '', notes: '', mdrByMcc: []
};

export default function PartnerFormModal({ open, onOpenChange, partner, onSave, saving }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const isEditing = !!partner?.id;

  useEffect(() => {
    if (partner) {
      setForm({
        name: partner.name || '',
        isPrincipal: partner.isPrincipal || false,
        modelo: partner.modelo || '',
        parcelasMax: partner.parcelasMax || '',
        transactionFee: partner.transactionFee || 0,
        antifraudCost: partner.antifraudCost || 0,
        threeDSCost: partner.threeDSCost || 0,
        percentualAntecipacao: partner.percentualAntecipacao || 0,
        antecipacaoInfo: partner.antecipacaoInfo || '',
        notes: partner.notes || '',
        mdrByMcc: partner.mdrByMcc || []
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [partner, open]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleMccChange = (idx, mccItem) => {
    const newMdr = [...form.mdrByMcc];
    newMdr[idx] = mccItem;
    update('mdrByMcc', newMdr);
  };

  const handleMccRemove = (idx) => {
    update('mdrByMcc', form.mdrByMcc.filter((_, i) => i !== idx));
  };

  const addMcc = () => {
    update('mdrByMcc', [...form.mdrByMcc, { mccCode: '', mccDescription: '', rates: {} }]);
  };

  const handleSave = () => {
    if (!form.name) return;
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
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
              <Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Ex: Pagar.me, DOCK..." className="border-[#002443]/10" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-[#002443]/50">Modelo</Label>
              <Input value={form.modelo} onChange={(e) => update('modelo', e.target.value)} placeholder="Ex: MDR fixo bandeira×MCC" className="border-[#002443]/10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#002443]/50">Parcelas Máx</Label>
              <Input value={form.parcelasMax} onChange={(e) => update('parcelasMax', e.target.value)} placeholder="Ex: 12x, 21x" className="border-[#002443]/10" />
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl border border-[#002443]/5 bg-[#f4f4f4] md:col-span-2">
              <Star className={`w-4 h-4 ${form.isPrincipal ? 'text-amber-500 fill-amber-500' : 'text-[#002443]/20'}`} />
              <div className="flex-1">
                <Label className="text-sm font-semibold text-[#002443]">Parceiro Principal</Label>
                <p className="text-[10px] text-[#002443]/40">Usado como base para taxas mínimas</p>
              </div>
              <Switch checked={form.isPrincipal} onCheckedChange={(checked) => update('isPrincipal', checked)} className="data-[state=checked]:bg-amber-500" />
            </div>
          </div>

          {/* MDR por MCC */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-[#002443]/40 font-bold uppercase tracking-wider">Taxas MDR por MCC</p>
              <Button variant="outline" size="sm" onClick={addMcc} className="text-xs h-7 rounded-lg border-[#002443]/10">
                <Plus className="w-3 h-3 mr-1" /> Adicionar MCC
              </Button>
            </div>
            {form.mdrByMcc.length === 0 && (
              <p className="text-xs text-[#002443]/30 text-center py-6">Nenhum MCC adicionado. Clique em "Adicionar MCC".</p>
            )}
            {form.mdrByMcc.map((mccItem, idx) => (
              <MCCRateEditor key={idx} mccItem={mccItem} index={idx} onChange={handleMccChange} onRemove={handleMccRemove} />
            ))}
          </div>

          {/* Taxas adicionais */}
          <div>
            <p className="text-[10px] text-[#002443]/40 font-bold uppercase tracking-wider mb-3">Taxas Adicionais</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Fee Transação (R$)', key: 'transactionFee' },
                { label: 'Antifraude (R$)', key: 'antifraudCost' },
                { label: '3DS (R$)', key: 'threeDSCost' },
                { label: 'Antecipação (%)', key: 'percentualAntecipacao' },
              ].map(f => (
                <div key={f.key} className="space-y-1.5">
                  <Label className="text-xs text-[#002443]/50">{f.label}</Label>
                  <Input type="number" step="0.01" value={form[f.key] || ''} onChange={(e) => update(f.key, parseFloat(e.target.value) || 0)} placeholder="0.00" className="border-[#002443]/10" />
                </div>
              ))}
            </div>
          </div>

          {/* Antecipação Info */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#002443]/50">Info Antecipação</Label>
            <Input value={form.antecipacaoInfo} onChange={(e) => update('antecipacaoInfo', e.target.value)} placeholder="Ex: 120% CDI (~1,40% a.m.)" className="border-[#002443]/10" />
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#002443]/50">Observações</Label>
            <Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Notas internas..." rows={2} className="border-[#002443]/10" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl border-[#002443]/10">Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !form.name} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {isEditing ? 'Atualizar' : 'Criar Parceiro'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}