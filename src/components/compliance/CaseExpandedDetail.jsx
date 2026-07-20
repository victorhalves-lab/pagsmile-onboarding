import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2, XCircle, Clock, AlertTriangle, FileText,
  Brain, Shield, Paperclip, Loader2, ExternalLink
} from 'lucide-react';
import CaseActionButtons from './CaseActionButtons';

function DocStatusIcon({ status }) {
  if (status === 'Validado') return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
  if (status === 'Rejeitado') return <XCircle className="w-3.5 h-3.5 text-red-500" />;
  if (status === 'Erro') return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
  return <Clock className="w-3.5 h-3.5 text-slate-400" />;
}

function ValidationStatusBadge({ status }) {
  const colors = {
    'Sucesso': 'bg-green-100 text-green-700',
    'Falha': 'bg-red-100 text-red-700',
    'Erro': 'bg-red-100 text-red-700',
    'Pendente': 'bg-yellow-100 text-yellow-700',
  };
  return <Badge className={`${colors[status] || colors.Pendente} text-[10px] border-0`}>{status}</Badge>;
}

export default function CaseExpandedDetail({ caseData, scoresMap, templatesMap, merchantMap }) {
  const score = scoresMap?.[caseData.id];
  const template = templatesMap?.[caseData.questionnaireTemplateId];
  const requiredDocs = template?.requiredDocuments || [];

  const { data: uploads = [], isLoading: loadingUploads } = useQuery({
    queryKey: ['doc-uploads', caseData.id],
    queryFn: () => base44.entities.DocumentUpload.filter({ onboardingCaseId: caseData.id }),
    enabled: !!caseData.id,
  });

  const { data: validations = [], isLoading: loadingValidations } = useQuery({
    queryKey: ['ext-validations', caseData.id],
    queryFn: () => base44.entities.ExternalValidationResult.filter({ onboardingCaseId: caseData.id }),
    enabled: !!caseData.id,
  });

  const isLoading = loadingUploads || loadingValidations;

  // Map uploads by document name for matching
  const uploadsByName = {};
  uploads.forEach(u => {
    const key = (u.documentName || '').toLowerCase().trim();
    if (key) uploadsByName[key] = u;
  });

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-[#0A0A0A]/5">
        <span className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">Ações Rápidas</span>
        <CaseActionButtons
          caseId={caseData.id}
          merchantName={merchantMap?.[caseData.merchantId]?.fullName || ''}
          documentsCount={uploads.length}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* IA Summary */}
      <div className="bg-white rounded-xl p-4 border border-[#0A0A0A]/5">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-[#1356E2]" />
          <h4 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">Resumo IA</h4>
        </div>
        <p className="text-xs text-[#0A0A0A]/60 leading-relaxed">
          {score?.sumario_executivo || score?.parecer_final || caseData.iaExplanation || 'Análise não disponível.'}
        </p>
        {(score?.red_flags || caseData.redFlags || []).length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-[10px] font-bold text-red-600 mb-1.5">RED FLAGS</p>
            <ul className="space-y-1">
              {(score?.red_flags || caseData.redFlags || []).slice(0, 4).map((flag, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-red-600">
                  <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="bg-white rounded-xl p-4 border border-[#0A0A0A]/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-indigo-500" />
            <h4 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">Documentos</h4>
          </div>
          <Badge className="bg-indigo-50 text-indigo-600 text-[10px] border-0">
            {uploads.length}/{requiredDocs.length}
          </Badge>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
        ) : requiredDocs.length === 0 ? (
          <p className="text-xs text-slate-400">Template sem documentos configurados.</p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {requiredDocs.map((doc, i) => {
              const docLabel = doc.label || doc;
              const matchKey = String(docLabel).toLowerCase().trim();
              const upload = uploadsByName[matchKey] || uploads.find(u => 
                (u.documentName || '').toLowerCase().includes(matchKey.slice(0, 20))
              );
              const status = upload?.validationStatus || 'Pendente';
              const sent = !!upload;
              return (
                <div key={i} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] ${
                  sent ? 'bg-green-50/50' : 'bg-slate-50'
                }`}>
                  <DocStatusIcon status={sent ? status : 'Pendente'} />
                  <span className={`flex-1 truncate ${sent ? 'text-[#0A0A0A]' : 'text-slate-400'}`}>
                    {docLabel}
                  </span>
                  {sent ? (
                    <Badge className={`text-[9px] border-0 ${
                      status === 'Validado' ? 'bg-green-100 text-green-700' :
                      status === 'Rejeitado' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{status}</Badge>
                  ) : (
                    <span className="text-[9px] text-slate-300 font-medium">NÃO ENVIADO</span>
                  )}
                  {doc.required && !sent && (
                    <span className="text-[8px] text-red-400 font-bold">OBRIG.</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Validations & Scores */}
      <div className="bg-white rounded-xl p-4 border border-[#0A0A0A]/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">Validações</h4>
          </div>
          <Badge className="bg-amber-50 text-amber-600 text-[10px] border-0">
            {validations.filter(v => v.status === 'Sucesso').length}/{validations.length || 0}
          </Badge>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
        ) : validations.length === 0 ? (
          <p className="text-xs text-slate-400 mb-3">Nenhuma validação externa executada.</p>
        ) : (
          <div className="space-y-1.5 mb-3 max-h-28 overflow-y-auto">
            {validations.map((v, i) => (
              <div key={i} className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 rounded-lg text-[11px]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-[#0A0A0A] truncate">{v.provider}</span>
                  <span className="text-slate-400 truncate">{v.validationType}</span>
                </div>
                <ValidationStatusBadge status={v.status} />
              </div>
            ))}
          </div>
        )}

        {/* Scores */}
        <div className="pt-3 border-t border-slate-100 space-y-1.5">
          <p className="text-[10px] font-bold text-[#0A0A0A] uppercase tracking-wider mb-1">Scores</p>
          {[
            { label: 'Questionário (SQ)', value: score?.score_questionario },
            { label: 'Validação Ext. (SVE)', value: score?.score_validacao_externa },
            { label: 'Geral Composto (SGC)', value: score?.score_geral_composto || caseData.riskScore, highlight: true },
            { label: 'Recomendação', value: score?.recomendacao_final || caseData.iaDecision, isText: true },
          ].map((s, i) => (
            <div key={i} className="flex justify-between text-[11px]">
              <span className="text-[#0A0A0A]/50">{s.label}</span>
              <span className={`font-bold ${s.highlight ? 'text-[#1356E2]' : ''}`}>
                {s.value || '-'}
              </span>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}