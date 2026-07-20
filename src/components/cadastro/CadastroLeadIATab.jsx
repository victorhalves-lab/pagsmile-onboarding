import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Database, FileText, ChevronDown, ChevronUp, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';

function Section({ icon: Icon, title, badge, children, color = 'text-[var(--pinbank-blue)]' }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-5">
      <h3 className="text-sm font-semibold text-[var(--pinbank-blue)] mb-3 flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        {title}
        {badge != null && <Badge className="bg-[var(--pinbank-blue)]/10 text-[var(--pinbank-blue)] text-[10px] ml-1">{badge}</Badge>}
      </h3>
      {children}
    </div>
  );
}

function CollapsibleJson({ label, data }) {
  const [open, setOpen] = useState(false);
  if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) return null;
  return (
    <div className="bg-slate-50 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-3 text-left">
        <span className="text-xs font-semibold text-[var(--pinbank-blue)]">{label}</span>
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <pre className="px-3 pb-3 text-[10px] text-[var(--pinbank-blue)]/70 overflow-auto max-h-[300px] font-mono">
          {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

function RiskBadge({ level }) {
  if (!level) return null;
  const map = {
    BAIXO: 'bg-green-100 text-green-700',
    MEDIO: 'bg-amber-100 text-amber-700',
    ALTO: 'bg-orange-100 text-orange-700',
    CRITICO: 'bg-red-100 text-red-700',
    EXCELENTE: 'bg-green-100 text-green-700',
    BOM: 'bg-blue-100 text-blue-700',
    REGULAR: 'bg-amber-100 text-amber-700',
    FRACO: 'bg-orange-100 text-orange-700',
    INSUFICIENTE: 'bg-red-100 text-red-700',
  };
  return <Badge className={`${map[level] || 'bg-slate-100 text-slate-700'} text-[10px]`}>{level}</Badge>;
}

export default function CadastroLeadIATab({ lead, latestCase }) {
  // HelenaAnalysis
  const { data: helenaList = [] } = useQuery({
    queryKey: ['cadastro-helena', latestCase?.id],
    queryFn: () => base44.entities.HelenaAnalysis.filter({ onboarding_case_id: latestCase.id }),
    enabled: !!latestCase?.id,
  });
  const helena = helenaList.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

  if (!lead && !helena) {
    return (
      <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-10 text-center mt-4">
        <Brain className="w-10 h-10 mx-auto mb-3 text-[var(--pinbank-blue)]/20" />
        <p className="text-sm text-[var(--pinbank-blue)]/50">Sem dados de IA / pré-onboarding registrados</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {/* PRISCILA */}
      {lead?.priscilaQualityScore != null && (
        <Section icon={Sparkles} title="PRISCILA — Análise de Qualidade do Lead" color="text-violet-600">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div className="p-3 bg-violet-50 rounded-lg">
              <p className="text-[10px] text-[var(--pinbank-blue)]/50">Score Qualidade</p>
              <p className="text-2xl font-bold text-violet-700">{lead.priscilaQualityScore}</p>
            </div>
            <div className="p-3 bg-violet-50 rounded-lg flex flex-col justify-center">
              <p className="text-[10px] text-[var(--pinbank-blue)]/50">Nível de Risco</p>
              <RiskBadge level={lead.priscilaRiskLevel} />
            </div>
            <div className="p-3 bg-violet-50 rounded-lg">
              <p className="text-[10px] text-[var(--pinbank-blue)]/50">Caminho Sugerido</p>
              <p className="text-xs font-semibold">{lead.priscilaDecisionPath || '—'}</p>
            </div>
          </div>
          <CollapsibleJson label="Relatório PRISCILA Completo" data={lead.priscilaAnalysisReport} />
        </Section>
      )}

      {/* Lead Qualifier IA */}
      {lead?.leadQualifierScore != null && (
        <Section icon={TrendingUp} title="Lead Qualifier IA — Maturidade do Lead" color="text-blue-600">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-[10px] text-[var(--pinbank-blue)]/50">Score</p>
              <p className="text-2xl font-bold text-blue-700">{lead.leadQualifierScore}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg flex flex-col justify-center">
              <p className="text-[10px] text-[var(--pinbank-blue)]/50">Classificação</p>
              <RiskBadge level={lead.leadQualifierLevel} />
            </div>
            <div className="p-3 bg-blue-50 rounded-lg col-span-2">
              <p className="text-[10px] text-[var(--pinbank-blue)]/50">Última análise</p>
              <p className="text-xs font-semibold">{lead.leadQualifierDate ? new Date(lead.leadQualifierDate).toLocaleString('pt-BR') : '—'}</p>
            </div>
          </div>
          <CollapsibleJson label="Relatório Completo Lead Qualifier" data={lead.leadQualifierReport} />
        </Section>
      )}

      {/* Análise de Risco IA Avançada (Lead) */}
      {(lead?.iaRiskScore != null || lead?.iaAnalysisReport) && (
        <Section icon={Brain} title="Análise IA Avançada (Pré-Onboarding)" color="text-purple-600">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {lead.iaRiskScore != null && (
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-[10px] text-[var(--pinbank-blue)]/50">Score IA</p>
                <p className="text-2xl font-bold text-purple-700">{lead.iaRiskScore}</p>
              </div>
            )}
            {lead.iaDecision && (
              <div className="p-3 bg-purple-50 rounded-lg flex flex-col justify-center">
                <p className="text-[10px] text-[var(--pinbank-blue)]/50">Decisão Sugerida</p>
                <p className="text-xs font-bold">{lead.iaDecision}</p>
              </div>
            )}
            {lead.iaPriority && (
              <div className="p-3 bg-purple-50 rounded-lg flex flex-col justify-center">
                <p className="text-[10px] text-[var(--pinbank-blue)]/50">Prioridade</p>
                <Badge className="bg-purple-200 text-purple-800 text-[10px]">{lead.iaPriority}</Badge>
              </div>
            )}
            {lead.iaAnalysisDate && (
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-[10px] text-[var(--pinbank-blue)]/50">Data</p>
                <p className="text-xs font-semibold">{new Date(lead.iaAnalysisDate).toLocaleString('pt-BR')}</p>
              </div>
            )}
          </div>
          {lead.iaSuggestions?.length > 0 && (
            <div className="mb-3 p-3 bg-purple-50 rounded-lg">
              <p className="text-[10px] font-bold text-purple-700 mb-1.5">Sugestões IA</p>
              <ul className="space-y-1">
                {lead.iaSuggestions.map((s, i) => (
                  <li key={i} className="text-[11px] text-purple-700/80 flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {lead.iaAnalysisReport && (
            <div className="text-xs text-[var(--pinbank-blue)]/70 whitespace-pre-wrap p-3 bg-slate-50 rounded-lg max-h-[300px] overflow-auto">
              {lead.iaAnalysisReport}
            </div>
          )}
        </Section>
      )}

      {/* BDC Pré-Onboarding */}
      {(lead?.bdcLeadScore != null || lead?.bdcEnrichmentData || lead?.bdcDueReport) && (
        <Section icon={Database} title="Enriquecimento BDC Pré-Onboarding" color="text-cyan-600">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {lead.bdcLeadScore != null && (
              <div className="p-3 bg-cyan-50 rounded-lg">
                <p className="text-[10px] text-[var(--pinbank-blue)]/50">Score BDC</p>
                <p className="text-2xl font-bold text-cyan-700">{lead.bdcLeadScore}</p>
              </div>
            )}
            {lead.bdcScoreLevel && (
              <div className="p-3 bg-cyan-50 rounded-lg flex flex-col justify-center">
                <p className="text-[10px] text-[var(--pinbank-blue)]/50">Nível</p>
                <RiskBadge level={lead.bdcScoreLevel} />
              </div>
            )}
            {lead.bdcEnrichmentDate && (
              <div className="p-3 bg-cyan-50 rounded-lg col-span-2">
                <p className="text-[10px] text-[var(--pinbank-blue)]/50">Última consulta</p>
                <p className="text-xs font-semibold">{new Date(lead.bdcEnrichmentDate).toLocaleString('pt-BR')}</p>
              </div>
            )}
          </div>
          {lead.bdcFlags?.length > 0 && (
            <div className="mb-3 p-3 bg-amber-50 rounded-lg">
              <p className="text-[10px] font-bold text-amber-700 mb-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />Flags BDC ({lead.bdcFlags.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {lead.bdcFlags.map((f, i) => (
                  <Badge key={i} className="bg-amber-100 text-amber-700 text-[10px]">{f}</Badge>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <CollapsibleJson label="Dados BDC Brutos" data={lead.bdcEnrichmentData} />
            <CollapsibleJson label="Cross-Validation (Declarado vs Verificado)" data={lead.bdcCrossValidation} />
            <CollapsibleJson label="Deep Due Diligence (KYC, Sanções, Processos)" data={lead.bdcDueReport} />
          </div>
        </Section>
      )}

      {/* Helena Analysis */}
      {helena && (
        <Section icon={Brain} title="Helena IA — Análise de Compliance" color="text-emerald-600">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {helena.score != null && (
              <div className="p-3 bg-emerald-50 rounded-lg">
                <p className="text-[10px] text-[var(--pinbank-blue)]/50">Score</p>
                <p className="text-2xl font-bold text-emerald-700">{helena.score}</p>
              </div>
            )}
            {helena.decision && (
              <div className="p-3 bg-emerald-50 rounded-lg flex flex-col justify-center">
                <p className="text-[10px] text-[var(--pinbank-blue)]/50">Decisão</p>
                <Badge className={`text-[10px] ${
                  helena.decision === 'APPROVED' ? 'bg-green-100 text-green-700' :
                  helena.decision === 'REJECTED' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }`}>{helena.decision}</Badge>
              </div>
            )}
            {helena.model_version && (
              <div className="p-3 bg-emerald-50 rounded-lg col-span-2">
                <p className="text-[10px] text-[var(--pinbank-blue)]/50">Modelo / Tempo</p>
                <p className="text-xs font-semibold">{helena.model_version} • {helena.processing_time_ms || 0}ms</p>
              </div>
            )}
          </div>
          {helena.recommendation && (
            <div className="mb-3 p-3 bg-emerald-50 rounded-lg">
              <p className="text-[10px] font-bold text-emerald-700 mb-1">Recomendação</p>
              <p className="text-xs text-emerald-700/80">{helena.recommendation}</p>
            </div>
          )}
          {helena.positive_factors?.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] font-bold text-green-700 mb-1.5 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Fatores Positivos</p>
              <ul className="space-y-1">
                {helena.positive_factors.map((f, i) => (
                  <li key={i} className="text-[11px] text-green-700/80 flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {helena.risk_factors?.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] font-bold text-amber-700 mb-1.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Fatores de Risco</p>
              <ul className="space-y-1">
                {helena.risk_factors.map((f, i) => (
                  <li key={i} className="text-[11px] text-amber-700/80 flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {helena.justification && (
            <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-[var(--pinbank-blue)]/70 whitespace-pre-wrap max-h-[200px] overflow-auto">
              {helena.justification}
            </div>
          )}
        </Section>
      )}

      {/* Internal Commercial Questionnaire */}
      {lead?.cpfCnpj && <InternalCommercialBlock cpfCnpj={lead.cpfCnpj} />}

      {/* Simplified Questionnaire */}
      {lead?.cpfCnpj && <SimplifiedQuestionnaireBlock cpfCnpj={lead.cpfCnpj} email={lead.email} />}
    </div>
  );
}

function InternalCommercialBlock({ cpfCnpj }) {
  const { data: items = [] } = useQuery({
    queryKey: ['cadastro-internal-comm', cpfCnpj],
    queryFn: () => base44.entities.InternalCommercialQuestionnaire.filter({ cpfCnpj }),
    enabled: !!cpfCnpj,
  });
  if (!items.length) return null;
  return (
    <Section icon={FileText} title="Questionário Comercial Interno" badge={items.length} color="text-indigo-600">
      <div className="space-y-2">
        {items.map((q, i) => (
          <details key={q.id || i} className="p-3 bg-slate-50 rounded-lg">
            <summary className="text-xs font-semibold cursor-pointer text-[var(--pinbank-blue)]">
              Registro {i + 1} • {new Date(q.created_date).toLocaleDateString('pt-BR')}
            </summary>
            <pre className="mt-2 text-[10px] text-[var(--pinbank-blue)]/70 overflow-auto max-h-[300px] font-mono">
              {JSON.stringify(q, null, 2)}
            </pre>
          </details>
        ))}
      </div>
    </Section>
  );
}

function SimplifiedQuestionnaireBlock({ cpfCnpj, email }) {
  const { data: items = [] } = useQuery({
    queryKey: ['cadastro-simplified', cpfCnpj, email],
    queryFn: async () => {
      const a = await base44.entities.QuestionarioSimplificado.filter({ cpfCnpj });
      const b = email ? await base44.entities.QuestionarioSimplificado.filter({ email }) : [];
      const map = new Map();
      [...a, ...b].forEach(x => map.set(x.id, x));
      return Array.from(map.values());
    },
    enabled: !!cpfCnpj || !!email,
  });
  if (!items.length) return null;
  return (
    <Section icon={FileText} title="Questionário Simplificado" badge={items.length} color="text-teal-600">
      <div className="space-y-2">
        {items.map((q, i) => (
          <details key={q.id || i} className="p-3 bg-slate-50 rounded-lg">
            <summary className="text-xs font-semibold cursor-pointer text-[var(--pinbank-blue)]">
              Registro {i + 1} • {new Date(q.created_date).toLocaleDateString('pt-BR')}
            </summary>
            <pre className="mt-2 text-[10px] text-[var(--pinbank-blue)]/70 overflow-auto max-h-[300px] font-mono">
              {JSON.stringify(q, null, 2)}
            </pre>
          </details>
        ))}
      </div>
    </Section>
  );
}