import React from 'react';
import DatasetSection from '../DatasetSection';
import { DollarSign } from 'lucide-react';

export default function BdcTabFinanceiro({ result }) {
  return (
    <div className="space-y-4">
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-3">
        <DollarSign className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-emerald-900">
          <p className="font-semibold mb-1">Financeiro ⭐</p>
          <p>Balanço, DRE e indicadores de crédito. Use para cross-check do TPV declarado.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DatasetSection title="Balanço + DRE (financial_data)" data={result?.FinancialData || result?.FinantialData} />
        <DatasetSection title="Mercado financeiro (financial_market)" data={result?.FinancialMarket} />
        <DatasetSection title="Risco de crédito (credit_risk)" data={result?.CreditRisk} />
        <DatasetSection title="Credit Score (credit_score)" data={result?.CreditScore} />
        <DatasetSection title="SCR BACEN positivo (scr_positive_score)" data={result?.ScrPositiveScore} />
        <DatasetSection title="Renda presumida PF (presumed_income)" data={result?.PresumedIncome} />
      </div>
    </div>
  );
}