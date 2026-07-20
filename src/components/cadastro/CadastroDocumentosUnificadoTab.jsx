import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  FileCheck, ExternalLink, Copy, Check, Link as LinkIcon, Send,
  FileText, Camera, Building2, Users, Inbox, Shield, AlertCircle, Filter, Download
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const STATUS_COLORS = {
  'Pendente': 'bg-gray-100 text-gray-700',
  'Validado': 'bg-green-100 text-green-700',
  'Rejeitado': 'bg-red-100 text-red-700',
  'Erro': 'bg-red-100 text-red-700',
};

const SOURCE_CONFIG = {
  upload: { label: 'Upload Cliente', icon: FileCheck, color: 'bg-blue-100 text-blue-700', iconColor: 'text-blue-600' },
  caf: { label: 'CAF (KYC/KYB)', icon: Camera, color: 'bg-purple-100 text-purple-700', iconColor: 'text-purple-600' },
  bdc: { label: 'BDC (Enriquecimento)', icon: Shield, color: 'bg-emerald-100 text-emerald-700', iconColor: 'text-emerald-600' },
  subseller_info: { label: 'Coleta Gateway', icon: Inbox, color: 'bg-amber-100 text-amber-700', iconColor: 'text-amber-600' },
  kickoff: { label: 'Kick-Off', icon: FileText, color: 'bg-rose-100 text-rose-700', iconColor: 'text-rose-600' },
  contract: { label: 'Contrato', icon: FileText, color: 'bg-indigo-100 text-indigo-700', iconColor: 'text-indigo-600' },
  partner: { label: 'Doc Parceiros', icon: Building2, color: 'bg-cyan-100 text-cyan-700', iconColor: 'text-cyan-600' },
};

// ----------------------------------------------------------------
// Painel para solicitar documentos ao cliente (mantém UX existente)
// ----------------------------------------------------------------
function DocRequestPanel({ latestCase, merchantEmail }) {
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [docUrl, setDocUrl] = useState('');

  const generateLink = async () => {
    if (!latestCase) return;
    setGenerating(true);
    try {
      const res = await base44.functions.invoke('generateDocOnlyLink', {
        caseId: latestCase.id,
        baseUrl: window.location.origin,
      });
      const data = res?.data || {};
      if (!data.success || !data.url) {
        toast.error(data.error || 'Falha ao gerar link.');
        return;
      }
      setDocUrl(data.url);
      toast.success(`Link gerado — ${data.requiredDocsCount} documento(s) requerido(s)`);
    } catch (err) {
      toast.error(err?.message || 'Erro ao gerar link.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(docUrl);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = async () => {
    if (!merchantEmail || !docUrl) return;
    setSending(true);
    await base44.integrations.Core.SendEmail({
      to: merchantEmail,
      subject: 'Complemento de Documentos — Pin Bank',
      body: `<p>Olá,</p><p>Para dar continuidade ao seu processo de onboarding, precisamos que envie os documentos solicitados.</p><p><a href="${docUrl}" style="display:inline-block;padding:12px 24px;background:#1356E2;color:white;text-decoration:none;border-radius:8px;font-weight:600;">Enviar Documentos</a></p><p>Se o botão não funcionar, copie e cole o link abaixo:</p><p>${docUrl}</p><p>Atenciosamente,<br/>Equipe Pin Bank</p>`,
    });
    setSending(false);
    toast.success(`E-mail enviado para ${merchantEmail}`);
  };

  return (
    <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <LinkIcon className="w-4 h-4 text-amber-600" />
        <h3 className="text-sm font-semibold text-amber-800">Solicitar Documentos ao Cliente</h3>
      </div>
      {!docUrl ? (
        <Button onClick={generateLink} disabled={generating || latestCase?.docCompleted} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
          {generating ? 'Gerando...' : 'Gerar Link de Documentos'}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input readOnly value={docUrl} className="flex-1 text-xs bg-white border border-amber-300 rounded-lg px-3 py-2 text-[var(--pinbank-blue)]/80 font-mono truncate" />
            <Button onClick={handleCopy} variant="outline" size="sm" className="gap-1 border-amber-300">
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          </div>
          {merchantEmail && (
            <Button onClick={handleSendEmail} disabled={sending} size="sm" variant="outline" className="gap-1 border-amber-300 text-amber-700">
              <Send className="w-3.5 h-3.5" />
              {sending ? 'Enviando...' : `Enviar por e-mail (${merchantEmail})`}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------
// Card de documento unificado
// ----------------------------------------------------------------
function DocCard({ doc, onOpenPrivate }) {
  const cfg = SOURCE_CONFIG[doc.source] || SOURCE_CONFIG.upload;
  const Icon = cfg.icon;
  const isPrivate = doc.isPrivate && doc.fileUri && !doc.fileUrl;

  return (
    <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
        <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-semibold text-[var(--pinbank-blue)] truncate">{doc.documentName || doc.fileName || 'Documento'}</p>
          <Badge className={`text-[9px] ${cfg.color}`}>{cfg.label}</Badge>
        </div>
        {doc.fileName && doc.fileName !== doc.documentName && (
          <p className="text-xs text-[var(--pinbank-blue)]/40 truncate">{doc.fileName}</p>
        )}
        {doc.contextLabel && (
          <p className="text-[10px] text-[var(--pinbank-blue)]/50 mt-0.5 truncate">{doc.contextLabel}</p>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {doc.validationStatus && (
            <Badge className={`text-[10px] ${STATUS_COLORS[doc.validationStatus] || STATUS_COLORS['Pendente']}`}>
              {doc.validationStatus}
            </Badge>
          )}
          {doc.notAvailable && (
            <Badge className="bg-orange-100 text-orange-700 text-[10px]">Não disponível</Badge>
          )}
          {doc.uploadDate && (
            <span className="text-[10px] text-[var(--pinbank-blue)]/40">
              {new Date(doc.uploadDate).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
        {doc.notAvailableReason && (
          <p className="text-[10px] text-orange-700 mt-1 italic">↳ {doc.notAvailableReason}</p>
        )}
      </div>
      {isPrivate ? (
        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => onOpenPrivate(doc)}>
          <ExternalLink className="w-4 h-4" />
        </Button>
      ) : doc.fileUrl ? (
        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <ExternalLink className="w-4 h-4" />
          </Button>
        </a>
      ) : null}
    </div>
  );
}

// ----------------------------------------------------------------
// Tab principal
// ----------------------------------------------------------------
export default function CadastroDocumentosUnificadoTab({ documents = [], latestCase, merchantEmail, merchant, integrationLogs = [], contracts = [], allCases = [] }) {
  const [sourceFilter, setSourceFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // --------- Buscar fontes adicionais ---------
  const allCaseIds = useMemo(() => allCases.map(c => c.id), [allCases]);

  // SubsellerInfoSubmission docs (caso este merchant seja gateway)
  const { data: gatewayCollections = [] } = useQuery({
    queryKey: ['cadastro-docs-collections', merchant?.cpfCnpj],
    queryFn: () => base44.entities.SubsellerInfoCollection.filter({ gateway_cnpj: merchant.cpfCnpj }),
    enabled: !!merchant?.cpfCnpj,
  });

  const { data: gatewaySubmissions = [] } = useQuery({
    queryKey: ['cadastro-docs-submissions', gatewayCollections.map(c => c.id)],
    queryFn: async () => {
      if (!gatewayCollections.length) return [];
      const results = await Promise.all(gatewayCollections.map(c => base44.entities.SubsellerInfoSubmission.filter({ collection_id: c.id })));
      return results.flat();
    },
    enabled: gatewayCollections.length > 0,
  });

  // KickOff presentations (anexos eventuais)
  const { data: kickoffs = [] } = useQuery({
    queryKey: ['cadastro-docs-kickoffs', merchant?.cpfCnpj],
    queryFn: () => base44.entities.KickOffPresentation.filter({ clientCnpj: merchant.cpfCnpj }),
    enabled: !!merchant?.cpfCnpj,
  });

  // --------- Montar lista unificada ---------
  const unifiedDocs = useMemo(() => {
    const all = [];

    // 1. DocumentUpload (já vem do parent)
    documents.forEach(d => {
      all.push({
        id: `upload-${d.id}`,
        source: 'upload',
        documentName: d.documentName,
        fileName: d.fileName,
        fileUrl: d.fileUrl,
        fileUri: d.fileUri,
        isPrivate: d.isPrivate,
        validationStatus: d.validationStatus,
        uploadDate: d.uploadDate || d.created_date,
        notAvailable: d.notAvailable,
        notAvailableReason: d.notAvailableReason,
        contextLabel: d.onboardingCaseId ? `Caso ${d.onboardingCaseId.slice(0, 8)}` : null,
        raw: d,
      });
    });

    // 2. CAF images (image_urls em IntegrationLog)
    integrationLogs.filter(l => l.provider === 'CAF').forEach(log => {
      (log.image_urls || []).forEach((url, idx) => {
        all.push({
          id: `caf-${log.id}-${idx}`,
          source: 'caf',
          documentName: `CAF ${log.service_type || 'documento'} ${idx + 1}`,
          fileName: url.split('/').pop()?.split('?')[0] || `caf_${idx}`,
          fileUrl: url,
          validationStatus: log.result_status === 'APPROVED' ? 'Validado' : log.result_status === 'REPROVED' ? 'Rejeitado' : 'Pendente',
          uploadDate: log.created_date,
          contextLabel: `${log.service_type} • ${log.status}`,
          raw: log,
        });
      });
    });

    // 3. BDC PDFs (image_urls em IntegrationLog BDC)
    integrationLogs.filter(l => l.provider === 'BigDataCorp').forEach(log => {
      (log.image_urls || []).forEach((url, idx) => {
        all.push({
          id: `bdc-${log.id}-${idx}`,
          source: 'bdc',
          documentName: `BDC ${log.service_type || log.dataset_codigo || 'anexo'} ${idx + 1}`,
          fileName: url.split('/').pop()?.split('?')[0] || `bdc_${idx}`,
          fileUrl: url,
          uploadDate: log.created_date,
          contextLabel: log.service_type || log.dataset_codigo,
          raw: log,
        });
      });
    });

    // 4. Coletas Gateway (docs dentro de SubsellerInfoSubmission)
    gatewaySubmissions.forEach(sub => {
      (sub.subsellers || []).forEach((seller, sIdx) => {
        (seller.documents || []).forEach((d, dIdx) => {
          all.push({
            id: `subinfo-${sub.id}-${sIdx}-${dIdx}`,
            source: 'subseller_info',
            documentName: d.doc_label || d.doc_type || 'Documento',
            fileName: d.file_name,
            fileUrl: d.file_uri,
            uploadDate: d.uploaded_at || sub.created_date,
            contextLabel: `Subseller: ${seller.company_name || seller.cnpj || seller.cpf || '—'}`,
            raw: d,
          });
        });
      });
    });

    // 5. Contratos (PDFs gerados)
    contracts.forEach(c => {
      if (c.pdfUrl || c.signedPdfUrl) {
        all.push({
          id: `contract-${c.id}`,
          source: 'contract',
          documentName: c.signedPdfUrl ? 'Contrato assinado' : 'Contrato (PDF)',
          fileName: c.contractNumber || c.id,
          fileUrl: c.signedPdfUrl || c.pdfUrl,
          uploadDate: c.signedAt || c.created_date,
          validationStatus: c.status === 'signed' ? 'Validado' : 'Pendente',
          contextLabel: `${c.contractNumber || ''} • ${c.status || ''}`,
          raw: c,
        });
      }
    });

    // 6. KickOff anexos (se houver pdfUrl ou attachments)
    kickoffs.forEach(k => {
      if (k.pdfUrl) {
        all.push({
          id: `kickoff-pdf-${k.id}`,
          source: 'kickoff',
          documentName: `Kick-Off (PDF) — ${k.clientName || ''}`,
          fileName: k.publicToken || k.id,
          fileUrl: k.pdfUrl,
          uploadDate: k.created_date,
          contextLabel: k.segment,
          raw: k,
        });
      }
      (k.attachments || []).forEach((a, idx) => {
        all.push({
          id: `kickoff-att-${k.id}-${idx}`,
          source: 'kickoff',
          documentName: a.name || `Anexo Kick-Off ${idx + 1}`,
          fileName: a.fileName,
          fileUrl: a.url,
          uploadDate: a.uploadedAt || k.created_date,
          contextLabel: k.clientName,
          raw: a,
        });
      });
    });

    return all.sort((a, b) => new Date(b.uploadDate || 0) - new Date(a.uploadDate || 0));
  }, [documents, integrationLogs, gatewaySubmissions, contracts, kickoffs]);

  // --------- Filtros ---------
  const filteredDocs = useMemo(() => {
    return unifiedDocs.filter(d => {
      if (sourceFilter !== 'all' && d.source !== sourceFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const hay = `${d.documentName || ''} ${d.fileName || ''} ${d.contextLabel || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [unifiedDocs, sourceFilter, searchTerm]);

  // --------- KPIs por fonte ---------
  const sourceCounts = useMemo(() => {
    const counts = {};
    unifiedDocs.forEach(d => { counts[d.source] = (counts[d.source] || 0) + 1; });
    return counts;
  }, [unifiedDocs]);

  // --------- Abrir doc privado ---------
  const handleOpenPrivate = async (doc) => {
    try {
      const res = await base44.functions.invoke('getPrivateDocumentUrl', { fileUri: doc.fileUri });
      const url = res?.data?.url || res?.data?.signedUrl;
      if (url) window.open(url, '_blank');
      else toast.error('Não foi possível gerar a URL temporária');
    } catch (err) {
      toast.error(err?.message || 'Erro ao abrir documento privado');
    }
  };

  return (
    <div className="space-y-4 mt-4">
      {latestCase && !latestCase.docCompleted && (
        <DocRequestPanel latestCase={latestCase} merchantEmail={merchantEmail} />
      )}

      {/* KPIs por fonte */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        <button
          onClick={() => setSourceFilter('all')}
          className={`bg-white rounded-lg border p-3 text-center hover:shadow-md transition ${sourceFilter === 'all' ? 'border-[var(--pinbank-blue)] ring-2 ring-[var(--pinbank-blue)]/20' : 'border-[var(--pinbank-blue)]/8'}`}
        >
          <p className="text-xl font-bold text-[var(--pinbank-blue)]">{unifiedDocs.length}</p>
          <p className="text-[9px] text-[var(--pinbank-blue)]/50 uppercase tracking-wider mt-0.5">Total</p>
        </button>
        {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => {
          const count = sourceCounts[key] || 0;
          if (count === 0) return null;
          const Icon = cfg.icon;
          return (
            <button
              key={key}
              onClick={() => setSourceFilter(key)}
              className={`bg-white rounded-lg border p-3 text-center hover:shadow-md transition ${sourceFilter === key ? 'border-[var(--pinbank-blue)] ring-2 ring-[var(--pinbank-blue)]/20' : 'border-[var(--pinbank-blue)]/8'}`}
            >
              <Icon className={`w-4 h-4 mx-auto mb-1 ${cfg.iconColor}`} />
              <p className="text-base font-bold text-[var(--pinbank-blue)]">{count}</p>
              <p className="text-[9px] text-[var(--pinbank-blue)]/50 uppercase tracking-wider mt-0.5 truncate">{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {/* Barra de filtros */}
      <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-3 flex flex-wrap items-center gap-2">
        <Filter className="w-4 h-4 text-[var(--pinbank-blue)]/40 ml-1" />
        <Input
          placeholder="Buscar por nome, arquivo, contexto..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[200px] h-8 text-xs"
        />
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="h-8 text-xs w-[180px]">
            <SelectValue placeholder="Fonte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as fontes</SelectItem>
            {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-[var(--pinbank-blue)]/60 ml-auto">
          {filteredDocs.length} de {unifiedDocs.length}
        </p>
      </div>

      {/* Lista de documentos */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-10 text-center">
          <FileCheck className="w-10 h-10 mx-auto mb-3 text-[var(--pinbank-blue)]/20" />
          <p className="text-sm text-[var(--pinbank-blue)]/50">
            {unifiedDocs.length === 0 ? 'Nenhum documento encontrado em todas as fontes' : 'Nenhum documento com os filtros atuais'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredDocs.map(doc => (
            <DocCard key={doc.id} doc={doc} onOpenPrivate={handleOpenPrivate} />
          ))}
        </div>
      )}
    </div>
  );
}