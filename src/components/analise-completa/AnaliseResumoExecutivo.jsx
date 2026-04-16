import React from 'react';
import { Shield, CheckCircle2, XCircle, AlertTriangle, AlertOctagon, Fingerprint, Database, FileCheck, ScanFace, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SERVICE_LABELS = {
  face_liveness: 'Prova de Vida (Liveness)',
  face_authentication: 'Autenticação Facial',
  document_detector: 'Detecção de Documento',
  document_detector_front: 'Documento — Frente',
  document_detector_back: 'Documento — Verso',
  documentscopy: 'Documentoscopia (Fraude Documental)',
  deepfake_detection: 'Detecção de Deepfake',
  official_biometrics: 'Biometria Oficial (Gov)',
  ocr_sync: 'OCR (Leitura de Documento)',
  document_liveness: 'Liveness de Documento',
  onboarding_web: 'Onboarding Web CAF',
  transaction: 'Transação CAF',
  liveness: 'Liveness (Legacy)',
  facematch: 'Face Match (Legacy)',
  pep_international: 'PEP Internacional',
  sanctions_international: 'Sanções Internacionais',
  warnings_interpol: 'Alertas Interpol',
  cpf_cross_validation: 'Validação Cruzada CPF',
  kyb_company_search: 'KYB — Busca Empresa',
  kyb_business_identity: 'KYB — Identidade Empresarial',
  kyb_credit_report: 'KYB — Relatório de Crédito',
  pf_credit_profile: 'Perfil de Crédito PF',
  pj_credit_profile: 'Perfil de Crédito PJ',
  caf_webhook_received: 'Webhook CAF Recebido',
  caf_post_capture_full: 'Pós-Captura Completa',
  private_faceset: 'Faceset Privado',
  shared_faceset: 'Faceset Compartilhado',
  face_register: 'Registro Facial',
  verifai_docs: 'VerifAI Documentos',
  empresas_basic_data: 'Dados Básicos Empresa',
  empresas_kyc: 'KYC Empresa',
  empresas_kyc_real: 'KYC Empresa (Real)',
  empresas_owners_kyc: 'KYC Sócios',
  empresas_relationships: 'Relacionamentos Empresariais',
  pessoas_kyc: 'KYC Pessoa Física',
};

function getServiceLabel(serviceType) {
  return SERVICE_LABELS[serviceType] || serviceType?.replace(/_/g, ' ') || 'Desconhecido';
}

function getStatusInfo(status) {
  const s = (status || '').toUpperCase();
  if (s === 'SUCCESS' || s === 'SUCESSO' || s === 'APPROVED') return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', label: 'Aprovado' };
  if (s === 'FAILED' || s === 'FALHA' || s === 'REPROVED') return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Reprovado' };
  if (s === 'PENDING' || s === 'PENDENTE' || s === 'PENDING_REVIEW' || s === 'PROCESSING') return { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Pendente' };
  return { icon: Eye, color: 'text-slate-500', bg: 'bg-slate-50', label: status || 'N/D' };
}

export default function AnaliseResumoExecutivo({ merchant, latestCase, latestScore, cafValidations, cafLogs, bdcValidations, bdcLogs }) {
  // Consolidate all CAF service types
  const allCafRecords = [...cafValidations, ...cafLogs];
  const cafServiceTypes = [...new Set(allCafRecords.map(r => r.service_type || r.validationType).filter(Boolean))];
  
  // Status summary
  const cafApproved = allCafRecords.filter(r => ['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status)).length;
  const cafFailed = allCafRecords.filter(r => ['Falha', 'failed', 'REPROVED'].includes(r.status || r.result_status)).length;
  const cafPending = allCafRecords.filter(r => ['Pendente', 'pending', 'PENDING_REVIEW', 'processing'].includes(r.status || r.result_status)).length;
  
  const bdcRecords = [...bdcValidations, ...bdcLogs];
  const bdcApproved = bdcRecords.filter(r => ['Sucesso', 'success'].includes(r.status || r.result_status)).length;

  // Red flags from case
  const redFlags = latestCase?.redFlags || [];

  // Score info
  const scoreV4 = latestScore?.score_final ?? latestCase?.riskScoreV4;
  const subfaixa = latestScore?.subfaixa_nome || latestCase?.subfaixaNome || '';
  const recomendacao = latestScore?.recomendacao_final || '';

  // Determine overall risk level in business language
  const getOverallAssessment = () => {
    if (cafFailed > 0 || redFlags.length > 3) {
      return { level: 'CRÍTICO', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', 
        text: 'Foram identificados problemas graves nas validações de identidade. A verificação facial, documental ou de sanções retornou resultados negativos. Recomenda-se revisão manual imediata e possível recusa.' };
    }
    if (redFlags.length > 0 || cafPending > 2) {
      return { level: 'ATENÇÃO', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200',
        text: 'Alguns pontos de atenção foram identificados. Existem flags de risco que devem ser analisados manualmente pelo time de compliance antes da aprovação.' };
    }
    if (cafApproved > 0 && cafFailed === 0) {
      return { level: 'FAVORÁVEL', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200',
        text: 'As validações externas indicam um perfil com baixo risco. A verificação de identidade foi aprovada e não foram encontradas sanções, PEPs ou inconsistências graves.' };
    }
    return { level: 'INCOMPLETO', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200',
      text: 'As validações externas ainda não foram concluídas. Aguarde a finalização dos processos de verificação da CAF e enriquecimento BDC para uma avaliação completa.' };
  };

  const assessment = getOverallAssessment();

  return (
    <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 overflow-hidden">
      {/* Title */}
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50">
            <Shield className="w-5 h-5 text-[var(--pagsmile-green)]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--pagsmile-blue)]">Resumo Executivo — Validações Externas</h2>
            <p className="text-xs text-[var(--pagsmile-blue)]/40">Visão consolidada em linguagem de negócio e compliance</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Overall Assessment */}
        <div className={`p-5 rounded-xl border ${assessment.border} ${assessment.bg}`}>
          <div className="flex items-center gap-2 mb-2">
            <Badge className={`${assessment.bg} ${assessment.color} border ${assessment.border} text-xs font-bold`}>
              Parecer: {assessment.level}
            </Badge>
            {scoreV4 != null && (
              <Badge className="bg-[var(--pagsmile-blue)] text-white text-xs">Score V4: {scoreV4} — {subfaixa}</Badge>
            )}
            {recomendacao && <Badge variant="outline" className="text-xs">{recomendacao}</Badge>}
          </div>
          <p className={`text-sm leading-relaxed ${assessment.color}`}>{assessment.text}</p>
        </div>

        {/* Quick Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickMetric icon={Fingerprint} label="Verificações CAF" value={allCafRecords.length} sub={`${cafApproved} ok · ${cafFailed} falha · ${cafPending} pendente`} iconColor="text-purple-600" bgColor="bg-purple-50" />
          <QuickMetric icon={Database} label="Consultas BDC" value={bdcRecords.length} sub={`${bdcApproved} com retorno`} iconColor="text-blue-600" bgColor="bg-blue-50" />
          <QuickMetric icon={AlertOctagon} label="Red Flags" value={redFlags.length} sub={redFlags.length > 0 ? 'Requer atenção' : 'Nenhum identificado'} iconColor={redFlags.length > 0 ? 'text-red-600' : 'text-green-600'} bgColor={redFlags.length > 0 ? 'bg-red-50' : 'bg-green-50'} />
          <QuickMetric icon={FileCheck} label="Serviços Distintos" value={cafServiceTypes.length} sub="Tipos de validação CAF" iconColor="text-indigo-600" bgColor="bg-indigo-50" />
        </div>

        {/* Services Performed */}
        <div>
          <h3 className="text-sm font-bold text-[var(--pagsmile-blue)] mb-3">Serviços de Validação Executados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {cafServiceTypes.map(svc => {
              const records = allCafRecords.filter(r => (r.service_type || r.validationType) === svc);
              const latest = records.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
              const si = getStatusInfo(latest?.status || latest?.result_status);
              const Icon = si.icon;
              return (
                <div key={svc} className={`flex items-center gap-3 p-3 rounded-lg border ${si.bg} border-slate-200`}>
                  <Icon className={`w-4 h-4 ${si.color} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--pagsmile-blue)] truncate">{getServiceLabel(svc)}</p>
                    <p className="text-[10px] text-[var(--pagsmile-blue)]/40">{si.label} • {records.length}x executado</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Red Flags Detail */}
        {redFlags.length > 0 && (
          <div className="p-4 bg-red-50 rounded-xl border border-red-200">
            <h3 className="text-sm font-bold text-red-700 mb-3 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4" />
              Red Flags Identificados ({redFlags.length})
            </h3>
            <p className="text-xs text-red-600/70 mb-3">
              Sinalizações automáticas geradas pelas validações da CAF e/ou BDC que indicam possíveis riscos ao negócio.
            </p>
            <div className="space-y-2">
              {redFlags.map((flag, i) => {
                const { source, text } = parseFlag(flag);
                return (
                  <div key={i} className="flex items-start gap-2.5 p-3 bg-red-100/50 rounded-lg">
                    <XCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-red-700 leading-relaxed">{text}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {source && (
                          <span className="inline-flex px-1.5 py-0.5 rounded bg-red-100 text-[9px] font-medium text-red-600 border border-red-200">
                            {source}
                          </span>
                        )}
                        <span className="text-[9px] text-red-500/60">{getFlagBusinessExplanation(flag)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function QuickMetric({ icon: Icon, label, value, sub, iconColor, bgColor }) {
  return (
    <div className="p-4 rounded-xl bg-white border border-slate-200">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${bgColor}`}><Icon className={`w-4 h-4 ${iconColor}`} /></div>
        <span className="text-[10px] font-semibold text-[var(--pagsmile-blue)]/50 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-black text-[var(--pagsmile-blue)]">{value}</p>
      <p className="text-[10px] text-[var(--pagsmile-blue)]/40 mt-0.5">{sub}</p>
    </div>
  );
}

function parseFlag(text) {
  if (!text) return { source: '', text: '' };
  const prefixMatch = text.match(/^(SENTINEL|V4|CAF):\s*/i);
  const prefix = prefixMatch ? prefixMatch[1].toUpperCase() : '';
  let cleaned = prefixMatch ? text.slice(prefixMatch[0].length) : text;
  let source = prefix;
  const fonteMatch = cleaned.match(/\[FONTE:\s*([^\]]+)\]/i);
  if (fonteMatch) {
    source = (prefix ? prefix + ' · ' : '') + fonteMatch[1].trim();
    cleaned = cleaned.replace(fonteMatch[0], '').trim();
  }
  cleaned = cleaned.replace(/\[([^\]]+)\]/g, '($1)').trim();
  return { source, text: cleaned };
}

function getFlagBusinessExplanation(flag) {
  const lower = (flag || '').toLowerCase();
  if (lower.includes('pep')) return 'Pessoa politicamente exposta — exige monitoramento reforçado e aprovação em nível superior conforme regulamentação BACEN.';
  if (lower.includes('sanc') || lower.includes('ofac')) return 'Identificação em lista de sanções internacionais — risco regulatório elevado, pode impedir a operação.';
  if (lower.includes('interpol')) return 'Alerta em bases da Interpol — alto risco de compliance e reputação.';
  if (lower.includes('cnpj') && lower.includes('inativ')) return 'CNPJ com situação irregular na Receita Federal — empresa pode estar inapta, suspensa ou baixada.';
  if (lower.includes('deepfake')) return 'Suspeita de manipulação digital na imagem facial — possível tentativa de fraude de identidade.';
  if (lower.includes('liveness') || lower.includes('prova de vida')) return 'A verificação de prova de vida falhou — pode indicar uso de foto, vídeo ou máscara.';
  if (lower.includes('face') && lower.includes('match')) return 'A foto do rosto não corresponde ao documento apresentado — divergência de identidade.';
  if (lower.includes('document') && lower.includes('fraud')) return 'Suspeita de adulteração ou falsificação do documento apresentado.';
  if (lower.includes('cpf') && lower.includes('diverg')) return 'Os dados do CPF não correspondem aos declarados — inconsistência de identidade.';
  if (lower.includes('credit') || lower.includes('score_baixo')) return 'Score de crédito abaixo do esperado — pode indicar inadimplência ou histórico negativo.';
  if (lower.includes('divida') || lower.includes('debt')) return 'Dívidas ativas identificadas — pode afetar a capacidade de honrar compromissos.';
  if (lower.includes('processo') || lower.includes('lawsuit')) return 'Processos judiciais identificados — risco operacional e reputacional.';
  return 'Sinalização automática que requer análise manual do time de compliance.';
}