import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const DIVERGENCE_EXPLANATIONS = {
  'Razão Social': {
    divergence: 'Os nomes são similares mas não idênticos. Pode ser abreviação ("LTDA" vs "LTDA."), pequena alteração cadastral recente ou discrepância tipográfica.',
    mismatch: 'Nomes completamente diferentes entre o que o cliente declarou e o que consta na Receita Federal. Sinal forte de identidade construída ou declaração incorreta — investigar CNPJ.',
  },
  'CNPJ': {
    divergence: 'CNPJs com formatação diferente ou com ou sem dígitos de pontuação. Normalmente é só formatação.',
    mismatch: 'CNPJ declarado não bate com o que a BDC consultou. Erro crítico — refazer busca com o CNPJ correto.',
  },
  'CPF': {
    divergence: 'CPFs com formatação diferente.',
    mismatch: 'CPF declarado diverge do encontrado — investigar.',
  },
  'CNAE/MCC Principal': {
    divergence: 'MCC declarado e CNAE da Receita descrevem atividades similares mas com códigos distintos. Pode ser enquadramento subótimo.',
    mismatch: 'MCC declarado e CNAE descrevem atividades MUITO distintas (ex: cliente diz "moda" mas CNAE é "serviços financeiros"). Risco alto de chargeback por categoria errada, ou tentativa de ocultar atividade real.',
  },
  'Capital Social': {
    divergence: 'Valores próximos mas diferentes — pode ser alteração cadastral recente não atualizada.',
    mismatch: 'Capital declarado muito diferente do registrado na Receita. Investigar se houve alteração societária recente OU se o cliente declarou valor incorreto.',
  },
  'Situação Cadastral': {
    divergence: 'Situação cadastral com termos diferentes mas sentido similar.',
    mismatch: 'A Receita indica situação IRREGULAR (inativa/suspensa/inapta) enquanto o cliente pressupõe ativa. Pode ser bloqueio automático — checar bloco de bloqueios.',
  },
  'Data de Fundação': {
    divergence: 'Datas próximas — possível diferença entre data de constituição e data de início de atividades.',
    mismatch: 'Diferença grande entre data declarada e data oficial. Investigar histórico de alterações da empresa.',
  },
  'Localização': {
    divergence: 'Endereços similares — pode ser mudança recente ou formatação diferente.',
    mismatch: 'Endereço declarado diferente do fiscal da Receita. Pode ser endereço operacional distinto (filial, galpão) ou sinal de shell company com endereço virtual.',
  },
  'Qtd. Sócios': {
    divergence: 'Diferença pequena (1 sócio) entre declarado e QSA da BDC — pode ser alteração societária recente.',
    mismatch: 'Quantidade de sócios declarada muito diferente da BDC. Pode indicar laranjas não declarados, alteração recente, ou estrutura de holding não explicitada.',
  },
};

function getDivergenceExplanation(field, status) {
  const info = DIVERGENCE_EXPLANATIONS[field];
  if (!info) return null;
  return info[status] || null;
}

/**
 * BDCDeclaredVsConfirmed — Side-by-side comparison of what the merchant declared
 * vs what the BDC confirmed, with consistency indicators.
 */

function getStatusConfig(status) {
  switch (status) {
    case 'match': return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', label: 'Consistente', border: 'border-green-200' };
    case 'divergence': return { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Divergência', border: 'border-amber-200' };
    case 'mismatch': return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Inconsistente', border: 'border-red-200' };
    default: return { icon: HelpCircle, color: 'text-slate-400', bg: 'bg-slate-50', label: 'Sem dados BDC', border: 'border-slate-200' };
  }
}

function compareValues(declared, confirmed) {
  if (!confirmed || confirmed === 'N/D' || confirmed === 'Não encontrado') return 'unknown';
  if (!declared || declared === 'N/D') return 'unknown';
  
  const d = String(declared).toLowerCase().trim().replace(/[.\-\/\s]/g, '');
  const c = String(confirmed).toLowerCase().trim().replace(/[.\-\/\s]/g, '');
  
  if (d === c) return 'match';
  if (d.includes(c) || c.includes(d)) return 'divergence';
  
  // Number comparison with tolerance
  const dn = parseFloat(d.replace(/[^0-9.,]/g, '').replace(',', '.'));
  const cn = parseFloat(c.replace(/[^0-9.,]/g, '').replace(',', '.'));
  if (!isNaN(dn) && !isNaN(cn)) {
    if (dn === cn) return 'match';
    const diff = Math.abs(dn - cn) / Math.max(dn, cn, 1);
    if (diff < 0.1) return 'divergence';
    return 'mismatch';
  }
  
  return 'mismatch';
}

function formatCurrency(val) {
  if (!val && val !== 0) return 'N/D';
  const n = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.,]/g, '').replace(',', '.'));
  if (isNaN(n)) return String(val);
  return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BDCDeclaredVsConfirmed({ merchant, analysis, questionnaireData }) {
  if (!merchant || !analysis) return null;

  const sections = analysis.sections || {};
  const identityItems = sections.identity?.items || [];
  const ownerItems = sections.owners?.items || [];

  // Helper to find BDC item value
  const findBdc = (labelPattern) => {
    const item = identityItems.find(i => labelPattern.test(i.label));
    return item?.value || null;
  };

  const findOwnerCount = () => {
    const item = ownerItems.find(i => /total|qtd|sócios|socios/i.test(i.label));
    if (item) return item.value;
    const ownersArr = ownerItems.find(i => i.owners);
    return ownersArr?.owners?.length || null;
  };

  // Build comparison rows
  const rows = [];

  if (merchant.fullName) {
    rows.push({
      field: 'Razão Social',
      declared: merchant.fullName,
      confirmed: findBdc(/razão|razao|nome.*empresa|corporate.*name/i) || findBdc(/empresa/i),
    });
  }

  if (merchant.cpfCnpj) {
    rows.push({
      field: merchant.type === 'PF' ? 'CPF' : 'CNPJ',
      declared: merchant.cpfCnpj,
      confirmed: findBdc(/cnpj|cpf|documento/i) || merchant.cpfCnpj,
    });
  }

  const bdcCnae = findBdc(/cnae|atividade.*principal/i);
  if (bdcCnae) {
    const qCnae = questionnaireData?.cnae || questionnaireData?.mcc || null;
    rows.push({
      field: 'CNAE/MCC Principal',
      declared: qCnae || 'Não declarado',
      confirmed: bdcCnae,
    });
  }

  const bdcCapital = findBdc(/capital.*social/i);
  if (bdcCapital) {
    const qCapital = questionnaireData?.capitalSocial || null;
    rows.push({
      field: 'Capital Social',
      declared: qCapital ? formatCurrency(qCapital) : 'Não declarado',
      confirmed: bdcCapital,
    });
  }

  const bdcSituation = findBdc(/situação|situacao|status.*cadastral/i);
  if (bdcSituation) {
    rows.push({
      field: 'Situação Cadastral',
      declared: 'Ativa (pressuposto)',
      confirmed: bdcSituation,
    });
  }

  const bdcFoundation = findBdc(/fundação|fundacao|data.*abertura|criação|criacao/i);
  if (bdcFoundation) {
    rows.push({
      field: 'Data de Fundação',
      declared: questionnaireData?.dataFundacao || 'Não declarado',
      confirmed: bdcFoundation,
    });
  }

  const bdcAddress = findBdc(/endereço|endereco|cidade|UF|estado/i);
  if (bdcAddress) {
    const qAddress = questionnaireData?.cidade || questionnaireData?.endereco || null;
    rows.push({
      field: 'Localização',
      declared: qAddress || 'Não declarado',
      confirmed: bdcAddress,
    });
  }

  // Owners count
  const bdcOwnerCount = findOwnerCount();
  if (bdcOwnerCount) {
    const qOwnerCount = questionnaireData?.qtdSocios || null;
    rows.push({
      field: 'Qtd. Sócios',
      declared: qOwnerCount || 'Não declarado',
      confirmed: String(bdcOwnerCount),
    });
  }

  if (rows.length === 0) return null;

  // Calculate statuses
  const enrichedRows = rows.map(r => ({
    ...r,
    status: compareValues(r.declared, r.confirmed),
  }));

  const matchCount = enrichedRows.filter(r => r.status === 'match').length;
  const divCount = enrichedRows.filter(r => r.status === 'divergence').length;
  const misCount = enrichedRows.filter(r => r.status === 'mismatch').length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <h4 className="text-sm font-bold text-[#0A0A0A] mb-1">🔍 Declarado vs Confirmado</h4>
        <p className="text-[10px] text-[#0A0A0A]/40">
          Comparativo entre os dados declarados pelo merchant no questionário e os dados encontrados na Big Data Corp
        </p>
        <div className="flex gap-3 mt-2">
          {matchCount > 0 && <Badge className="bg-green-100 text-green-700 border-green-200 border text-[10px]">✅ {matchCount} consistente(s)</Badge>}
          {divCount > 0 && <Badge className="bg-amber-100 text-amber-700 border-amber-200 border text-[10px]">⚠️ {divCount} divergência(s)</Badge>}
          {misCount > 0 && <Badge className="bg-red-100 text-red-700 border-red-200 border text-[10px]">❌ {misCount} inconsistência(s)</Badge>}
        </div>
      </div>

      <TooltipProvider delayDuration={200}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-[#0A0A0A]/50 uppercase tracking-wider">
                <th className="px-4 py-2.5 text-left">Campo</th>
                <th className="px-4 py-2.5 text-left">Declarado pelo Merchant</th>
                <th className="px-4 py-2.5 text-left">Confirmado pela BDC</th>
                <th className="px-4 py-2.5 text-center">Divergência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrichedRows.map((row, i) => {
                const cfg = getStatusConfig(row.status);
                const Icon = cfg.icon;
                const explanation = getDivergenceExplanation(row.field, row.status);
                const semaforo = row.status === 'match' ? '✅' : row.status === 'divergence' ? '⚠️' : row.status === 'mismatch' ? '❌' : '❓';
                return (
                  <tr key={i} className={`${cfg.bg}/30 hover:${cfg.bg}/50 transition-colors`}>
                    <td className="px-4 py-3 text-xs font-semibold text-[#0A0A0A]">{row.field}</td>
                    <td className="px-4 py-3 text-xs text-[#0A0A0A]/70">{row.declared || <span className="text-[#0A0A0A]/30 italic">Não declarado</span>}</td>
                    <td className="px-4 py-3 text-xs text-[#0A0A0A]/70 font-medium">{row.confirmed || <span className="text-[#0A0A0A]/30 italic">Não encontrado</span>}</td>
                    <td className="px-4 py-3 text-center">
                      {explanation ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${cfg.border} ${cfg.bg} cursor-help`}>
                              <span className="text-[11px]">{semaforo}</span>
                              <Icon className={`w-3 h-3 ${cfg.color}`} />
                              <span className={`text-[10px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs bg-[#0A0A0A] text-white border-[#0A0A0A]">
                            <p className="text-[10px] font-bold mb-1 text-[#1356E2]">
                              {row.status === 'divergence' ? '⚠️ Divergência leve' : '❌ Divergência grave'}
                            </p>
                            <p className="text-[11px] leading-relaxed">{explanation}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${cfg.border} ${cfg.bg}`}>
                          <span className="text-[11px]">{semaforo}</span>
                          <Icon className={`w-3 h-3 ${cfg.color}`} />
                          <span className={`text-[10px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </TooltipProvider>
    </div>
  );
}