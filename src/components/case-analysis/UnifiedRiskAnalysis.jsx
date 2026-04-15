import React from 'react';
import RiskVerdictBanner from '../risk-analysis/RiskVerdictBanner';
import RiskScorePanel from '../risk-analysis/RiskScorePanel';
import RiskRedFlagsPanel from '../risk-analysis/RiskRedFlagsPanel';
import RiskDimensionalAnalysis from '../risk-analysis/RiskDimensionalAnalysis';
import RiskPositivesAndConcerns from '../risk-analysis/RiskPositivesAndConcerns';
import RiskFinalVerdict from '../risk-analysis/RiskFinalVerdict';

/**
 * Unified Risk Analysis v5.1 — Complete redesign.
 * 
 * Structure (top to bottom):
 * 1. Verdict Banner — THE decision, prominent, with escalation explanation
 * 2. Score Panel — V4 score with decomposition (objective data)
 * 3. Red Flags — All alerts with source tags (BDC/CAF/SENTINEL)
 * 4. Dimensional Analysis — BDC data by area, each item with explanation
 * 5. Positives & Concerns — Side by side
 * 6. Final Verdict — SENTINEL parecer, conditions, questions, full analysis
 * 
 * Removed: BDCNarrativeReport, BDCGlossary, BDCDataConfidence, 
 * BDCDeclaredVsConfirmed, BDCRiskHeatmap, BDCSmartAlerts, UnifiedSourcesSummary
 */
export default function UnifiedRiskAnalysis({
  onboardingCase,
  complianceScore,
  validations = [],
  integrationLogs = [],
  merchant,
  onboardingCaseId,
}) {
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

      {/* 4. Positives & Concerns */}
      <RiskPositivesAndConcerns complianceScore={complianceScore} />

      {/* 5. Dimensional Analysis — BDC data item by item */}
      <RiskDimensionalAnalysis
        complianceScore={complianceScore}
        merchant={merchant}
      />

      {/* 6. SENTINEL Parecer — Qualitative analysis */}
      <RiskFinalVerdict
        complianceScore={complianceScore}
        onboardingCase={onboardingCase}
      />
    </div>
  );
}