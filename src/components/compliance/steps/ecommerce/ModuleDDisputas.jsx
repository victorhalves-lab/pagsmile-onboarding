import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertTriangle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MOTIVOS_DISPUTA = [
  { value: 'fraude', label: 'Fraude' },
  { value: 'nao_reconhecimento', label: 'Não reconhecimento' },
  { value: 'produto_nao_recebido', label: 'Produto não recebido' },
  { value: 'produto_diferente', label: 'Produto diferente' },
  { value: 'servico_nao_entregue', label: 'Serviço não entregue' },
  { value: 'outro', label: 'Outro' }
];

export default function ModuleDDisputas({ formData, handleChange }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-red-100">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--pagsmile-blue)]">Módulo Disputas/Chargeback</h2>
          <p className="text-sm text-[var(--pagsmile-blue)]/60">Gestão de contestações (ativado por taxa &gt;1%)</p>
        </div>
      </div>

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
        <p className="text-sm text-amber-800">
          Este módulo foi ativado porque você indicou uma taxa de chargeback superior a 1%.
        </p>
      </div>

      <div className="grid gap-5">
        <div className="space-y-2">
          <Label>Motivo mais comum de disputa *</Label>
          <Select
            value={formData.motivoMaisComumDisputa || ''}
            onValueChange={(value) => handleChange('motivoMaisComumDisputa', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {MOTIVOS_DISPUTA.map((motivo) => (
                <SelectItem key={motivo.value} value={motivo.value}>{motivo.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Existe prova de entrega/serviço para contestação? *</Label>
          <Select
            value={formData.existeProvaEntrega || ''}
            onValueChange={(value) => handleChange('existeProvaEntrega', value)}
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
          <Label>Antifraude ativo? *</Label>
          <Select
            value={formData.antifraudeAtivo || ''}
            onValueChange={(value) => handleChange('antifraudeAtivo', value)}
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

        {formData.antifraudeAtivo === 'Sim' && (
          <div className="space-y-2">
            <Label htmlFor="qualAntifraude">Qual antifraude? (opcional)</Label>
            <Input
              id="qualAntifraude"
              value={formData.qualAntifraude || ''}
              onChange={(e) => handleChange('qualAntifraude', e.target.value)}
              placeholder="Ex: ClearSale, Konduto, etc."
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>SLA de atendimento ao cliente *</Label>
          <Select
            value={formData.slaAtendimento || ''}
            onValueChange={(value) => handleChange('slaAtendimento', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ate_24h">Até 24h</SelectItem>
              <SelectItem value="48h">48h</SelectItem>
              <SelectItem value="72h">72h</SelectItem>
              <SelectItem value="maior_72h">&gt;72h</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="medidasReduzirDisputas">Medidas em andamento para reduzir disputas *</Label>
          <Input
            id="medidasReduzirDisputas"
            value={formData.medidasReduzirDisputas || ''}
            onChange={(e) => handleChange('medidasReduzirDisputas', e.target.value)}
            placeholder="Descreva as medidas implementadas ou planejadas"
          />
        </div>
      </div>
    </div>
  );
}