import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase } from 'lucide-react';

export default function StepL2aModelo({ formData, handleChange }) {
  const modelosNegocio = [
    "E-commerce (produto físico)",
    "Produto digital / infoproduto",
    "Prestação de serviços",
    "SaaS / assinatura",
    "Marketplace",
    "Outro"
  ];

  const canaisVenda = [
    "Site próprio",
    "App próprio",
    "Checkout/link de pagamento",
    "Redes sociais / WhatsApp",
    "Marketplaces (ex.: Mercado Livre, Shopee etc.)",
    "Outro"
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-xl bg-[var(--pinbank-blue)]/10">
          <Briefcase className="w-6 h-6 text-[var(--pinbank-blue)]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--pinbank-blue)]">
            Modelo de Negócio
          </h2>
          <p className="text-[var(--pinbank-blue)]/70">
            Como sua empresa opera
          </p>
        </div>
      </div>

      <div className="grid gap-5">
        <div className="space-y-2">
          <Label className="text-[var(--pinbank-blue)] font-semibold">Modelo de Negócio Principal</Label>
          <Select
            value={formData.modeloNegocio || ''}
            onValueChange={(v) => handleChange('modeloNegocio', v)}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Selecione o modelo de negócio" />
            </SelectTrigger>
            <SelectContent>
              {modelosNegocio.map((modelo) => (
                <SelectItem key={modelo} value={modelo}>{modelo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[var(--pinbank-blue)] font-semibold">Canal de Venda Principal</Label>
          <Select
            value={formData.canalVenda || ''}
            onValueChange={(v) => handleChange('canalVenda', v)}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Selecione o canal de venda" />
            </SelectTrigger>
            <SelectContent>
              {canaisVenda.map((canal) => (
                <SelectItem key={canal} value={canal}>{canal}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}