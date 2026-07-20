import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, ShieldAlert, ArrowRight, Info, ChevronDown, ChevronUp, HelpCircle, AlertOctagon, Eye, FileText, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import EscalationPointsList from './EscalationPointsList';
import EscalationReasonBanner from './EscalationReasonBanner';

const DECISION_CONFIG = {
  'Aprovado': { bg: 'bg-emerald-900', border: 'border-emerald-700', icon: CheckCircle2, iconColor: 'text-emerald-300', label: 'APROVADO', sublabel: 'Dados objetivos (BDC + CAF) não identificaram riscos impeditivos. Aprovação automática.' },
  'Aprovado com Condições Leves': { bg: 'bg-blue-900', border: 'border-blue-700', icon: ShieldCheck, iconColor: 'text-blue-300', label: 'APROVADO COM CONDIÇÕES LEVES', sublabel: 'Dados objetivos limpos, mas com pontos de atenção menores que justificam monitoramento básico.' },
  'Aprovado com Condições': { bg: 'bg-amber-900', border: 'border-amber-700', icon: AlertTriangle, iconColor: 'text-amber-300', label: 'APROVADO COM CONDIÇÕES', sublabel: 'Dados objetivos limpos, porém inconsistências detectadas justificam condições rigorosas de operação.' },
  'Revisão Manual': { bg: 'bg-orange-900', border: 'border-orange-700', icon: ShieldAlert, iconColor: 'text-orange-300', label: 'REVISÃO MANUAL NECESSÁRIA', sublabel: 'Inconsistências significativas requerem análise humana antes da decisão final. Nenhum analista tomou decisão ainda.' },
  'Recusado': { bg: 'bg-red-900', border: 'border-red-700', icon: XCircle, iconColor: 'text-red-300', label: 'RECUSADO', sublabel: 'Bloqueio objetivo detectado OU análise IA identificou risco crítico. Veja detalhes abaixo.' },
};

const SUBFAIXA_NAMES = {
  '1A': 'VERDE EXPRESS — Risco muito baixo',
  '1B': 'VERDE — Risco baixo',
  '2A': 'AZUL LEVE — Risco moderado-baixo',
  '2B': 'AZUL — Risco moderado',
  '3A': 'AMARELO — Risco médio-alto',
  '3B': 'LARANJA — Risco alto',
  '4': 'VERMELHO — Risco muito alto',
  '5': 'BLOQUEIO — Risco máximo/impeditivo',
};

const BLOCK_EXPLANATIONS = {
  'B01': { title: 'CNPJ/CPF Inativo ou Irregular', explanation: 'O documento fiscal (CNPJ ou CPF) está com situação cadastral INATIVA, SUSPENSA ou INAPTA na Receita Federal. Isso significa que a empresa não pode exercer atividades econômicas legalmente. Este é um impedimento absoluto previsto na Circular BCB 3.978/2020.', action: 'A empresa precisa regularizar sua situação junto à Receita Federal antes de qualquer aprovação.' },
  'B02': { title: 'Empresa com menos de 6 meses', explanation: 'A empresa foi fundada há menos de 6 meses. Empresas muito novas não possuem histórico suficiente para avaliação de risco. A taxa de mortalidade de empresas no primeiro ano é de aproximadamente 20%.', action: 'Aguardar a empresa completar pelo menos 6 meses de operação, ou solicitar documentação adicional extensiva.' },
  'B03': { title: 'Empresa ou Sócio em Lista de Sanções', explanation: 'A empresa ou um de seus sócios foi encontrado em listas de sanções internacionais (OFAC SDN, União Europeia, Nações Unidas, COAF, CEIS, CNEP). Transacionar com entidades sancionadas é ilegal e pode resultar em multas milionárias e responsabilização criminal. Fundamentação: Lei 9.613/1998 Art. 10 (PLD/FT).', action: 'Recusa imediata. Não há possibilidade de aprovação enquanto a sanção estiver ativa.' },
  'B03c': { title: 'Grupo Econômico com Sanções', explanation: 'Uma empresa do grupo econômico (participações diretas ou indiretas) foi encontrada em listas de sanções. Circular BCB 3.978/2020 Art. 16 §§1-4 exige verificação de toda a cadeia societária.', action: 'Recusa imediata por contaminação do grupo econômico.' },
  'B04': { title: 'Pessoa Falecida', explanation: 'O CPF consultado está associado a registro de óbito. Operações em nome de pessoa falecida configuram fraude.', action: 'Recusa imediata e registro de suspeita de fraude.' },
  'B05': { title: 'Provável Empresa de Fachada (Shell Company)', explanation: 'O score de Shell Company (empresa de fachada) da Big Data Corp está acima de 80%. Isso é calculado combinando: zero empregados, sem domínio ativo de internet, sem passagens na web, endereço virtual, capital social mínimo. Uma empresa com score acima de 80% muito provavelmente não tem operação real.', action: 'Recusa automática. Se o merchant contestar, solicitar comprovações extensivas de operação real (folha de pagamento, fotos do local, contratos com clientes).' },
  'B06': { title: 'Dívida Ativa Superior a R$ 500.000', explanation: 'A empresa possui mais de R$ 500.000 inscritos em dívida ativa com o governo (federal, estadual ou municipal). Isso indica grave inadimplência fiscal e risco financeiro extremo.', action: 'Recusa automática. Empresa com dívida ativa deste porte provavelmente não consegue honrar compromissos financeiros.' },
  'B07': { title: 'Adverse Media Grave', explanation: 'Foram encontradas notícias na mídia com sentimento MUITO NEGATIVO associadas a temas como fraude, lavagem de dinheiro ou corrupção. Isso representa risco reputacional e regulatório extremo para a Pin Bank.', action: 'Recusa automática por risco reputacional.' },
  'B08': { title: 'Lista Suja MTE — Trabalho Escravo', explanation: 'A empresa foi encontrada na Lista Suja do Ministério do Trabalho e Emprego por uso de trabalho em condições análogas à escravidão. Este é um impedimento absoluto previsto na legislação trabalhista brasileira e política ESG.', action: 'REJEIÇÃO IMEDIATA. Fazer negócio com empresa na lista suja pode resultar em responsabilização solidária.' },
  'B09': { title: 'Embargo Ambiental IBAMA', explanation: 'A empresa possui embargo ambiental ativo do IBAMA, indicando infração ambiental grave.', action: 'Recusa até investigação completa.' },
};

function BlockExplanationCard({ block }) {
  const [open, setOpen] = useState(true);
  const code = block.split('_')[0] || block;
  const info = BLOCK_EXPLANATIONS[code] || null;
  const blockLabel = block.replace(/_/g, ' ');

  return (
    <div className="bg-white/10 rounded-xl border border-white/15 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-start gap-3 p-4 text-left">
        <AlertOctagon className="w-5 h-5 text-red-300 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">{info?.title || blockLabel}</p>
          <p className="text-xs text-white/50 mt-0.5">Código: {code} — Bloqueio automático por dados objetivos</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-white/40 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-white/40 shrink-0 mt-1" />}
      </button>
      {open && info && (
        <div className="px-4 pb-4 pt-0 space-y-3">
          <div className="pl-8">
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <p className="text-xs font-bold text-white/70 uppercase tracking-wide mb-1.5">O que isso significa</p>
              <p className="text-xs text-white/60 leading-relaxed">{info.explanation}</p>
            </div>
            <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-400/20 mt-2">
              <p className="text-xs font-bold text-amber-200/80 uppercase tracking-wide mb-1.5">Ação necessária</p>
              <p className="text-xs text-amber-200/60 leading-relaxed">{info.action}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DecisionExplanation({ decision, v4Decision, v4Score, subfaixa, hasV4Block, hasCafFraud, wasEscalated, sentinelRecommendation, bloqueios }) {
  // Case 1: V4 has blocks → automatic rejection by objective data
  if (hasV4Block) {
    return (
      <div className="space-y-3 mt-4">
        <div className="bg-white/10 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <AlertOctagon className="w-5 h-5 text-red-300" />
            <span className="text-sm font-bold text-white">POR QUE ESTÁ RECUSADO — Bloqueio por Dados Objetivos</span>
          </div>
          <div className="space-y-2 text-xs text-white/70 leading-relaxed">
            <p>A Big Data Corp (BDC) encontrou <strong className="text-white">{bloqueios.length} bloqueio(s) impeditivo(s)</strong> nos dados cadastrais desta empresa. Bloqueios são condições absolutas que impedem a aprovação, independente de qualquer outra análise.</p>
            <p>O Score V4 é <strong className="text-white">{v4Score}/849</strong> e a subfaixa é <strong className="text-white">{SUBFAIXA_NAMES[subfaixa] || subfaixa}</strong>, mas a presença de bloqueios ANULA o score e força a decisão para RECUSADO automaticamente.</p>
            <p className="text-white/50 text-[10px]">Nota: Bloqueios são gerados EXCLUSIVAMENTE por dados objetivos (Receita Federal, listas de sanções, dados cadastrais). O SENTINEL (IA) NÃO pode gerar bloqueios.</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold text-white/60 uppercase tracking-wider px-1">Detalhes de cada bloqueio:</p>
          {bloqueios.map((block, i) => (
            <BlockExplanationCard key={i} block={block} />
          ))}
        </div>
      </div>
    );
  }

  // Case 2: CAF biometric fraud
  if (hasCafFraud) {
    return (
      <div className="bg-white/10 rounded-xl p-4 mt-4 border border-white/10 space-y-3">
        <div className="flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-300" />
          <span className="text-sm font-bold text-white">POR QUE ESTÁ EM REVISÃO/RECUSADO — Fraude Biométrica</span>
        </div>
        <div className="text-xs text-white/70 leading-relaxed space-y-2">
          <p>O provedor CAF (Combate à Fraude) detectou <strong className="text-white">fraude biométrica ou documental</strong>. Isso pode significar:</p>
          <ul className="list-disc pl-5 space-y-1 text-white/60">
            <li><strong className="text-white/80">Liveness reprovado:</strong> A selfie não passou no teste de prova de vida (pode ser foto de foto, deepfake, ou a pessoa não é real)</li>
            <li><strong className="text-white/80">FaceMatch reprovado:</strong> O rosto da selfie não corresponde ao rosto do documento</li>
            <li><strong className="text-white/80">Documentoscopia reprovada:</strong> O documento apresentado é possivelmente falsificado ou adulterado</li>
            <li><strong className="text-white/80">Deepfake detectado:</strong> A IA da CAF detectou tentativa de deepfake na verificação facial</li>
          </ul>
          <p>Este é um dado <strong className="text-white">OBJETIVO</strong> que justifica revisão manual com forte sugestão de recusa.</p>
          <p>O Score V4 (BDC) é <strong className="text-white">{v4Score}/849</strong> (subfaixa {SUBFAIXA_NAMES[subfaixa] || subfaixa}), mas a fraude biométrica sobrescreve a decisão V4.</p>
        </div>
      </div>
    );
  }

  // Case 3: Recusado BUT V4 says approved — SENTINEL old version recusou
  if (decision === 'Recusado' && (v4Decision === 'Aprovado' || v4Decision === 'Aprovado com Condições Leves')) {
    return (
      <div className="bg-white/10 rounded-xl p-4 mt-4 border border-amber-400/20 space-y-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-300" />
          <span className="text-sm font-bold text-white">POR QUE ESTÁ RECUSADO — Inconsistência Detectada</span>
        </div>
        <div className="text-xs text-white/70 leading-relaxed space-y-2">
          <p>⚠️ <strong className="text-amber-200">Atenção:</strong> Os dados objetivos (BDC) classificam este caso como <strong className="text-emerald-300">{v4Decision}</strong> (Score {v4Score}/849, subfaixa {SUBFAIXA_NAMES[subfaixa] || subfaixa}). <strong className="text-white">NÃO há bloqueios ativos.</strong></p>
          <p>A recusa foi gerada pela <strong className="text-amber-200">IA SENTINEL</strong> em uma versão anterior do sistema (v5.0) que permitia ao SENTINEL recusar diretamente. Na versão atual (v5.1+), o SENTINEL pode no máximo sugerir "Revisão Manual" — nunca recusar.</p>
          <p><strong className="text-white">Recomendação:</strong> Este caso deve ser <strong className="text-amber-200">reprocessado</strong> com o novo pipeline para que a decisão seja recalculada corretamente. A decisão correta provavelmente seria "Revisão Manual" (se o SENTINEL encontrar inconsistências graves no questionário) ou "Aprovado com Condições".</p>
          <p className="text-white/50">Motivos que o SENTINEL identificou para a recusa (qualitativa, baseada no questionário):</p>
        </div>
      </div>
    );
  }

  // Case 4: Escalation (SENTINEL elevated V4 decision)
  if (wasEscalated) {
    return (
      <div className="bg-white/10 rounded-xl p-4 mt-4 border border-white/10 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <ArrowRight className="w-5 h-5 text-white/60" />
          <span className="text-sm font-bold text-white">Como a decisão foi formada — Escalação SENTINEL</span>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/30">
            <span className="text-xs font-bold text-emerald-300">V4 (BDC): {v4Decision}</span>
            <span className="text-[10px] text-emerald-200/60 ml-1">(Score {v4Score}/849)</span>
          </div>
          <ArrowRight className="w-4 h-4 text-white/30" />
          <div className="px-3 py-1.5 rounded-lg bg-white/15 border border-white/20">
            <span className="text-xs font-bold text-white">{decision}</span>
            <span className="text-[10px] text-white/50 ml-1">(SENTINEL qualificou)</span>
          </div>
        </div>
        <div className="text-xs text-white/70 leading-relaxed space-y-2">
          <p>O <strong className="text-white">Score V4 (dados objetivos da BDC)</strong> indicou <strong className="text-emerald-300">"{v4Decision}"</strong> porque os dados cadastrais não apresentam bloqueios.</p>
          <p>O <strong className="text-white">SENTINEL (IA qualitativa)</strong> analisou o questionário, cruzou com dados BDC e CAF, e identificou pontos de atenção adicionais que justificam condições extras ou revisão manual.</p>
          {decision !== 'Recusado' && <p className="text-white/50">Nota: O SENTINEL NÃO pode recusar — apenas adicionar condições ou escalar para revisão manual.</p>}
        </div>
      </div>
    );
  }

  // Case 5: Normal decision, just V4
  return (
    <div className="bg-white/10 rounded-xl p-4 mt-4 border border-white/10">
      <div className="flex items-center gap-2 mb-2">
        <Info className="w-4 h-4 text-white/60" />
        <span className="text-xs font-bold text-white/80">Detalhes da decisão</span>
      </div>
      <div className="text-xs text-white/60 leading-relaxed">
        <p>Score V4: <strong className="text-white">{v4Score}/849</strong> — Subfaixa: <strong className="text-white">{SUBFAIXA_NAMES[subfaixa] || subfaixa}</strong></p>
        <p className="mt-1">Decisão baseada nos dados objetivos da Big Data Corp. Sem bloqueios ativos e sem escalação pelo SENTINEL.</p>
      </div>
    </div>
  );
}

export default function RiskVerdictBanner({ onboardingCase, complianceScore }) {
  const decision = complianceScore?.recomendacao_final || onboardingCase?.iaDecision || onboardingCase?.status || 'Pendente';
  const config = DECISION_CONFIG[decision] || DECISION_CONFIG['Revisão Manual'];
  const Icon = config.icon;

  const v4Subfaixa = onboardingCase?.subfaixa;
  const v4Score = onboardingCase?.riskScoreV4;
  const v4Decision = v4Subfaixa === '1A' || v4Subfaixa === '1B' ? 'Aprovado' : v4Subfaixa === '2A' ? 'Aprovado com Condições Leves' : v4Subfaixa === '2B' ? 'Aprovado com Condições' : v4Subfaixa === '5' ? 'Recusado' : 'Revisão Manual';
  const wasEscalated = complianceScore?.decisao_escalada_sentinel === true;
  const sentinelRecommendation = complianceScore?.sentinel_recommendation;
  const confidence = complianceScore?.nivel_confianca_ia;
  const hasCafFraud = (onboardingCase?.redFlags || []).some(f => f.includes('CAF:') && f.toLowerCase().includes('fraude'));
  const bloqueios = onboardingCase?.bloqueiosAtivos || [];
  const hasV4Block = bloqueios.length > 0;

  if (decision === 'Pendente' || decision === 'Em Processamento') {
    return (
      <div className="rounded-2xl bg-slate-100 border border-slate-200 p-6 text-center">
        <Info className="w-8 h-8 mx-auto text-slate-400 mb-2" />
        <p className="text-sm font-bold text-slate-600">Análise ainda não concluída</p>
        <p className="text-xs text-slate-400 mt-1">Execute o pipeline de compliance para gerar a análise de risco.</p>
      </div>
    );
  }

  // Detect mismatch: V4 says approved but final says rejected
  const hasDecisionMismatch = decision === 'Recusado' && !hasV4Block && !hasCafFraud && (v4Decision === 'Aprovado' || v4Decision === 'Aprovado com Condições Leves');

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
                  Confiança IA: {confidence}%
                </Badge>
              )}
              {hasDecisionMismatch && (
                <Badge className="bg-amber-500/30 text-amber-200 border-amber-400/30 border text-[10px] animate-pulse">
                  ⚠️ Reprocessamento recomendado
                </Badge>
              )}
            </div>
            <p className="text-sm text-white/70 leading-relaxed">{config.sublabel}</p>

            {/* Quick score context */}
            {v4Score != null && (
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge className="bg-white/10 text-white/70 border-white/15 border text-[10px]">
                  Score V4: {v4Score}/849
                </Badge>
                <Badge className="bg-white/10 text-white/70 border-white/15 border text-[10px]">
                  Subfaixa: {v4Subfaixa} — {SUBFAIXA_NAMES[v4Subfaixa]?.split(' — ')[0] || 'N/D'}
                </Badge>
                {bloqueios.length > 0 && (
                  <Badge className="bg-red-500/30 text-red-200 border-red-400/30 border text-[10px]">
                    {bloqueios.length} bloqueio(s) ativo(s)
                  </Badge>
                )}
              </div>
            )}

            {/* Detailed explanation */}
            <DecisionExplanation
              decision={decision}
              v4Decision={v4Decision}
              v4Score={v4Score}
              subfaixa={v4Subfaixa}
              hasV4Block={hasV4Block}
              hasCafFraud={hasCafFraud}
              wasEscalated={wasEscalated}
              sentinelRecommendation={sentinelRecommendation}
              bloqueios={bloqueios}
            />

            {/* Technical reason for escalation (new v8 — prevents analyst guesswork) */}
            <EscalationReasonBanner onboardingCase={onboardingCase} />

            {/* Numbered list of escalation points — extracted from red_flags/pontos_atencao */}
            <EscalationPointsList
              complianceScore={complianceScore}
              onboardingCase={onboardingCase}
            />
          </div>
        </div>
      </div>

      {/* Executive summary with lead-style first sentence */}
      {complianceScore?.sumario_executivo && (
        <div className="px-6 pb-5 border-t border-white/10 pt-4">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Resumo Executivo SENTINEL</p>
          <ExecutiveSummary text={complianceScore.sumario_executivo} />
        </div>
      )}

      {/* Action buttons */}
      <BannerActionButtons onboardingCase={onboardingCase} />
    </div>
  );
}

function ExecutiveSummary({ text }) {
  const match = String(text).match(/^([^.!?]{15,}[.!?])\s+(.*)/s);
  if (match && match[2].length > 10) {
    return (
      <p className="text-sm text-white/70 leading-relaxed">
        <strong className="text-white font-bold">{match[1]}</strong>{' '}
        <span className="text-white/60">{match[2]}</span>
      </p>
    );
  }
  return <p className="text-sm text-white/60 leading-relaxed">{text}</p>;
}

function BannerActionButtons({ onboardingCase }) {
  const [generating, setGenerating] = useState(false);

  const handleScrollToAnalysis = () => {
    const el = document.querySelector('[data-sentinel-full-analysis]');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      toast.info('Análise completa está mais abaixo nesta página.');
    }
  };

  const handleGeneratePdf = async () => {
    if (!onboardingCase?.id) return;
    setGenerating(true);
    try {
      const res = await base44.functions.invoke('generateCompliancePdf', { onboardingCaseId: onboardingCase.id });
      const url = res?.data?.url || res?.data?.pdfUrl;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
        toast.success('PDF do parecer gerado.');
      } else {
        toast.error('PDF gerado mas URL não retornada. Veja o console.');
      }
    } catch (err) {
      toast.error('Falha ao gerar PDF: ' + (err?.message || 'erro desconhecido'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="px-6 pb-5 pt-3 border-t border-white/10 flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="ghost"
        onClick={handleScrollToAnalysis}
        className="bg-white/10 hover:bg-white/20 text-white border-white/10 border h-8 text-xs"
      >
        <Eye className="w-3.5 h-3.5 mr-1.5" />
        Ver análise completa
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleGeneratePdf}
        disabled={generating}
        className="bg-white/10 hover:bg-white/20 text-white border-white/10 border h-8 text-xs"
      >
        {generating ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 mr-1.5" />}
        {generating ? 'Gerando PDF…' : 'Gerar parecer PDF'}
      </Button>
    </div>
  );
}