import React, { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TrendingUp, Calculator } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FAIXAS_TPV = [
  { value: 'ate_500k', label: 'Até R$ 500 mil' },
  { value: '500k_2m', label: 'R$ 500 mil - R$ 2 milhões' },
  { value: '2m_10m', label: 'R$ 2 milhões - R$ 10 milhões' },
  { value: 'acima_10m', label: 'Acima de R$ 10 milhões' }
];

const FAIXAS_TICKET = [
  { value: 'ate_50', label: 'Até R$ 50' },
  { value: '50_150', label: 'R$ 50 - R$ 150' },
  { value: '150_500', label: 'R$ 150 - R$ 500' },
  { value: '500_1000', label: 'R$ 500 - R$ 1.000' },
  { value: 'acima_1000', label: 'Acima de R$ 1.000' }
];

const FAIXAS_CHARGEBACK = [
  { value: 'menor_03', label: '< 0,3%' },
  { value: '03_06', label: '0,3% - 0,6%' },
  { value: '06_10', label: '0,6% - 1,0%' },
  { value: 'maior_10', label: '> 1,0%' },
  { value: 'nao_sei', label: 'Não sei' }
];

const FAIXAS_ESTORNOS = [
  { value: 'menor_1', label: '< 1%' },
  { value: '1_3', label: '1% - 3%' },
  { value: '3_5', label: '3% - 5%' },
  { value: 'maior_5', label: '> 5%' },
  { value: 'nao_sei', label: 'Não sei' }
];

export default function StepE3PerfilTransacional({ formData, handleChange }) {
  // Cálculo automático de pedidos/mês
  const pedidosMes = useMemo(() => {
    const tpvMap = {
      'ate_500k': 250000,
      '500k_2m': 1250000,
      '2m_10m': 6000000,
      'acima_10m': 15000000
    };
    
    const ticketMap = {
      'ate_50': 25,
      '50_150': 100,
      '150_500': 325,
      '500_1000': 750,
      'acima_1000': 1500
    };

    const tpv = tpvMap[formData.tpvMensal];
    const ticket = ticketMap[formData.ticketMedio];

    if (tpv && ticket) {
      const pedidos = Math.round(tpv / ticket);
      return pedidos.toLocaleString('pt-BR');
    }
    return null;
  }, [formData.tpvMensal, formData.ticketMedio]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-blue-100">
          <TrendingUp className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--pagsmile-blue)]">Perfil Transacional</h2>
          <p className="text-sm text-[var(--pagsmile-blue)]/60">Volume e características das transações</p>
        </div>
      </div>

      <div className="grid gap-5">
        <div className="space-y-2">
          <Label>TPV / Faturamento mensal estimado *</Label>
          <Select
            value={formData.tpvMensal || ''}
            onValueChange={(value) => handleChange('tpvMensal', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a faixa" />
            </SelectTrigger>
            <SelectContent>
              {FAIXAS_TPV.map((faixa) => (
                <SelectItem key={faixa.value} value={faixa.value}>{faixa.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Ticket médio estimado *</Label>
          <Select
            value={formData.ticketMedio || ''}
            onValueChange={(value) => handleChange('ticketMedio', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a faixa" />
            </SelectTrigger>
            <SelectContent>
              {FAIXAS_TICKET.map((faixa) => (
                <SelectItem key={faixa.value} value={faixa.value}>{faixa.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Campo calculado de Pedidos/mês */}
        {pedidosMes && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Calculator className="w-4 h-4 text-green-600" />
              <Label className="text-green-800 font-medium">Pedidos/mês (estimativa)</Label>
            </div>
            <p className="text-2xl font-bold text-green-700">~{pedidosMes} pedidos</p>
            <p className="text-xs text-green-600 mt-1">Calculado automaticamente: TPV ÷ Ticket médio</p>
          </div>
        )}

        <div className="space-y-2">
          <Label>Chargeback/Disputas (últimos 3 meses) *</Label>
          <Select
            value={formData.chargebackRate || ''}
            onValueChange={(value) => handleChange('chargebackRate', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a faixa" />
            </SelectTrigger>
            <SelectContent>
              {FAIXAS_CHARGEBACK.map((faixa) => (
                <SelectItem key={faixa.value} value={faixa.value}>{faixa.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Estornos/Cancelamentos (últimos 3 meses) *</Label>
          <Select
            value={formData.estornosRate || ''}
            onValueChange={(value) => handleChange('estornosRate', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a faixa" />
            </SelectTrigger>
            <SelectContent>
              {FAIXAS_ESTORNOS.map((faixa) => (
                <SelectItem key={faixa.value} value={faixa.value}>{faixa.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}