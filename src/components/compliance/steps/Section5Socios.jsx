import React from 'react';
import { UserCheck, Plus, Trash2 } from 'lucide-react';
import FormSection from '../FormSection';
import FormField from '../FormField';
import SelectionButton from '../SelectionButton';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Section5Socios({ formData, handleChange, handleArrayChange, handleAddArrayItem, handleRemoveArrayItem }) {
  const cargoOptions = [
    { value: 'Sócio', label: 'Sócio' },
    { value: 'Administrador', label: 'Administrador' },
    { value: 'Diretor Executivo', label: 'Diretor Executivo' },
    { value: 'Procurador', label: 'Procurador' }
  ];

  const socios = formData.socios || [];

  const addSocio = () => {
    handleAddArrayItem('socios', {
      nome: '',
      cargo: '',
      cpf: '',
      email: '',
      isPEP: null
    });
  };

  return (
    <FormSection
      title="Sócios e Administradores"
      subtitle="Informe os dados dos gestores e pessoas chave."
      icon={UserCheck}
    >
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-slate-700">
          Lista de Sócios e Administradores
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSocio}
          className="text-[var(--pagsmile-green)] border-[var(--pagsmile-green)]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Pessoa
        </Button>
      </div>

      {socios.map((socio, index) => (
        <div key={index} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-800">Pessoa {index + 1}</h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveArrayItem('socios', index)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Nome Completo"
              required
              value={socio.nome}
              onChange={(value) => handleArrayChange('socios', index, 'nome', value)}
              placeholder="Nome"
            />

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Cargo <span className="text-red-500">*</span>
              </Label>
              <Select
                value={socio.cargo}
                onValueChange={(value) => handleArrayChange('socios', index, 'cargo', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {cargoOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="CPF"
              required
              value={socio.cpf}
              onChange={(value) => handleArrayChange('socios', index, 'cpf', value)}
              placeholder="000.000.000-00"
            />

            <FormField
              label="E-mail"
              required
              type="email"
              value={socio.email}
              onChange={(value) => handleArrayChange('socios', index, 'email', value)}
              placeholder="email@empresa.com"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              É PEP (Pessoa Politicamente Exposta)? <span className="text-red-500">*</span>
            </Label>
            <SelectionButton
              options={[
                { value: true, label: 'Sim' },
                { value: false, label: 'Não' }
              ]}
              value={socio.isPEP}
              onChange={(value) => handleArrayChange('socios', index, 'isPEP', value)}
              columns={2}
            />
          </div>
        </div>
      ))}

      {socios.length === 0 && (
        <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
          <UserCheck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>Nenhum sócio ou administrador adicionado.</p>
          <p className="text-sm">Clique em "Adicionar Pessoa" para incluir.</p>
        </div>
      )}
    </FormSection>
  );
}