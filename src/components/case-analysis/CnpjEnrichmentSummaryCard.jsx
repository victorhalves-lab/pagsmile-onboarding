import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, AlertTriangle, CheckCircle, Clock, 
  Building2, MapPin, Globe, Users, Landmark,
  ChevronDown, ChevronUp, Loader2, RefreshCw
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

function RiskBadge({ level }) {
  const config = {
    BAIXO: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    MEDIO: { color: 'bg-amber-50 text-amber-700 border-amber-200' },
    ALTO: { color: 'bg-orange-50 text-orange-700 border-orange-200' },
    CRITICO: { color: 'bg-red-50 text-red-700 border-red-200' },
  };
  const c = config[level] || config.MEDIO;
  return <Badge className={`${c.color} text-[10px] font-semibold border`}>{level}</Badge>;
}

function EnrichmentRow({ icon: Icon, label, value, flag, positive }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
      <Icon className={`w-4 h-4 flex-shrink-0 ${
        flag ? 'text-amber-500' : positive ? 'text-emerald-500' : 'text-[#002443]/30'
      }`} />
      <span className="text-xs text-[#002443]/60 w-28 flex-shrink-0">{label}</span>
      <span className={`text-xs font-medium flex-1 ${flag ? 'text-amber-700' : 'text-[#002443]'}`}>
        {value || '—'}
      </span>
      {flag && (
        <Badge className="bg-amber-50 text-amber-600 border-amber-200 text-[9px] font-normal border max-w-[200px] truncate">
          ⚠ {flag}
        </Badge>
      )}
      {positive && !flag && (
        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
      )}
    </div>
  );
}

export default function CnpjEnrichmentSummaryCard({ complianceScore, onboardingCaseId, merchant }) {
  const [expanded, setExpanded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [localResult, setLocalResult] = useState(null);

  // Tentar extrair dados de enriquecimento do ComplianceScore existente
  const hasEnrichmentData = complianceScore?.fase_1_completa && complianceScore?.score_questionario;
  const score = complianceScore?.score_questionario ? Math.round(complianceScore.score_questionario / 10) : null;
  const riskLevel = complianceScore?.classificacao_questionario;
  const flags = complianceScore?.red_flags || [];
  const positives = complianceScore?.pontos_positivos || [];

  const handleRunEnrichment = async () => {
    if (!merchant?.cpfCnpj) return;
    setIsRunning(true);
    try {
      // Primeiro buscar dados do CNPJ
      const cnpjClean = merchant.cpfCnpj.replace(/\D/g, '');
      if (cnpjClean.length !== 14) return;
      
      const cnpjRes = await base44.functions.invoke('brasilApiCnpj', { cnpj: cnpjClean });
      if (cnpjRes.data?.error) throw new Error(cnpjRes.data.error);
      
      // Rodar análise de enriquecimento
      const enrichRes = await base44.functions.invoke('analyzeCnpjEnrichment', {
        cnpjDataArray: { ...cnpjRes.data, cnpj: cnpjClean },
        onboardingCaseId
      });
      setLocalResult(enrichRes.data);
    } catch (e) {
      console.error('Enrichment failed:', e);
    }
    setIsRunning(false);
  };

  // Usar resultado local se disponível
  const enrichResult = localResult?.results?.[0];
  const enrichData = enrichResult?.enrichment;
  const enrichScore = enrichResult?.overallScore;

  const displayScore = enrichScore?.score ?? score;
  const displayLevel = enrichScore?.riskLevel ?? riskLevel;
  const displayFlags = enrichScore?.flags ?? flags;

  if (!hasEnrichmentData && !enrichResult && !merchant?.cpfCnpj) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50">
            <Shield className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#002443]">Enriquecimento CNPJ</h4>
            <p className="text-[10px] text-[#002443]/50">Dados da Receita Federal + Análise de Risco</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {displayScore !== null && displayScore !== undefined ? (
            <>
              <span className={`text-xl font-bold ${
                displayScore >= 80 ? 'text-emerald-600' : 
                displayScore >= 60 ? 'text-amber-600' : 
                displayScore >= 40 ? 'text-orange-600' : 'text-red-600'
              }`}>{displayScore}</span>
              <span className="text-xs text-[#002443]/40">/100</span>
              {displayLevel && <RiskBadge level={displayLevel} />}
            </>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRunEnrichment}
              disabled={isRunning}
              className="text-xs rounded-lg border-indigo-200 text-indigo-600 hover:bg-indigo-50"
            >
              {isRunning ? (
                <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Analisando...</>
              ) : (
                <><RefreshCw className="w-3 h-3 mr-1" /> Analisar CNPJ</>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Flags resumo */}
      {displayFlags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {displayFlags.slice(0, expanded ? 20 : 3).map((flag, i) => (
            <Badge key={i} className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] border font-normal">
              ⚠ {flag}
            </Badge>
          ))}
          {!expanded && displayFlags.length > 3 && (
            <Badge className="bg-slate-50 text-slate-500 border-slate-200 text-[10px] border font-normal">
              +{displayFlags.length - 3} mais
            </Badge>
          )}
        </div>
      )}

      {/* Pontos positivos resumo */}
      {positives.length > 0 && !expanded && (
        <div className="flex flex-wrap gap-1 mb-3">
          {positives.slice(0, 2).map((p, i) => (
            <Badge key={i} className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] border font-normal">
              ✓ {p}
            </Badge>
          ))}
        </div>
      )}

      {/* Dados detalhados (expandidos) */}
      {enrichData && expanded && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <EnrichmentRow 
            icon={Clock} label="Idade" 
            value={enrichData.companyAge.anos !== null ? `${enrichData.companyAge.anos} ano(s)` : 'N/D'}
            flag={enrichData.companyAge.flag}
            positive={enrichData.companyAge.anos >= 5}
          />
          <EnrichmentRow 
            icon={AlertTriangle} label="Sit. Especial" 
            value={enrichData.situacaoEspecial.hasSituacao ? 'Sim' : 'Nenhuma'}
            flag={enrichData.situacaoEspecial.flag}
            positive={!enrichData.situacaoEspecial.hasSituacao}
          />
          <EnrichmentRow 
            icon={Landmark} label="Simples" 
            value={enrichData.simplesNacional.info}
          />
          <EnrichmentRow 
            icon={Building2} label="MEI" 
            value={enrichData.mei.optante ? 'Sim' : 'Não'}
            flag={enrichData.mei.flag}
          />
          <EnrichmentRow 
            icon={Users} label="QSA" 
            value={`${enrichData.qsaAnalysis.totalSocios} sócio(s)`}
            flag={enrichData.qsaAnalysis.flag}
            positive={enrichData.qsaAnalysis.totalSocios > 0 && !enrichData.qsaAnalysis.flag}
          />
          <EnrichmentRow 
            icon={Globe} label="Domínio" 
            value={enrichData.emailDomain.consistent === true ? 'Consistente' : enrichData.emailDomain.consistent === false ? 'Inconsistente' : 'N/A'}
            flag={enrichData.emailDomain.flag}
            positive={enrichData.emailDomain.consistent === true}
          />
          <EnrichmentRow 
            icon={MapPin} label="Geo UF×DDD" 
            value={enrichData.geoConsistency.consistent === true ? 'Consistente' : enrichData.geoConsistency.consistent === false ? 'Inconsistente' : 'N/A'}
            flag={enrichData.geoConsistency.flag}
            positive={enrichData.geoConsistency.consistent === true}
          />
          {enrichData.cnaeRisk?.flag && (
            <EnrichmentRow 
              icon={AlertTriangle} label="CNAE Risco" 
              value="Alto risco"
              flag={enrichData.cnaeRisk.flag}
            />
          )}
        </div>
      )}

      {/* Toggle */}
      {(enrichData || hasEnrichmentData) && (
        <button 
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[11px] text-indigo-500 hover:text-indigo-700 mt-2 transition-colors"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Recolher detalhes' : 'Ver detalhes do enriquecimento'}
        </button>
      )}
    </div>
  );
}