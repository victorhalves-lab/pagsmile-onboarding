import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserCheck } from 'lucide-react';

export default function StepL3EstruturaSocietaria({ formData, handleChange }) {
  const tiposEmpresa = ["LTDA", "SA", "Empresário Individual", "MEI", "Outro"];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-xl bg-[var(--pagsmile-green)]/10">
          <Users className="w-6 h-6 text-[var(--pagsmile-green)]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--pagsmile-blue)]">
            Estrutura Societária
          </h2>
          <p className="text-[var(--pagsmile-blue)]/70">
            Informações sobre a estrutura legal e representantes da empresa
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Tipo de Empresa */}
        <div className="space-y-2">
          <Label className="text-[var(--pagsmile-blue)] font-semibold">
            Tipo de Empresa <span className="text-red-500">*</span>
          </Label>
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
        <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-6">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-[var(--pagsmile-green)]" />
            <p className="font-semibold text-[var(--pagsmile-blue)]">Representante Legal</p>
          </div>

          <div className="space-y-2">
            <Label className="text-[var(--pagsmile-blue)] font-semibold">
              Nome Completo <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.representanteLegalNome || ''}
              onChange={(e) => handleChange('representanteLegalNome', e.target.value)}
              placeholder="Nome completo do representante legal"
              className="h-12 bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[var(--pagsmile-blue)] font-semibold">
              CPF <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.representanteLegalCPF || ''}
              onChange={(e) => handleChange('representanteLegalCPF', e.target.value)}
              placeholder="000.000.000-00"
              className="h-12 bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[var(--pagsmile-blue)] font-semibold">
              E-mail <span className="text-red-500">*</span>
            </Label>
            <Input
              type="email"
              value={formData.representanteLegalEmail || ''}
              onChange={(e) => handleChange('representanteLegalEmail', e.target.value)}
              placeholder="email@empresa.com.br"
              className="h-12 bg-white"
            />
          </div>
        </div>

        {/* UBO */}
        <div className="space-y-2">
          <Label className="text-[var(--pagsmile-blue)] font-semibold">
            Existe Beneficiário Final (UBO) com mais de 25%? <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleChange('existeUBO', true)}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                formData.existeUBO === true
                  ? 'border-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="font-semibold text-[var(--pagsmile-blue)]">Sim</p>
            </button>
            <button
              type="button"
              onClick={() => handleChange('existeUBO', false)}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                formData.existeUBO === false
                  ? 'border-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="font-semibold text-[var(--pagsmile-blue)]">Não</p>
            </button>
          </div>
          <p className="text-xs text-[var(--pagsmile-blue)]/60">
            UBO = Ultimate Beneficial Owner (pessoa física que detém mais de 25% da empresa, direta ou indiretamente)
          </p>
        </div>

        {/* Condicional UBO */}
        {formData.existeUBO === true && (
          <div className="space-y-4 p-6 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-sm font-medium text-[var(--pagsmile-blue)]/80">
              Informe os Beneficiários Finais:
            </p>
            <div className="space-y-2">
              <Label className="text-[var(--pagsmile-blue)] font-semibold">
                Liste os UBOs (Nome; CPF; %) <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={formData.listaUBO || ''}
                onChange={(e) => handleChange('listaUBO', e.target.value)}
                placeholder="Ex: João Silva; 123.456.789-00; 30%&#10;Maria Santos; 987.654.321-00; 40%"
                className="min-h-[120px] bg-white"
              />
              <p className="text-xs text-[var(--pagsmile-blue)]/60">
                Separe cada beneficiário em uma linha. Formato: Nome; CPF; Percentual
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}