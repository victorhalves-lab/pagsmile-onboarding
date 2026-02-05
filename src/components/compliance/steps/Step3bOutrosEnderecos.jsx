import React from 'react';
import { Building2 } from 'lucide-react';
import FormSection from '../FormSection';
import FormField from '../FormField';

export default function Step3bOutrosEnderecos({ formData, handleChange }) {
  return (
    <FormSection
      title="Outros Endereços"
      subtitle="Filiais ou escritórios adicionais."
      icon={Building2}
    >
      <FormField
        label="Endereço de Demais Escritórios (opcional)"
        type="textarea"
        value={formData.outrosEnderecos}
        onChange={(value) => handleChange('outrosEnderecos', value)}
        placeholder="Caso possua outros escritórios, informe os endereços completos aqui..."
        rows={6}
        className="text-[var(--pagsmile-blue)]"
      />
    </FormSection>
  );
}