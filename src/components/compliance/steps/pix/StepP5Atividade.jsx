import React from 'react';
import { Briefcase } from 'lucide-react';
import FormSection from '../../FormSection';
import FormField from '../../FormField';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function StepP5Atividade({ formData, handleChange }) {
  return (
    <FormSection
      title="Atividade Principal"
      subtitle="O que sua empresa faz."
      icon={Briefcase}
    >
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">Tipo de produto/serviço principal</Label>
        <Select 
          value={formData.tipoProdutoPrincipal} 
          onValueChange={(val) => handleChange('tipoProdutoPrincipal', val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="software_saas">Software (SaaS)</SelectItem>
            <SelectItem value="ecommerce">E-commerce (Varejo)</SelectItem>
            <SelectItem value="servicos_digitais">Serviços Digitais</SelectItem>
            <SelectItem value="hardware">Hardware/Eletrônicos</SelectItem>
            <SelectItem value="financeiro">Serviços Financeiros</SelectItem>
            <SelectItem value="educacao">Educação/Cursos</SelectItem>
            <SelectItem value="games">Jogos/Games</SelectItem>
            <SelectItem value="turismo">Turismo/Viagens</SelectItem>
            <SelectItem value="saude">Saúde/Bem-estar</SelectItem>
            <SelectItem value="alimentacao">Alimentação/Delivery</SelectItem>
            <SelectItem value="outros">Outros</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <FormField
        label="Descreva brevemente os produtos/serviços"
        type="textarea"
        value={formData.descricaoProdutos}
        onChange={(val) => handleChange('descricaoProdutos', val)}
        placeholder="Ex: Vendemos roupas masculinas e femininas..."
        rows={3}
      />
    </FormSection>
  );
}