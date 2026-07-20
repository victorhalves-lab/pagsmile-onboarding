import React, { useState, useMemo } from 'react';
import { Database, Fingerprint, ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertTriangle, Clock, Eye, Shield, FileCheck, ScanFace, Camera, AlertOctagon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ═══ BDC Dataset Metadata ═══
const BDC_DATASETS = {
  empresas_basic_data: { label: 'Dados Básicos da Empresa', desc: 'Razão social, nome fantasia, situação cadastral, data de abertura, porte, capital social, natureza jurídica, CNAEs.' },
  empresas_kyc: { label: 'KYC Empresa (Básico)', desc: 'Verificação rápida de conformidade empresarial.' },
  empresas_kyc_real: { label: 'KYC Empresa (Completo)', desc: 'Verificação completa: PEPs, sanções, processos, dívida ativa, protestos.' },
  empresas_owners_kyc: { label: 'KYC dos Sócios', desc: 'Análise individual de cada sócio: CPF, PEP, sanções, processos.' },
  empresas_relationships: { label: 'Relacionamentos Empresariais', desc: 'Participações societárias, grupo econômico, vínculos cruzados.' },
  empresas_phones: { label: 'Telefones da Empresa', desc: 'Telefones associados ao CNPJ em diferentes bases.' },
  empresas_emails: { label: 'E-mails da Empresa', desc: 'E-mails associados ao CNPJ.' },
  empresas_addresses: { label: 'Endereços', desc: 'Endereços registrados na RF e outras bases.' },
  empresas_activity_indicators: { label: 'Indicadores de Atividade', desc: 'Notas fiscais, licitações, importação/exportação.' },
  empresas_domains: { label: 'Domínios Web', desc: 'Sites e domínios registrados pela empresa.' },
  empresas_mcc: { label: 'MCC', desc: 'Código de categoria do estabelecimento comercial.' },
  empresas_basic_enrichment: { label: 'Enriquecimento Básico', desc: 'Faturamento estimado, funcionários, segmento.' },
  pessoas_kyc: { label: 'KYC Pessoa Física', desc: 'CPF, óbito, PEP, sanções, processos, protestos.' },
};

// ═══ CAF Service Metadata ═══
const CAF_SERVICES = {
  face_liveness: { label: 'Prova de Vida', desc: 'Confirma que a pessoa é real (não foto/vídeo/deepfake).' },
  face_authentication: { label: 'Autenticação Facial', desc: 'Compara selfie com face previamente registrada.' },
  facematch: { label: 'Face Match', desc: 'Compara selfie com foto do documento.' },
  document_detector_front: { label: 'Documento — Frente', desc: 'Captura e valida a frente do documento.' },
  document_detector_back: { label: 'Documento — Verso', desc: 'Captura e valida o verso do documento.' },
  documentscopy: { label: 'Documentoscopia', desc: 'Análise forense de fraude documental.' },
  deepfake_detection: { label: 'Detecção de Deepfake', desc: 'IA para detectar manipulação por deepfake.' },
  official_biometrics: { label: 'Biometria Oficial (Gov)', desc: 'Compara com bases biométricas oficiais.' },
  ocr_sync: { label: 'OCR — Leitura do Documento', desc: 'Extrai dados do documento (nome, CPF, nascimento).' },
  document_liveness: { label: 'Liveness de Documento', desc: 'Verifica se o documento é original físico.' },
  cpf_cross_validation: { label: 'Validação Cruzada CPF', desc: 'Compara dados do CPF na RF com o documento.' },
  pep_international: { label: 'PEP Internacional', desc: 'Verifica se é Pessoa Politicamente Exposta.' },
  sanctions_international: { label: 'Sanções Internacionais', desc: 'Busca em listas OFAC, UE, ONU.' },
  warnings_interpol: { label: 'Alertas Interpol', desc: 'Consulta bases da Interpol.' },
  kyb_company_search: { label: 'KYB — Busca Empresa', desc: 'Dados cadastrais da empresa no CNPJ.' },
  kyb_business_identity: { label: 'KYB — Identidade Empresarial', desc: 'Sócios, representantes, estrutura.' },
  kyb_credit_report: { label: 'KYB — Crédito PJ', desc: 'Score, protestos, cheques, capacidade financeira.' },
  pf_credit_profile: { label: 'Crédito PF', desc: 'Score e histórico de crédito da pessoa física.' },
  pj_credit_profile: { label: 'Crédito PJ', desc: 'Score e indicadores financeiros da empresa.' },
  onboarding_web: { label: 'Onboarding Web', desc: 'Fluxo completo de onboarding CAF.' },
  caf_webhook_received: { label: 'Webhook Recebido', desc: 'Notificação automática da CAF.' },
  caf_post_capture_full: { label: 'Pós-Captura Completa', desc: 'Análise pós-captura de todas as imagens.' },
};

function getStatusVisual(status) {
  const s = (status || '').toLowerCase();
  if (['sucesso', 'success', 'approved'].includes(s)) return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Sucesso' };
  if (['falha', 'failed', 'reproved'].includes(s)) return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Falha' };
  if (['pendente', 'pending', 'pending_review', 'processing'].includes(s)) return { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Pendente' };
  return { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', label: status || 'N/D' };
}

function extractKeyFields(data) {
  if (!data || typeof data !== 'object') return [];
  const fields = [];
  const seen = new Set();
  
  function walk(obj, prefix = '', depth = 0) {
    if (depth > 2 || !obj) return;
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (seen.has(fullKey)) continue;
      seen.add(fullKey);
      
      if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length <= 8) {
        walk(value, fullKey, depth + 1);
      } else if (Array.isArray(value)) {
        if (value.length > 0 && (typeof value[0] === 'string' || typeof value[0] === 'number')) {
          fields.push({ key: fullKey, value: value.join(', ') });
        } else if (value.length > 0) {
          fields.push({ key: fullKey, value: `${value.length} item(ns)`, isComplex: true, rawValue: value });
        }
      } else {
        fields.push({ key: fullKey, value: String(value) });
      }
    }
  }
  walk(data);
  return fields.slice(0, 20);
}

function humanizeKey(key) {
  const last = key.split('.').pop();
  return last.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, s => s.toUpperCase());
}

function EnrichmentCard({ record, type }) {
  const [expanded, setExpanded] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const isBdc = type === 'bdc';
  const svcType = record.service_type || record.validationType || 'unknown';
  const meta = isBdc ? (BDC_DATASETS[svcType] || { label: svcType.replace(/_/g, ' '), desc: '' }) : (CAF_SERVICES[svcType] || { label: svcType.replace(/_/g, ' '), desc: '' });
  const sv = getStatusVisual(record.status || record.result_status);
  const StatusIcon = sv.icon;
  const data = record.resultData || record.response_payload || {};
  const hasData = data && Object.keys(data).length > 0;
  const date = new Date(record.created_date || record.timestamp);
  const keyFields = useMemo(() => expanded ? extractKeyFields(data) : [], [expanded, data]);

  return (
    <div className={`rounded-xl border ${sv.border} overflow-hidden`}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-3 p-3.5 text-left hover:opacity-90 transition-opacity">
        <StatusIcon className={`w-4 h-4 ${sv.color} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[var(--pinbank-blue)]">{meta.label}</span>
            <Badge className={`${sv.bg} ${sv.color} text-[9px] border-0`}>{sv.label}</Badge>
          </div>
          <p className="text-[10px] text-[var(--pinbank-blue)]/40 mt-0.5">
            {date.toLocaleDateString('pt-BR')} {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            {record.duration_ms ? ` · ${record.duration_ms}ms` : ''}
            {record.score != null ? ` · Score: ${record.score}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {record.red_flags?.length > 0 && <Badge className="bg-red-100 text-red-700 text-[9px] border-0">{record.red_flags.length} flags</Badge>}
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-3">
          {/* Description */}
          {meta.desc && (
            <p className="text-xs text-[var(--pinbank-blue)]/60 p-2.5 bg-slate-50 rounded-lg leading-relaxed">{meta.desc}</p>
          )}

          {/* Key metrics for CAF */}
          {!isBdc && (record.is_alive != null || record.similarity != null || record.probability != null) && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {record.is_alive != null && (
                <div className={`p-2.5 rounded-lg border ${record.is_alive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <p className="text-[10px] font-semibold opacity-70">Prova de Vida</p>
                  <p className={`text-xs font-bold ${record.is_alive ? 'text-green-700' : 'text-red-700'}`}>{record.is_alive ? 'Aprovada ✓' : 'Reprovada ✗'}</p>
                </div>
              )}
              {record.similarity != null && (
                <div className="p-2.5 rounded-lg border bg-blue-50 border-blue-200">
                  <p className="text-[10px] font-semibold opacity-70">Similaridade Facial</p>
                  <p className="text-xs font-bold text-blue-700">{(record.similarity * 100).toFixed(0)}%</p>
                </div>
              )}
              {record.probability != null && (
                <div className="p-2.5 rounded-lg border bg-indigo-50 border-indigo-200">
                  <p className="text-[10px] font-semibold opacity-70">Probabilidade</p>
                  <p className="text-xs font-bold text-indigo-700">{(record.probability * 100).toFixed(0)}%</p>
                </div>
              )}
            </div>
          )}

          {/* Red flags */}
          {record.red_flags?.length > 0 && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-[10px] font-bold text-red-700 mb-1">Sinalizações de Risco</p>
              {record.red_flags.map((f, i) => (
                <p key={i} className="text-[11px] text-red-700/80 flex items-start gap-1.5 mt-0.5">
                  <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />{f}
                </p>
              ))}
            </div>
          )}

          {/* Key fields in business-friendly format */}
          {keyFields.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[var(--pinbank-blue)]/50 mb-2">Dados Retornados</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {keyFields.filter(f => !f.isComplex).map((f, i) => (
                  <div key={i} className="text-xs p-2 rounded bg-white border border-slate-100">
                    <span className="text-[var(--pinbank-blue)]/40 text-[10px]">{humanizeKey(f.key)}: </span>
                    <span className="font-medium text-[var(--pinbank-blue)]">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Images */}
          {record.image_urls?.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {record.image_urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="w-20 h-20 rounded-lg overflow-hidden border hover:border-[var(--pinbank-blue)]">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          )}

          {/* Raw JSON toggle */}
          {hasData && (
            <div>
              <button onClick={() => setShowRaw(!showRaw)} className="text-[10px] text-[var(--pinbank-blue)]/30 hover:text-[var(--pinbank-blue)]/60 flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {showRaw ? 'Ocultar JSON bruto' : 'Ver JSON bruto completo'}
              </button>
              {showRaw && (
                <pre className="mt-2 p-3 bg-slate-900 text-green-300 text-[10px] rounded-lg overflow-auto max-h-[300px] font-mono">
                  {JSON.stringify(data, null, 2)}
                </pre>
              )}
            </div>
          )}

          {!hasData && (
            <p className="text-xs text-[var(--pinbank-blue)]/30 italic">Nenhum dado retornado nesta consulta.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function CadastroEnrichmentTab({ validations = [], integrationLogs = [] }) {
  // BDC records
  const uniqueBdc = useMemo(() => {
    const map = new Map();
    [...validations.filter(v => v.provider === 'BigDataCorp'), ...integrationLogs.filter(l => l.provider === 'BigDataCorp')].forEach(r => map.set(r.id, r));
    return Array.from(map.values()).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [validations, integrationLogs]);

  // CAF records
  const uniqueCaf = useMemo(() => {
    const map = new Map();
    [...validations.filter(v => v.provider === 'CAF'), ...integrationLogs.filter(l => l.provider === 'CAF')].forEach(r => map.set(r.id, r));
    return Array.from(map.values()).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [validations, integrationLogs]);

  if (!uniqueBdc.length && !uniqueCaf.length) {
    return (
      <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-10 text-center mt-4">
        <Database className="w-10 h-10 mx-auto mb-3 text-[var(--pinbank-blue)]/20" />
        <p className="text-sm text-[var(--pinbank-blue)]/50">Nenhum resultado de enriquecimento externo encontrado</p>
      </div>
    );
  }

  const bdcOk = uniqueBdc.filter(r => ['Sucesso', 'success'].includes(r.status)).length;
  const cafOk = uniqueCaf.filter(r => ['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status)).length;
  const cafFail = uniqueCaf.filter(r => ['Falha', 'failed', 'REPROVED'].includes(r.status || r.result_status)).length;

  return (
    <div className="space-y-6 mt-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard icon={Database} label="Consultas BDC" value={uniqueBdc.length} sub={`${bdcOk} com retorno`} color="blue" />
        <SummaryCard icon={Fingerprint} label="Verificações CAF" value={uniqueCaf.length} sub={`${cafOk} ok · ${cafFail} falha`} color="purple" />
        <SummaryCard icon={Shield} label="Datasets Distintos BDC" value={new Set(uniqueBdc.map(r => r.service_type || r.validationType)).size} sub="tipos de consulta" color="indigo" />
        <SummaryCard icon={FileCheck} label="Serviços CAF" value={new Set(uniqueCaf.map(r => r.service_type || r.validationType)).size} sub="tipos de verificação" color="violet" />
      </div>

      {/* BDC Section */}
      {uniqueBdc.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-[var(--pinbank-blue)]">Big Data Corp — Enriquecimento de Dados</h3>
            <Badge className="bg-blue-100 text-blue-700 text-[10px]">{uniqueBdc.length}</Badge>
          </div>
          <p className="text-xs text-[var(--pinbank-blue)]/40 mb-3">
            Bureau de dados que agrega informações da Receita Federal, Juntas Comerciais, Tribunais, Serasa, CEIS/CNEP e bases proprietárias.
          </p>
          <div className="space-y-2">
            {uniqueBdc.map(r => <EnrichmentCard key={r.id} record={r} type="bdc" />)}
          </div>
        </div>
      )}

      {/* CAF Section */}
      {uniqueCaf.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Fingerprint className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-[var(--pinbank-blue)]">CAF — Combate à Fraude</h3>
            <Badge className="bg-purple-100 text-purple-700 text-[10px]">{uniqueCaf.length}</Badge>
          </div>
          <p className="text-xs text-[var(--pinbank-blue)]/40 mb-3">
            Plataforma de verificação de identidade: prova de vida, correspondência facial, análise documental, screening PEP/Sanções.
          </p>
          <div className="space-y-2">
            {uniqueCaf.map(r => <EnrichmentCard key={r.id} record={r} type="caf" />)}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="p-4 rounded-xl bg-white border border-slate-200">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg bg-${color}-50`}><Icon className={`w-4 h-4 text-${color}-600`} /></div>
        <span className="text-[10px] font-semibold text-[var(--pinbank-blue)]/50 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-black text-[var(--pinbank-blue)]">{value}</p>
      <p className="text-[10px] text-[var(--pinbank-blue)]/40 mt-0.5">{sub}</p>
    </div>
  );
}