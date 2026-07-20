import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Building2 } from 'lucide-react';

export default function StepL1Identificacao({ formData, handleChange }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-xl bg-[var(--pinbank-blue)]/10">
          <Building2 className="w-6 h-6 text-[var(--pinbank-blue)]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--pinbank-blue)]">
            Identificação da Empresa
          </h2>
          <p className="text-[var(--pinbank-blue)]/70">
            Informe os dados básicos da sua empresa
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* CNPJ */}
        <div className="space-y-2">
          <Label className="text-[var(--pinbank-blue)] font-semibold">
            CNPJ <span className="text-red-500">*</span>
          </Label>
          <Input
            value={formData.cnpj || ''}
            onChange={(e) => handleChange('cnpj', e.target.value)}
            placeholder="00.000.000/0001-00"
            className="h-12"
          />
          <p className="text-xs text-[var(--pinbank-blue)]/60">
            Informe o CNPJ da empresa, apenas números ou com formatação
          </p>
        </div>

        {/* Razão Social */}
        <div className="space-y-2">
          <Label className="text-[var(--pinbank-blue)] font-semibold">
            Razão Social <span className="text-red-500">*</span>
          </Label>
          <Input
            value={formData.razaoSocial || ''}
            onChange={(e) => handleChange('razaoSocial', e.target.value)}
            placeholder="Nome empresarial conforme CNPJ"
            className="h-12"
          />
        </div>

        {/* Nome Fantasia */}
        <div className="space-y-2">
          <Label className="text-[var(--pinbank-blue)] font-semibold">
            Nome Fantasia <span className="text-[var(--pinbank-blue)]/50 text-sm">(opcional)</span>
          </Label>
          <Input
            value={formData.nomeFantasia || ''}
            onChange={(e) => handleChange('nomeFantasia', e.target.value)}
            placeholder="Nome comercial da empresa"
            className="h-12"
          />
        </div>

        {/* Endereço Comercial */}
        <div className="space-y-2">
          <Label className="text-[var(--pinbank-blue)] font-semibold">
            Endereço Comercial Completo <span className="text-red-500">*</span>
          </Label>
          <Textarea
            value={formData.enderecoComercial || ''}
            onChange={(e) => handleChange('enderecoComercial', e.target.value)}
            placeholder="Rua, número, complemento, bairro, cidade, estado, CEP"
            className="min-h-[100px]"
          />
          <p className="text-xs text-[var(--pinbank-blue)]/60">
            Informe o endereço completo, incluindo CEP
          </p>
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label className="text-[var(--pinbank-blue)] font-semibold">
            Website / Domínio Principal <span className="text-[var(--pinbank-blue)]/50 text-sm">(opcional)</span>
          </Label>
          <Input
            value={formData.website || ''}
            onChange={(e) => handleChange('website', e.target.value)}
            placeholder="www.suaempresa.com.br"
            className="h-12"
          />
        </div>

        {/* Descrição do Negócio */}
        <div className="space-y-2">
          <Label className="text-[var(--pinbank-blue)] font-semibold">
            Descrição Curta do Negócio <span className="text-red-500">*</span>
          </Label>
          <Textarea
            value={formData.descricaoNegocio || ''}
            onChange={(e) => handleChange('descricaoNegocio', e.target.value)}
            placeholder="O que você vende e para quem? (2-3 linhas)"
            className="min-h-[100px]"
          />
          <p className="text-xs text-[var(--pinbank-blue)]/60">
            Descreva brevemente o que sua empresa faz, quais produtos/serviços oferece e quem são seus clientes
          </p>
        </div>
      </div>
    </div>
  );
}