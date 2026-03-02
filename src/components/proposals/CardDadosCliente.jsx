import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CardDadosCliente({ form, errors, mccs = [], onUpdate }) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="w-5 h-5 text-[var(--pagsmile-green)]" />
          Dados do Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Nome da Empresa *</Label>
          <Input
            value={form.clienteNome || ''}
            onChange={(e) => onUpdate('clienteNome', e.target.value)}
            placeholder="Razão social ou nome fantasia"
            className={errors?.clienteNome ? 'border-red-500' : ''}
          />
          {errors?.clienteNome && <p className="text-xs text-red-500">{errors.clienteNome}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">CNPJ *</Label>
            <Input
              value={form.clienteCnpj || ''}
              onChange={(e) => onUpdate('clienteCnpj', e.target.value)}
              placeholder="00.000.000/0000-00"
              className={errors?.clienteCnpj ? 'border-red-500' : ''}
            />
            {errors?.clienteCnpj && <p className="text-xs text-red-500">{errors.clienteCnpj}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">MCC *</Label>
            <Select value={form.clienteMcc || ''} onValueChange={(v) => onUpdate('clienteMcc', v)}>
              <SelectTrigger className={errors?.clienteMcc ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecione MCC" />
              </SelectTrigger>
              <SelectContent>
                {mccs.map(m => (
                  <SelectItem key={m.id} value={m.codigo || m.id}>
                    {m.codigo} - {m.descricao || m.name}
                  </SelectItem>
                ))}
                {mccs.length === 0 && <SelectItem value="0000">0000 - Geral</SelectItem>}
              </SelectContent>
            </Select>
            {errors?.clienteMcc && <p className="text-xs text-red-500">{errors.clienteMcc}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Contato Principal *</Label>
          <Input
            value={form.clienteContato || ''}
            onChange={(e) => onUpdate('clienteContato', e.target.value)}
            placeholder="Nome do contato principal"
            className={errors?.clienteContato ? 'border-red-500' : ''}
          />
          {errors?.clienteContato && <p className="text-xs text-red-500">{errors.clienteContato}</p>}
        </div>
      </CardContent>
    </Card>
  );
}