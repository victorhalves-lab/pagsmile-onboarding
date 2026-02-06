import React from 'react';
import { Label } from '@/components/ui/label';
import { ShieldAlert } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function StepE2cPEPSancoes({ formData, handleChange }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-red-100">
          <ShieldAlert className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--pagsmile-blue)]">PEP e Sanções</h2>
          <p className="text-sm text-[var(--pagsmile-blue)]/60">Verificação de exposição política e restrições</p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="space-y-2">
          <Label className="text-base">
            Algum sócio/administrador/beneficiário final é Pessoa Exposta Politicamente (PEP)? *
          </Label>
          <p className="text-sm text-slate-500 mb-2">
            PEP inclui ocupantes de cargos públicos relevantes, seus familiares e pessoas de relacionamento próximo
          </p>
          <Select
            value={formData.algumPEP || ''}
            onValueChange={(value) => handleChange('algumPEP', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Sim">Sim</SelectItem>
              <SelectItem value="Não">Não</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-base">
            Algum sócio/administrador/beneficiário final consta em listas restritivas/sanções? *
          </Label>
          <p className="text-sm text-slate-500 mb-2">
            Inclui listas da ONU, OFAC, União Europeia, COAF, entre outras
          </p>
          <Select
            value={formData.algumSancionado || ''}
            onValueChange={(value) => handleChange('algumSancionado', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Sim">Sim</SelectItem>
              <SelectItem value="Não">Não</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(formData.algumPEP === 'Sim' || formData.algumSancionado === 'Sim') && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Atenção:</strong> Você indicou que há pessoas expostas politicamente ou em listas restritivas. 
              Será necessário preencher um módulo adicional de detalhamento ao final do questionário.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}