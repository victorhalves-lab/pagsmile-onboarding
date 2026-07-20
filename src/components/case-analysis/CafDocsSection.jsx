import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScanFace, Eye, Download, CheckCircle2, XCircle, AlertTriangle, Camera, FileImage, Activity } from 'lucide-react';

/**
 * CafDocsSection — exibe imagens capturadas pelo CAF (doc frente, verso, selfie)
 * + metadados (liveness score, facematch similarity, status, data).
 *
 * Fontes de dados (em cascata, última tentativa):
 *   1. DocumentUpload com documentName contendo "CAF" (frente/verso/selfie salvos)
 *   2. IntegrationLog.image_urls do último evento CAF (fallback direto da API)
 *
 * Metadados vêm do IntegrationLog mais recente (score, similarity, probability, result_status).
 */

// Classifica um DocumentUpload como CAF doc baseado no nome
function classifyCafDoc(name = '') {
  const n = name.toLowerCase();
  if (n.includes('selfie')) return 'selfie';
  if (n.includes('verso') || n.includes('back')) return 'doc_back';
  if (n.includes('frente') || n.includes('front') || n.includes('cnh') || n.includes('rg')) return 'doc_front';
  if (n.includes('caf') && n.includes('doc')) return 'doc_front';
  return null;
}

// Classifica uma URL do IntegrationLog.image_urls (ordem típica: [front, back, selfie])
function classifyCafUrl(url = '', index = 0) {
  const u = url.toLowerCase();
  if (u.includes('selfie') || u.includes('liveness')) return 'selfie';
  if (u.includes('back') || u.includes('verso')) return 'doc_back';
  if (u.includes('front') || u.includes('frente')) return 'doc_front';
  // Fallback: ordem posicional típica CAF
  return ['doc_front', 'doc_back', 'selfie'][index] || null;
}

function StatusBadge({ status }) {
  if (!status) return null;
  const map = {
    APPROVED: { cls: 'bg-green-100 text-green-700 border-green-200', Icon: CheckCircle2, label: 'Aprovado' },
    REPROVED: { cls: 'bg-red-100 text-red-700 border-red-200', Icon: XCircle, label: 'Reprovado' },
    PENDING_REVIEW: { cls: 'bg-amber-100 text-amber-700 border-amber-200', Icon: AlertTriangle, label: 'Revisão' },
    NOT_APPLICABLE: { cls: 'bg-slate-100 text-slate-600 border-slate-200', Icon: AlertTriangle, label: 'N/A' },
  };
  const { cls, Icon, label } = map[status] || map.NOT_APPLICABLE;
  return (
    <Badge className={`${cls} border text-[10px] gap-1`}>
      <Icon className="w-3 h-3" />{label}
    </Badge>
  );
}

function ImageCard({ type, url, label, icon: Icon }) {
  if (!url) {
    return (
      <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center bg-slate-50">
        <Icon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <p className="text-[10px] text-slate-400 mt-1">Não capturado</p>
      </div>
    );
  }
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white group relative">
      <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden">
        <img src={url} alt={label} className="w-full h-full object-cover" />
      </div>
      <div className="p-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon className="w-3.5 h-3.5 text-[#1356E2] shrink-0" />
          <p className="text-xs font-semibold text-[#0A0A0A] truncate">{label}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button asChild size="icon" variant="ghost" className="h-7 w-7">
            <a href={url} target="_blank" rel="noopener noreferrer" title="Ver em tamanho real">
              <Eye className="w-3.5 h-3.5" />
            </a>
          </Button>
          <Button asChild size="icon" variant="ghost" className="h-7 w-7">
            <a href={url} download title="Baixar">
              <Download className="w-3.5 h-3.5" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

function MetadataChip({ label, value, highlight = false }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className={`px-3 py-2 rounded-lg border ${highlight ? 'bg-[#1356E2]/10 border-[#1356E2]/30' : 'bg-slate-50 border-slate-200'}`}>
      <p className="text-[9px] font-bold uppercase tracking-wider text-[#0A0A0A]/50">{label}</p>
      <p className={`text-sm font-bold ${highlight ? 'text-[#1356E2]' : 'text-[#0A0A0A]'}`}>{value}</p>
    </div>
  );
}

export default function CafDocsSection({ documents = [], integrationLogs = [] }) {
  // ── Encontrar a ÚLTIMA tentativa CAF com dados úteis ──
  const cafLogs = integrationLogs
    .filter(l => l.provider === 'CAF')
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  // Log mais recente que tenha imagens OU metadados de liveness/facematch
  const latestRichLog = cafLogs.find(l =>
    (Array.isArray(l.image_urls) && l.image_urls.length > 0) ||
    l.is_alive !== undefined || l.similarity !== undefined || l.score !== undefined
  );

  // Montar mapa de imagens: priorizar DocumentUpload (persistente) → fallback IntegrationLog
  const images = { doc_front: null, doc_back: null, selfie: null };

  // 1) Passar pelos DocumentUploads (filtra só os CAF)
  const cafDocs = documents
    .filter(d => classifyCafDoc(d.documentName || d.fileName || ''))
    .sort((a, b) => new Date(b.uploadDate || b.created_date) - new Date(a.uploadDate || a.created_date));

  for (const d of cafDocs) {
    const type = classifyCafDoc(d.documentName || d.fileName || '');
    if (type && !images[type] && d.fileUrl) {
      images[type] = d.fileUrl;
    }
  }

  // 2) Fallback nas image_urls do último log CAF
  if (latestRichLog?.image_urls?.length) {
    latestRichLog.image_urls.forEach((url, idx) => {
      const type = classifyCafUrl(url, idx);
      if (type && !images[type]) {
        images[type] = url;
      }
    });
  }

  const hasAnyImage = images.doc_front || images.doc_back || images.selfie;
  const hasMetadata = latestRichLog && (latestRichLog.score || latestRichLog.similarity || latestRichLog.is_alive !== undefined);

  if (!hasAnyImage && !hasMetadata) return null;

  // ── Extrair metadados da última tentativa ──
  // Pode haver logs separados (um pra liveness, um pra facematch). Pegar os mais recentes de cada.
  const livenessLog = cafLogs.find(l => ['liveness', 'face_liveness', 'prova_de_vida'].includes(l.service_type));
  const facematchLog = cafLogs.find(l => ['facematch', 'face_authentication'].includes(l.service_type));

  const livenessScore = livenessLog?.score ?? livenessLog?.probability;
  const livenessAlive = livenessLog?.is_alive;
  const similarity = facematchLog?.similarity;
  const overallStatus = latestRichLog?.result_status;
  const captureDate = latestRichLog?.callback_received_at || latestRichLog?.created_date;

  return (
    <div className="bg-white rounded-xl border-2 border-[#1356E2]/20 p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#1356E2]/10">
            <ScanFace className="w-5 h-5 text-[#1356E2]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0A0A0A]">Docs CAF — Identidade Verificada</h3>
            <p className="text-xs text-[#0A0A0A]/60">Imagens capturadas e validadas pela CAF</p>
          </div>
        </div>
        <StatusBadge status={overallStatus} />
      </div>

      {/* Imagens */}
      {hasAnyImage && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <ImageCard type="doc_front" url={images.doc_front} label="Documento (Frente)" icon={FileImage} />
          <ImageCard type="doc_back" url={images.doc_back} label="Documento (Verso)" icon={FileImage} />
          <ImageCard type="selfie" url={images.selfie} label="Selfie / Prova de Vida" icon={Camera} />
        </div>
      )}

      {/* Metadados */}
      {hasMetadata && (
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-[#1356E2]" />
            <h4 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">Resultado da Validação CAF</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetadataChip
              label="Liveness Score"
              value={livenessScore !== undefined ? `${Math.round(Number(livenessScore) * (livenessScore > 1 ? 1 : 100))}%` : null}
              highlight
            />
            <MetadataChip
              label="Prova de Vida"
              value={livenessAlive === true ? '✓ Vivo' : livenessAlive === false ? '✗ Falha' : null}
            />
            <MetadataChip
              label="Similaridade Facial"
              value={similarity !== undefined ? `${Math.round(Number(similarity) * (similarity > 1 ? 1 : 100))}%` : null}
              highlight
            />
            <MetadataChip
              label="Data da Captura"
              value={captureDate ? new Date(captureDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : null}
            />
          </div>
        </div>
      )}
    </div>
  );
}