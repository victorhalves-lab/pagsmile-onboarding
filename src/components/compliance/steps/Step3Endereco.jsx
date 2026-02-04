import React from 'react';
import { MapPin } from 'lucide-react';
import FormSection from '../FormSection';
import FormField from '../FormField';

export default function Step3Endereco({ formData, handleChange }) {
  return (
    <FormSection
      title="Endereço Comercial"
      subtitle="Endereço da sede e outras unidades."
      icon={MapPin}
    >
      <FormField
        label="Endereço Registrado"
        required
        type="textarea"
        value={formData.enderecoComercial}
        onChange={(value) => handleChange('enderecoComercial', value)}
        placeholder="Rua, número, complemento, bairro, cidade, estado"
        rows={3}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="CEP"
          value={formData.cep}
          onChange={(value) => handleChange('cep', value)}
          placeholder="00000-000"
        />
        
        <FormField
          label="Estado"
          value={formData.estado}
          onChange={(value) => handleChange('estado', value)}
          placeholder="Ex: São Paulo"
        />
      </div>
      
      <FormField
        label="Outros Endereços/Unidades"
        type="textarea"
        value={formData.outrosEnderecos}
        onChange={(value) => handleChange('outrosEnderecos', value)}
        placeholder="Informe se a empresa possui outros endereços ou filiais."
        rows={3}
      />
    </FormSection>
  );
}