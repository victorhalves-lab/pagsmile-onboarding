import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Check } from 'lucide-react';

export default function MeetingFormBasicInfo({ form, updateField }) {
  return (
    <Card className="border-[#002443]/5">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="w-5 h-5 text-[#2bc196]" />
          Informações do Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nome / Razão Social *</Label>
            <Input value={form.clientFullName} onChange={e => updateField('clientFullName', e.target.value)} placeholder="Nome completo ou Razão Social" />
          </div>
          <div>
            <Label>CPF / CNPJ</Label>
            <Input value={form.clientCpfCnpj} onChange={e => updateField('clientCpfCnpj', e.target.value)} placeholder="00.000.000/0000-00" />
          </div>
          <div>
            <Label>E-mail *</Label>
            <Input type="email" value={form.clientEmail} onChange={e => updateField('clientEmail', e.target.value)} placeholder="email@empresa.com" />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input value={form.clientPhone} onChange={e => updateField('clientPhone', e.target.value)} placeholder="+55 11 99999-9999" />
          </div>
          <div>
            <Label>Website</Label>
            <Input value={form.clientWebsite} onChange={e => updateField('clientWebsite', e.target.value)} placeholder="https://www.empresa.com" />
          </div>
          <div>
            <Label>Tipo de Negócio *</Label>
            <div className="flex gap-2 mt-1">
              {[
                { v: 'MERCHAN', l: 'Merchant' },
                { v: 'GATEWAY', l: 'Gateway' },
                { v: 'MARKETPLACE', l: 'Marketplace' },
              ].map(opt => (
                <button key={opt.v} type="button" onClick={() => updateField('businessType', opt.v)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    form.businessType === opt.v
                      ? 'bg-[#2bc196] border-[#2bc196] text-white shadow-md'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-[#2bc196]/50'
                  }`}>
                  {form.businessType === opt.v && <Check className="w-3 h-3" />} {opt.l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Nome do Contato</Label>
            <Input value={form.contactName} onChange={e => updateField('contactName', e.target.value)} placeholder="Nome do contato" />
          </div>
          <div>
            <Label>Cargo do Contato</Label>
            <Input value={form.contactRole} onChange={e => updateField('contactRole', e.target.value)} placeholder="Ex: Diretor Financeiro" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}