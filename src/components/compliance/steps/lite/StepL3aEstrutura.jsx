import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserCheck } from 'lucide-react';

export default function StepL3aEstrutura({ formData, handleChange }) {
  const tiposEmpresa = ["LTDA", "SA", "Empresário Individual", "MEI", "Outro"];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-xl bg-[var(--pinbank-blue)]/10">
          <Users className="w-6 h-6 text-[var(--pinbank-blue)]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--pinbank-blue)]">
            Estrutura Societária
          </h2>
          <p className="text-[var(--pinbank-blue)]/70">
            Tipo de empresa e representante
          </p>
        </div>
      </div>

      <div className="grid gap-5">
        <div className="space-y-2">
          <Label className="text-[var(--pinbank-blue)] font-semibold">Tipo de Empresa</Label>
          <Select
            value={formData.tipoEmpresa || ''}
            onValueChange={(v) => handleChange('tipoEmpresa', v)}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Selecione o tipo de empresa" />
            </SelectTrigger>
            <SelectContent>
              {tiposEmpresa.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Representante Legal */}
        <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[var(--pinbank-blue)]" />
            <p className="font-semibold text-[var(--pinbank-blue)]">Representante Legal</p>
          </div>

          <div className="space-y-2">
            <Label className="text-[var(--pinbank-blue)] font-semibold text-sm">Nome Completo</Label>
            <Input
              value={formData.representanteLegalNome || ''}
              onChange={(e) => handleChange('representanteLegalNome', e.target.value)}
              placeholder="Nome completo do representante legal"
              className="h-11 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-[var(--pinbank-blue)] font-semibold text-sm">CPF</Label>
              <Input
                value={formData.representanteLegalCPF || ''}
                onChange={(e) => handleChange('representanteLegalCPF', e.target.value)}
                placeholder="000.000.000-00"
                className="h-11 bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[var(--pinbank-blue)] font-semibold text-sm">E-mail</Label>
              <Input
                type="email"
                value={formData.representanteLegalEmail || ''}
                onChange={(e) => handleChange('representanteLegalEmail', e.target.value)}
                placeholder="email@empresa.com.br"
                className="h-11 bg-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}