import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ModuleBInternacional({ formData, handleChange }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-sky-100">
          <Globe className="w-5 h-5 text-sky-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--pinbank-blue)]">Módulo Internacional</h2>
          <p className="text-sm text-[var(--pinbank-blue)]/60">Operações cross-border</p>
        </div>
      </div>

      <div className="grid gap-5">
        <div className="space-y-2">
          <Label htmlFor="paisesAtendidos">Países atendidos *</Label>
          <Input
            id="paisesAtendidos"
            value={formData.paisesAtendidos || ''}
            onChange={(e) => handleChange('paisesAtendidos', e.target.value)}
            placeholder="Ex: EUA, Portugal, Argentina"
          />
          <p className="text-xs text-slate-500">Separe os países por vírgula</p>
        </div>

        <div className="space-y-2">
          <Label>Modelo de entrega internacional *</Label>
          <Select
            value={formData.modeloEntregaInternacional || ''}
            onValueChange={(value) => handleChange('modeloEntregaInternacional', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Proprio">Próprio</SelectItem>
              <SelectItem value="Terceiro">Terceiro</SelectItem>
              <SelectItem value="Misto">Misto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Moeda de cobrança *</Label>
          <Select
            value={formData.moedaCobranca || ''}
            onValueChange={(value) => handleChange('moedaCobranca', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BRL">BRL (Real brasileiro)</SelectItem>
              <SelectItem value="Estrangeira">Moeda estrangeira</SelectItem>
              <SelectItem value="Ambas">Ambas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="urlPoliticaDevolucaoInternacional">Política de devolução internacional (URL - opcional)</Label>
          <Input
            id="urlPoliticaDevolucaoInternacional"
            type="url"
            value={formData.urlPoliticaDevolucaoInternacional || ''}
            onChange={(e) => handleChange('urlPoliticaDevolucaoInternacional', e.target.value)}
            placeholder="https://"
          />
        </div>
      </div>
    </div>
  );
}