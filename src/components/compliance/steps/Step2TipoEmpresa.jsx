import React from 'react';
import { FileText } from 'lucide-react';
import FormSection from '../FormSection';
import SelectionButton from '../SelectionButton';
import { Label } from '@/components/ui/label';

export default function Step2TipoEmpresa({ formData, handleChange }) {
  const tipoEmpresaOptions = [
    { value: 'LTDA', label: 'LTDA', description: 'Sociedade Limitada' },
    { value: 'SA', label: 'SA', description: 'Sociedade Anônima' },
    { value: 'EIRELI', label: 'EIRELI', description: 'Empresa Individual' },
    { value: 'MEI', label: 'MEI', description: 'Microempreendedor Individual' },
    { value: 'SLU', label: 'SLU', description: 'Sociedade Limitada Unipessoal' },
    { value: 'Outro', label: 'Outro', description: 'Outro tipo' }
  ];

  const qtdColaboradoresOptions = [
    { value: '1-5', label: '1-5', description: 'Micro empresa' },
    { value: '6-10', label: '6-10', description: 'Pequena empresa' },
    { value: '11-50', label: '11-50', description: 'Média empresa' },
    { value: '50+', label: '50+', description: 'Grande empresa' }
  ];

  return (
    <FormSection
      title="Tipo de Empresa"
      subtitle="Natureza jurídica e estrutura da sua organização."
      icon={FileText}
    >
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">
          Tipo de Empresa <span className="text-red-500">*</span>
        </Label>
        <SelectionButton
          options={tipoEmpresaOptions}
          value={formData.tipoEmpresa}
          onChange={(value) => handleChange('tipoEmpresa', value)}
          columns={3}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">
          Número de Colaboradores <span className="text-red-500">*</span>
        </Label>
        <SelectionButton
          options={qtdColaboradoresOptions}
          value={formData.qtdColaboradores}
          onChange={(value) => handleChange('qtdColaboradores', value)}
          columns={4}
        />
      </div>
    </FormSection>
  );
}