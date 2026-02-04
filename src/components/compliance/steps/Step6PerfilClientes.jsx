import React from 'react';
import { Users } from 'lucide-react';
import FormSection from '../FormSection';
import FormField from '../FormField';
import SelectionButton from '../SelectionButton';
import { Label } from '@/components/ui/label';

export default function Step6PerfilClientes({ formData, handleChange }) {
  const tipoClientesOptions = [
    { value: 'B2C', label: 'Pessoa Física (B2C)', description: 'Consumidores finais' },
    { value: 'B2B', label: 'Pessoa Jurídica (B2B)', description: 'Empresas' },
    { value: 'Ambos', label: 'Ambos', description: 'PF e PJ' }
  ];

  const proporcaoInternacionalOptions = [
    { value: '0%', label: '0%', description: 'Somente nacional' },
    { value: '1-25%', label: '1-25%', description: 'Baixa proporção' },
    { value: '26-50%', label: '26-50%', description: 'Média proporção' },
    { value: '50%+', label: '50%+', description: 'Alta proporção' }
  ];

  return (
    <FormSection
      title="Perfil de Clientes"
      subtitle="Quem é seu público-alvo e como ele se comporta."
      icon={Users}
    >
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">
          Tipo de Clientes <span className="text-red-500">*</span>
        </Label>
        <SelectionButton
          options={tipoClientesOptions}
          value={formData.tipoClientes}
          onChange={(value) => handleChange('tipoClientes', value)}
          columns={3}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">
          Proporção de Clientes Internacionais <span className="text-red-500">*</span>
        </Label>
        <SelectionButton
          options={proporcaoInternacionalOptions}
          value={formData.proporcaoInternacional}
          onChange={(value) => handleChange('proporcaoInternacional', value)}
          columns={4}
        />
      </div>
      
      <FormField
        label="Principais Clientes"
        type="textarea"
        value={formData.principaisClientes}
        onChange={(value) => handleChange('principaisClientes', value)}
        placeholder="Descreva seus principais clientes ou segmentos de mercado."
        rows={3}
      />
    </FormSection>
  );
}