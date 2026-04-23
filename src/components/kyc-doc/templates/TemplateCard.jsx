import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, HelpCircle, Tag, Users } from 'lucide-react';
import { QuestionTable } from '../DocHelpers';
import TemplateDocumentsBlock from './TemplateDocumentsBlock';

/* ──────────────────────────────────────────────────────────
   TemplateCard — expandable card for a single template
   Shows full metadata + all questions + all documents
   ────────────────────────────────────────────────────────── */
export default function TemplateCard({ template, questions = [] }) {
  const [expandedBlocks, setExpandedBlocks] = useState({ meta: true, questions: true, documents: true });

  const toggle = (key) => setExpandedBlocks(prev => ({ ...prev, [key]: !prev[key] }));

  const requiredDocs = (template.requiredDocuments || []).filter(d => !d.conditionalLogic);
  const conditionalDocs = (template.requiredDocuments || []).filter(d => d.conditionalLogic);
  const requiredQs = questions.filter(q => q.isRequired);
  const riskQs = questions.filter(q => q.riskWeight > 0);
  const conditionalQs = questions.filter(q => q.conditionalLogic);

  return (
    <div className="border border-[#e8e8e8] rounded-lg overflow-hidden mb-6 bg-white print-avoid-break">
      {/* Header */}
      <div className="bg-[#f9fafb] border-b border-[#e8e8e8] px-5 py-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-[#002443]">{template.name}</h3>
            <p className="text-[11px] text-[#1a1a1a]/50 mt-0.5 font-mono">
              model: <span className="text-[#2bc196]">{template.model}</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#002443] text-white">
              <Users className="w-3 h-3" />{template.merchantType}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#2bc196]/15 text-[#2bc196]">
              <Tag className="w-3 h-3" />{template.subCategory || 'GENERAL'}
            </span>
          </div>
        </div>

        {template.description && (
          <p className="text-[12px] text-[#1a1a1a]/70 leading-relaxed mt-2">{template.description}</p>
        )}

        {/* Quick metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3">
          <Metric label="Perguntas" value={questions.length} />
          <Metric label="Obrigatórias" value={requiredQs.length} accent="blue" />
          <Metric label="Com Risco" value={riskQs.length} accent="amber" />
          <Metric label="Docs Base" value={requiredDocs.length} accent="green" />
          <Metric label="Docs Cond." value={conditionalDocs.length} accent="purple" />
        </div>
      </div>

      {/* Metadata block */}
      <Section
        title="Metadata Regulatória & Thresholds"
        icon={HelpCircle}
        expanded={expandedBlocks.meta}
        onToggle={() => toggle('meta')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px]">
          <div>
            <p className="text-[#1a1a1a]/50 font-semibold mb-1">Version</p>
            <p className="text-[#002443]">{template.version || 1}</p>
          </div>
          <div>
            <p className="text-[#1a1a1a]/50 font-semibold mb-1">Usage Count</p>
            <p className="text-[#002443]">{template.usageCount || 0} casos criados</p>
          </div>
          <div>
            <p className="text-[#1a1a1a]/50 font-semibold mb-1">Auto-aprovação ≥</p>
            <p className="text-[#002443]">{template.riskThresholds?.autoApproveAbove ?? '—'}</p>
          </div>
          <div>
            <p className="text-[#1a1a1a]/50 font-semibold mb-1">Auto-recusa &lt;</p>
            <p className="text-[#002443]">{template.riskThresholds?.autoRejectBelow ?? '—'}</p>
          </div>
          <div>
            <p className="text-[#1a1a1a]/50 font-semibold mb-1">Revisão manual (min-max)</p>
            <p className="text-[#002443]">
              {template.riskThresholds?.manualReviewMin ?? '—'} — {template.riskThresholds?.manualReviewMax ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-[#1a1a1a]/50 font-semibold mb-1">Status</p>
            <p className="text-[#002443]">{template.isActive ? '🟢 Ativo' : '🔴 Inativo'} {template.isArchived && '| Arquivado'}</p>
          </div>
        </div>
      </Section>

      {/* Questions block */}
      {questions.length > 0 && (
        <Section
          title={`Perguntas (${questions.length})`}
          icon={HelpCircle}
          expanded={expandedBlocks.questions}
          onToggle={() => toggle('questions')}
        >
          <QuestionTable questions={questions} />

          {conditionalQs.length > 0 && (
            <div className="mt-4 p-3 bg-purple-50/50 border border-purple-100 rounded">
              <p className="text-[11px] font-bold text-purple-900 mb-1.5">
                Lógica Condicional ({conditionalQs.length} perguntas condicionais)
              </p>
              <ul className="text-[11px] space-y-1">
                {conditionalQs.map(q => {
                  const parent = questions.find(x => x.id === q.conditionalLogic.dependsOn);
                  return (
                    <li key={q.id} className="text-[#1a1a1a]/75 leading-relaxed">
                      <span className="font-semibold text-[#002443]">"{q.text}"</span>
                      {' '}aparece quando pergunta #{parent?.order ?? '?'}{' '}
                      <span className="font-mono text-[10px]">{q.conditionalLogic.operator}</span>{' '}
                      <em>"{Array.isArray(q.conditionalLogic.value) ? q.conditionalLogic.value.join(' | ') : q.conditionalLogic.value}"</em>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {riskQs.length > 0 && (
            <div className="mt-3 p-3 bg-amber-50/50 border border-amber-100 rounded">
              <p className="text-[11px] font-bold text-amber-900 mb-1.5">
                Perguntas com Peso de Risco ({riskQs.length})
              </p>
              <ul className="text-[11px] space-y-1">
                {riskQs.map(q => (
                  <li key={q.id} className="text-[#1a1a1a]/75 leading-relaxed">
                    <span className="font-semibold text-[#002443]">"{q.text}"</span> — peso {q.riskWeight}
                    {q.riskValues && Object.keys(q.riskValues).length > 0 && (
                      <span className="text-[#1a1a1a]/60"> — valores: {Object.entries(q.riskValues).map(([k, v]) => `"${k}"=${v}`).join(', ')}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      )}

      {/* Documents block */}
      <Section
        title={`Documentos Solicitados (${(template.requiredDocuments || []).length})`}
        icon={FileText}
        expanded={expandedBlocks.documents}
        onToggle={() => toggle('documents')}
      >
        <TemplateDocumentsBlock requiredDocs={requiredDocs} conditionalDocs={conditionalDocs} />
      </Section>
    </div>
  );
}

/* ─── Subcomponents ─── */

function Metric({ label, value, accent = 'default' }) {
  const colors = {
    default: 'bg-white border-[#e8e8e8] text-[#002443]',
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    green: 'bg-green-50 border-green-100 text-green-700',
    purple: 'bg-purple-50 border-purple-100 text-purple-700',
  }[accent];
  return (
    <div className={`${colors} border rounded px-2.5 py-1.5`}>
      <p className="text-[9px] uppercase tracking-wider opacity-60 font-semibold">{label}</p>
      <p className="text-base font-bold">{value}</p>
    </div>
  );
}

function Section({ title, icon: Icon, expanded, onToggle, children }) {
  return (
    <div className="border-t border-[#e8e8e8]">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-5 py-3 text-left hover:bg-[#f9fafb] transition-colors"
      >
        <Icon className="w-4 h-4 text-[#2bc196]" />
        <span className="text-[13px] font-bold text-[#002443] flex-1">{title}</span>
        {expanded ? <ChevronDown className="w-4 h-4 text-[#1a1a1a]/40" /> : <ChevronRight className="w-4 h-4 text-[#1a1a1a]/40" />}
      </button>
      {expanded && <div className="px-5 py-4 border-t border-[#e8e8e8] bg-white">{children}</div>}
    </div>
  );
}