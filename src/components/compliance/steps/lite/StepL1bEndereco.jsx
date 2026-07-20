import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';

export default function StepL1bEndereco({ formData, handleChange }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-xl bg-[var(--pinbank-blue)]/10">
          <MapPin className="w-6 h-6 text-[var(--pinbank-blue)]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--pinbank-blue)]">
            Endereço e Contato
          </h2>
          <p className="text-[var(--pinbank-blue)]/70">
            Localização e presença online
          </p>
        </div>
      </div>

      <div className="grid gap-5">
        <div className="space-y-2">
          <Label className="text-[var(--pinbank-blue)] font-semibold">Endereço Comercial Completo</Label>
          <Textarea
            value={formData.enderecoComercial || ''}
            onChange={(e) => handleChange('enderecoComercial', e.target.value)}
            placeholder="Rua, número, complemento, bairro, cidade, estado, CEP"
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[var(--pinbank-blue)] font-semibold">
            Website / Domínio Principal <span className="text-[var(--pinbank-blue)]/50 text-sm">(opcional)</span>
          </Label>
          <Input
            value={formData.website || ''}
            onChange={(e) => handleChange('website', e.target.value)}
            placeholder="www.suaempresa.com.br"
            className="h-12"
          />
        </div>
      </div>
    </div>
  );
}