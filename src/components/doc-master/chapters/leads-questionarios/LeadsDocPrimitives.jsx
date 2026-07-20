// =============================================================================
// Primitivas de UI para a documentação dos questionários de leads.
// Reutilizadas por LeadsV5QuestionnaireDoc e LeadsPixV4QuestionnaireDoc.
// =============================================================================

import React from 'react';

export function StepBlock({ number, title, description, condition, children }) {
  return (
    <div className="bg-white border border-[#0A0A0A]/10 rounded-2xl overflow-hidden">
      <div className="bg-[#0A0A0A] text-white px-5 py-3 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-[#1356E2] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {number}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold tracking-wide">{title}</h3>
          {description && <p className="text-[11px] text-white/70 mt-0.5">{description}</p>}
        </div>
      </div>
      {condition && (
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 text-[11px] text-amber-900">
          <strong>Aparece quando:</strong> {condition}
        </div>
      )}
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

export function Question({ id, label, type, required, options, hint, condition }) {
  return (
    <div className="border-l-2 border-[#1356E2]/40 pl-4 py-1">
      <div className="flex items-start gap-2 flex-wrap">
        {id && (
          <code className="text-[10px] bg-[#0A0A0A]/5 text-[#0A0A0A]/70 px-1.5 py-0.5 rounded font-mono">
            {id}
          </code>
        )}
        <span className="text-sm font-semibold text-[#0A0A0A]">{label}</span>
        {required && (
          <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold">OBRIGATÓRIO</span>
        )}
        {type && (
          <span className="text-[10px] bg-[#1356E2]/10 text-[#1356E2] px-1.5 py-0.5 rounded font-bold uppercase">
            {type}
          </span>
        )}
      </div>
      {hint && <p className="text-[11px] text-[#0A0A0A]/60 mt-1 italic">{hint}</p>}
      {condition && (
        <p className="text-[11px] text-amber-700 mt-1">
          <strong>Condicional:</strong> {condition}
        </p>
      )}
      {options && options.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {options.map((opt, i) => (
            <span
              key={i}
              className="text-[11px] bg-[#f4f4f4] text-[#0A0A0A] px-2 py-0.5 rounded border border-[#0A0A0A]/10"
            >
              {opt}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function FlagCard({ code, name, description, penalty }) {
  return (
    <div className="bg-white border border-[#0A0A0A]/10 rounded-lg p-3 flex gap-3">
      <code className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-mono font-bold whitespace-nowrap h-fit">
        {code}
      </code>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-[#0A0A0A]">{name}</div>
        <div className="text-[11px] text-[#0A0A0A]/70 mt-0.5">{description}</div>
        {penalty && (
          <div className="text-[10px] text-red-600 mt-1 font-semibold">
            Penalidade no score: {penalty}
          </div>
        )}
      </div>
    </div>
  );
}

export function ScoreRule({ condition, points, type = 'bonus' }) {
  const isBonus = type === 'bonus';
  return (
    <div className={`flex items-center gap-3 p-2 rounded ${isBonus ? 'bg-emerald-50' : 'bg-red-50'}`}>
      <span
        className={`text-[11px] font-bold px-2 py-0.5 rounded ${
          isBonus ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}
      >
        {isBonus ? '+' : ''}
        {points}
      </span>
      <span className="text-xs text-[#0A0A0A]">{condition}</span>
    </div>
  );
}

export function InfoBox({ title, children, tone = 'info' }) {
  const tones = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
  };
  return (
    <div className={`border rounded-lg p-3 text-xs ${tones[tone]}`}>
      {title && <div className="font-bold mb-1">{title}</div>}
      <div>{children}</div>
    </div>
  );
}