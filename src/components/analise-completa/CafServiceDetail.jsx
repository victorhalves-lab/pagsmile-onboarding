import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertTriangle, Clock, Eye, Fingerprint, FileCheck, Camera, Shield, AlertOctagon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SERVICE_LABELS = {
  face_liveness: { label: 'Prova de Vida (Liveness)', desc: 'Verifica se a pessoa na selfie é real e está viva (não é foto, vídeo ou deepfake). Usa inteligência artificial para analisar movimentos faciais e texturas de pele.', icon: Fingerprint },
  face_authentication: { label: 'Autenticação Facial', desc: 'Compara a selfie com uma face previamente registrada no sistema para confirmar que é a mesma pessoa.', icon: Fingerprint },
  document_detector_front: { label: 'Detecção de Documento — Frente', desc: 'Captura e analisa a frente do documento de identidade. Verifica se o documento é válido, se está legível e se não foi adulterado.', icon: FileCheck },
  document_detector_back: { label: 'Detecção de Documento — Verso', desc: 'Captura e analisa o verso do documento de identidade. Extrai dados como CPF, filiação e data de emissão.', icon: FileCheck },
  documentscopy: { label: 'Documentoscopia (Análise de Fraude)', desc: 'Análise forense digital do documento para detectar adulterações, montagens, uso de editores de imagem ou falsificação. É o serviço mais crítico para prevenção de fraude documental.', icon: AlertOctagon },
  deepfake_detection: { label: 'Detecção de Deepfake', desc: 'Usa IA avançada para detectar se a imagem facial foi gerada ou manipulada por deepfake, face swap ou outras técnicas de inteligência artificial.', icon: Shield },
  official_biometrics: { label: 'Biometria Oficial (Gov)', desc: 'Compara a selfie com a base biométrica oficial do governo brasileiro (ex: TSE, CNH, passaporte). Considerado o mais confiável por usar dados oficiais.', icon: Shield },
  ocr_sync: { label: 'OCR — Leitura do Documento', desc: 'Extrai automaticamente os dados impressos no documento (nome completo, CPF, data de nascimento, nome da mãe, RG) usando reconhecimento óptico de caracteres.', icon: Camera },
  document_liveness: { label: 'Liveness de Documento', desc: 'Verifica se o documento é real (não é foto de tela, impressão ou cópia). Analisa reflexos, texturas e características físicas do documento.', icon: FileCheck },
  cpf_cross_validation: { label: 'Validação Cruzada de CPF', desc: 'Compara os dados do CPF na Receita Federal com os dados declarados e extraídos do documento. Identifica divergências de nome, nascimento e nome da mãe.', icon: Shield },
  pep_international: { label: 'PEP Internacional', desc: 'Verifica se a pessoa é uma Pessoa Politicamente Exposta em bases internacionais. PEPs requerem monitoramento reforçado conforme regulamentação de PLD/FT.', icon: AlertOctagon },
  sanctions_international: { label: 'Sanções Internacionais', desc: 'Busca o nome em listas de sanções da OFAC (EUA), União Europeia, ONU e outras. Pessoas ou empresas sancionadas estão proibidas de realizar transações financeiras.', icon: AlertOctagon },
  warnings_interpol: { label: 'Alertas Interpol', desc: 'Consulta as bases de alerta da Interpol para identificar procurados, mandados internacionais e alertas de segurança.', icon: AlertOctagon },
  kyb_company_search: { label: 'KYB — Busca de Empresa', desc: 'Consulta dados cadastrais da empresa no CNPJ: razão social, situação cadastral, data de abertura, porte, natureza jurídica e CNAEs.', icon: Shield },
  kyb_business_identity: { label: 'KYB — Identidade Empresarial', desc: 'Verificação completa da identidade empresarial incluindo sócios, representantes legais e estrutura societária.', icon: Shield },
  kyb_credit_report: { label: 'KYB — Relatório de Crédito PJ', desc: 'Análise de crédito da empresa incluindo score, protestos, cheques devolvidos, pendências financeiras e capacidade de pagamento.', icon: Shield },
  pf_credit_profile: { label: 'Perfil de Crédito PF', desc: 'Score de crédito da pessoa física, histórico de inadimplência, protestos e pendências financeiras.', icon: Shield },
  pj_credit_profile: { label: 'Perfil de Crédito PJ', desc: 'Score de crédito da empresa, nível de endividamento, histórico de pagamentos e indicadores financeiros.', icon: Shield },
  onboarding_web: { label: 'Onboarding Web CAF', desc: 'Fluxo completo de onboarding via web hospedado pela CAF. Inclui captura de documento, selfie e validações em sequência.', icon: Fingerprint },
  caf_webhook_received: { label: 'Webhook Recebido', desc: 'Notificação automática da CAF informando que uma transação foi processada. Contém o resultado final e detalhes da análise.', icon: Clock },
  caf_post_capture_full: { label: 'Pós-Captura Completa', desc: 'Análise completa realizada após a captura de todas as imagens. Inclui OCR, cross-validation e verificações assíncronas de fraude.', icon: FileCheck },
};

function getServiceInfo(serviceType) {
  return SERVICE_LABELS[serviceType] || { label: serviceType?.replace(/_/g, ' ') || 'Desconhecido', desc: 'Serviço de validação da CAF.', icon: Eye };
}

function getStatusConfig(status) {
  const s = (status || '').toLowerCase();
  if (['sucesso', 'success', 'approved'].includes(s)) return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Aprovado' };
  if (['falha', 'failed', 'reproved'].includes(s)) return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Reprovado' };
  if (['pendente', 'pending', 'pending_review', 'processing'].includes(s)) return { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Pendente/Processando' };
  return { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', label: status || 'N/D' };
}

export default function CafServiceDetail({ record }) {
  const [expanded, setExpanded] = useState(false);
  const svcType = record.service_type || record.validationType || 'unknown';
  const svcInfo = getServiceInfo(svcType);
  const statusCfg = getStatusConfig(record.status || record.result_status);
  const StatusIcon = statusCfg.icon;
  const SvcIcon = svcInfo.icon;
  const rd = record.resultData || record.response_payload || {};
  const date = new Date(record.created_date || record.timestamp);

  return (
    <div className="bg-white">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-3 p-4 hover:bg-slate-50/50 transition-colors text-left">
        <div className={`p-1.5 rounded-lg ${statusCfg.bg}`}>
          <SvcIcon className={`w-4 h-4 ${statusCfg.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[var(--pinbank-blue)]">{svcInfo.label}</span>
            <Badge className={`${statusCfg.bg} ${statusCfg.color} ${statusCfg.border} border text-[10px]`}>{statusCfg.label}</Badge>
          </div>
          <p className="text-[10px] text-[var(--pinbank-blue)]/40 mt-0.5">
            {date.toLocaleDateString('pt-BR')} {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            {record.duration_ms ? ` • ${record.duration_ms}ms` : ''}
            {record.responseTime ? ` • ${record.responseTime}ms` : ''}
            {record.request_id ? ` • ID: ${record.request_id}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {record.score != null && <Badge variant="outline" className="text-[10px]">Score: {record.score}</Badge>}
          {record.similarity != null && <Badge variant="outline" className="text-[10px]">Sim: {(record.similarity * 100).toFixed(0)}%</Badge>}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Service Description */}
          <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
            <p className="text-xs text-indigo-800 leading-relaxed">{svcInfo.desc}</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {record.is_alive != null && (
              <MetricBox label="Prova de Vida" value={record.is_alive ? 'APROVADA — Pessoa real' : 'REPROVADA — Possível fraude'} color={record.is_alive ? 'green' : 'red'} />
            )}
            {record.similarity != null && (
              <MetricBox label="Similaridade Facial" value={`${(record.similarity * 100).toFixed(1)}% — ${record.similarity >= 0.7 ? 'Alta confiança' : record.similarity >= 0.4 ? 'Média confiança' : 'Baixa confiança'}`} color={record.similarity >= 0.7 ? 'green' : record.similarity >= 0.4 ? 'amber' : 'red'} />
            )}
            {record.probability != null && (
              <MetricBox label="Probabilidade" value={`${(record.probability * 100).toFixed(1)}%`} color={record.probability >= 0.8 ? 'green' : 'amber'} />
            )}
            {record.score != null && (
              <MetricBox label="Score" value={`${record.score} — ${record.score >= 80 ? 'Bom' : record.score >= 50 ? 'Moderado' : 'Baixo'}`} color={record.score >= 80 ? 'green' : record.score >= 50 ? 'amber' : 'red'} />
            )}
          </div>

          {/* Red Flags */}
          {record.red_flags?.length > 0 && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs font-bold text-red-700 mb-2">Sinalizações ({record.red_flags.length})</p>
              {record.red_flags.map((f, i) => (
                <div key={i} className="flex items-start gap-2 mb-1 last:mb-0">
                  <XCircle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px] text-red-700/80">{f}</span>
                </div>
              ))}
            </div>
          )}

          {/* Images */}
          {record.image_urls?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-[var(--pinbank-blue)]/60 mb-2">Imagens Capturadas</p>
              <div className="flex gap-2 flex-wrap">
                {record.image_urls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-24 h-24 rounded-lg overflow-hidden border border-slate-200 hover:border-[var(--pinbank-blue)] transition-colors">
                    <img src={url} alt={`Imagem ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Extracted OCR Data */}
          {(rd.name || rd.cpf || rd.birthDate || rd.motherName) && (
            <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
              <p className="text-xs font-bold text-blue-700 mb-2">Dados Extraídos por OCR</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {rd.name && <div><span className="text-blue-600/60">Nome: </span><span className="font-medium">{rd.name}</span></div>}
                {rd.cpf && <div><span className="text-blue-600/60">CPF: </span><span className="font-mono font-medium">{rd.cpf}</span></div>}
                {rd.birthDate && <div><span className="text-blue-600/60">Nascimento: </span><span className="font-medium">{rd.birthDate}</span></div>}
                {rd.motherName && <div><span className="text-blue-600/60">Nome da Mãe: </span><span className="font-medium">{rd.motherName}</span></div>}
                {rd.fatherName && <div><span className="text-blue-600/60">Nome do Pai: </span><span className="font-medium">{rd.fatherName}</span></div>}
                {rd.rg && <div><span className="text-blue-600/60">RG: </span><span className="font-mono font-medium">{rd.rg}</span></div>}
                {rd.documentType && <div><span className="text-blue-600/60">Tipo: </span><span className="font-medium">{rd.documentType}</span></div>}
              </div>
            </div>
          )}

          {/* Transaction details */}
          {record.transaction_id && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs font-bold text-[var(--pinbank-blue)]/60 mb-2">Detalhes Técnicos</p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><span className="text-[var(--pinbank-blue)]/40">Transaction ID: </span><span className="font-mono">{record.transaction_id}</span></div>
                {record.onboarding_id && <div><span className="text-[var(--pinbank-blue)]/40">Onboarding ID: </span><span className="font-mono">{record.onboarding_id}</span></div>}
                {record.request_id && <div><span className="text-[var(--pinbank-blue)]/40">Request ID: </span><span className="font-mono">{record.request_id}</span></div>}
                {record.error_code && <div><span className="text-[var(--pinbank-blue)]/40">Código Erro: </span><span className="font-mono text-red-600">{record.error_code}</span></div>}
                {record.error_message && <div className="col-span-2"><span className="text-[var(--pinbank-blue)]/40">Mensagem Erro: </span><span className="text-red-600">{record.error_message}</span></div>}
              </div>
            </div>
          )}

          {/* Callback data */}
          {record.callback_payload && (
            <div>
              <p className="text-xs font-bold text-[var(--pinbank-blue)]/60 mb-2">Dados do Webhook/Callback</p>
              <RawJson data={record.callback_payload} />
            </div>
          )}

          {/* Raw Data */}
          <RawJson data={rd} label="Dados Brutos Completos (JSON)" />
        </div>
      )}
    </div>
  );
}

function MetricBox({ label, value, color }) {
  const colors = {
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  return (
    <div className={`p-2.5 rounded-lg border ${colors[color] || colors.blue}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70 mb-0.5">{label}</p>
      <p className="text-xs font-bold">{value}</p>
    </div>
  );
}

function RawJson({ data, label = 'Dados Brutos' }) {
  const [open, setOpen] = useState(false);
  if (!data || Object.keys(data).length === 0) return null;
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="text-[10px] text-[var(--pinbank-blue)]/40 hover:text-[var(--pinbank-blue)]/60 flex items-center gap-1">
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {open ? 'Ocultar' : label}
      </button>
      {open && (
        <pre className="mt-2 p-3 bg-slate-900 text-green-300 text-[10px] rounded-lg overflow-auto max-h-[400px] font-mono">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}