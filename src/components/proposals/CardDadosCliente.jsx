import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Network } from 'lucide-react';
import CnpjInput from './CnpjInput';
import { SEGMENTS, normalizeSegment, getSegmentLabel } from '@/lib/segmentConfig';

export default function CardDadosCliente({ form, errors, onUpdate }) {
  const { data: leads } = useQuery({
    queryKey: ['leads-list'],
    queryFn: () => base44.entities.Lead.list('-created_date', 100),
  });

  const handleLeadSelect = (leadId) => {
    const selected = leads?.find(l => l.id === leadId);
    if (selected) {
      onUpdate('clienteNome', selected.companyName || selected.fullName || '');
      onUpdate('clienteCnpj', (selected.cpfCnpj || '').replace(/\D/g, ''));
      onUpdate('clienteMcc', selected.mcc || '');
      onUpdate('clienteContato', selected.contactName || '');
      if (selected.businessSubCategory) {
        onUpdate('businessSubCategory', selected.businessSubCategory);
      }
    }
  };

  const inputCls = "bg-white/5 border-white/10 text-white h-11 rounded-xl placeholder:text-white/20 focus:border-[#1356E2] focus:ring-1 focus:ring-[#1356E2]";
  const labelCls = "text-[10px] text-[#E84B1C]/70 font-semibold uppercase tracking-wider";
  const errorCls = "text-[10px] text-red-400";

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-[#1356E2]/10 flex items-center justify-center"><Building2 className="w-3.5 h-3.5 text-[#E84B1C]" /></div>
        <h2 className="text-sm font-bold text-white">Dados do Cliente</h2>
      </div>

      {/* Lead Quick Select */}
      {leads && leads.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {leads.slice(0, 6).map(l => (
            <button key={l.id} onClick={() => handleLeadSelect(l.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] text-white/50 hover:text-white hover:border-[#1356E2]/30 hover:bg-[#1356E2]/5 transition-all truncate max-w-[140px]">
              {l.companyName || l.fullName}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-1">
        <Label className={labelCls}>Nome da Empresa *</Label>
        <Input value={form.clienteNome || ''} onChange={(e) => onUpdate('clienteNome', e.target.value)} placeholder="Razão social ou nome fantasia"
          className={`${inputCls} ${errors?.clienteNome ? 'border-red-400/50' : ''}`} />
        {errors?.clienteNome && <p className={errorCls}>{errors.clienteNome}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className={labelCls}>CNPJ *</Label>
          <CnpjInput value={form.clienteCnpj || ''} onChange={(val) => onUpdate('clienteCnpj', val)} error={errors?.clienteCnpj}
            className={`${inputCls} ${errors?.clienteCnpj ? 'border-red-400/50' : ''}`} />
          {errors?.clienteCnpj && <p className={errorCls}>{errors.clienteCnpj}</p>}
        </div>
        <div className="space-y-1">
          <Label className={labelCls}>MCC *</Label>
          <Input value={form.clienteMcc || ''} onChange={(e) => onUpdate('clienteMcc', e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="5812"
            className={`${inputCls} ${errors?.clienteMcc ? 'border-red-400/50' : ''}`} />
          {errors?.clienteMcc && <p className={errorCls}>{errors.clienteMcc}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className={labelCls}>Contato *</Label>
          <Input value={form.clienteContato || ''} onChange={(e) => onUpdate('clienteContato', e.target.value)} placeholder="Nome do contato principal"
            className={`${inputCls} ${errors?.clienteContato ? 'border-red-400/50' : ''}`} />
          {errors?.clienteContato && <p className={errorCls}>{errors.clienteContato}</p>}
        </div>
        <div className="space-y-1">
          <Label className={labelCls}>
            <span className="flex items-center gap-1"><Network className="w-3 h-3" /> Segmento *</span>
          </Label>
          <Select 
            value={normalizeSegment(form.businessSubCategory)} 
            onValueChange={(v) => onUpdate('businessSubCategory', v)}
          >
            <SelectTrigger className={`${inputCls} ${errors?.businessSubCategory ? 'border-red-400/50' : ''}`}>
              <SelectValue placeholder="Selecione o segmento">
                {form.businessSubCategory ? getSegmentLabel(form.businessSubCategory) : 'Selecione o segmento'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SEGMENTS.map(seg => (
                <SelectItem key={seg.id} value={seg.id}>{seg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.businessSubCategory && <p className={errorCls}>{errors.businessSubCategory}</p>}
        </div>
      </div>
    </div>
  );
}