import React, { useState } from 'react';
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
}) {
  return (
    <div className="space-y-5">
      {/* 1. Score Unificado V4 — A verdade */}
      <UnifiedScoreHeader
        onboardingCase={onboardingCase}
        complianceScore={complianceScore}
        validations={validations}
      />

      {/* 2. Análise IA Profunda — Explicações, findings, red flags */}
      <UnifiedIAAnalysis
        complianceScore={complianceScore}
        onboardingCase={onboardingCase}
      />

      {/* 3. Fontes de Dados — CAF + BDC resumidos */}
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