import React from 'react';
import { FileText, Lock, AlertCircle, Camera } from 'lucide-react';
import { Table } from '../DocHelpers';

/* ─────────────────────────────────────
   Shows required + conditional documents
   with full detail per the DB schema
   ───────────────────────────────────── */
export default function TemplateDocumentsBlock({ requiredDocs = [], conditionalDocs = [] }) {
  if (requiredDocs.length === 0 && conditionalDocs.length === 0) {
    return (
      <div className="text-[12px] text-[#1a1a1a]/50 italic p-4 bg-[#fafafa] rounded">
        Este template não possui documentos cadastrados. O upload é dispensado — o cliente só responde o questionário.
      </div>
    );
  }

  return (
    <>
      {requiredDocs.length > 0 && (
        <>
          <h4 className="text-[11px] font-bold text-[#002443] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Documentos Base (obrigatórios para todos)
          </h4>
          <Table
            headers={['#', 'Documento', 'Descrição', 'Formatos', 'Tamanho Máx.', 'CAF SDK']}
            rows={requiredDocs.map((d, i) => [
              String(i + 1),
              d.label || d.name || d.documentTypeId,
              d.description || '—',
              (d.allowedFormats || []).join(', ') || 'Qualquer',
              d.maxSizeMB ? `${d.maxSizeMB} MB` : '10 MB (padrão)',
              d.cafSdk ? <span className="inline-flex items-center gap-1 text-[#2bc196] font-semibold"><Camera className="w-3 h-3" />{d.cafSdk}</span> : '—',
            ])}
          />

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
            {requiredDocs.map((d, i) => (
              <DocumentDetailCard key={i} doc={d} />
            ))}
          </div>
        </>
      )}

      {conditionalDocs.length > 0 && (
        <>
          <h4 className="text-[11px] font-bold text-[#002443] uppercase tracking-wider mb-2 mt-5 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Documentos Condicionais (solicitados apenas em condições específicas)
          </h4>
          <Table
            headers={['#', 'Documento', 'Descrição', 'Aparece quando', 'Formatos']}
            rows={conditionalDocs.map((d, i) => [
              String(i + 1),
              d.label || d.name || d.documentTypeId,
              d.description || '—',
              formatCondition(d.conditionalLogic),
              (d.allowedFormats || []).join(', ') || 'Qualquer',
            ])}
          />
        </>
      )}
    </>
  );
}

function DocumentDetailCard({ doc }) {
  return (
    <div className="border border-[#e8e8e8] rounded p-3 bg-white">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-[12px] font-bold text-[#002443] flex-1 leading-tight">
          {doc.label || doc.documentTypeId}
        </p>
        <div className="flex gap-1 flex-shrink-0">
          {doc.cafSdk && (
            <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-[#2bc196]/15 text-[#2bc196] font-semibold">
              <Camera className="w-2.5 h-2.5" />SDK
            </span>
          )}
          {doc.required && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 font-semibold">
              OBRIGATÓRIO
            </span>
          )}
        </div>
      </div>
      <p className="text-[10px] text-[#1a1a1a]/50 font-mono mb-1.5">{doc.documentTypeId}</p>
      {doc.description && (
        <p className="text-[11px] text-[#1a1a1a]/75 leading-relaxed mb-2">{doc.description}</p>
      )}
      <div className="flex items-center gap-2 text-[10px] text-[#1a1a1a]/60">
        <Lock className="w-3 h-3" />
        <span>Armazenamento privado (LGPD) — acesso via signed URL 5min</span>
      </div>
      {doc.allowedFormats?.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {doc.allowedFormats.map(f => (
            <span key={f} className="text-[9px] px-1.5 py-0.5 bg-[#f4f4f4] rounded font-mono text-[#002443]">
              {f}
            </span>
          ))}
          {doc.maxSizeMB && (
            <span className="text-[9px] px-1.5 py-0.5 bg-[#f4f4f4] rounded font-mono text-[#002443]">
              ≤ {doc.maxSizeMB}MB
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function formatCondition(cond) {
  if (!cond) return '—';
  const op = { equals: '=', not_equals: '≠', in: 'em', contains: 'contém' }[cond.operator] || cond.operator;
  const val = Array.isArray(cond.value) ? cond.value.join(' | ') : (cond.value || '?');
  return <span className="font-mono text-[10px]">Q{cond.dependsOn?.slice(-4) || '?'} {op} "{val}"</span>;
}