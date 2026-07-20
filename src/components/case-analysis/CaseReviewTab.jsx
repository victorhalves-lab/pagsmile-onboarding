import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, Zap, Shield, Target, Eye, ArrowUp } from 'lucide-react';

export default function CaseReviewTab({
  onboardingCase, complianceScore, reviewComments, setReviewComments,
  onShowApprove, onShowReject, onShowRequestInfo,
}) {
  const subfaixa = onboardingCase.subfaixa;
  const subfaixaNome = onboardingCase.subfaixaNome;
  const isAutoDecision = complianceScore?.decisao_automatica || false;
  const escalatedBySentinel = complianceScore?.decisao_escalada_sentinel || false;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
      <h3 className="text-lg font-bold text-[var(--pinbank-blue)]">Revisão Manual</h3>

      {/* Auto-Decision Context */}
      {subfaixa && (
        <div className={`p-4 rounded-lg border ${
          ['1A','1B'].includes(subfaixa) ? 'bg-green-50 border-green-200' :
          ['2A','2B'].includes(subfaixa) ? 'bg-blue-50 border-blue-200' :
          ['3A','3B'].includes(subfaixa) ? 'bg-amber-50 border-amber-200' :
          subfaixa === '4' ? 'bg-red-50 border-red-200' :
          'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-bold text-[var(--pinbank-blue)]">
              V4: Subfaixa {subfaixa} — {subfaixaNome}
            </span>
            {isAutoDecision && <Badge className="bg-blue-100 text-blue-700 text-[9px]">Decisão Automática</Badge>}
            {escalatedBySentinel && <Badge className="bg-orange-100 text-orange-700 text-[9px]"><ArrowUp className="w-2.5 h-2.5 mr-0.5" />Escalada pelo SENTINEL</Badge>}
          </div>
          {escalatedBySentinel && complianceScore?.escalation_justification && (
            <p className="text-[11px] text-orange-700/80 bg-orange-100/50 rounded px-2 py-1 mb-2">
              <strong>Motivo da escalação:</strong> {complianceScore.escalation_justification}
            </p>
          )}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[var(--pinbank-blue)]/50">Score V4</span>
              <p className="font-bold text-[var(--pinbank-blue)]">{onboardingCase.riskScoreV4 ?? 'N/D'}/849</p>
            </div>
            <div>
              <span className="text-[var(--pinbank-blue)]/50">Rolling Reserve</span>
              <p className="font-bold text-[var(--pinbank-blue)]">{onboardingCase.rollingReservePercent || 0}%</p>
            </div>
            <div>
              <span className="text-[var(--pinbank-blue)]/50">Monitoramento</span>
              <p className="font-bold text-[var(--pinbank-blue)]">{onboardingCase.monitoramentoNivel?.replace(/_/g, ' ') || 'Padrão'}</p>
            </div>
          </div>

          {onboardingCase.condicoesAutomaticas?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--pinbank-blue)]/10">
              <p className="text-[10px] font-semibold text-[var(--pinbank-blue)]/60 mb-1.5 flex items-center gap-1">
                <Target className="w-3 h-3" /> Condições Automáticas Aplicadas
              </p>
              <ul className="space-y-1">
                {onboardingCase.condicoesAutomaticas.map((c, i) => (
                  <li key={i} className="text-[11px] text-[var(--pinbank-blue)]/70 flex items-start gap-1.5">
                    <span className="text-[var(--pinbank-blue)]/30">•</span> {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Red Flags Summary — grouped by origin */}
      {onboardingCase.redFlags?.length > 0 && (() => {
        const v4Flags = onboardingCase.redFlags.filter(f => f.startsWith('V4:'));
        const sentinelFlags = onboardingCase.redFlags.filter(f => f.startsWith('SENTINEL:'));
        const otherFlags = onboardingCase.redFlags.filter(f => !f.startsWith('V4:') && !f.startsWith('SENTINEL:'));
        return (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs font-semibold text-red-700 mb-1.5 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> {onboardingCase.redFlags.length} Red Flag(s)
            </p>
            {v4Flags.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-bold text-red-600/50 mb-1">Motor V4 (determinístico)</p>
                <ul className="space-y-0.5">
                  {v4Flags.slice(0, 3).map((f, i) => (
                    <li key={i} className="text-[11px] text-red-600/80 flex items-start gap-1.5">
                      <XCircle className="w-3 h-3 flex-shrink-0 mt-0.5" /> {f.replace('V4: ', '')}
                    </li>
                  ))}
                  {v4Flags.length > 3 && <li className="text-[10px] text-red-400 italic">+{v4Flags.length - 3} mais</li>}
                </ul>
              </div>
            )}
            {sentinelFlags.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-bold text-red-600/50 mb-1">SENTINEL (qualitativo)</p>
                <ul className="space-y-0.5">
                  {sentinelFlags.slice(0, 3).map((f, i) => (
                    <li key={i} className="text-[11px] text-red-600/80 flex items-start gap-1.5">
                      <XCircle className="w-3 h-3 flex-shrink-0 mt-0.5" /> {f.replace('SENTINEL: ', '')}
                    </li>
                  ))}
                  {sentinelFlags.length > 3 && <li className="text-[10px] text-red-400 italic">+{sentinelFlags.length - 3} mais</li>}
                </ul>
              </div>
            )}
            {otherFlags.length > 0 && (
              <ul className="space-y-0.5">
                {otherFlags.slice(0, 3).map((f, i) => (
                  <li key={i} className="text-[11px] text-red-600/80 flex items-start gap-1.5">
                    <XCircle className="w-3 h-3 flex-shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })()}

      {/* IA Explanation inline */}
      {onboardingCase.iaExplanation && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> Parecer SENTINEL
          </p>
          <p className="text-xs text-blue-700/80 leading-relaxed whitespace-pre-wrap">{onboardingCase.iaExplanation}</p>
        </div>
      )}
      
      {onboardingCase.manualReviewComments && (
        <Alert className="bg-slate-50 border-slate-200">
          <AlertDescription>
            <p className="font-semibold text-[var(--pinbank-blue)] mb-1">Comentário anterior:</p>
            <p className="text-[var(--pinbank-blue)]/80 font-medium">{onboardingCase.manualReviewComments}</p>
            {onboardingCase.manualReviewerId && (
              <p className="text-xs text-[var(--pinbank-blue)]/60 font-medium mt-2">
                Por {onboardingCase.manualReviewerId} em {onboardingCase.manualReviewDate ? 
                  new Date(onboardingCase.manualReviewDate).toLocaleDateString('pt-BR') : '-'}
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {onboardingCase.status !== 'Aprovado' && onboardingCase.status !== 'Recusado' && (
        <>
          <div className="space-y-2">
            <Label>Comentários da Revisão</Label>
            <Textarea 
              placeholder="Adicione comentários sobre este caso..."
              rows={4}
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onShowApprove} className="flex-1 bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Aprovar
            </Button>
            <Button variant="outline" onClick={onShowRequestInfo} className="flex-1">
              <AlertTriangle className="w-4 h-4 mr-2" /> Solicitar Informações
            </Button>
            <Button variant="destructive" onClick={onShowReject} className="flex-1">
              <XCircle className="w-4 h-4 mr-2" /> Recusar
            </Button>
          </div>
        </>
      )}

      {(onboardingCase.status === 'Aprovado' || onboardingCase.status === 'Recusado') && (
        <Alert className={onboardingCase.status === 'Aprovado' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          {onboardingCase.status === 'Aprovado' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
          <AlertDescription className={onboardingCase.status === 'Aprovado' ? 'text-green-800' : 'text-red-800'}>
            Este caso foi {onboardingCase.status === 'Aprovado' ? 'aprovado' : 'recusado'} 
            {onboardingCase.finalDecisionDate ? ` em ${new Date(onboardingCase.finalDecisionDate).toLocaleDateString('pt-BR')}` : ''}.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}