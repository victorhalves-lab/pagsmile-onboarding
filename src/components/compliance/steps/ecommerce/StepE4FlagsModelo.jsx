import React from 'react';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function StepE4FlagsModelo({ formData, handleChange }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-amber-100">
          <Settings className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--pinbank-blue)]">Modelo de Negócio</h2>
          <p className="text-sm text-[var(--pinbank-blue)]/60">Características específicas da operação</p>
        </div>
      </div>

      <p className="text-sm text-slate-600 p-3 bg-slate-50 rounded-lg">
        As respostas abaixo determinarão quais módulos adicionais serão necessários para completar o questionário.
      </p>

      <div className="grid gap-6">
        <div className="space-y-2">
          <Label className="text-base">Opera Marketplace/3P (sellers)? *</Label>
          <p className="text-sm text-slate-500 mb-2">
            Você permite que terceiros vendam produtos através da sua plataforma?
          </p>
          <Select
            value={formData.operaMarketplace || ''}
            onValueChange={(value) => handleChange('operaMarketplace', value)}
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
          <Label className="text-base">Tem cross-border (venda e/ou entrega fora do Brasil)? *</Label>
          <p className="text-sm text-slate-500 mb-2">
            Você vende ou entrega produtos para clientes fora do Brasil?
          </p>
          <Select
            value={formData.temCrossBorder || ''}
            onValueChange={(value) => handleChange('temCrossBorder', value)}
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
          <Label className="text-base">Tem assinatura/recorrência? *</Label>
          <p className="text-sm text-slate-500 mb-2">
            Você oferece produtos ou serviços por assinatura com cobrança recorrente?
          </p>
          <Select
            value={formData.temRecorrencia || ''}
            onValueChange={(value) => handleChange('temRecorrencia', value)}
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
          <Label className="text-base">Vende produto digital (download/código/licença/entrega digital)? *</Label>
          <p className="text-sm text-slate-500 mb-2">
            Você comercializa produtos que são entregues digitalmente?
          </p>
          <Select
            value={formData.vendeProdutoDigital || ''}
            onValueChange={(value) => handleChange('vendeProdutoDigital', value)}
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