import React from 'react';
import { Fingerprint, CheckCircle2, XCircle, AlertTriangle, Clock, Shield, ScanFace, FileCheck, Camera, AlertOctagon, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * Translates CAF integration log results into business-friendly language.
 * Each verification type gets a human-readable verdict.
 */

const SERVICE_BUSINESS = {
  face_liveness: {
    label: 'Prova de Vida',
    question: 'A pessoa na selfie é real?',
    icon: ScanFace,
    getVerdict: (r) => {
      if (r.is_alive === true) return { status: 'ok', text: `Sim — pessoa real confirmada com ${r.probability ? (r.probability * 100).toFixed(0) + '% de confiança' : 'alta confiança'}. Não é foto, vídeo ou máscara.` };
      if (r.is_alive === false) return { status: 'fail', text: 'Não — a prova de vida falhou. Pode indicar uso de foto, vídeo gravado ou deepfake. Risco de fraude de identidade.' };
      return { status: 'pending', text: 'Aguardando resultado da verificação de prova de vida.' };
    }
  },
  face_authentication: {
    label: 'Correspondência Facial',
    question: 'O rosto corresponde ao documento?',
    icon: ScanFace,
    getVerdict: (r) => {
      const sim = r.similarity != null ? (r.similarity * 100).toFixed(0) : null;
      if (['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status)) {
        return { status: 'ok', text: `Sim — selfie corresponde ao documento${sim ? ` com ${sim}% de similaridade` : ''}. Identidade confirmada.` };
      }
      return { status: 'fail', text: `Não — a selfie NÃO corresponde ao documento${sim ? ` (${sim}% similaridade)` : ''}. Risco alto de fraude de identidade.` };
    }
  },
  facematch: {
    label: 'Face Match',
    question: 'O rosto corresponde ao documento?',
    icon: ScanFace,
    getVerdict: (r) => {
      const sim = r.similarity != null ? (r.similarity * 100).toFixed(0) : null;
      if (['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status)) {
        return { status: 'ok', text: `Sim — correspondência facial confirmada${sim ? ` (${sim}%)` : ''}.` };
      }
      return { status: 'fail', text: `Não — divergência facial detectada${sim ? ` (${sim}%)` : ''}.` };
    }
  },
  documentscopy: {
    label: 'Autenticidade do Documento',
    question: 'O documento é autêntico?',
    icon: FileCheck,
    getVerdict: (r) => {
      if (['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status)) {
        return { status: 'ok', text: 'Sim — a análise forense digital não encontrou sinais de adulteração, montagem ou falsificação no documento.' };
      }
      return { status: 'fail', text: 'Não — foram identificados indícios de adulteração ou falsificação documental. Documento potencialmente fraudulento.' };
    }
  },
  deepfake_detection: {
    label: 'Detecção de Deepfake',
    question: 'A imagem é manipulada digitalmente?',
    icon: Shield,
    getVerdict: (r) => {
      if (['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status)) {
        return { status: 'ok', text: 'Não detectado — a IA não encontrou sinais de deepfake, face swap ou manipulação por inteligência artificial.' };
      }
      return { status: 'fail', text: 'ALERTA — detectada manipulação digital (deepfake/face swap). Alto risco de fraude de identidade via IA generativa.' };
    }
  },
  document_detector_front: {
    label: 'Captura Documento (Frente)',
    question: 'A frente do documento foi capturada corretamente?',
    icon: Camera,
    getVerdict: (r) => {
      if (['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status)) return { status: 'ok', text: 'Sim — frente do documento capturada com qualidade suficiente para análise.' };
      return { status: 'fail', text: 'Não — a captura da frente falhou. Documento ilegível, cortado ou de baixa qualidade.' };
    }
  },
  document_detector_back: {
    label: 'Captura Documento (Verso)',
    question: 'O verso do documento foi capturado corretamente?',
    icon: Camera,
    getVerdict: (r) => {
      if (['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status)) return { status: 'ok', text: 'Sim — verso do documento capturado e legível.' };
      return { status: 'fail', text: 'Não — a captura do verso falhou.' };
    }
  },
  ocr_sync: {
    label: 'Leitura do Documento (OCR)',
    question: 'Os dados do documento foram extraídos?',
    icon: Eye,
    getVerdict: (r) => {
      const rd = r.resultData || r.response_payload || {};
      const extracted = [rd.name, rd.cpf, rd.birthDate].filter(Boolean);
      if (extracted.length > 0) return { status: 'ok', text: `Sim — ${extracted.length} dados extraídos (${rd.name ? 'nome' : ''}${rd.cpf ? ', CPF' : ''}${rd.birthDate ? ', nascimento' : ''}).` };
      return { status: 'pending', text: 'Dados não puderam ser extraídos automaticamente do documento.' };
    }
  },
  pep_international: {
    label: 'PEP Internacional',
    question: 'É Pessoa Politicamente Exposta?',
    icon: AlertOctagon,
    getVerdict: (r) => {
      const hasFlag = (r.red_flags || []).some(f => f.toLowerCase().includes('pep'));
      if (hasFlag) return { status: 'fail', text: 'SIM — identificada como PEP. Exige monitoramento reforçado e aprovação em nível superior (Circular BACEN 3.978/2020).' };
      if (['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status)) return { status: 'ok', text: 'Não — não identificada como PEP em bases internacionais. Sem restrições neste quesito.' };
      return { status: 'pending', text: 'Verificação de PEP ainda em processamento.' };
    }
  },
  sanctions_international: {
    label: 'Sanções Internacionais',
    question: 'Está em listas de sanções (OFAC, UE, ONU)?',
    icon: AlertOctagon,
    getVerdict: (r) => {
      const hasFlag = (r.red_flags || []).some(f => f.toLowerCase().includes('sanc') || f.toLowerCase().includes('ofac'));
      if (hasFlag) return { status: 'fail', text: 'SIM — presente em listas de sanções internacionais. Operações financeiras podem estar PROIBIDAS por lei.' };
      if (['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status)) return { status: 'ok', text: 'Não — não consta em listas de sanções da OFAC, União Europeia ou ONU.' };
      return { status: 'pending', text: 'Verificação de sanções em processamento.' };
    }
  },
  warnings_interpol: {
    label: 'Alertas Interpol',
    question: 'Consta em bases da Interpol?',
    icon: AlertOctagon,
    getVerdict: (r) => {
      const hasFlag = (r.red_flags || []).some(f => f.toLowerCase().includes('interpol'));
      if (hasFlag) return { status: 'fail', text: 'SIM — alerta encontrado em bases da Interpol. Risco reputacional e regulatório máximo.' };
      if (['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status)) return { status: 'ok', text: 'Não — sem alertas na Interpol.' };
      return { status: 'pending', text: 'Verificação Interpol em processamento.' };
    }
  },
  official_biometrics: {
    label: 'Biometria Oficial (Gov)',
    question: 'A selfie confere com bases governamentais?',
    icon: Shield,
    getVerdict: (r) => {
      if (['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status)) return { status: 'ok', text: 'Sim — a selfie corresponde à biometria registrada em bases oficiais do governo (TSE/CNH/Passaporte). Máxima confiança.' };
      return { status: 'fail', text: 'Não — a biometria não foi confirmada por bases oficiais.' };
    }
  },
  cpf_cross_validation: {
    label: 'Validação Cruzada CPF',
    question: 'Os dados do CPF conferem?',
    icon: Shield,
    getVerdict: (r) => {
      if (['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status)) return { status: 'ok', text: 'Sim — nome, nascimento e dados do CPF conferem entre documento, selfie e Receita Federal.' };
      return { status: 'fail', text: 'Divergência — os dados do CPF não conferem com o documento apresentado.' };
    }
  },
  document_liveness: {
    label: 'Liveness do Documento',
    question: 'O documento é um original físico?',
    icon: FileCheck,
    getVerdict: (r) => {
      if (['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status)) return { status: 'ok', text: 'Sim — documento é um original físico (não é foto de tela, cópia ou impressão).' };
      return { status: 'fail', text: 'Não — o documento parece ser uma cópia, foto de tela ou impressão. Não é original.' };
    }
  },
};

function getGenericVerdict(record) {
  const s = (record.status || record.result_status || '').toLowerCase();
  if (['sucesso', 'success', 'approved'].includes(s)) return { status: 'ok', text: 'Verificação concluída com sucesso.' };
  if (['falha', 'failed', 'reproved'].includes(s)) return { status: 'fail', text: 'Verificação falhou ou foi reprovada.' };
  return { status: 'pending', text: 'Verificação em andamento ou pendente.' };
}

const STATUS_VISUAL = {
  ok: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  fail: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
};

export default function CafResultsSummaryBusiness({ integrationLogs = [], validations = [] }) {
  // Merge all CAF records, dedupe, pick latest per service type
  const allCaf = [...validations.filter(v => v.provider === 'CAF'), ...integrationLogs.filter(l => l.provider === 'CAF')];
  const byType = {};
  for (const r of allCaf) {
    const svc = r.service_type || r.validationType || 'unknown';
    if (!byType[svc] || new Date(r.created_date) > new Date(byType[svc].created_date)) {
      byType[svc] = r;
    }
  }
  const entries = Object.entries(byType).sort((a, b) => {
    const order = Object.keys(SERVICE_BUSINESS);
    const ia = order.indexOf(a[0]);
    const ib = order.indexOf(b[0]);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  if (entries.length === 0) return null;

  const okCount = entries.filter(([, r]) => {
    const svc = SERVICE_BUSINESS[r.service_type || r.validationType];
    const v = svc ? svc.getVerdict(r) : getGenericVerdict(r);
    return v.status === 'ok';
  }).length;
  const failCount = entries.filter(([, r]) => {
    const svc = SERVICE_BUSINESS[r.service_type || r.validationType];
    const v = svc ? svc.getVerdict(r) : getGenericVerdict(r);
    return v.status === 'fail';
  }).length;

  return (
    <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-purple-50/40 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100">
            <Fingerprint className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--pinbank-blue)]">Resultados CAF — Linguagem de Negócio</h3>
            <p className="text-xs text-[var(--pinbank-blue)]/40">Cada verificação traduzida: o que verificou, o que encontrou, o que significa</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge className="bg-green-100 text-green-700 text-[10px]">{okCount} ok</Badge>
            {failCount > 0 && <Badge className="bg-red-100 text-red-700 text-[10px]">{failCount} falha</Badge>}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {entries.map(([svcType, record]) => {
          const svcConfig = SERVICE_BUSINESS[svcType];
          const verdict = svcConfig ? svcConfig.getVerdict(record) : getGenericVerdict(record);
          const vis = STATUS_VISUAL[verdict.status];
          const Icon = svcConfig?.icon || Fingerprint;
          const StatusIcon = vis.icon;
          const label = svcConfig?.label || svcType.replace(/_/g, ' ');
          const question = svcConfig?.question || 'Verificação realizada?';

          return (
            <div key={svcType} className={`p-4 rounded-xl border ${vis.border} ${vis.bg}`}>
              <div className="flex items-start gap-3">
                <StatusIcon className={`w-5 h-5 ${vis.color} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold text-[var(--pinbank-blue)]">{label}</span>
                  </div>
                  <p className="text-[10px] font-semibold text-[var(--pinbank-blue)]/50 mb-1">{question}</p>
                  <p className={`text-xs leading-relaxed ${vis.color}`}>{verdict.text}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}