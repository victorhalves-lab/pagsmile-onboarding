import React from 'react';
import { Info } from 'lucide-react';

/**
 * Exibe nota discreta quando o CNAE da empresa sugere atividade financeira
 * mas o lead selecionou "Merchant" como tipo de empresa.
 * NÃO bloqueia — apenas sinaliza.
 */
export default function CnaeCoherenceAlert({ cnpjData, selectedType }) {
  if (!cnpjData || !selectedType) return null;
  
  const cnaeFiscal = String(cnpjData.cnae_fiscal || '');
  const divisao = cnaeFiscal.substring(0, 2);
  
  // Divisões 64 (financeiras), 65 (seguros), 66 (auxiliares financeiros)
  const isFinancialCnae = ['64', '65', '66'].includes(divisao);
  
  // Só mostra alerta se selecionou Merchant direto e CNAE indica financeiro
  const selected = String(selectedType).toLowerCase();
  const intermediaryKeywords = ['gateway', 'marketplace', 'plataforma vertical'];
  const isIntermediary = intermediaryKeywords.some(kw => selected.includes(kw));
  const isMerchant = selected.includes('merchant') || (!isIntermediary && !selected.includes('gateway'));
  
  if (!isFinancialCnae || !isMerchant) return null;

  return (
    <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl mt-2 animate-in fade-in duration-300">
      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm text-amber-800 font-medium">
          O CNAE da sua empresa sugere atividade financeira.
        </p>
        <p className="text-xs text-amber-600 mt-0.5">
          Confirma que é Merchant? Se for Gateway ou Marketplace, altere a seleção acima.
        </p>
      </div>
    </div>
  );
}