import React from 'react';
import { FileText } from 'lucide-react';
import CadastroEditMerchant from './CadastroEditMerchant';

function formatValue(val) {
  if (val === null || val === undefined || val === '') return '—';
  if (typeof val === 'boolean') return val ? 'Sim' : 'Não';
  if (Array.isArray(val)) return val.join(', ') || '—';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function DataRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2 border-b border-[var(--pagsmile-blue)]/5 last:border-0">
      <span className="text-xs text-[var(--pagsmile-blue)]/50 sm:w-1/3 flex-shrink-0">{label}</span>
      <span className="text-sm text-[var(--pagsmile-blue)] font-medium break-words">{formatValue(value)}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-5">
      <h3 className="text-sm font-semibold text-[var(--pagsmile-blue)] mb-3 flex items-center gap-2">
        <FileText className="w-4 h-4 text-[var(--pagsmile-green)]" />
        {title}
      </h3>
      <div>{children}</div>
    </div>
  );
}

export default function CadastroDadosTab({ merchant, lead, responses, latestCase, onMerchantUpdated }) {
  // Group responses by question text for display
  const questionResponses = responses.map(r => ({
    question: r.questionText || `Pergunta ${r.questionId}`,
    answer: r.valueText || r.valueNumber || r.valueBoolean || (r.valueArray?.length ? r.valueArray : null),
  }));

  // Lead questionnaire data
  const leadData = lead?.questionnaireData || {};
  const leadEntries = Object.entries(leadData).filter(([k, v]) => 
    !k.startsWith('_') && v !== null && v !== undefined && v !== ''
  );

  return (
    <div className="space-y-4 mt-4">
      {/* Edit Button */}
      <div className="flex justify-end">
        <CadastroEditMerchant merchant={merchant} onSaved={onMerchantUpdated} />
      </div>

      {/* Merchant Basic Data */}
      <Section title="Dados Básicos do Merchant">
        <DataRow label="Nome / Razão Social" value={merchant.fullName} />
        {merchant.companyName && <DataRow label="Nome Fantasia" value={merchant.companyName} />}
        <DataRow label="Tipo" value={merchant.type} />
        <DataRow label="CPF/CNPJ" value={merchant.cpfCnpj} />
        <DataRow label="E-mail" value={merchant.email} />
        <DataRow label="Telefone" value={merchant.phone} />
        {merchant.dateOfBirth && <DataRow label="Data de Nascimento" value={merchant.dateOfBirth} />}
        {merchant.nationality && <DataRow label="Nacionalidade" value={merchant.nationality} />}
        {merchant.motherName && <DataRow label="Nome da Mãe" value={merchant.motherName} />}
      </Section>

      {/* Lead Questionnaire Data */}
      {leadEntries.length > 0 && (
        <Section title="Dados do Questionário de Lead">
          {leadEntries.map(([key, value]) => (
            <DataRow key={key} label={key} value={value} />
          ))}
        </Section>
      )}

      {/* Compliance Questionnaire Responses */}
      {questionResponses.length > 0 && (
        <Section title="Respostas do Questionário de Compliance">
          {questionResponses.map((r, i) => (
            <DataRow key={i} label={r.question} value={r.answer} />
          ))}
        </Section>
      )}

      {/* If no data at all */}
      {questionResponses.length === 0 && leadEntries.length === 0 && (
        <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-10 text-center">
          <FileText className="w-10 h-10 mx-auto mb-3 text-[var(--pagsmile-blue)]/20" />
          <p className="text-sm text-[var(--pagsmile-blue)]/50">Nenhum questionário preenchido ainda</p>
        </div>
      )}
    </div>
  );
}