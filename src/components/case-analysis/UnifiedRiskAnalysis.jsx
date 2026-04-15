import React, { useMemo } from 'react';
import RiskVerdictBanner from '../risk-analysis/RiskVerdictBanner';
import RiskScorePanel from '../risk-analysis/RiskScorePanel';
import RiskRedFlagsPanel from '../risk-analysis/RiskRedFlagsPanel';
import RiskDimensionalAnalysis from '../risk-analysis/RiskDimensionalAnalysis';
import RiskPositivesAndConcerns from '../risk-analysis/RiskPositivesAndConcerns';
import RiskFinalVerdict from '../risk-analysis/RiskFinalVerdict';
import BDCSmartAlerts from '../bdc-enrichment/BDCSmartAlerts';
import BDCDataConfidence from '../bdc-enrichment/BDCDataConfidence';
import BDCRiskHeatmap from '../bdc-enrichment/BDCRiskHeatmap';
import BDCDeclaredVsConfirmed from '../bdc-enrichment/BDCDeclaredVsConfirmed';
import BDCNarrativeReport from '../bdc-enrichment/BDCNarrativeReport';
import UnifiedSourcesSummary from './UnifiedSourcesSummary';

/**
 * Unified Risk Analysis v5.2
 * 
 * Structure:
 * 1. Verdict Banner — THE decision + escalation explanation
 * 2. Score Panel — V4 score with decomposition
 * 3. Red Flags — All alerts (BDC/CAF/SENTINEL)
 * 4. Smart Alerts — Top critical BDC findings
 * 5. Risk Heatmap — Radar chart by dimension
 * 6. Data Confidence — Which BDC datasets returned data
 * 7. Declared vs Confirmed — Cross-validation table
 * 8. Positives & Concerns
 * 9. Dimensional Analysis — BDC data item by item
 * 10. SENTINEL Parecer — Full qualitative analysis
 * 11. BDC Narrative Report — Detailed AI-generated report
 * 12. Sources Summary — CAF + BDC expandable details
 */

function reconstructAnalysisFromCache(cs) {
  if (!cs?.variaveis_aplicadas) return null;
  const sections = cs.variaveis_aplicadas;
  return {
    type: cs.segmento === 'subseller_pf' ? 'PF' : 'PJ',
    document: '',
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
    sections,
    scoring: {
      baseScore: cs.score_base_segmento || 0,
      variablesScore: cs.score_variaveis || 0,
      enrichmentScore: cs.score_enriquecimento || 0,
      finalScore: cs.score_final || 0,
      subfaixa: cs.subfaixa || '4',
      subfaixaNome: cs.subfaixa_nome || 'N/D',
    },
  };
}

export default function UnifiedRiskAnalysis({
  onboardingCase,
  complianceScore,
  validations = [],
  integrationLogs = [],
  merchant,
  onboardingCaseId,
}) {
  // Reconstruct BDC analysis object from complianceScore for the BDC visual components
  const bdcAnalysis = useMemo(() => {
    if (!complianceScore) return null;
    return reconstructAnalysisFromCache(complianceScore);
  }, [complianceScore]);

  return (
    <div className="space-y-5">
      {/* 1. Verdict Banner — THE decision */}
      <RiskVerdictBanner
        onboardingCase={onboardingCase}
        complianceScore={complianceScore}
      />

      {/* 2. Score V4 — Objective data */}
      <RiskScorePanel
        onboardingCase={onboardingCase}
        complianceScore={complianceScore}
      />

      {/* 3. Red Flags — All sources */}
      <RiskRedFlagsPanel
        onboardingCase={onboardingCase}
        complianceScore={complianceScore}
      />

      {/* 4. Smart Alerts — Top critical BDC findings */}
      {bdcAnalysis && <BDCSmartAlerts analysis={bdcAnalysis} merchant={merchant} />}

      {/* 5. Risk Heatmap — Radar by dimension */}
      {bdcAnalysis && <BDCRiskHeatmap analysis={bdcAnalysis} />}

      {/* 6. Data Confidence — Dataset coverage */}
      {bdcAnalysis && <BDCDataConfidence analysis={bdcAnalysis} />}

      {/* 7. Declared vs Confirmed — Cross-validation */}
      {bdcAnalysis && <BDCDeclaredVsConfirmed analysis={bdcAnalysis} merchant={merchant} />}

      {/* 8. Positives & Concerns */}
      <RiskPositivesAndConcerns complianceScore={complianceScore} />

      {/* 9. Dimensional Analysis — BDC data item by item */}
      <RiskDimensionalAnalysis
        complianceScore={complianceScore}
        merchant={merchant}
      />

      {/* 10. SENTINEL Parecer — Qualitative analysis */}
      <RiskFinalVerdict
        complianceScore={complianceScore}
        onboardingCase={onboardingCase}
      />

      {/* 11. BDC Narrative Report — Full AI-generated detailed report */}
      {bdcAnalysis && (
        <BDCNarrativeReport analysis={bdcAnalysis} complianceScore={complianceScore} />
      )}

      {/* 12. Sources Summary — CAF + BDC expandable details */}
      <UnifiedSourcesSummary
        validations={validations}
        integrationLogs={integrationLogs}
        complianceScore={complianceScore}
        merchant={merchant}
        onboardingCaseId={onboardingCaseId}
      />
    </div>
  );
}