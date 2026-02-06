import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ShieldCheck } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function StepE5PLDFT({ formData, handleChange }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-teal-100">
          <ShieldCheck className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--pagsmile-blue)]">PLD/FT</h2>
          <p className="text-sm text-[var(--pagsmile-blue)]/60">Prevenção à lavagem de dinheiro</p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="space-y-2">
          <Label className="text-base">
            A empresa possui Política/Procedimento de PLD/FT ou Declaração equivalente? *
          </Label>
          <Select
            value={formData.possuiPoliticaPLD || ''}
            onValueChange={(value) => handleChange('possuiPoliticaPLD', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Sim">Sim</SelectItem>
              <SelectItem value="Não">Não</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500 mt-2">
            Independente da resposta, será necessário enviar o documento ou declaração simplificada na etapa de documentos.
          </p>
        </div>

        <div className="border-t pt-6">
          <Label className="text-base font-semibold mb-4 block">Responsável PLD/FT (opcional)</Label>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="responsavelPLDNome">Nome</Label>
              <Input
                id="responsavelPLDNome"
                value={formData.responsavelPLDNome || ''}
                onChange={(e) => handleChange('responsavelPLDNome', e.target.value)}
                placeholder="Nome do responsável PLD/FT"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsavelPLDEmail">E-mail corporativo</Label>
              <Input
                id="responsavelPLDEmail"
                type="email"
                value={formData.responsavelPLDEmail || ''}
                onChange={(e) => handleChange('responsavelPLDEmail', e.target.value)}
                placeholder="email@empresa.com.br"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}