import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';

export default function PixFormBasicInfo({ form, updateField }) {
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
            <Label>Nome da Empresa / Razão Social *</Label>
            <Input value={form.clientFullName} onChange={e => updateField('clientFullName', e.target.value)} placeholder="Razão Social" />
          </div>
          <div>
            <Label>CNPJ</Label>
            <Input value={form.clientCpfCnpj} onChange={e => updateField('clientCpfCnpj', e.target.value)} placeholder="00.000.000/0001-00" />
          </div>
          <div>
            <Label>Nome do Contato</Label>
            <Input value={form.contactName} onChange={e => updateField('contactName', e.target.value)} placeholder="Nome do contato principal" />
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
            <Label>Tipo de Atuação *</Label>
            <Select value={form.businessType} onValueChange={v => updateField('businessType', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Gateway">Gateway</SelectItem>
                <SelectItem value="Seller">Seller</SelectItem>
                <SelectItem value="Marketplace">Marketplace</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}