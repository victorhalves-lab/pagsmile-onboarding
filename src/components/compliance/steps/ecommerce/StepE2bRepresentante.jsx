import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { UserCircle } from 'lucide-react';

export default function StepE2bRepresentante({ formData, handleChange }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-indigo-100">
          <UserCircle className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--pinbank-blue)]">Representante Legal</h2>
          <p className="text-sm text-[var(--pinbank-blue)]/60">Dados do administrador principal</p>
        </div>
      </div>

      <div className="grid gap-5">
        <div className="space-y-2">
          <Label htmlFor="representanteNome">Nome completo *</Label>
          <Input
            id="representanteNome"
            value={formData.representanteNome || ''}
            onChange={(e) => handleChange('representanteNome', e.target.value)}
            placeholder="Nome completo do representante"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="representanteCPF">CPF *</Label>
          <Input
            id="representanteCPF"
            value={formData.representanteCPF || ''}
            onChange={(e) => handleChange('representanteCPF', e.target.value)}
            placeholder="000.000.000-00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="representanteCargo">Cargo *</Label>
          <Input
            id="representanteCargo"
            value={formData.representanteCargo || ''}
            onChange={(e) => handleChange('representanteCargo', e.target.value)}
            placeholder="Ex: Diretor, Sócio-Administrador"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="representanteEmail">E-mail corporativo *</Label>
          <Input
            id="representanteEmail"
            type="email"
            value={formData.representanteEmail || ''}
            onChange={(e) => handleChange('representanteEmail', e.target.value)}
            placeholder="email@empresa.com.br"
          />
        </div>
      </div>
    </div>
  );
}