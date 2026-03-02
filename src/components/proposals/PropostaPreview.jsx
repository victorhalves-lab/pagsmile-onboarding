import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, CreditCard } from 'lucide-react';

const BANDEIRAS = [
  { id: 'mastercard', label: 'Master' },
  { id: 'visa', label: 'Visa' },
  { id: 'elo', label: 'Elo' },
  { id: 'amex', label: 'Amex' },
  { id: 'outras', label: 'Outras' },
];

function formatTaxa(val) {
  if (!val && val !== 0) return '-';
  const num = typeof val === 'string' ? val.replace(',', '.') : val;
  return `${num}%`;
}

function formatMoeda(val) {
  if (!val && val !== 0) return '-';
  const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  if (isNaN(num)) return '-';
  return `R$ ${num.toFixed(2).replace('.', ',')}`;
}

export default function PropostaPreview({ form, rates }) {
  const [previewBandeira, setPreviewBandeira] = useState('mastercard');
  const cartao = rates?.cartao || {};
  const pix = rates?.pix || {};
  const rav = rates?.rav || {};

  return (
    <Card className="border-slate-200 sticky top-24">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-5 h-5 text-[var(--pagsmile-green)]" />
          Preview da Proposta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dados do Cliente */}
        <div className="bg-slate-50 rounded-lg p-3 space-y-1">
          <p className="font-semibold text-sm text-[var(--pagsmile-blue)]">
            {form.clienteNome || 'Nome da Empresa'}
          </p>
          <p className="text-xs text-[var(--pagsmile-blue)]/60">
            {form.clienteCnpj || 'CNPJ'} • {form.clienteMcc || 'MCC'}
          </p>
        </div>

        {/* Taxas de Cartão */}
        <div>
          <p className="text-xs font-semibold text-[var(--pagsmile-blue)]/70 mb-2 flex items-center gap-1">
            <CreditCard className="w-3 h-3" /> Cartão de Crédito
          </p>
          <Tabs value={previewBandeira} onValueChange={setPreviewBandeira}>
            <TabsList className="w-full grid grid-cols-5 h-8">
              {BANDEIRAS.map(b => (
                <TabsTrigger key={b.id} value={b.id} className="text-[10px] py-1">
                  {b.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {BANDEIRAS.map(b => (
              <TabsContent key={b.id} value={b.id} className="mt-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white border border-slate-100 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-[var(--pagsmile-blue)]/50">À Vista</p>
                    <p className="text-sm font-bold text-[var(--pagsmile-green)]">
                      {formatTaxa(cartao[b.id]?.avista)}
                    </p>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-[var(--pagsmile-blue)]/50">2-6x</p>
                    <p className="text-sm font-bold text-[var(--pagsmile-green)]">
                      {formatTaxa(cartao[b.id]?.de2a6x)}
                    </p>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-[var(--pagsmile-blue)]/50">7-12x</p>
                    <p className="text-sm font-bold text-[var(--pagsmile-green)]">
                      {formatTaxa(cartao[b.id]?.de7a12x)}
                    </p>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* PIX */}
        <div className="flex items-center justify-between py-2 border-t border-slate-100">
          <span className="text-xs text-[var(--pagsmile-blue)]/70">PIX</span>
          <span className="text-sm font-semibold text-[var(--pagsmile-green)]">
            {pix.tipo === 'fixo' ? formatMoeda(pix.valor) : formatTaxa(pix.valor)}
          </span>
        </div>

        {/* Boleto */}
        <div className="flex items-center justify-between py-2 border-t border-slate-100">
          <span className="text-xs text-[var(--pagsmile-blue)]/70">Boleto</span>
          <span className="text-sm font-semibold">
            {formatMoeda(rates?.boleto)}
          </span>
        </div>

        {/* RAV */}
        <div className="flex items-center justify-between py-2 border-t border-slate-100">
          <span className="text-xs text-[var(--pagsmile-blue)]/70">
            RAV ({rav.prazo || 'D+1'})
          </span>
          <span className="text-sm font-semibold">
            {formatTaxa(rav.taxa)} a.m.
          </span>
        </div>

        {/* Fee */}
        {rates?.feeTransacao && (
          <div className="flex items-center justify-between py-2 border-t border-slate-100">
            <span className="text-xs text-[var(--pagsmile-blue)]/70">Fee/Transação</span>
            <span className="text-sm font-semibold">{formatMoeda(rates.feeTransacao)}</span>
          </div>
        )}

        {/* Antifraude */}
        {rates?.alertaPreChargeback && (
          <div className="flex items-center justify-between py-2 border-t border-slate-100">
            <span className="text-xs text-[var(--pagsmile-blue)]/70">Alerta Pré-CB</span>
            <span className="text-sm font-semibold">{formatMoeda(rates.alertaPreChargeback)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}