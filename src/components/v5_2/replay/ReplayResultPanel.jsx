import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle2, AlertTriangle, Equal, TrendingUp, TrendingDown } from 'lucide-react';

const CATEGORIA_META = {
  cat_1_auto_approve:   { label: 'Auto-aprovar',           color: '#10b981' },
  cat_2_conditional:    { label: 'Aprovado c/ condições',  color: '#3b82f6' },
  cat_3_manual_review:  { label: 'Revisão Manual',         color: '#f59e0b' },
  cat_4_block:          { label: 'Bloqueado',              color: '#ef4444' },
  cat_5_intensive_monitoring: { label: 'Monit. Intensivo', color: '#8b5cf6' },
};

const TIER_LABEL = {
  tier_1: 'Tier 1',
  tier_2: 'Tier 2',
  tier_3: 'Tier 3',
  subseller_pj: 'Sub-PJ',
  subseller_pf: 'Sub-PF',
};

/**
 * [V5.2 Fase 6.5.7] Painel side-by-side: Original vs Replay com regras atuais.
 *
 * Props:
 *   - result: payload retornado pelo backend replaySnapshotV5_2
 */
export default function ReplayResultPanel({ result }) {
  if (!result) return null;
  const { original, replay, diff, snapshot, replay_metadata } = result;

  const hasMudanca = diff?.tem_mudanca;

  return (
    <div className="space-y-4">
      {/* Banner de resultado */}
      <Card className={hasMudanca ? 'border-amber-300 bg-amber-50/30' : 'border-emerald-300 bg-emerald-50/30'}>
        <CardContent className="p-4 flex items-start gap-3">
          {hasMudanca ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className={`text-sm font-bold ${hasMudanca ? 'text-amber-900' : 'text-emerald-900'}`}>
              {hasMudanca
                ? `Replay detectou ${diff.changed_fields.length} ${diff.changed_fields.length === 1 ? 'mudança' : 'mudanças'} com as regras atuais`
                : 'Replay convergente — decisão atual seria idêntica'}
            </p>
            {hasMudanca && (
              <ul className="mt-1 space-y-0.5">
                {diff.mudancas_humanas.map((m, i) => (
                  <li key={i} className="text-xs text-amber-800">• {m}</li>
                ))}
              </ul>
            )}
            <p className="text-[10px] text-[#002443]/55 mt-2 font-mono">
              Executado em {new Date(replay_metadata.executed_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} · por {replay_metadata.executed_by}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Comparação lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ResultColumn
          title="Decisão Original"
          subtitle={`Snapshot ${snapshot.id.substring(0, 8)}… · ${new Date(snapshot.created_date).toLocaleDateString('pt-BR')}`}
          data={original}
          color="#64748b"
          headerBadge={<Badge variant="outline" className="text-[10px]">{snapshot.framework_version}</Badge>}
        />
        <ResultColumn
          title="Replay com regras atuais"
          subtitle={replay_metadata.rules_version}
          data={replay}
          color="#2bc196"
          changedFields={diff.changed_fields}
          compareWith={original}
          headerBadge={
            <Badge className="bg-[#2bc196] text-white text-[10px]">
              {new Date(replay_metadata.executed_at).toLocaleDateString('pt-BR')}
            </Badge>
          }
        />
      </div>

      {/* Linha de evolução do score */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Evolução do score normalizado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 items-center">
            <ScoreCard
              label="Original"
              value={`${(original.score_pct * 100).toFixed(1)}%`}
              detail={`${original.score_final}/${original.score_max}`}
              color="#64748b"
            />
            <div className="flex items-center justify-center">
              <div className="flex flex-col items-center">
                {diff.delta_score_pct > 0 ? (
                  <TrendingUp className="w-6 h-6 text-emerald-500" />
                ) : diff.delta_score_pct < 0 ? (
                  <TrendingDown className="w-6 h-6 text-red-500" />
                ) : (
                  <Equal className="w-6 h-6 text-slate-400" />
                )}
                <span className={`text-xs font-bold font-mono mt-1 ${
                  diff.delta_score_pct > 0 ? 'text-emerald-700'
                    : diff.delta_score_pct < 0 ? 'text-red-700'
                    : 'text-slate-500'
                }`}>
                  {diff.delta_score_pct > 0 ? '+' : ''}{diff.delta_score_pct}pp
                </span>
              </div>
            </div>
            <ScoreCard
              label="Replay (hoje)"
              value={`${(replay.score_pct * 100).toFixed(1)}%`}
              detail={`${replay.score_final}/${replay.score_max}`}
              color="#2bc196"
            />
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
        <p className="font-semibold mb-1">ℹ️ Sobre o Replay</p>
        <p className="opacity-80">
          Este replay é <strong>read-only</strong> — nenhuma persistência foi realizada. Os inputs originais
          (snapshot imutável) são reavaliados com as regras V5.2 vigentes hoje. Use esta ferramenta para
          validar impacto de mudanças regulatórias antes de promover novas regras para produção.
        </p>
      </div>
    </div>
  );
}

function ResultColumn({ title, subtitle, data, color, changedFields = [], compareWith, headerBadge }) {
  const isChanged = (field) => changedFields.includes(field);
  const catMeta = CATEGORIA_META[data.categoria_decisao] || { label: data.categoria_decisao || '—', color: '#64748b' };

  return (
    <Card style={{ borderColor: color }} className="border-2">
      <CardHeader className="pb-3" style={{ backgroundColor: `${color}08` }}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm" style={{ color }}>{title}</CardTitle>
            <p className="text-[10px] text-[#002443]/55 mt-0.5 font-mono">{subtitle}</p>
          </div>
          {headerBadge}
        </div>
      </CardHeader>
      <CardContent className="pt-3 space-y-2">
        <Row label="Tier" value={TIER_LABEL[data.tier] || data.tier} highlight={isChanged('tier')} />
        <Row label="Segmento" value={data.segmento} />
        <Row label="Morfologia" value={data.morfologia} />
        <Row
          label="Categoria de decisão"
          value={
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
              style={{ backgroundColor: `${catMeta.color}20`, color: catMeta.color }}
            >
              {catMeta.label}
            </span>
          }
          highlight={isChanged('categoria_decisao')}
        />
        <Row label="Subfaixa" value={data.subfaixa} />
        <Row label="Score final" value={`${data.score_final} / ${data.score_max}`} highlight={isChanged('score_max')} />
        <Row label="Score %" value={`${(data.score_pct * 100).toFixed(1)}%`} highlight={isChanged('score_pct')} />
        <Row label="Bloqueios" value={data.bloqueios?.length ? `${data.bloqueios.length} ativos` : 'Nenhum'} />
        <Row label="Patch Financeiro" value={data.patch_status || '—'} />
        <Row label="Capabilities" value={(data.capabilities || []).join(', ') || 'Nenhuma'} />
      </CardContent>
    </Card>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div className={`flex items-start justify-between gap-3 text-xs py-1 ${highlight ? 'bg-amber-50 -mx-2 px-2 rounded' : ''}`}>
      <span className="text-[#002443]/60 font-medium">{label}</span>
      <span className={`text-right font-mono ${highlight ? 'text-amber-900 font-bold' : 'text-[#002443]'}`}>
        {value ?? '—'}
      </span>
    </div>
  );
}

function ScoreCard({ label, value, detail, color }) {
  return (
    <div className="text-center">
      <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color }}>
        {label}
      </div>
      <div className="text-2xl font-bold font-mono" style={{ color }}>{value}</div>
      <div className="text-[10px] text-[#002443]/50 font-mono mt-0.5">{detail}</div>
    </div>
  );
}