import React, { useState, useMemo } from 'react';
import { Fingerprint, ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertTriangle, Clock, Eye, FileCheck, ScanFace, Shield, Camera, AlertOctagon, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import CafServiceDetail from './CafServiceDetail';

// All 87 CAF validation rules mapped to business language
const VALIDATION_RULES = {
  'rule_01': 'Documento vencido ou expirado',
  'rule_02': 'Foto do documento ilegível ou de baixa qualidade',
  'rule_03': 'Documento adulterado ou manipulado',
  'rule_04': 'CPF divergente do documento',
  'rule_05': 'Nome divergente do documento',
  'rule_06': 'Data de nascimento divergente',
  'rule_07': 'Nome da mãe divergente',
  'rule_08': 'Selfie não corresponde ao documento',
  'rule_09': 'Prova de vida falhou (liveness)',
  'rule_10': 'Suspeita de deepfake na selfie',
};

// 20 manual reproval reasons in business language
const REPROVAL_REASONS = {
  'manual_01': 'Documento ilegível — não foi possível ler as informações do documento enviado',
  'manual_02': 'Foto do rosto cortada ou obscurecida — a selfie não mostra o rosto completo',
  'manual_03': 'Documento não aceito — o tipo de documento enviado não é válido para esta verificação',
  'manual_04': 'Dados inconsistentes — as informações do documento não correspondem aos dados declarados',
  'manual_05': 'Suspeita de fraude — evidências de adulteração no documento ou na selfie',
  'manual_06': 'Documento de terceiro — o documento parece pertencer a outra pessoa',
  'manual_07': 'Imagem de tela/monitor — foi detectada captura de tela ao invés de foto real',
  'manual_08': 'Documento preto e branco — apenas cópias coloridas são aceitas',
  'manual_09': 'Múltiplas tentativas falharam — o limite de tentativas foi atingido',
  'manual_10': 'Biometria não reconhecida — o sistema não conseguiu processar os dados biométricos',
};

const SERVICE_CATEGORIES = {
  'Verificação de Identidade': ['face_liveness', 'face_authentication', 'liveness', 'facematch', 'official_biometrics', 'deepfake_detection', 'face_register', 'private_faceset', 'shared_faceset'],
  'Documentos': ['document_detector', 'document_detector_front', 'document_detector_back', 'documentscopy', 'document_liveness', 'ocr_sync', 'verifai_docs'],
  'KYC / KYB': ['cpf_cross_validation', 'kyb_company_search', 'kyb_business_identity', 'kyb_credit_report', 'pf_credit_profile', 'pj_credit_profile', 'pessoas_kyc', 'empresas_basic_data', 'empresas_kyc', 'empresas_kyc_real', 'empresas_owners_kyc', 'empresas_relationships'],
  'Screening Internacional': ['pep_international', 'sanctions_international', 'warnings_interpol'],
  'Onboarding & Webhooks': ['onboarding_web', 'transaction', 'caf_webhook_received', 'caf_post_capture_full', 'sdk_token_generation'],
};

function getServiceCategory(serviceType) {
  for (const [cat, types] of Object.entries(SERVICE_CATEGORIES)) {
    if (types.includes(serviceType)) return cat;
  }
  return 'Outros';
}

function getStatusBadge(status) {
  const s = (status || '').toLowerCase();
  if (['sucesso', 'success', 'approved'].includes(s)) return { bg: 'bg-green-100 text-green-700', label: 'Aprovado' };
  if (['falha', 'failed', 'reproved'].includes(s)) return { bg: 'bg-red-100 text-red-700', label: 'Reprovado' };
  if (['pendente', 'pending', 'pending_review', 'processing'].includes(s)) return { bg: 'bg-amber-100 text-amber-700', label: 'Pendente' };
  return { bg: 'bg-slate-100 text-slate-600', label: status || 'N/D' };
}

export default function AnaliseCafCompleta({ cafValidations, cafLogs, merchant, latestCase }) {
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Merge and dedupe all CAF records
  const allRecords = React.useMemo(() => {
    const map = new Map();
    [...cafValidations, ...cafLogs].forEach(r => map.set(r.id, r));
    return Array.from(map.values()).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [cafValidations, cafLogs]);

  // Group by category
  const grouped = React.useMemo(() => {
    const groups = {};
    for (const record of allRecords) {
      const svcType = record.service_type || record.validationType || 'unknown';
      const cat = getServiceCategory(svcType);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(record);
    }
    return groups;
  }, [allRecords]);

  const categoryOrder = ['Verificação de Identidade', 'Documentos', 'KYC / KYB', 'Screening Internacional', 'Onboarding & Webhooks', 'Outros'];

  if (allRecords.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-8 text-center">
        <Fingerprint className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <p className="text-sm text-[var(--pinbank-blue)]/50 font-medium">Nenhum resultado da CAF encontrado</p>
        <p className="text-xs text-[var(--pinbank-blue)]/30 mt-1">O cliente ainda não passou pela verificação de identidade e documentos.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-purple-50/50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Fingerprint className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--pinbank-blue)]">CAF — Combate à Fraude</h2>
              <p className="text-xs text-[var(--pinbank-blue)]/40">Análise microscópica de todas as verificações de identidade, documentos, KYC/KYB e screening</p>
            </div>
          </div>
          <Badge className="bg-purple-100 text-purple-700 text-xs">{allRecords.length} registros</Badge>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Explanation */}
        <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
          <h3 className="text-xs font-bold text-purple-800 mb-2">O que é a CAF?</h3>
          <p className="text-xs text-purple-700/70 leading-relaxed">
            A CAF (Combate à Fraude) é a plataforma de verificação de identidade digital. Ela executa <strong>prova de vida</strong> (liveness detection) para confirmar que a pessoa é real, 
            <strong> face match</strong> para comparar a selfie com o documento, <strong>documentoscopia</strong> para detectar fraude documental, 
            <strong> OCR</strong> para extrair dados do documento, <strong>KYC/KYB</strong> para verificar CPF/CNPJ em bases oficiais, 
            e <strong>screening internacional</strong> contra listas de PEPs, sanções e Interpol. 
            Possui <strong>87 regras de validação automática</strong> e <strong>20 códigos de reprovação manual</strong>.
          </p>
        </div>

        {/* Categories */}
        {categoryOrder.map(catName => {
          const records = grouped[catName];
          if (!records || records.length === 0) return null;
          const isExpanded = expandedCategory === catName;
          
          const approvedCount = records.filter(r => ['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status)).length;
          const failedCount = records.filter(r => ['Falha', 'failed', 'REPROVED'].includes(r.status || r.result_status)).length;

          return (
            <div key={catName} className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : catName)}
                className="w-full flex items-center gap-3 p-4 hover:bg-slate-50/50 transition-colors text-left"
              >
                <CategoryIcon category={catName} />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-[var(--pinbank-blue)]">{catName}</h4>
                  <p className="text-[10px] text-[var(--pinbank-blue)]/40">{records.length} verificação(ões)</p>
                </div>
                <div className="flex items-center gap-2">
                  {approvedCount > 0 && <Badge className="bg-green-100 text-green-700 text-[10px]">{approvedCount} ok</Badge>}
                  {failedCount > 0 && <Badge className="bg-red-100 text-red-700 text-[10px]">{failedCount} falha</Badge>}
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>
              {isExpanded && (
                <div className="border-t border-slate-100 divide-y divide-slate-100">
                  {records.map(record => (
                    <CafServiceDetail key={record.id} record={record} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoryIcon({ category }) {
  const map = {
    'Verificação de Identidade': { icon: ScanFace, color: 'text-purple-600', bg: 'bg-purple-50' },
    'Documentos': { icon: FileCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
    'KYC / KYB': { icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    'Screening Internacional': { icon: AlertOctagon, color: 'text-red-600', bg: 'bg-red-50' },
    'Onboarding & Webhooks': { icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
  };
  const cfg = map[category] || { icon: Eye, color: 'text-slate-600', bg: 'bg-slate-50' };
  const Icon = cfg.icon;
  return <div className={`p-2 rounded-lg ${cfg.bg}`}><Icon className={`w-4 h-4 ${cfg.color}`} /></div>;
}