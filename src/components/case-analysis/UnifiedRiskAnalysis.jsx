import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Shield, AlertOctagon, CheckCircle2, AlertTriangle, XCircle,
  TrendingUp, TrendingDown, Zap, Clock, RefreshCw,
  Brain, ThumbsUp, ThumbsDown, Lightbulb, FileQuestion, FileText,
  Eye, Gauge, ChevronDown, ChevronUp, ScanFace, Database,
  Fingerprint, Camera, FileCheck, Building2, MapPin, Globe, Users, Landmark
} from 'lucide-react';

import UnifiedScoreHeader from './UnifiedScoreHeader';
import UnifiedIAAnalysis from './UnifiedIAAnalysis';
import UnifiedSourcesSummary from './UnifiedSourcesSummary';
import BDCSmartAlerts from '../bdc-enrichment/BDCSmartAlerts';
import BDCRiskHeatmap from '../bdc-enrichment/BDCRiskHeatmap';
import BDCDeclaredVsConfirmed from '../bdc-enrichment/BDCDeclaredVsConfirmed';
import BDCDataConfidence from '../bdc-enrichment/BDCDataConfidence';
import BDCNarrativeReport from '../bdc-enrichment/BDCNarrativeReport';
import BDCGlossary from '../bdc-enrichment/BDCGlossary';

/**
 * Unified Risk Analysis — Single source of truth for all risk data.
 * Combines: Score V4, IA Analysis, CAF results, BDC enrichment, CNPJ data
 * into one coherent, deeply informative view.
 */
export default function UnifiedRiskAnalysis({
  onboardingCase,
  complianceScore,
  validations = [],
  integrationLogs = [],
  merchant,
  onboardingCaseId,
  questionnaireData,
}) {
  // Reconstruct BDC analysis from complianceScore cached sections
  const bdcAnalysis = React.useMemo(() => {
    if (!complianceScore?.variaveis_aplicadas || complianceScore?.framework_version !== 'v4.0') return null;
    const cs = complianceScore;
    return {
      type: cs.segmento === 'subseller_pf' ? 'PF' : 'PJ',
      document: merchant?.cpfCnpj || '',
      templateModel: cs.segmento,
      datasetGroup: 'CACHED',
      datasetsQueried: 0,
      queryDate: cs.data_analise_fase_2,
      elapsedMs: 0,
      blocks: (cs.bloqueios_ativos || []).map(b => {
        const parts = b.split('_');
        return { code: parts[0] || 'B??', label: parts.slice(1).join(' '), severity: 'BLOQUEIO', detail: '', score: 850 };
      }),
      hasBlock: (cs.bloqueios_ativos || []).length > 0,
      sections: cs.variaveis_aplicadas,
      scoring: {
        baseScore: cs.score_base_segmento || 0,
        variablesScore: cs.score_variaveis || 0,
        enrichmentScore: cs.score_enriquecimento || 0,
        finalScore: cs.score_final || 0,
        subfaixa: cs.subfaixa || '4',
        subfaixaNome: cs.subfaixa_nome || 'N/D',
      },
    };
  }, [complianceScore, merchant]);

  return (
    <div className="space-y-5">
      {/* 1. Score Unificado V4 */}
      <UnifiedScoreHeader
        onboardingCase={onboardingCase}
        complianceScore={complianceScore}
        validations={validations}
      />

      {/* 2. Alertas Inteligentes Consolidados */}
      {bdcAnalysis && <BDCSmartAlerts analysis={bdcAnalysis} merchant={merchant} />}

      {/* 3. Score de Confiança dos Dados */}
      {bdcAnalysis && <BDCDataConfidence analysis={bdcAnalysis} />}

      {/* 4. Mapa de Calor de Risco */}
      {bdcAnalysis && <BDCRiskHeatmap analysis={bdcAnalysis} />}

      {/* 5. Declarado vs Confirmado */}
      {bdcAnalysis && <BDCDeclaredVsConfirmed analysis={bdcAnalysis} merchant={merchant} questionnaireData={questionnaireData} />}

      {/* 6. Relatório Narrativo IA — Extremamente Detalhado */}
      {bdcAnalysis && <BDCNarrativeReport analysis={bdcAnalysis} complianceScore={complianceScore} />}

      {/* 7. Análise IA SENTINEL — Findings, Red Flags, Recomendações */}
      <UnifiedIAAnalysis
        complianceScore={complianceScore}
        onboardingCase={onboardingCase}
      />

      {/* 8. Fontes de Dados — CAF + BDC */}
      <UnifiedSourcesSummary
        validations={validations}
        integrationLogs={integrationLogs}
        complianceScore={complianceScore}
        merchant={merchant}
        onboardingCaseId={onboardingCaseId}
      />

      {/* 9. Glossário de Termos */}
      <BDCGlossary />
    </div>
  );
}