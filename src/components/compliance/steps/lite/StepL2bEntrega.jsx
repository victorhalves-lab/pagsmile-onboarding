import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Laptop } from 'lucide-react';

export default function StepL2bEntrega({ formData, handleChange }) {
  const quemEntrega = ["próprio", "transportadora", "correios", "terceiro"];
  const comoComprovaFisico = ["rastreio", "canhoto", "confirmação digital", "não comprova"];
  const comoComprovaDigital = ["logs/sistema", "e-mail de entrega", "agenda/ordem de serviço", "termo/aceite", "não comprova"];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-xl bg-[var(--pinbank-blue)]/10">
          <Package className="w-6 h-6 text-[var(--pinbank-blue)]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--pinbank-blue)]">
            Entrega de Produtos
          </h2>
          <p className="text-[var(--pinbank-blue)]/70">
            Como você entrega ao cliente
          </p>
        </div>
      </div>

      <div className="grid gap-5">
        {/* Entrega Produto Físico */}
        <div className="space-y-2">
          <Label className="text-[var(--pinbank-blue)] font-semibold">Vocês entregam produto físico?</Label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleChange('entregaProdutoFisico', true)}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                formData.entregaProdutoFisico === true
                  ? 'border-[var(--pinbank-blue)] bg-[var(--pinbank-blue)]/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Package className="w-5 h-5 mx-auto mb-1 text-[var(--pinbank-blue)]" />
              <p className="font-semibold text-[var(--pinbank-blue)] text-sm">Sim</p>
            </button>
            <button
              type="button"
              onClick={() => handleChange('entregaProdutoFisico', false)}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                formData.entregaProdutoFisico === false
                  ? 'border-[var(--pinbank-blue)] bg-[var(--pinbank-blue)]/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Package className="w-5 h-5 mx-auto mb-1 text-slate-400" />
              <p className="font-semibold text-[var(--pinbank-blue)] text-sm">Não</p>
            </button>
          </div>
        </div>

        {/* Condicionais para Produto Físico */}
        {formData.entregaProdutoFisico === true && (
          <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="space-y-2">
              <Label className="text-[var(--pinbank-blue)] font-semibold text-sm">Quem realiza a entrega?</Label>
              <Select
                value={formData.quemRealizaEntrega || ''}
                onValueChange={(v) => handleChange('quemRealizaEntrega', v)}
              >
                <SelectTrigger className="h-11 bg-white">
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
              <Label className="text-[var(--pinbank-blue)] font-semibold text-sm">Como vocês comprovam entrega?</Label>
              <Select
                value={formData.comoComprovaEntregaFisica || ''}
                onValueChange={(v) => handleChange('comoComprovaEntregaFisica', v)}
              >
                <SelectTrigger className="h-11 bg-white">
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
          <Label className="text-[var(--pinbank-blue)] font-semibold">Vocês entregam produto digital ou prestam serviço?</Label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleChange('entregaDigitalServico', true)}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                formData.entregaDigitalServico === true
                  ? 'border-[var(--pinbank-blue)] bg-[var(--pinbank-blue)]/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Laptop className="w-5 h-5 mx-auto mb-1 text-[var(--pinbank-blue)]" />
              <p className="font-semibold text-[var(--pinbank-blue)] text-sm">Sim</p>
            </button>
            <button
              type="button"
              onClick={() => handleChange('entregaDigitalServico', false)}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                formData.entregaDigitalServico === false
                  ? 'border-[var(--pinbank-blue)] bg-[var(--pinbank-blue)]/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Laptop className="w-5 h-5 mx-auto mb-1 text-slate-400" />
              <p className="font-semibold text-[var(--pinbank-blue)] text-sm">Não</p>
            </button>
          </div>
        </div>

        {/* Condicionais para Digital/Serviço */}
        {formData.entregaDigitalServico === true && (
          <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="space-y-2">
              <Label className="text-[var(--pinbank-blue)] font-semibold text-sm">Como vocês comprovam entrega/prestação?</Label>
              <Select
                value={formData.comoComprovaEntregaDigital || ''}
                onValueChange={(v) => handleChange('comoComprovaEntregaDigital', v)}
              >
                <SelectTrigger className="h-11 bg-white">
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