import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2 } from 'lucide-react';

export default function StepL1aIdentificacao({ formData, handleChange }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-xl bg-[var(--pinbank-blue)]/10">
          <Building2 className="w-6 h-6 text-[var(--pinbank-blue)]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--pinbank-blue)]">
            Identificação da Empresa
          </h2>
          <p className="text-[var(--pinbank-blue)]/70">
            Dados básicos de registro
          </p>
        </div>
      </div>

      <div className="grid gap-5">
        <div className="space-y-2">
          <Label className="text-[var(--pinbank-blue)] font-semibold">CNPJ</Label>
          <Input
            value={formData.cnpj || ''}
            onChange={(e) => handleChange('cnpj', e.target.value)}
            placeholder="00.000.000/0001-00"
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[var(--pinbank-blue)] font-semibold">Razão Social</Label>
          <Input
            value={formData.razaoSocial || ''}
            onChange={(e) => handleChange('razaoSocial', e.target.value)}
            placeholder="Nome empresarial conforme CNPJ"
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[var(--pinbank-blue)] font-semibold">
            Nome Fantasia <span className="text-[var(--pinbank-blue)]/50 text-sm">(opcional)</span>
          </Label>
          <Input
            value={formData.nomeFantasia || ''}
            onChange={(e) => handleChange('nomeFantasia', e.target.value)}
            placeholder="Nome comercial da empresa"
            className="h-12"
          />
        </div>
      </div>
    </div>
  );
}