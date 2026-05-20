import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import {
  Building2, User, ChevronRight, Users, Phone, Mail, MapPin,
  DollarSign, UserCheck, FileText, AlertTriangle, TrendingUp
} from 'lucide-react';
import { segmentLabel } from '@/lib/segmentLabels';
import { V5_2Badge } from '@/components/v5_2/FrameworkVersionFilter';

const STATUS_CONFIG = {
  'Pendente': { color: 'bg-gray-100 text-gray-700', label: 'Pendente' },
  'Em Análise': { color: 'bg-blue-100 text-blue-700', label: 'Em Análise' },
  'Aprovado': { color: 'bg-green-100 text-green-700', label: 'Aprovado' },
  'Manual': { color: 'bg-amber-100 text-amber-700', label: 'Revisão Manual' },
  'Recusado': { color: 'bg-red-100 text-red-700', label: 'Recusado' },
};

function formatDoc(doc) {
  if (!doc) return '—';
  if (doc.length === 14) return doc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  if (doc.length === 11) return doc.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  return doc;
}

function formatMoney(v) {
  if (v == null || isNaN(v)) return null;
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`;
  return `R$ ${v.toFixed(0)}`;
}

/**
 * Linha enriquecida do Cadastro — mostra TODOS os dados importantes do cliente
 * de forma visível: contato, TPV, vendedor, segmento, score, propostas, contratos,
 * subsellers e alerta de duplicação.
 */
export default function CadastroRichRow({
  merchant, oCase, lead, proposal, contract,
  subsellerCount, duplicateCount, originLabel
}) {
  const sc = STATUS_CONFIG[merchant.onboardingStatus] || STATUS_CONFIG['Pendente'];
  const tpv = lead?.tpvMensal;
  const segName = lead?.businessSubCategory ? segmentLabel(lead.businessSubCategory) : null;
  const sellerName = lead?.commercialAgentName || oCase?.commercialAgentName;
  const isDuplicate = duplicateCount > 1;
  const score = oCase?.riskScoreV4 ?? oCase?.riskScore;
  const subfaixa = oCase?.subfaixaNome;
  const hasProposal = !!proposal;
  const hasContract = !!contract;

  return (
    <Link
      to={`/CadastroDetalhe?id=${merchant.id}`}
      className={`block bg-white rounded-xl border transition-all group ${
        isDuplicate
          ? 'border-red-300 hover:border-red-400 hover:shadow-md'
          : 'border-[var(--pagsmile-blue)]/8 hover:border-[var(--pagsmile-green)]/40 hover:shadow-md'
      }`}
    >
      {/* Banner de duplicação */}
      {isDuplicate && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 rounded-t-xl flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          <span className="text-[11px] font-bold text-red-700">
            ⚠️ CADASTRO DUPLICADO — {duplicateCount} registros com este CNPJ
          </span>
        </div>
      )}

      <div className="p-4">
        {/* Linha principal: nome + tipo + status + chevron */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${merchant.type === 'PJ' ? 'bg-blue-50' : 'bg-purple-50'}`}>
            {merchant.type === 'PJ'
              ? <Building2 className="w-5 h-5 text-blue-600" />
              : <User className="w-5 h-5 text-purple-600" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-[var(--pagsmile-blue)] truncate">
                {merchant.companyName || merchant.fullName}
              </span>
              <Badge variant="outline" className="text-[10px] shrink-0">{merchant.type}</Badge>
              <V5_2Badge frameworkVersion={oCase?.framework_version} />
              {merchant.fullName && merchant.companyName && merchant.fullName !== merchant.companyName && (
                <span className="text-[11px] text-[var(--pagsmile-blue)]/40 truncate">
                  ({merchant.fullName})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--pagsmile-blue)]/50 mt-0.5">
              <span className="font-mono">{formatDoc(merchant.cpfCnpj)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {score != null && (
              <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                score <= 200 ? 'bg-green-50 text-green-700' :
                score <= 500 ? 'bg-amber-50 text-amber-700' :
                'bg-red-50 text-red-700'
              }`}>
                {subfaixa || `Score ${score}`}
              </div>
            )}
            <Badge className={`${sc.color} text-[10px]`}>{sc.label}</Badge>
            <ChevronRight className="w-4 h-4 text-[var(--pagsmile-blue)]/20 group-hover:text-[var(--pagsmile-green)] transition-colors" />
          </div>
        </div>

        {/* Linha 2: dados de contato + TPV + segmento */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-1.5 mt-3 text-[11px]">
          {merchant.email && (
            <div className="flex items-center gap-1.5 text-[var(--pagsmile-blue)]/60 truncate">
              <Mail className="w-3 h-3 flex-shrink-0 text-[var(--pagsmile-blue)]/40" />
              <span className="truncate">{merchant.email}</span>
            </div>
          )}
          {merchant.phone && (
            <div className="flex items-center gap-1.5 text-[var(--pagsmile-blue)]/60">
              <Phone className="w-3 h-3 flex-shrink-0 text-[var(--pagsmile-blue)]/40" />
              <span>{merchant.phone}</span>
            </div>
          )}
          {tpv && (
            <div className="flex items-center gap-1.5 text-[var(--pagsmile-blue)]/60">
              <DollarSign className="w-3 h-3 flex-shrink-0 text-[var(--pagsmile-green)]" />
              <span className="font-semibold">TPV {formatMoney(tpv)}/mês</span>
            </div>
          )}
          {segName && (
            <div className="flex items-center gap-1.5 text-[var(--pagsmile-blue)]/60">
              <TrendingUp className="w-3 h-3 flex-shrink-0 text-[var(--pagsmile-blue)]/40" />
              <span>{segName}</span>
            </div>
          )}
        </div>

        {/* Linha 3: vendedor + origem + proposta + contrato + subsellers */}
        {(sellerName || originLabel || hasProposal || hasContract || subsellerCount > 0) && (
          <div className="flex items-center flex-wrap gap-2 mt-2 pt-2 border-t border-[var(--pagsmile-blue)]/5">
            {sellerName && (
              <Badge variant="outline" className="text-[10px] gap-1 bg-blue-50/50 border-blue-200 text-blue-700">
                <UserCheck className="w-2.5 h-2.5" />
                {sellerName}
              </Badge>
            )}
            {originLabel && (
              <Badge variant="outline" className="text-[10px] bg-slate-50 border-slate-200 text-slate-600">
                {originLabel}
              </Badge>
            )}
            {hasProposal && (
              <Badge variant="outline" className="text-[10px] gap-1 bg-purple-50/50 border-purple-200 text-purple-700">
                <FileText className="w-2.5 h-2.5" />
                Proposta {proposal.status}
              </Badge>
            )}
            {hasContract && (
              <Badge variant="outline" className="text-[10px] gap-1 bg-emerald-50/50 border-emerald-200 text-emerald-700">
                <FileText className="w-2.5 h-2.5" />
                Contrato {contract.status}
              </Badge>
            )}
            {subsellerCount > 0 && (
              <Badge variant="outline" className="text-[10px] gap-1 bg-purple-50 border-purple-200 text-purple-700">
                <Users className="w-2.5 h-2.5" />
                {subsellerCount} subseller{subsellerCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}