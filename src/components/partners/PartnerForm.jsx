import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save, Loader2, Star } from 'lucide-react';

export default function PartnerForm({ form, onChange, onSave, saving, isEditing }) {
  const update = (field, value) => onChange({ ...form, [field]: value });

  return (
    <div className="bg-white rounded-2xl border border-[#002443]/5 p-6 space-y-5">
      <h2 className="text-base font-bold text-[#002443]">
        {isEditing ? 'Editar Parceiro' : 'Novo Parceiro'}
      </h2>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-xs text-[#002443]/50">Nome do Parceiro *</Label>
          <Input
            value={form.name || ''}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Ex: Stone, Cielo, PagSeguro..."
            className="border-[#002443]/10"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-[#002443]/50">Fee por Transação (R$)</Label>
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
          <Label className="text-xs text-[#002443]/50">Custo Antifraude (R$)</Label>
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
          <Label className="text-xs text-[#002443]/50">Custo 3DS (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={form.threeDSCost || ''}
            onChange={(e) => update('threeDSCost', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="border-[#002443]/10"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-[#002443]/50">Taxa de Antecipação (%)</Label>
          <Input
            type="number"
            step="0.01"
            value={form.percentualAntecipacao || ''}
            onChange={(e) => update('percentualAntecipacao', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="border-[#002443]/10"
          />
          <p className="text-[10px] text-[#002443]/30">Global para todos os MCCs deste parceiro</p>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl border border-[#002443]/5 bg-[#f4f4f4]">
          <Star className={`w-4 h-4 ${form.isPrincipal ? 'text-amber-500 fill-amber-500' : 'text-[#002443]/20'}`} />
          <div className="flex-1">
            <Label className="text-sm font-semibold text-[#002443]">Parceiro Principal</Label>
            <p className="text-[10px] text-[#002443]/40">Usado como base para taxas mínimas</p>
          </div>
          <Switch
            checked={form.isPrincipal || false}
            onCheckedChange={(checked) => update('isPrincipal', checked)}
            className="data-[state=checked]:bg-amber-500"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-[#002443]/50">Observações</Label>
        <Textarea
          value={form.notes || ''}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="Notas internas sobre o parceiro..."
          rows={2}
          className="border-[#002443]/10"
        />
      </div>

      <Button
        onClick={onSave}
        disabled={saving || !form.name}
        className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        {isEditing ? 'Atualizar Parceiro' : 'Criar Parceiro'}
      </Button>
    </div>
  );
}