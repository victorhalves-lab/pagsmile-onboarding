import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UserX } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ModuleEPEPSancoes({ formData, handleChange }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-rose-100">
          <UserX className="w-5 h-5 text-rose-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--pagsmile-blue)]">Detalhamento PEP/Sanções</h2>
          <p className="text-sm text-[var(--pagsmile-blue)]/60">Informações adicionais sobre exposição</p>
        </div>
      </div>

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
        <p className="text-sm text-amber-800">
          Este módulo foi ativado porque você indicou que há pessoa(s) exposta(s) politicamente ou em listas restritivas.
        </p>
      </div>

      <div className="grid gap-5">
        <div className="space-y-2">
          <Label htmlFor="nomePessoaRelacionada">Nome da pessoa/entidade relacionada *</Label>
          <Input
            id="nomePessoaRelacionada"
            value={formData.nomePessoaRelacionada || ''}
            onChange={(e) => handleChange('nomePessoaRelacionada', e.target.value)}
            placeholder="Nome completo"
          />
        </div>

        <div className="space-y-2">
          <Label>Relação com a empresa *</Label>
          <Select
            value={formData.relacaoComEmpresa || ''}
            onValueChange={(value) => handleChange('relacaoComEmpresa', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Socio">Sócio</SelectItem>
              <SelectItem value="Administrador">Administrador</SelectItem>
              <SelectItem value="UBO">UBO (Beneficiário Final)</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paisResidencia">País de residência *</Label>
          <Input
            id="paisResidencia"
            value={formData.paisResidencia || ''}
            onChange={(e) => handleChange('paisResidencia', e.target.value)}
            placeholder="Ex: Brasil"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contextoPEP">Contexto (2-3 linhas) *</Label>
          <Textarea
            id="contextoPEP"
            value={formData.contextoPEP || ''}
            onChange={(e) => handleChange('contextoPEP', e.target.value)}
            placeholder="Descreva brevemente o contexto da exposição política ou sanção"
            rows={3}
          />
        </div>

        <p className="text-sm text-slate-500">
          Se houver documento de suporte, você poderá anexá-lo na etapa de envio de documentos.
        </p>
      </div>
    </div>
  );
}