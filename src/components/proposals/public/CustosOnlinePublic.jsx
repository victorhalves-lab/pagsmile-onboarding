import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, ShieldCheck, Lock, AlertCircle } from 'lucide-react';

const fmtBRL = (v) => `R$ ${(parseFloat(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtPct = (v) => `${(parseFloat(v) || 0).toFixed(2).replace('.', ',')}%`;

/**
 * Custos Adicionais por Transação Online — só aparecem em vendas online (e-commerce).
 * NÃO incidem em transações presenciais (POS).
 * Lê os MESMOS campos que sempre existiram em rates → 100% retrocompatível.
 */
export default function CustosOnlinePublic({ rates }) {
  const items = [
    { key: 'feeTransacao', label: 'Fee por Transação', value: fmtBRL(rates.feeTransacao), icon: Zap },
    { key: 'antifraude', label: 'Antifraude', value: fmtBRL(rates.antifraude), icon: ShieldCheck },
    { key: 'taxa3ds', label: '3DS', value: fmtBRL(rates.taxa3ds), icon: Lock },
    { key: 'alertaPreChargeback', label: 'Alerta Pré-Chargeback', value: fmtBRL(rates.alertaPreChargeback), icon: AlertCircle },
  ];

  return (
    <Card className="mb-4">
      <CardContent className="py-4">
        <h3 className="font-bold text-sm text-[#0A0A0A] mb-1 uppercase tracking-wide">Custos Adicionais por Transação</h3>
        <p className="text-[11px] text-[#0A0A0A]/50 mb-4">Aplicados em cada venda processada online (e-commerce, link de pagamento, checkout)</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {items.map(({ key, label, value, icon: Icon }) => (
            <div key={key} className="bg-[#f4f4f4] rounded-xl p-3 border border-[#1356E2]/10">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className="w-3.5 h-3.5 text-[#E84B1C]" />
                <p className="text-[10px] text-[#0A0A0A]/60 uppercase font-semibold tracking-wide">{label}</p>
              </div>
              <p className="text-base font-bold text-[#0A0A0A] font-mono">{value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}