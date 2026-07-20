import React from 'react';
import { Briefcase } from 'lucide-react';
import FormSection from '../FormSection';
import FormField from '../FormField';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Step4aAtividadePrincipal({ formData, handleChange }) {
  return (
    <FormSection
      title="Atividade Principal"
      subtitle="Conte-nos sobre o que sua empresa faz."
      icon={Briefcase}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[var(--pinbank-blue)]">Qual o principal tipo de produto/serviço? <span className="text-red-500">*</span></Label>
          <Select 
            value={formData.tipoProdutoPrincipal} 
            onValueChange={(val) => handleChange('tipoProdutoPrincipal', val)}
          >
            <SelectTrigger className="border-[var(--pinbank-blue)]/20 text-[var(--pinbank-blue)] focus:ring-[var(--pinbank-blue)]">
              <SelectValue placeholder="Selecione o tipo principal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="software_saas">Software (SaaS)</SelectItem>
              <SelectItem value="ecommerce">E-commerce (Varejo Online)</SelectItem>
              <SelectItem value="servicos_digitais">Serviços Digitais (Consultoria, Marketing)</SelectItem>
              <SelectItem value="hardware">Hardware/Eletrônicos</SelectItem>
              <SelectItem value="financeiro">Serviços Financeiros</SelectItem>
              <SelectItem value="conteudo">Mídia/Conteúdo Digital</SelectItem>
              <SelectItem value="educacao">Educação/Cursos Online</SelectItem>
              <SelectItem value="games">Jogos/Games</SelectItem>
              <SelectItem value="turismo">Turismo/Viagens</SelectItem>
              <SelectItem value="saude">Saúde/Bem-estar</SelectItem>
              <SelectItem value="alimentacao">Alimentação/Delivery</SelectItem>
              <SelectItem value="logistica">Logística/Transporte</SelectItem>
              <SelectItem value="outros">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <FormField
          label="Descreva brevemente todos os produtos/serviços comercializados"
          required
          type="textarea"
          value={formData.descricaoProdutos}
          onChange={(val) => handleChange('descricaoProdutos', val)}
          placeholder="Ex: Vendemos roupas masculinas e femininas, incluindo camisetas, calças jeans..."
          minLength={20}
          rows={5}
          helpText="Mínimo 20 caracteres"
          className="text-[var(--pinbank-blue)]"
        />
      </div>
    </FormSection>
  );
}