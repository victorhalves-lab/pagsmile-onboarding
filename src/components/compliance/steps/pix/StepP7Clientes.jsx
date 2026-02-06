import React from 'react';
import { Users } from 'lucide-react';
import FormSection from '../../FormSection';
import FormField from '../../FormField';
import SelectionButton from '../../SelectionButton';
import { Label } from '@/components/ui/label';

export default function StepP7Clientes({ formData, handleChange }) {
  const tipoClientesOptions = [
    { value: 'B2C', label: 'Pessoa Física (B2C)', description: 'Consumidores finais' },
    { value: 'B2B', label: 'Pessoa Jurídica (B2B)', description: 'Empresas' },
    { value: 'Ambos', label: 'Ambos', description: 'PF e PJ' }
  ];

  const proporcaoInternacionalOptions = [
    { value: '0%', label: '0%' },
    { value: '1-25%', label: '1-25%' },
    { value: '26-50%', label: '26-50%' },
    { value: '50%+', label: '50%+' }
  ];

  return (
    <FormSection
      title="Perfil de Clientes"
      subtitle="Quem é seu público-alvo."
      icon={Users}
    >
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">Tipo de Clientes</Label>
        <SelectionButton
          options={tipoClientesOptions}
          value={formData.tipoClientes}
          onChange={(value) => handleChange('tipoClientes', value)}
          columns={3}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">Clientes Internacionais</Label>
        <SelectionButton
          options={proporcaoInternacionalOptions}
          value={formData.proporcaoInternacional}
          onChange={(value) => handleChange('proporcaoInternacional', value)}
          columns={4}
        />
      </div>
      
      <FormField
        label="Principais Clientes (opcional)"
        type="textarea"
        value={formData.principaisClientes}
        onChange={(value) => handleChange('principaisClientes', value)}
        placeholder="Descreva seus principais clientes ou segmentos."
        rows={2}
      />
    </FormSection>
  );
}