import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ModuleCRecorrencia({ formData, handleChange }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-emerald-100">
          <RefreshCw className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--pinbank-blue)]">Módulo Assinatura/Recorrência</h2>
          <p className="text-sm text-[var(--pinbank-blue)]/60">Cobranças recorrentes</p>
        </div>
      </div>

      <div className="grid gap-5">
        <div className="space-y-2">
          <Label>Cancelamento self-service para o cliente? *</Label>
          <Select
            value={formData.cancelamentoSelfService || ''}
            onValueChange={(value) => handleChange('cancelamentoSelfService', value)}
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
          <Label>Aviso claro de cobrança recorrente/renovação no fluxo de compra? *</Label>
          <Select
            value={formData.avisoClaroRecorrencia || ''}
            onValueChange={(value) => handleChange('avisoClaroRecorrencia', value)}
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
          <Label htmlFor="urlPoliticaCancelamento">Política de cancelamento/recorrência (URL - opcional)</Label>
          <Input
            id="urlPoliticaCancelamento"
            type="url"
            value={formData.urlPoliticaCancelamento || ''}
            onChange={(e) => handleChange('urlPoliticaCancelamento', e.target.value)}
            placeholder="https://"
          />
        </div>

        <div className="space-y-2">
          <Label>Regra de reembolso em recorrência *</Label>
          <Select
            value={formData.regraReembolsoRecorrencia || ''}
            onValueChange={(value) => handleChange('regraReembolsoRecorrencia', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Nao_aplicavel">Não aplicável</SelectItem>
              <SelectItem value="Parcial">Parcial</SelectItem>
              <SelectItem value="Integral">Integral</SelectItem>
              <SelectItem value="Caso_a_caso">Caso a caso</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Controles para reduzir contestação (antifraude/validação)? *</Label>
          <Select
            value={formData.controlesReduzirContestacao || ''}
            onValueChange={(value) => handleChange('controlesReduzirContestacao', value)}
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
      </div>
    </div>
  );
}