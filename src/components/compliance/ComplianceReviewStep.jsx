import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2, FileText, AlertTriangle, ArrowLeft, ArrowRight,
  Shield, Clock, User, Building2, Mail, IdCard, ScanFace, Loader2,
  FileCheck2, FileWarning, Files
} from 'lucide-react';

/**
 * ComplianceReviewStep — tela de resumo final antes de enviar.
 *
 * Aparece após o upload de documentos e antes da submissão final (ou antes do CAF).
 * Mostra ao cliente exatamente o que será enviado e o que ainda falta, dando
 * uma última chance de revisar/corrigir.
 *
 * Props:
 *   - merchant: { fullName, cpfCnpj, email, companyName, type }
 *   - template: { name, model, requiredDocuments: [...] }
 *   - documents: { [docKey]: { files?: [...], notAvailable?: bool, notAvailableReason?: string } }
 *   - nextStepLabel: texto do botão de avanço (ex: "Próximo: Verificação de Identidade", "Enviar Documentos")
 *   - nextStepIcon: lucide icon component to render on the next button (optional)
 *   - onBack: callback para voltar
 *   - onConfirm: callback para confirmar e avançar
 *   - isSubmitting: bool
 *   - modeLabel: legenda do fluxo ("Documentos + Verificação de Identidade", "Apenas Documentos", etc.)
 */
export default function ComplianceReviewStep({
  merchant,
  template,
  documents,
  nextStepLabel = 'Confirmar e Enviar',
  NextStepIcon = ArrowRight,
  onBack,
  onConfirm,
  isSubmitting = false,
  modeLabel,
}) {
  // ── Expand template docs with stable keys (matches DynamicDocumentUploader logic) ──
  const allDocs = (template?.requiredDocuments || []).map((doc, index) => ({
    ...doc,
    _docKey: doc.documentTypeId || doc.id || `doc_${index}_${(doc.label || '').replace(/\s+/g, '_').toLowerCase().slice(0, 30)}`,
  }));

  const getEntry = (doc) => documents[doc._docKey];

  const getStatus = (doc) => {
    const e = getEntry(doc);
    if (!e) return { kind: 'missing', files: [], reason: null };
    const files = Array.isArray(e.files) ? e.files : (e.url ? [{ name: e.name, size: e.size, type: e.type }] : []);
    if (files.length > 0) return { kind: 'uploaded', files, reason: null };
    if (e.notAvailable && e.notAvailableReason) return { kind: 'justified', files: [], reason: e.notAvailableReason };
    return { kind: 'missing', files: [], reason: null };
  };

  const mandatoryDocs = allDocs.filter(d => d.required);
  const optionalDocs = allDocs.filter(d => !d.required);

  const mandatoryUploaded = mandatoryDocs.filter(d => getStatus(d).kind === 'uploaded').length;
  const mandatoryJustified = mandatoryDocs.filter(d => getStatus(d).kind === 'justified').length;
  const mandatoryMissing = mandatoryDocs.filter(d => getStatus(d).kind === 'missing');

  const optionalUploaded = optionalDocs.filter(d => getStatus(d).kind === 'uploaded').length;
  const optionalJustified = optionalDocs.filter(d => getStatus(d).kind === 'justified').length;

  const totalFiles = Object.values(documents).reduce((sum, e) => {
    const files = Array.isArray(e?.files) ? e.files : (e?.url ? 1 : 0);
    return sum + (Array.isArray(files) ? files.length : files);
  }, 0);

  const canProceed = mandatoryMissing.length === 0 && !isSubmitting;

  return (
    <div className="space-y-6">
      {/* Banner de abertura */}
      <div className="bg-gradient-to-br from-[#1356E2]/10 via-white to-[#0A0A0A]/5 border border-[#1356E2]/20 rounded-2xl p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#1356E2] flex items-center justify-center shrink-0">
            <FileCheck2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg md:text-xl font-bold text-[#0A0A0A] mb-1">
              Tudo pronto? Confira antes de enviar.
            </h2>
            <p className="text-sm text-[#0A0A0A]/70 leading-relaxed">
              Esta é a sua última chance de revisar as informações. Depois de confirmar, os dados
              seguem para análise da nossa equipe de compliance.
            </p>
            {modeLabel && (
              <Badge className="mt-3 bg-white border border-[#1356E2]/30 text-[#0A0A0A] hover:bg-white">
                <Shield className="w-3 h-3 mr-1.5 text-[#1356E2]" /> {modeLabel}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Resumo de identificação do cliente */}
      {merchant && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-[#0A0A0A] mb-4 flex items-center gap-2">
            {merchant.type === 'PF' ? <User className="w-4 h-4 text-[#1356E2]" /> : <Building2 className="w-4 h-4 text-[#1356E2]" />}
            {merchant.type === 'PF' ? 'Seus dados' : 'Dados da empresa'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <InfoRow icon={merchant.type === 'PF' ? User : Building2} label={merchant.type === 'PF' ? 'Nome' : 'Razão Social'} value={merchant.fullName} />
            <InfoRow icon={IdCard} label={merchant.type === 'PF' ? 'CPF' : 'CNPJ'} value={formatCpfCnpj(merchant.cpfCnpj)} mono />
            {merchant.email && <InfoRow icon={Mail} label="E-mail" value={merchant.email} />}
            {merchant.companyName && merchant.companyName !== merchant.fullName && (
              <InfoRow icon={Building2} label="Nome Fantasia" value={merchant.companyName} />
            )}
          </div>
        </div>
      )}

      {/* KPIs do resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={FileText}
          label="Documentos obrigatórios"
          value={`${mandatoryUploaded + mandatoryJustified}/${mandatoryDocs.length}`}
          tone={mandatoryMissing.length === 0 ? 'success' : 'warning'}
        />
        <StatCard
          icon={Files}
          label="Arquivos anexados"
          value={totalFiles}
          tone="neutral"
        />
        <StatCard
          icon={FileWarning}
          label="Com justificativa"
          value={mandatoryJustified + optionalJustified}
          tone={mandatoryJustified + optionalJustified > 0 ? 'warning' : 'neutral'}
        />
        <StatCard
          icon={FileCheck2}
          label="Opcionais enviados"
          value={optionalUploaded}
          tone="neutral"
        />
      </div>

      {/* Bloqueio se falta obrigatório */}
      {mandatoryMissing.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-900 mb-1">
                {mandatoryMissing.length} documento(s) obrigatório(s) faltando
              </p>
              <p className="text-xs text-red-800/80 mb-2">
                Volte ao passo anterior e anexe os arquivos ou clique em "Não tenho este documento" para justificar.
              </p>
              <ul className="text-xs text-red-900 space-y-1 list-disc pl-4">
                {mandatoryMissing.map(d => <li key={d._docKey}>{d.label || d.name}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Lista detalhada dos documentos */}
      {mandatoryDocs.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-[#0A0A0A] mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Documentos obrigatórios ({mandatoryDocs.length})
          </h3>
          <div className="space-y-2">
            {mandatoryDocs.map(doc => <DocSummaryRow key={doc._docKey} doc={doc} status={getStatus(doc)} />)}
          </div>
        </div>
      )}

      {optionalDocs.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-[#0A0A0A] mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            Documentos opcionais ({optionalDocs.length})
          </h3>
          <div className="space-y-2">
            {optionalDocs.map(doc => <DocSummaryRow key={doc._docKey} doc={doc} status={getStatus(doc)} optional />)}
          </div>
        </div>
      )}

      {/* Aviso legal / LGPD */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-4 h-4 text-[#0A0A0A]/60 shrink-0 mt-0.5" />
          <div className="text-xs text-[#0A0A0A]/70 leading-relaxed">
            <p className="font-semibold text-[#0A0A0A] mb-1">Ao confirmar, você declara que:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>as informações e documentos enviados são <strong>verdadeiros e atualizados</strong>;</li>
              <li>autoriza a Pin Bank a <strong>armazenar e analisar</strong> os dados conforme a LGPD;</li>
              <li>está ciente de que informações falsas podem levar à <strong>recusa do cadastro</strong>.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Próximos passos / tempo estimado */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900">
          <p className="font-semibold mb-0.5">O que acontece depois?</p>
          <p className="opacity-80">
            Nossa equipe de compliance analisa seu caso em até <strong>24 horas úteis</strong>. Você
            receberá uma notificação por e-mail com o resultado ou próximos passos.
          </p>
        </div>
      </div>

      {/* Botões */}
      <div className="flex flex-col-reverse md:flex-row items-stretch md:items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isSubmitting}
          className="text-slate-600"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar e editar
        </Button>
        <Button
          onClick={onConfirm}
          disabled={!canProceed}
          size="lg"
          className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white shadow-lg shadow-[#1356E2]/30 disabled:opacity-50 disabled:shadow-none"
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
          ) : (
            <><NextStepIcon className="w-4 h-4 mr-2" /> {nextStepLabel}</>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Small helpers ───

function InfoRow({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-[#1356E2] shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-[#0A0A0A]/50 font-semibold">{label}</p>
        <p className={`text-sm text-[#0A0A0A] truncate ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone = 'neutral' }) {
  const tones = {
    success: 'bg-green-50 border-green-200 text-green-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    neutral: 'bg-white border-slate-200 text-[#0A0A0A]',
  };
  return (
    <div className={`rounded-xl border p-3 ${tones[tone]}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5" />
        <p className="text-[10px] uppercase tracking-wider font-semibold opacity-70">{label}</p>
      </div>
      <p className="text-xl font-bold leading-tight">{value}</p>
    </div>
  );
}

function DocSummaryRow({ doc, status, optional = false }) {
  const { kind, files, reason } = status;
  const border =
    kind === 'uploaded' ? 'border-green-200 bg-green-50/50' :
    kind === 'justified' ? 'border-amber-200 bg-amber-50/50' :
    optional ? 'border-slate-200 bg-white' :
    'border-red-200 bg-red-50/50';

  return (
    <div className={`rounded-xl border p-3 ${border}`}>
      <div className="flex items-start gap-3">
        <StatusBadge kind={kind} optional={optional} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#0A0A0A] leading-tight">{doc.label || doc.name}</p>
          {kind === 'uploaded' && (
            <div className="mt-1.5 space-y-0.5">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px] text-[#0A0A0A]/70">
                  <FileText className="w-3 h-3 shrink-0" />
                  <span className="truncate font-mono">{f.name}</span>
                  {f.size && <span className="text-[#0A0A0A]/40 shrink-0">({formatSize(f.size)})</span>}
                </div>
              ))}
            </div>
          )}
          {kind === 'justified' && (
            <p className="mt-1 text-xs text-amber-900/80 italic line-clamp-2">"{reason}"</p>
          )}
          {kind === 'missing' && (
            <p className="mt-1 text-xs text-[#0A0A0A]/50 italic">
              {optional ? 'Não enviado (opcional)' : 'Falta anexar ou justificar'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ kind, optional }) {
  if (kind === 'uploaded') {
    return (
      <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
        <CheckCircle2 className="w-4 h-4 text-green-600" />
      </div>
    );
  }
  if (kind === 'justified') {
    return (
      <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
        <FileWarning className="w-4 h-4 text-amber-600" />
      </div>
    );
  }
  // missing
  return (
    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${optional ? 'bg-slate-100' : 'bg-red-100'}`}>
      <AlertTriangle className={`w-4 h-4 ${optional ? 'text-slate-400' : 'text-red-600'}`} />
    </div>
  );
}

function formatCpfCnpj(v) {
  if (!v) return '';
  const clean = String(v).replace(/\D/g, '');
  if (clean.length === 11) return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (clean.length === 14) return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return v;
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}