import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, Package, Laptop } from 'lucide-react';

export default function StepL2ModeloNegocio({ formData, handleChange }) {
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

  const quemEntrega = ["próprio", "transportadora", "correios", "terceiro"];
  const comoComprovaFisico = ["rastreio", "canhoto", "confirmação digital", "não comprova"];
  const comoComprovaDigital = ["logs/sistema", "e-mail de entrega", "agenda/ordem de serviço", "termo/aceite", "não comprova"];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-xl bg-[var(--pagsmile-green)]/10">
          <Briefcase className="w-6 h-6 text-[var(--pagsmile-green)]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--pagsmile-blue)]">
            Modelo de Negócio e Entrega
          </h2>
          <p className="text-[var(--pagsmile-blue)]/70">
            Informe como sua empresa opera e entrega seus produtos/serviços
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Modelo de Negócio */}
        <div className="space-y-2">
          <Label className="text-[var(--pagsmile-blue)] font-semibold">
            Modelo de Negócio Principal <span className="text-red-500">*</span>
          </Label>
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

        {/* Canal de Venda */}
        <div className="space-y-2">
          <Label className="text-[var(--pagsmile-blue)] font-semibold">
            Canal de Venda Principal <span className="text-red-500">*</span>
          </Label>
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

        {/* Entrega Produto Físico */}
        <div className="space-y-2">
          <Label className="text-[var(--pagsmile-blue)] font-semibold">
            Vocês entregam produto físico? <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleChange('entregaProdutoFisico', true)}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                formData.entregaProdutoFisico === true
                  ? 'border-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Package className="w-6 h-6 mx-auto mb-2 text-[var(--pagsmile-blue)]" />
              <p className="font-semibold text-[var(--pagsmile-blue)]">Sim</p>
            </button>
            <button
              type="button"
              onClick={() => handleChange('entregaProdutoFisico', false)}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                formData.entregaProdutoFisico === false
                  ? 'border-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Package className="w-6 h-6 mx-auto mb-2 text-slate-400" />
              <p className="font-semibold text-[var(--pagsmile-blue)]">Não</p>
            </button>
          </div>
        </div>

        {/* Condicionais para Produto Físico */}
        {formData.entregaProdutoFisico === true && (
          <div className="space-y-6 p-6 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-sm font-medium text-[var(--pagsmile-blue)]/80">Detalhes da entrega física:</p>
            
            <div className="space-y-2">
              <Label className="text-[var(--pagsmile-blue)] font-semibold">
                Quem realiza a entrega? <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.quemRealizaEntrega || ''}
                onValueChange={(v) => handleChange('quemRealizaEntrega', v)}
              >
                <SelectTrigger className="h-12 bg-white">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {quemEntrega.map((quem) => (
                    <SelectItem key={quem} value={quem}>{quem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[var(--pagsmile-blue)] font-semibold">
                Como vocês comprovam entrega? <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.comoComprovaEntregaFisica || ''}
                onValueChange={(v) => handleChange('comoComprovaEntregaFisica', v)}
              >
                <SelectTrigger className="h-12 bg-white">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {comoComprovaFisico.map((como) => (
                    <SelectItem key={como} value={como}>{como}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Entrega Digital/Serviço */}
        <div className="space-y-2">
          <Label className="text-[var(--pagsmile-blue)] font-semibold">
            Vocês entregam produto digital ou prestam serviço? <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleChange('entregaDigitalServico', true)}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                formData.entregaDigitalServico === true
                  ? 'border-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Laptop className="w-6 h-6 mx-auto mb-2 text-[var(--pagsmile-blue)]" />
              <p className="font-semibold text-[var(--pagsmile-blue)]">Sim</p>
            </button>
            <button
              type="button"
              onClick={() => handleChange('entregaDigitalServico', false)}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                formData.entregaDigitalServico === false
                  ? 'border-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Laptop className="w-6 h-6 mx-auto mb-2 text-slate-400" />
              <p className="font-semibold text-[var(--pagsmile-blue)]">Não</p>
            </button>
          </div>
        </div>

        {/* Condicionais para Digital/Serviço */}
        {formData.entregaDigitalServico === true && (
          <div className="space-y-6 p-6 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-sm font-medium text-[var(--pagsmile-blue)]/80">Detalhes da entrega digital/serviço:</p>
            
            <div className="space-y-2">
              <Label className="text-[var(--pagsmile-blue)] font-semibold">
                Como vocês comprovam entrega/prestação? <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.comoComprovaEntregaDigital || ''}
                onValueChange={(v) => handleChange('comoComprovaEntregaDigital', v)}
              >
                <SelectTrigger className="h-12 bg-white">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {comoComprovaDigital.map((como) => (
                    <SelectItem key={como} value={como}>{como}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}