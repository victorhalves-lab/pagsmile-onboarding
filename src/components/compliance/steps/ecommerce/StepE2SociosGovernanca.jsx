import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, Plus, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TIPOS_SOCIETARIOS = [
  'LTDA',
  'S.A.',
  'Empresário Individual',
  'MEI',
  'Outro'
];

export default function StepE2SociosGovernanca({ formData, handleChange }) {
  const socios = formData.quadroSocietario || [];

  const addSocio = () => {
    handleChange('quadroSocietario', [
      ...socios,
      { nome: '', cpfCnpj: '', participacao: '', socioAdministrador: 'Não' }
    ]);
  };

  const updateSocio = (index, field, value) => {
    const updated = [...socios];
    updated[index] = { ...updated[index], [field]: value };
    handleChange('quadroSocietario', updated);
  };

  const removeSocio = (index) => {
    handleChange('quadroSocietario', socios.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-purple-100">
          <Users className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--pinbank-blue)]">Sócios e Governança</h2>
          <p className="text-sm text-[var(--pinbank-blue)]/60">Estrutura societária da empresa</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tipo societário *</Label>
        <Select
          value={formData.tipoSocietario || ''}
          onValueChange={(value) => handleChange('tipoSocietario', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            {TIPOS_SOCIETARIOS.map((tipo) => (
              <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quadro Societário */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Quadro Societário *</Label>
          <Button type="button" variant="outline" size="sm" onClick={addSocio}>
            <Plus className="w-4 h-4 mr-1" /> Adicionar Sócio
          </Button>
        </div>

        {socios.length === 0 && (
          <p className="text-sm text-slate-500 p-4 bg-slate-50 rounded-lg text-center">
            Clique em "Adicionar Sócio" para incluir os sócios/acionistas
          </p>
        )}

        {socios.map((socio, index) => (
          <div key={index} className="p-4 bg-slate-50 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-600">Sócio {index + 1}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeSocio(index)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="Nome / Razão Social"
                value={socio.nome}
                onChange={(e) => updateSocio(index, 'nome', e.target.value)}
              />
              <Input
                placeholder="CPF/CNPJ"
                value={socio.cpfCnpj}
                onChange={(e) => updateSocio(index, 'cpfCnpj', e.target.value)}
              />
              <Input
                placeholder="% participação"
                type="number"
                value={socio.participacao}
                onChange={(e) => updateSocio(index, 'participacao', e.target.value)}
              />
              <Select
                value={socio.socioAdministrador}
                onValueChange={(value) => updateSocio(index, 'socioAdministrador', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sócio administrador?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sim">Sim - Administrador</SelectItem>
                  <SelectItem value="Não">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}