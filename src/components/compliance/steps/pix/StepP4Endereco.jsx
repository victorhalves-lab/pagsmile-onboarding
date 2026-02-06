import React from 'react';
import { MapPin } from 'lucide-react';
import FormSection from '../../FormSection';
import FormField from '../../FormField';

export default function StepP4Endereco({ formData, handleChange }) {
  return (
    <FormSection
      title="Endereço Comercial"
      subtitle="Endereço da sede conforme cartão CNPJ."
      icon={MapPin}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          label="CEP"
          value={formData.cep}
          onChange={(value) => handleChange('cep', value)}
          placeholder="00000-000"
        />
        <div className="md:col-span-2">
          <FormField
            label="Logradouro"
            value={formData.logradouro}
            onChange={(value) => handleChange('logradouro', value)}
            placeholder="Rua, Avenida, etc."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FormField
          label="Número"
          value={formData.numero}
          onChange={(value) => handleChange('numero', value)}
          placeholder="Nº"
        />
        <div className="md:col-span-3">
          <FormField
            label="Complemento"
            value={formData.complemento}
            onChange={(value) => handleChange('complemento', value)}
            placeholder="Sala, Bloco, Andar (opcional)"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          label="Bairro"
          value={formData.bairro}
          onChange={(value) => handleChange('bairro', value)}
          placeholder="Bairro"
        />
        <FormField
          label="Cidade"
          value={formData.cidade}
          onChange={(value) => handleChange('cidade', value)}
          placeholder="Cidade"
        />
        <FormField
          label="Estado (UF)"
          value={formData.estado}
          onChange={(value) => handleChange('estado', value)}
          placeholder="UF"
          maxLength={2}
        />
      </div>
    </FormSection>
  );
}