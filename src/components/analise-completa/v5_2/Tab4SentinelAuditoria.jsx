import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, FileLock2, Hash, History as HistoryIcon, FileText } from 'lucide-react';
import AnaliseTimelineIntegracoes from '../AnaliseTimelineIntegracoes';
import FeedbackSentinelPanel from '@/components/v5_2/feedback/FeedbackSentinelPanel';
import Term from '@/components/v5_2/glossary/Term';

/**
 * [V5.2 Fase 6.4-B] Aba 4 — SENTINEL + Auditoria (DOC6 §2.6.6).
 *   • Esquerda: parecer SENTINEL completo (sumário + parecer + análise dimensional)
 *   • Direita (sticky): trilha imutável (framework_version, hash, fases, sentinel_version)
 *                       + timeline de integrações reaproveitada do V4
 */

function TrilhaCard({ label, value, mono = false, icon: Icon }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex items-start gap-2 text-xs">
      {Icon && <Icon className="w-3.5 h-3.5 text-[#002443]/40 flex-shrink-0 mt-0.5" />}
      <div className="flex-1 min-w-0">
        {/* label pode ser string ou ReactNode (com <Term>) */}
        <div className="text-[9px] uppercase font-bold text-[#002443]/40 tracking-wide">{label}</div>
        <p className={`text-xs text-[#002443]/85 ${mono ? 'font-mono break-all' : ''}`}>{String(value)}</p>
      </div>
    </div>
  );
}

function SentinelParecerCompleto({ latestScore }) {
  if (!latestScore) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-xs text-[#002443]/50 italic">SENTINEL ainda não emitiu parecer.</p>
        </CardContent>
      </Card>
    );
  }

  const sections = [
    { title: 'Sumário Executivo', text: latestScore.sumario_executivo, icon: FileText },
    { title: 'Parecer Final', text: latestScore.parecer_final, icon: Brain },
    { title: 'Análise Completa', text: latestScore.analise_completa_ia, icon: FileText },
    { title: 'Recomendações para Revisão Manual', text: latestScore.recomendacoes_revisao_manual, icon: FileText },
  ].filter((s) => s.text);

  if (!sections.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-xs text-[#002443]/50 italic">SENTINEL ainda não emitiu parecer textual.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Brain className="w-4 h-4 text-[#2bc196]" />
            Parecer <Term code="sentinel" inline>SENTINEL</Term> Completo
          </CardTitle>
          {latestScore.sentinel_recommendation && (
            <Badge variant="outline" className="text-[10px]">
              Recomendação: {latestScore.sentinel_recommendation}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {sections.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx}>
              <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[#002443]/8">
                <Icon className="w-3.5 h-3.5 text-[#002443]/50" />
                <h4 className="text-xs font-bold uppercase tracking-wide text-[#002443]">
                  {s.title}
                </h4>
              </div>
              <p className="text-sm text-[#002443]/85 leading-relaxed whitespace-pre-wrap">
                {s.text}
              </p>
            </div>
          );
        })}

        {/* Confiança */}
        {latestScore.nivel_confianca_ia != null && (
          <div className="pt-3 border-t border-[#002443]/8 flex items-center justify-between">
            <span className="text-xs text-[#002443]/60">Nível de confiança da IA</span>
            <Badge className="bg-[#2bc196]/15 text-[#2bc196] border border-[#2bc196]/30 text-xs font-mono">
              {(latestScore.nivel_confianca_ia * 100).toFixed(0)}%
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TrilhaAuditoriaSidebar({ latestCase, latestScore }) {
  return (
    <Card className="lg:sticky lg:top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <FileLock2 className="w-4 h-4 text-[#002443]" />
          Trilha de Auditoria
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TrilhaCard
          label={<Term code="framework_version" inline>Framework Version</Term>}
          value={latestCase?.framework_version || latestScore?.framework_version}
          icon={HistoryIcon}
        />
        <TrilhaCard
          label={latestCase?.tier ? <Term code={latestCase.tier} inline>Tier</Term> : 'Tier'}
          value={latestCase?.tier}
          mono
        />
        <TrilhaCard
          label="Segmento V5.1/V5.2"
          value={latestCase?.segmento_v5_1}
        />
        <TrilhaCard
          label={latestCase?.morfologia ? <Term code={`morfologia_${String(latestCase.morfologia).toLowerCase()}`} inline>Morfologia</Term> : 'Morfologia'}
          value={latestCase?.morfologia}
          mono
        />
        <TrilhaCard
          label={<Term code="capabilities_ativas" inline>Capabilities Ativas</Term>}
          value={Array.isArray(latestCase?.capabilities_ativas) ? latestCase.capabilities_ativas.join(', ') : null}
        />
        <TrilhaCard
          label={<Term code="snapshot" inline>Snapshot Hash</Term>}
          value={latestScore?.snapshot_id || '—'}
          mono
          icon={Hash}
        />
        <TrilhaCard
          label="Score V5.2 Final"
          value={latestScore?.score_v5_1_final}
          mono
        />
        <TrilhaCard
          label={(() => {
            const cat = latestCase?.categoria_decisao_v5_2 || latestScore?.categoria_decisao_v5_1;
            return cat ? <Term code={cat} inline>Categoria Decisão</Term> : 'Categoria Decisão';
          })()}
          value={latestCase?.categoria_decisao_v5_2 || latestScore?.categoria_decisao_v5_1}
        />
        <TrilhaCard
          label={<Term code="sentinel" inline>SENTINEL Version</Term>}
          value={latestScore?.versao_agente}
          mono
        />
        <TrilhaCard
          label="Data Análise"
          value={latestScore?.created_date ? new Date(latestScore.created_date).toLocaleString('pt-BR') : null}
        />
      </CardContent>
    </Card>
  );
}

export default function Tab4SentinelAuditoria({ latestCase, latestScore, integrationLogs, validations }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <SentinelParecerCompleto latestScore={latestScore} />
        <TrilhaAuditoriaSidebar latestCase={latestCase} latestScore={latestScore} />
      </div>

      {/* [V5.2 Fase 6.5.6] Feedback estruturado do analista sobre o SENTINEL */}
      <FeedbackSentinelPanel latestCase={latestCase} latestScore={latestScore} />

      {/* Timeline reaproveitada do V4 */}
      <AnaliseTimelineIntegracoes
        integrationLogs={integrationLogs}
        validations={validations}
      />
    </div>
  );
}