import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Building2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PLATAFORMAS = [
  'VTEX',
  'Shopify',
  'Magento',
  'WooCommerce',
  'Outra'
];

export default function StepE1Identificacao({ formData, handleChange }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-orange-100">
          <Building2 className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--pinbank-blue)]">Identificação da Empresa</h2>
          <p className="text-sm text-[var(--pinbank-blue)]/60">Dados básicos do seu e-commerce</p>
        </div>
      </div>

      <div className="grid gap-5">
        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ *</Label>
          <Input
            id="cnpj"
            value={formData.cnpj || ''}
            onChange={(e) => handleChange('cnpj', e.target.value)}
            placeholder="00.000.000/0000-00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="razaoSocial">Razão Social *</Label>
          <Input
            id="razaoSocial"
            value={formData.razaoSocial || ''}
            onChange={(e) => handleChange('razaoSocial', e.target.value)}
            placeholder="Nome empresarial completo"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
          <Input
            id="nomeFantasia"
            value={formData.nomeFantasia || ''}
            onChange={(e) => handleChange('nomeFantasia', e.target.value)}
            placeholder="Nome comercial (opcional)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="urlDominio">URL do domínio principal da loja *</Label>
          <Input
            id="urlDominio"
            type="url"
            value={formData.urlDominio || ''}
            onChange={(e) => handleChange('urlDominio', e.target.value)}
            placeholder="https://www.minhaloja.com.br"
          />
        </div>

        <div className="space-y-2">
          <Label>Plataforma de e-commerce *</Label>
          <Select
            value={formData.plataformaEcommerce || ''}
            onValueChange={(value) => handleChange('plataformaEcommerce', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a plataforma" />
            </SelectTrigger>
            <SelectContent>
              {PLATAFORMAS.map((plat) => (
                <SelectItem key={plat} value={plat}>{plat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {formData.plataformaEcommerce === 'Outra' && (
          <div className="space-y-2">
            <Label htmlFor="outraPlataforma">Qual plataforma?</Label>
            <Input
              id="outraPlataforma"
              value={formData.outraPlataforma || ''}
              onChange={(e) => handleChange('outraPlataforma', e.target.value)}
              placeholder="Nome da plataforma"
            />
          </div>
        )}
      </div>
    </div>
  );
}