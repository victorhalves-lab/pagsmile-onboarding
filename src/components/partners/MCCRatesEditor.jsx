import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Save, Loader2, CreditCard, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { toast } from 'sonner';

const BANDEIRAS = ['visa', 'mastercard', 'elo', 'amex', 'outras'];
const BANDEIRA_LABELS = { visa: 'Visa', mastercard: 'Master', elo: 'Elo', amex: 'Amex', outras: 'Outras' };
const FAIXAS = ['avista', 'de2a6x', 'de7a12x'];
const FAIXA_LABELS = { avista: 'À Vista', de2a6x: '2x a 6x', de7a12x: '7x a 12x' };
const MARKUP = 1.20;

function RateInput({ value, onChange, placeholder = "0.00" }) {
  return (
    <Input
      type="number"
      step="0.01"
      value={value || ''}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      placeholder={placeholder}
      className="border-[#002443]/10 h-9 text-sm text-center w-full"
    />
  );
}

function MCCRateCard({ mccRate, onEdit, onDelete, expanded, onToggle }) {
  const rates = mccRate.rates || {};
  const cartao = rates.cartao || {};

  return (
    <div className="rounded-xl border border-[#002443]/5 overflow-hidden">
      <div
        className="flex items-center justify-between p-4 bg-[#f4f4f4] cursor-pointer hover:bg-[#002443]/[0.03] transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <Badge className="bg-[#002443]/5 text-[#002443] border-0 font-mono text-xs">
            MCC {mccRate.mcc}
          </Badge>
          {mccRate.mccLabel && (
            <span className="text-sm text-[#002443]/60">{mccRate.mccLabel}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <Edit className="w-3.5 h-3.5 text-[#002443]/40" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          {expanded ? <ChevronUp className="w-4 h-4 text-[#002443]/30" /> : <ChevronDown className="w-4 h-4 text-[#002443]/30" />}
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Crédito */}
          <div>
            <Label className="text-[10px] text-[#002443]/40 font-bold uppercase tracking-wider mb-2 block">
              MDR Crédito (Custo Parceiro → Mínimo Proposta +20%)
            </Label>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#002443]/5">
                    <th className="text-left py-2 text-[#002443]/40 font-semibold w-24">Bandeira</th>
                    {FAIXAS.map(f => (
                      <th key={f} className="text-center py-2 text-[#002443]/40 font-semibold" colSpan={2}>
                        {FAIXA_LABELS[f]}
                      </th>
                    ))}
                  </tr>
                  <tr className="border-b border-[#002443]/5">
                    <th></th>
                    {FAIXAS.map(f => (
                      <React.Fragment key={f}>
                        <th className="text-center py-1 text-[10px] text-[#002443]/30">Base</th>
                        <th className="text-center py-1 text-[10px] text-[#2bc196]">Mín. +20%</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BANDEIRAS.map(b => (
                    <tr key={b} className="border-b border-[#002443]/[0.03]">
                      <td className="py-2 font-semibold text-[#002443]">{BANDEIRA_LABELS[b]}</td>
                      {FAIXAS.map(f => {
                        const val = cartao[b]?.[f] || 0;
                        const min = Math.round(val * MARKUP * 100) / 100;
                        return (
                          <React.Fragment key={f}>
                            <td className="text-center py-2 text-[#002443]">{val ? `${val}%` : '-'}</td>
                            <td className="text-center py-2 font-bold text-[#2bc196]">{val ? `${min}%` : '-'}</td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Débito */}
          <div>
            <Label className="text-[10px] text-[#002443]/40 font-bold uppercase tracking-wider mb-2 block">
              MDR Débito
            </Label>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#002443]/5">
                    <th className="text-left py-2 text-[#002443]/40 font-semibold w-24">Bandeira</th>
                    <th className="text-center py-2 text-[#002443]/40 font-semibold">Base</th>
                    <th className="text-center py-2 text-[#2bc196] font-semibold">Mín. +20%</th>
                  </tr>
                </thead>
                <tbody>
                  {BANDEIRAS.filter(b => b !== 'amex').map(b => {
                    const val = rates.debito?.[b] || 0;
                    const min = Math.round(val * MARKUP * 100) / 100;
                    return (
                      <tr key={b} className="border-b border-[#002443]/[0.03]">
                        <td className="py-2 font-semibold text-[#002443]">{BANDEIRA_LABELS[b]}</td>
                        <td className="text-center py-2 text-[#002443]">{val ? `${val}%` : '-'}</td>
                        <td className="text-center py-2 font-bold text-[#2bc196]">{val ? `${min}%` : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Antecipação */}
          {rates.percentualAntecipacao > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#f4f4f4]">
              <span className="text-xs text-[#002443]/60">Taxa Antecipação:</span>
              <span className="text-sm font-bold text-[#002443]">{rates.percentualAntecipacao}%</span>
              <span className="text-xs text-[#002443]/30">→</span>
              <span className="text-sm font-bold text-[#2bc196]">
                {Math.round(rates.percentualAntecipacao * MARKUP * 100) / 100}% mín.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MCCRatesEditor({ partnerId, mccRates, onSave, onDelete, saving }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingMCC, setEditingMCC] = useState(null);
  const [expandedMCC, setExpandedMCC] = useState(null);
  const [mccForm, setMccForm] = useState({ mcc: '', mccLabel: '', rates: { cartao: {}, debito: {}, percentualAntecipacao: 0 } });

  const resetForm = () => setMccForm({ mcc: '', mccLabel: '', rates: { cartao: {}, debito: {}, percentualAntecipacao: 0 } });

  const openNew = () => { resetForm(); setEditingMCC(null); setShowDialog(true); };

  const openEdit = (mccRate) => {
    setEditingMCC(mccRate);
    setMccForm({
      mcc: mccRate.mcc || '',
      mccLabel: mccRate.mccLabel || '',
      rates: mccRate.rates || { cartao: {}, debito: {}, percentualAntecipacao: 0 }
    });
    setShowDialog(true);
  };

  const updateCartao = (bandeira, faixa, value) => {
    setMccForm(prev => ({
      ...prev,
      rates: {
        ...prev.rates,
        cartao: {
          ...prev.rates.cartao,
          [bandeira]: {
            ...(prev.rates.cartao?.[bandeira] || {}),
            [faixa]: value
          }
        }
      }
    }));
  };

  const updateDebito = (bandeira, value) => {
    setMccForm(prev => ({
      ...prev,
      rates: {
        ...prev.rates,
        debito: { ...(prev.rates.debito || {}), [bandeira]: value }
      }
    }));
  };

  const copyFirstBrand = () => {
    const first = mccForm.rates.cartao?.mastercard || mccForm.rates.cartao?.visa;
    if (!first) return;
    const newCartao = {};
    BANDEIRAS.forEach(b => { newCartao[b] = { ...first }; });
    setMccForm(prev => ({ ...prev, rates: { ...prev.rates, cartao: newCartao } }));
    toast.success('Taxas copiadas para todas as bandeiras');
  };

  const handleSave = () => {
    if (!mccForm.mcc) { toast.error('Informe o MCC'); return; }
    onSave({ ...mccForm, partnerId }, editingMCC?.id);
    setShowDialog(false);
    resetForm();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-[#002443]">Taxas por MCC</h3>
          <p className="text-[10px] text-[#002443]/40">{mccRates.length} MCC(s) cadastrado(s)</p>
        </div>
        <Button onClick={openNew} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl text-sm">
          <Plus className="w-4 h-4 mr-1" /> Adicionar MCC
        </Button>
      </div>

      {mccRates.length === 0 ? (
        <div className="text-center py-8 rounded-xl border border-dashed border-[#002443]/10">
          <CreditCard className="w-8 h-8 text-[#002443]/10 mx-auto mb-2" />
          <p className="text-sm text-[#002443]/40">Nenhum MCC cadastrado</p>
          <p className="text-xs text-[#002443]/30">Adicione MCCs e suas taxas para este parceiro</p>
        </div>
      ) : (
        <div className="space-y-2">
          {mccRates.map(mr => (
            <MCCRateCard
              key={mr.id}
              mccRate={mr}
              onEdit={() => openEdit(mr)}
              onDelete={() => onDelete(mr.id)}
              expanded={expandedMCC === mr.id}
              onToggle={() => setExpandedMCC(expandedMCC === mr.id ? null : mr.id)}
            />
          ))}
        </div>
      )}

      {/* Dialog para editar/criar MCC */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#002443]">{editingMCC ? 'Editar' : 'Novo'} MCC</DialogTitle>
            <DialogDescription className="text-[#002443]/50">Configure as taxas de MDR para este MCC.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* MCC Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#002443]/50">MCC *</Label>
                <Input
                  value={mccForm.mcc}
                  onChange={(e) => setMccForm(prev => ({ ...prev, mcc: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  placeholder="5812"
                  className="border-[#002443]/10 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#002443]/50">Descrição do MCC</Label>
                <Input
                  value={mccForm.mccLabel}
                  onChange={(e) => setMccForm(prev => ({ ...prev, mccLabel: e.target.value }))}
                  placeholder="Ex: Restaurantes"
                  className="border-[#002443]/10"
                />
              </div>
            </div>

            {/* Crédito */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs text-[#002443]/50 font-bold uppercase tracking-wider">MDR Crédito (%)</Label>
                <Button variant="ghost" size="sm" onClick={copyFirstBrand} className="text-[10px] text-[#002443]/40 hover:text-[#2bc196] h-7">
                  <Copy className="w-3 h-3 mr-1" /> Copiar Master para todas
                </Button>
              </div>
              <div className="rounded-xl border border-[#002443]/5 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#f4f4f4]">
                      <th className="text-left py-2 px-3 text-[#002443]/40 font-semibold w-24">Bandeira</th>
                      {FAIXAS.map(f => (
                        <th key={f} className="text-center py-2 px-2 text-[#002443]/40 font-semibold">{FAIXA_LABELS[f]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {BANDEIRAS.map(b => (
                      <tr key={b} className="border-t border-[#002443]/[0.03]">
                        <td className="py-2 px-3 font-semibold text-[#002443]">{BANDEIRA_LABELS[b]}</td>
                        {FAIXAS.map(f => (
                          <td key={f} className="py-2 px-2">
                            <RateInput
                              value={mccForm.rates.cartao?.[b]?.[f]}
                              onChange={(val) => updateCartao(b, f, val)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Débito */}
            <div>
              <Label className="text-xs text-[#002443]/50 font-bold uppercase tracking-wider mb-2 block">MDR Débito (%)</Label>
              <div className="grid grid-cols-4 gap-3">
                {BANDEIRAS.filter(b => b !== 'amex').map(b => (
                  <div key={b} className="space-y-1">
                    <Label className="text-[10px] text-[#002443]/40">{BANDEIRA_LABELS[b]}</Label>
                    <RateInput
                      value={mccForm.rates.debito?.[b]}
                      onChange={(val) => updateDebito(b, val)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Antecipação */}
            <div className="space-y-1.5">
              <Label className="text-xs text-[#002443]/50 font-bold uppercase tracking-wider">Taxa de Antecipação (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={mccForm.rates.percentualAntecipacao || ''}
                onChange={(e) => setMccForm(prev => ({
                  ...prev,
                  rates: { ...prev.rates, percentualAntecipacao: parseFloat(e.target.value) || 0 }
                }))}
                placeholder="0.00"
                className="border-[#002443]/10 w-40"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="rounded-xl border-[#002443]/10">Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !mccForm.mcc}
              className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingMCC ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}