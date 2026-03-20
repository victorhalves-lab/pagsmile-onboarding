import React from 'react';
import { Shield, FileText, FileCheck, Scale } from 'lucide-react';

export default function CaseSummaryCards({ complianceScore, onboardingCase, validations, documents, responses }) {
  const scoreValue = complianceScore?.score_geral_composto ? Math.round(complianceScore.score_geral_composto / 10) : onboardingCase.riskScore || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--pagsmile-blue)]/70 font-semibold">Score de Risco</p>
            <p className={`text-3xl font-bold ${scoreValue >= 75 ? 'text-green-600' : scoreValue >= 40 ? 'text-orange-600' : 'text-red-600'}`}>
              {scoreValue || '-'}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${scoreValue >= 75 ? 'bg-green-100' : scoreValue >= 40 ? 'bg-orange-100' : 'bg-red-100'}`}>
            <Scale className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--pagsmile-blue)]/70 font-semibold">Validações</p>
            <p className="text-3xl font-bold text-[var(--pagsmile-blue)]">
              {validations.filter(v => v.status === 'Sucesso').length}/{validations.length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-blue-100"><Shield className="w-6 h-6 text-blue-600" /></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--pagsmile-blue)]/70 font-semibold">Documentos</p>
            <p className="text-3xl font-bold text-[var(--pagsmile-blue)]">
              {documents.filter(d => d.validationStatus === 'Validado').length}/{documents.length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-purple-100"><FileText className="w-6 h-6 text-purple-600" /></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--pagsmile-blue)]/70 font-semibold">Respostas</p>
            <p className="text-3xl font-bold text-[var(--pagsmile-blue)]">{responses.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-teal-100"><FileCheck className="w-6 h-6 text-teal-600" /></div>
        </div>
      </div>
    </div>
  );
}