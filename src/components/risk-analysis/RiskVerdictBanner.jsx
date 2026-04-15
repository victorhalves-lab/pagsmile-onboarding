import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, ShieldAlert, ArrowRight, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const DECISION_CONFIG = {
  'Aprovado': { bg: 'bg-emerald-900', border: 'border-emerald-700', icon: CheckCircle2, iconColor: 'text-emerald-300', label: 'APROVADO', sublabel: 'Dados objetivos (BDC + CAF) não identificaram riscos. Aprovação automática.' },
  'Aprovado com Condições Leves': { bg: 'bg-blue-900', border: 'border-blue-700', icon: ShieldCheck, iconColor: 'text-blue-300', label: 'APROVADO COM CONDIÇÕES LEVES', sublabel: 'Dados objetivos limpos, mas com pontos de atenção menores que justificam monitoramento.' },
  'Aprovado com Condições': { bg: 'bg-amber-900', border: 'border-amber-700', icon: AlertTriangle, iconColor: 'text-amber-300', label: 'APROVADO COM CONDIÇÕES', sublabel: 'Dados objetivos limpos, porém inconsistências detectadas justificam condições rigorosas.' },
  'Revisão Manual': { bg: 'bg-orange-900', border: 'border-orange-700', icon: ShieldAlert, iconColor: 'text-orange-300', label: 'REVISÃO MANUAL NECESSÁRIA', sublabel: 'Inconsistências significativas requerem análise humana antes da decisão final.' },
  'Recusado': { bg: 'bg-red-900', border: 'border-red-700', icon: XCircle, iconColor: 'text-red-300', label: 'RECUSADO', sublabel: 'Bloqueio objetivo detectado (BDC ou CAF). Recusa automática por dados concretos.' },
};

export default function RiskVerdictBanner({ onboardingCase, complianceScore }) {
  const decision = complianceScore?.recomendacao_final || onboardingCase?.iaDecision || onboardingCase?.status || 'Pendente';
  const config = DECISION_CONFIG[decision] || DECISION_CONFIG['Revisão Manual'];
  const Icon = config.icon;

  const v4Subfaixa = onboardingCase?.subfaixa;
  const v4Score = onboardingCase?.riskScoreV4;
  const v4Decision = v4Subfaixa === '1A' || v4Subfaixa === '1B' ? 'Aprovado' : v4Subfaixa === '2A' ? 'Aprovado com Condições Leves' : v4Subfaixa === '2B' ? 'Aprovado com Condições' : v4Subfaixa === '5' ? 'Recusado' : 'Revisão Manual';
  const wasEscalated = complianceScore?.decisao_escalada_sentinel === true;
  const escalationJustification = complianceScore?.escalation_justification;
  const confidence = complianceScore?.nivel_confianca_ia;
  const hasCafFraud = (onboardingCase?.redFlags || []).some(f => f.includes('CAF:') && f.toLowerCase().includes('fraude'));
  const hasV4Block = (onboardingCase?.bloqueiosAtivos || []).length > 0;

  // Determine the source of the decision
  let decisionSource = '';
  if (hasV4Block) decisionSource = 'Bloqueio V4 (dados BDC objetivos)';
  else if (hasCafFraud) decisionSource = 'Fraude biométrica detectada (CAF)';
  else if (wasEscalated) decisionSource = 'SENTINEL qualificou a decisão V4';
  else decisionSource = 'Score V4 (dados BDC/CAF objetivos)';

  if (decision === 'Pendente' || decision === 'Em Processamento') {
    return (
      <div className="rounded-2xl bg-slate-100 border border-slate-200 p-6 text-center">
        <Info className="w-8 h-8 mx-auto text-slate-400 mb-2" />
        <p className="text-sm font-bold text-slate-600">Análise ainda não concluída</p>
        <p className="text-xs text-slate-400 mt-1">Execute o pipeline de compliance para gerar a análise de risco.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl ${config.bg} ${config.border} border overflow-hidden`}>
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-white/10">
            <Icon className={`w-8 h-8 ${config.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h2 className="text-xl font-black text-white">{config.label}</h2>
              {confidence != null && (
                <Badge className="bg-white/15 text-white/80 border-white/20 border text-[10px]">
                  Confiança: {confidence}%
                </Badge>
              )}
            </div>
            <p className="text-sm text-white/70 leading-relaxed mb-3">{config.sublabel}</p>

            {/* Decision source */}
            <div className="text-xs text-white/50 mb-3">
              <span className="font-bold">Origem da decisão:</span> {decisionSource}
            </div>

            {/* Escalation explanation */}
            {wasEscalated && (
              <div className="bg-white/10 rounded-xl p-4 mt-3 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRight className="w-4 h-4 text-white/60" />
                  <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Como a decisão foi formada</span>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/30">
                    <span className="text-xs font-bold text-emerald-300">V4: {v4Decision}</span>
                    <span className="text-[10px] text-emerald-200/60 ml-1">(Score {v4Score}/849)</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/30" />
                  <div className="px-3 py-1.5 rounded-lg bg-white/15 border border-white/20">
                    <span className="text-xs font-bold text-white">{decision}</span>
                    <span className="text-[10px] text-white/50 ml-1">(SENTINEL qualificou)</span>
                  </div>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  <strong>O Score V4 (dados BDC) indicou "{v4Decision}"</strong> porque os dados cadastrais são limpos. 
                  O SENTINEL identificou pontos de atenção adicionais e sugeriu condições/revisão. 
                  {decision !== 'Recusado' && ' Lembre-se: o SENTINEL NÃO pode recusar — apenas adicionar condições ou escalar para revisão manual.'}
                </p>
                {escalationJustification && (
                  <p className="text-xs text-white/50 mt-2 italic">Justificativa: {escalationJustification}</p>
                )}
              </div>
            )}

            {/* CAF fraud warning */}
            {hasCafFraud && (
              <div className="bg-red-500/20 rounded-xl p-4 mt-3 border border-red-400/30">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-300" />
                  <span className="text-xs font-bold text-red-200">FRAUDE BIOMÉTRICA/DOCUMENTAL DETECTADA PELA CAF</span>
                </div>
                <p className="text-xs text-red-200/70 mt-1">A CAF (Combate à Fraude) detectou fraude em verificação biométrica ou documental. Este é um dado OBJETIVO que justifica revisão manual com sugestão de recusa.</p>
              </div>
            )}

            {/* V4 blocks */}
            {hasV4Block && (
              <div className="bg-red-500/20 rounded-xl p-4 mt-3 border border-red-400/30">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-300" />
                  <span className="text-xs font-bold text-red-200">BLOQUEIO V4 — DADOS OBJETIVOS BDC</span>
                </div>
                <p className="text-xs text-red-200/70 mb-2">Bloqueios são condições absolutas detectadas pela Big Data Corp que impedem aprovação.</p>
                <div className="flex flex-wrap gap-1.5">
                  {(onboardingCase?.bloqueiosAtivos || []).map((b, i) => (
                    <Badge key={i} className="bg-red-500/30 text-red-200 border-red-400/30 border text-[10px]">{b}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary line */}
      {complianceScore?.sumario_executivo && (
        <div className="px-6 pb-5">
          <p className="text-sm text-white/60 leading-relaxed">{complianceScore.sumario_executivo}</p>
        </div>
      )}
    </div>
  );
}