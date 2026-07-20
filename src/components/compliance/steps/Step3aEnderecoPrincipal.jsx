import React from 'react';
import { MapPin } from 'lucide-react';
import FormSection from '../FormSection';
import FormField from '../FormField';

export default function Step3aEnderecoPrincipal({ formData, handleChange }) {
  return (
    <FormSection
      title="Endereço Comercial"
      subtitle="Endereço da sede conforme cartão CNPJ."
      icon={MapPin}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <FormField
            label="CEP"
            required
            value={formData.cep}
            onChange={(value) => handleChange('cep', value)}
            placeholder="00000-000"
            className="text-[var(--pinbank-blue)]"
          />
        </div>
        <div className="md:col-span-2">
          <FormField
            label="Logradouro"
            required
            value={formData.logradouro}
            onChange={(value) => handleChange('logradouro', value)}
            placeholder="Rua, Avenida, etc."
            className="text-[var(--pinbank-blue)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <FormField
            label="Número"
            required
            value={formData.numero}
            onChange={(value) => handleChange('numero', value)}
            placeholder="Nº"
            className="text-[var(--pinbank-blue)]"
          />
        </div>
        <div className="md:col-span-2">
          <FormField
            label="Complemento"
            value={formData.complemento}
            onChange={(value) => handleChange('complemento', value)}
            placeholder="Sala, Bloco, Andar (opcional)"
            className="text-[var(--pinbank-blue)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <FormField
            label="Bairro"
            required
            value={formData.bairro}
            onChange={(value) => handleChange('bairro', value)}
            placeholder="Bairro"
            className="text-[var(--pinbank-blue)]"
          />
        </div>
        <div className="md:col-span-1">
          <FormField
            label="Cidade"
            required
            value={formData.cidade}
            onChange={(value) => handleChange('cidade', value)}
            placeholder="Cidade"
            className="text-[var(--pinbank-blue)]"
          />
        </div>
        <div className="md:col-span-1">
          <FormField
            label="Estado (UF)"
            required
            value={formData.estado}
            onChange={(value) => handleChange('estado', value)}
            placeholder="UF"
            maxLength={2}
            className="text-[var(--pinbank-blue)]"
          />
        </div>
      </div>
    </FormSection>
  );
}