import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, AlertTriangle, CheckCircle, Clock, 
  Building2, MapPin, Globe, Users, Landmark,
  Loader2
} from 'lucide-react';

function RiskBadge({ level }) {
  const config = {
    BAIXO: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
    MEDIO: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle },
    ALTO: { color: 'bg-orange-50 text-orange-700 border-orange-200', icon: AlertTriangle },
    CRITICO: { color: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle },
  };
  const c = config[level] || config.MEDIO;
  const Icon = c.icon;
  return (
    <Badge className={`${c.color} text-[10px] gap-1 font-semibold`}>
      <Icon className="w-3 h-3" />
      Risco {level}
    </Badge>
  );
}

function EnrichmentItem({ icon: Icon, label, value, flag, positive }) {
  if (!value && !flag) return null;
  return (
    <div className="flex items-start gap-2 py-1.5">
      <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
        flag ? 'text-amber-500' : positive ? 'text-emerald-500' : 'text-[#0A0A0A]/40'
      }`} />
      <div className="flex-1 min-w-0">
        <span className="text-[11px] text-[#0A0A0A]/60">{label}: </span>
        <span className={`text-[11px] font-medium ${flag ? 'text-amber-700' : 'text-[#0A0A0A]'}`}>
          {value}
        </span>
        {flag && (
          <p className="text-[10px] text-amber-600 mt-0.5">⚠ {flag}</p>
        )}
      </div>
    </div>
  );
}

export default function CnpjEnrichmentPanel({ enrichmentResult, isLoading }) {
  if (isLoading) {
    return (
      <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-[#1356E2]" />
        <span className="text-xs text-[#0A0A0A]/60">Analisando dados de enriquecimento...</span>
      </div>
    );
  }

  if (!enrichmentResult || !enrichmentResult.results?.[0]) return null;

  const result = enrichmentResult.results[0];
  const { enrichment, overallScore } = result;
  const consolidated = enrichmentResult.consolidated;

  return (
    <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#0A0A0A]/50" />
          <span className="text-xs font-semibold text-[#0A0A0A]">Análise de Enriquecimento</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#0A0A0A]">
            {overallScore.score}/100
          </span>
          <RiskBadge level={overallScore.riskLevel} />
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-slate-100">
        <EnrichmentItem 
          icon={Clock} 
          label="Idade" 
          value={enrichment.companyAge.anos !== null 
            ? `${enrichment.companyAge.anos} ano${enrichment.companyAge.anos !== 1 ? 's' : ''}`
            : 'Não disponível'
          }
          flag={enrichment.companyAge.flag}
          positive={enrichment.companyAge.anos >= 5}
        />
        <EnrichmentItem 
          icon={AlertTriangle} 
          label="Situação Especial" 
          value={enrichment.situacaoEspecial.hasSituacao ? 'Sim' : 'Nenhuma'}
          flag={enrichment.situacaoEspecial.flag}
          positive={!enrichment.situacaoEspecial.hasSituacao}
        />
        <EnrichmentItem 
          icon={Landmark} 
          label="Simples Nacional" 
          value={enrichment.simplesNacional.info}
        />
        <EnrichmentItem 
          icon={Building2} 
          label="MEI" 
          value={enrichment.mei.optante ? 'Sim' : 'Não'}
          flag={enrichment.mei.flag}
        />
        <EnrichmentItem 
          icon={Users} 
          label="QSA" 
          value={`${enrichment.qsaAnalysis.totalSocios} sócio(s)${
            enrichment.qsaAnalysis.crossMatches.length > 0 
              ? ` — ${enrichment.qsaAnalysis.crossMatches.length} na base Pin Bank` 
              : ''
          }`}
          flag={enrichment.qsaAnalysis.flag}
          positive={enrichment.qsaAnalysis.totalSocios > 0 && !enrichment.qsaAnalysis.flag}
        />
        <EnrichmentItem 
          icon={Globe} 
          label="Domínio E-mail" 
          value={enrichment.emailDomain.consistent === true 
            ? 'Consistente com site' 
            : enrichment.emailDomain.consistent === false 
            ? 'Inconsistente' 
            : 'Não avaliado'}
          flag={enrichment.emailDomain.flag}
          positive={enrichment.emailDomain.consistent === true}
        />
        <EnrichmentItem 
          icon={MapPin} 
          label="Geo UF×DDD" 
          value={enrichment.geoConsistency.consistent === true 
            ? 'Consistente' 
            : enrichment.geoConsistency.consistent === false 
            ? 'Inconsistente' 
            : 'Não avaliado'}
          flag={enrichment.geoConsistency.flag}
          positive={enrichment.geoConsistency.consistent === true}
        />
        {enrichment.cnaeRisk?.flag && (
          <EnrichmentItem 
            icon={AlertTriangle} 
            label="CNAE" 
            value="Alto risco"
            flag={enrichment.cnaeRisk.flag}
          />
        )}
      </div>

      {/* Flags summary */}
      {consolidated.totalFlags > 0 && (
        <div className="pt-2 border-t border-slate-200">
          <p className="text-[10px] text-amber-600 font-medium">
            {consolidated.totalFlags} flag{consolidated.totalFlags > 1 ? 's' : ''} identificada{consolidated.totalFlags > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}