import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ScanFace, FileCheck, CheckCircle2, XCircle, AlertCircle, Eye, ChevronDown, ChevronUp,
  Shield, Camera, Image, Clock, Fingerprint
} from 'lucide-react';
import CafResyncButton from './CafResyncButton';

/**
 * Displays detailed CAF verification results (DocumentDetector + FaceLiveness)
 * extracted from ExternalValidationResult and IntegrationLog entities.
 */

function CafImagePreview({ url, label }) {
  const [expanded, setExpanded] = useState(false);
  if (!url) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-[#002443]/60">{label}</p>
      <div 
        className={`relative rounded-lg border border-slate-200 overflow-hidden cursor-pointer transition-all ${expanded ? 'max-h-[400px]' : 'max-h-[120px]'}`}
        onClick={() => setExpanded(!expanded)}
      >
        <img src={url} alt={label} className="w-full object-cover" />
        {!expanded && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent flex items-end justify-center pb-2">
            <span className="text-white text-xs font-medium bg-black/40 px-2 py-0.5 rounded-full">Clique para expandir</span>
          </div>
        )}
      </div>
      <Button variant="outline" size="sm" className="text-xs h-7" asChild>
        <a href={url} target="_blank" rel="noopener noreferrer"><Eye className="w-3 h-3 mr-1" /> Abrir original</a>
      </Button>
    </div>
  );
}

function CafResultCard({ validation, integrationLog }) {
  const [expanded, setExpanded] = useState(false);
  const rd = validation?.resultData || {};
  const isLiveness = validation?.validationType?.includes('Liveness');
  const isDocFront = validation?.validationType?.includes('Frente');
  const isDocBack = validation?.validationType?.includes('Verso');

  const Icon = isLiveness ? ScanFace : FileCheck;
  const iconBg = isLiveness ? 'bg-purple-50' : 'bg-blue-50';
  const iconColor = isLiveness ? 'text-purple-600' : 'text-blue-600';

  const isSuccess = validation?.status === 'Sucesso';
  const isPendingReview = validation?.status === 'Pendente';

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#002443]">{validation?.validationType}</span>
              <Badge className={
                isSuccess ? 'bg-green-100 text-green-800' : 
                isPendingReview ? 'bg-orange-100 text-orange-800' : 
                'bg-red-100 text-red-800'
              }>
                {isSuccess ? 'Aprovado' : isPendingReview ? 'Revisão Manual' : 'Reprovado'}
              </Badge>
            </div>
            <p className="text-xs text-[#002443]/50 mt-0.5">
              {validation?.timestamp ? new Date(validation.timestamp).toLocaleString('pt-BR') : '-'}
              {validation?.responseTime ? ` • ${validation.responseTime}ms` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {validation?.score !== undefined && (
            <span className={`text-lg font-bold ${validation.score >= 80 ? 'text-green-600' : validation.score >= 50 ? 'text-orange-600' : 'text-red-600'}`}>
              {validation.score}
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/50">
          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {isLiveness && (
              <>
                <MetricCard 
                  icon={Fingerprint} 
                  label="Prova de Vida" 
                  value={rd.isAlive === true ? 'APROVADA' : rd.isAlive === false ? 'REPROVADA' : '-'}
                  color={rd.isAlive ? 'green' : 'red'}
                />
                <MetricCard 
                  icon={ScanFace} 
                  label="Face Match" 
                  value={rd.isMatch === true ? 'CONFIRMADO' : rd.isMatch === false ? 'NÃO CORRESPONDEU' : '-'}
                  color={rd.isMatch ? 'green' : rd.isMatch === false ? 'red' : 'slate'}
                />
                {rd.similarity != null && (
                  <MetricCard 
                    icon={ScanFace} 
                    label="Similaridade" 
                    value={`${(rd.similarity * 100).toFixed(0)}%`}
                    color={rd.similarity >= 0.7 ? 'green' : rd.similarity >= 0.4 ? 'orange' : 'red'}
                  />
                )}
                {rd.probability != null && (
                  <MetricCard 
                    icon={Fingerprint} 
                    label="Probabilidade" 
                    value={`${(rd.probability * 100).toFixed(0)}%`}
                    color={rd.probability >= 0.8 ? 'green' : 'orange'}
                  />
                )}
              </>
            )}
            {(isDocFront || isDocBack) && (
              <>
                <MetricCard 
                  icon={FileCheck} 
                  label="Captura Válida" 
                  value={rd.isCaptureValid === true ? 'SIM' : rd.isCaptureValid === false ? 'NÃO' : '-'}
                  color={rd.isCaptureValid !== false ? 'green' : 'red'}
                />
                {rd.documentType && (
                  <MetricCard 
                    icon={Camera} 
                    label="Tipo Documento" 
                    value={`${rd.documentType}${rd.documentSide ? ' (' + rd.documentSide + ')' : ''}`}
                    color="blue"
                  />
                )}
                {!rd.documentType && rd.detectedDocument?.type && (
                  <MetricCard 
                    icon={Camera} 
                    label="Tipo Documento" 
                    value={rd.detectedDocument.type}
                    color="blue"
                  />
                )}
              </>
            )}
            <MetricCard 
              icon={Clock} 
              label="Tempo Resposta" 
              value={validation?.responseTime ? `${validation.responseTime}ms` : '-'}
              color="slate"
            />
            <MetricCard 
              icon={Shield} 
              label="Score" 
              value={validation?.score ?? '-'}
              color={validation?.score >= 80 ? 'green' : validation?.score >= 50 ? 'orange' : 'red'}
            />
          </div>

          {/* CAF Decision Badge */}
          {rd.cafDecision && (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
              rd.cafDecision === 'APPROVED' ? 'bg-green-100 text-green-800 border border-green-200' :
              rd.cafDecision === 'REPROVED' ? 'bg-red-100 text-red-800 border border-red-200' :
              'bg-orange-100 text-orange-800 border border-orange-200'
            }`}>
              {rd.cafDecision === 'APPROVED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
               rd.cafDecision === 'REPROVED' ? <XCircle className="w-3.5 h-3.5" /> :
               <AlertCircle className="w-3.5 h-3.5" />}
              Decisão CAF: {rd.cafDecision === 'APPROVED' ? 'Aprovado' : rd.cafDecision === 'REPROVED' ? 'Reprovado' : 'Revisão Manual'}
            </div>
          )}

          {/* Session ID for liveness */}
          {rd.sessionId && (
            <div className="text-xs text-[#002443]/40">
              <span className="font-medium">Session ID:</span> <span className="font-mono">{rd.sessionId}</span>
            </div>
          )}

          {/* Image preview */}
          {rd.uploadedImageUrl && (
            <CafImagePreview url={rd.uploadedImageUrl} label={
              isLiveness ? 'Selfie / Prova de Vida' :
              isDocFront ? 'Documento — Frente' : 'Documento — Verso'
            } />
          )}

          {/* Integration Log details */}
          {integrationLog && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
              <p className="text-xs font-bold text-[#002443]/50 mb-2 uppercase tracking-wide">Log de Integração</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {integrationLog.request_id && (
                  <div><span className="text-[#002443]/40">Request ID:</span> <span className="font-mono text-[#002443]/70">{integrationLog.request_id}</span></div>
                )}
                {integrationLog.duration_ms && (
                  <div><span className="text-[#002443]/40">Duração:</span> <span className="font-medium">{integrationLog.duration_ms}ms</span></div>
                )}
                {integrationLog.result_status && (
                  <div><span className="text-[#002443]/40">Resultado:</span> <Badge className={integrationLog.result_status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} variant="outline">{integrationLog.result_status}</Badge></div>
                )}
                {integrationLog.is_alive !== null && integrationLog.is_alive !== undefined && (
                  <div><span className="text-[#002443]/40">is_alive:</span> <span className="font-medium">{String(integrationLog.is_alive)}</span></div>
                )}
                {integrationLog.image_urls?.length > 0 && (
                  <div className="col-span-2"><span className="text-[#002443]/40">Imagens salvas:</span> <span className="font-medium">{integrationLog.image_urls.length}</span></div>
                )}
              </div>
            </div>
          )}

          {/* Raw resultData (collapsed) */}
          <RawDataViewer data={rd} />
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }) {
  const colors = {
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
  };
  return (
    <div className={`p-3 rounded-lg border ${colors[color] || colors.slate}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 opacity-60" />
        <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{label}</span>
      </div>
      <p className="font-bold text-sm">{value}</p>
    </div>
  );
}

function RawDataViewer({ data }) {
  const [open, setOpen] = useState(false);
  if (!data || Object.keys(data).length === 0) return null;
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="text-xs text-[#002443]/40 hover:text-[#002443]/60 flex items-center gap-1">
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {open ? 'Ocultar dados brutos' : 'Ver dados brutos da CAF'}
      </button>
      {open && (
        <pre className="mt-2 p-3 bg-slate-900 text-green-300 text-[10px] rounded-lg overflow-auto max-h-[300px] font-mono">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function CafResultsPanel({ validations, integrationLogs = [], onboardingCaseId, onResync }) {
  const cafValidations = validations.filter(v => v.provider === 'CAF');
  const cafLogs = integrationLogs.filter(l => l.provider === 'CAF');

  if (cafValidations.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <ScanFace className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-[#002443]">Resultados CAF</h3>
          </div>
          {onboardingCaseId && (
            <CafResyncButton onboardingCaseId={onboardingCaseId} onSuccess={onResync} />
          )}
        </div>
        <div className="text-center py-8">
          <ScanFace className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-[#002443]/50 font-medium">Nenhuma verificação CAF realizada</p>
          <p className="text-xs text-[#002443]/30 mt-1">O cliente ainda não completou a verificação de identidade.</p>
        </div>
      </div>
    );
  }

  // Sort: liveness last
  const sorted = [...cafValidations].sort((a, b) => {
    const order = { 'DocumentDetector Frente': 1, 'DocumentDetector Verso': 2, 'FaceLiveness': 3 };
    return (order[a.validationType] || 0) - (order[b.validationType] || 0);
  });

  // Summary
  const livenessResult = sorted.find(v => v.validationType?.includes('Liveness'));
  const allApproved = sorted.every(v => v.status === 'Sucesso');

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-50">
            <ScanFace className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#002443]">Resultados CAF</h3>
            <p className="text-xs text-[#002443]/50">{cafValidations.length} verificação(ões) encontrada(s)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onboardingCaseId && (
            <CafResyncButton onboardingCaseId={onboardingCaseId} onSuccess={onResync} />
          )}
          <Badge className={allApproved ? 'bg-green-100 text-green-800 border-green-200' : 'bg-orange-100 text-orange-800 border-orange-200'}>
            {allApproved ? (
              <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Todas aprovadas</>
            ) : (
              <><XCircle className="w-3.5 h-3.5 mr-1" /> Atenção necessária</>
            )}
          </Badge>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200 mb-4">
        {sorted.map((v, i) => {
          const isOk = v.status === 'Sucesso';
          return (
            <div key={i} className="flex items-center gap-1.5 text-xs font-medium">
              {isOk ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
              <span className={isOk ? 'text-green-700' : 'text-red-600'}>{v.validationType}</span>
            </div>
          );
        })}
      </div>

      {/* Individual results */}
      <div className="space-y-3">
        {sorted.map((v, i) => {
          const matchingLog = cafLogs.find(l => 
            l.service_type === (v.validationType?.includes('Frente') ? 'document_detector_front' :
                               v.validationType?.includes('Verso') ? 'document_detector_back' : 'face_liveness')
          );
          return <CafResultCard key={i} validation={v} integrationLog={matchingLog} />;
        })}
      </div>
    </div>
  );
}