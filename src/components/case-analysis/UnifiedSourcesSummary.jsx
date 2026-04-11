import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ScanFace, Database, CheckCircle2, XCircle, AlertCircle,
  ChevronDown, ChevronUp, Fingerprint, FileCheck, Camera,
  Shield, Clock, Building2, MapPin, Globe, Users, Landmark,
  AlertTriangle, Loader2, RefreshCw, Eye, TrendingUp, Newspaper
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import BDCEnrichmentPanel from '../bdc-enrichment/BDCEnrichmentPanel';

function StatusDot({ success }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${success ? 'bg-emerald-500' : 'bg-red-500'}`} />
  );
}

function CafSummarySection({ validations, integrationLogs }) {
  const [expanded, setExpanded] = useState(false);
  const cafValidations = validations.filter(v => v.provider === 'CAF');

  if (cafValidations.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-2">
          <ScanFace className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-[#002443]/50">CAF — Verificação de Identidade</span>
          <Badge className="bg-slate-100 text-slate-500 border-0 text-[10px]">Não realizada</Badge>
        </div>
      </div>
    );
  }

  const sorted = [...cafValidations].sort((a, b) => {
    const order = { 'DocumentDetector Frente': 1, 'DocumentDetector Verso': 2, 'FaceLiveness': 3 };
    return (order[a.validationType] || 0) - (order[b.validationType] || 0);
  });
  const allApproved = sorted.every(v => v.status === 'Sucesso');
  const livenessResult = sorted.find(v => v.validationType?.includes('Liveness'));

  return (
    <div className="p-4 rounded-xl bg-white border border-slate-200">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-50">
            <ScanFace className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-sm font-bold text-[#002443]">CAF — Verificação de Identidade</span>
          <Badge className={`text-[10px] border-0 ${allApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
            {allApproved ? 'Todas aprovadas' : 'Atenção'}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {sorted.map((v, i) => (
              <div key={i} className="flex items-center gap-1 text-[10px]">
                <StatusDot success={v.status === 'Sucesso'} />
                <span className="text-[#002443]/50">{v.validationType?.replace('DocumentDetector ', '').replace('FaceLiveness', 'Liveness')}</span>
              </div>
            ))}
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          {sorted.map((v, i) => {
            const rd = v.resultData || {};
            const isLiveness = v.validationType?.includes('Liveness');
            return (
              <div key={i} className={`p-3 rounded-lg border ${v.status === 'Sucesso' ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isLiveness ? <Fingerprint className="w-4 h-4 text-purple-500" /> : <Camera className="w-4 h-4 text-blue-500" />}
                    <span className="text-sm font-semibold text-[#002443]">{v.validationType}</span>
                  </div>
                  <Badge className={v.status === 'Sucesso' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                    {v.status === 'Sucesso' ? 'Aprovado' : 'Reprovado'}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-[#002443]/60">
                  {isLiveness && rd.isAlive != null && (
                    <span>Prova de Vida: <strong className={rd.isAlive ? 'text-emerald-700' : 'text-red-700'}>{rd.isAlive ? 'SIM' : 'NÃO'}</strong></span>
                  )}
                  {isLiveness && rd.isMatch != null && (
                    <span>Face Match: <strong className={rd.isMatch ? 'text-emerald-700' : 'text-red-700'}>{rd.isMatch ? 'SIM' : 'NÃO'}</strong></span>
                  )}
                  {rd.similarity != null && <span>Similaridade: <strong>{(rd.similarity * 100).toFixed(0)}%</strong></span>}
                  {rd.probability != null && <span>Probabilidade: <strong>{(rd.probability * 100).toFixed(0)}%</strong></span>}
                  {v.score != null && <span>Score: <strong>{v.score}</strong></span>}
                  {v.responseTime && <span>Tempo: {v.responseTime}ms</span>}
                </div>
                {rd.uploadedImageUrl && (
                  <div className="mt-2">
                    <a href={rd.uploadedImageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Ver imagem capturada
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BdcSummarySection({ validations, complianceScore, merchant, onboardingCaseId, onComplete }) {
  const [expanded, setExpanded] = useState(false);

  const bdcValidations = validations.filter(v => v.provider === 'BigDataCorp');
  const hasBdcData = bdcValidations.length > 0;
  const hasCachedAnalysis = complianceScore?.variaveis_aplicadas && complianceScore?.framework_version === 'v4.0' && complianceScore?.fase_2_completa;
  const hasDetailedAnalysis = hasBdcData || hasCachedAnalysis;

  // If we have detailed BDC analysis, show the full panel when expanded
  if (hasDetailedAnalysis && expanded) {
    return (
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <button onClick={() => setExpanded(false)} className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50">
              <Database className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-sm font-bold text-[#002443]">BigDataCorp — Enriquecimento Completo</span>
            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">{bdcValidations.length} consulta(s)</Badge>
          </div>
          <ChevronUp className="w-4 h-4 text-slate-400" />
        </button>
        <div className="border-t border-slate-100 p-4">
          <BDCEnrichmentPanel
            onboardingCaseId={onboardingCaseId}
            merchant={merchant}
            complianceScore={complianceScore}
            rawBdcResult={bdcValidations.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0]?.resultData || null}
            onComplete={onComplete}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-white border border-slate-200">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50">
            <Database className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-sm font-bold text-[#002443]">BigDataCorp + CNPJ — Enriquecimento</span>
          {hasBdcData ? (
            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">{bdcValidations.length} consulta(s)</Badge>
          ) : (
            <Badge className="bg-slate-100 text-slate-500 border-0 text-[10px]">Não consultado</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-[#002443]/40 text-center py-4">Nenhum dado de enriquecimento disponível. O BDC será executado automaticamente após o questionário.</p>
        </div>
      )}
    </div>
  );
}

export default function UnifiedSourcesSummary({ validations, integrationLogs, complianceScore, merchant, onboardingCaseId }) {
  return (
    <div className="bg-white rounded-2xl border border-[#002443]/8 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-slate-100">
          <Shield className="w-5 h-5 text-[#002443]/60" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#002443]">Fontes de Dados Externas</h3>
          <p className="text-xs text-[#002443]/40">Detalhes das verificações CAF e enriquecimento BigDataCorp/CNPJ</p>
        </div>
      </div>

      <CafSummarySection validations={validations} integrationLogs={integrationLogs} />
      <BdcSummarySection
        validations={validations}
        complianceScore={complianceScore}
        merchant={merchant}
        onboardingCaseId={onboardingCaseId}
        onComplete={() => window.location.reload()}
      />
    </div>
  );
}