import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitCompare, TrendingDown, TrendingUp, Shield, Banknote, Fingerprint, Check, X, AlertTriangle } from 'lucide-react';
import AnaliseCafCompleta from '../AnaliseCafCompleta';

/**
 * [V5.2 Fase 6.4-B] Aba 2 — Evidências & Cross-Validation (DOC6 §2.6.4).
 *   • Cross-Validation 16 campos V5.1
 *   • Patch Financeiro V5.1 (5 cross-checks)
 *   • Bloqueios Detalhados (fichas DOC5)
 *   • CAF — Biometria + Screening (reaproveita componente V4)
 */

const STATUS_STYLE = {
  match:       { Icon: Check, bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Match' },
  divergence:  { Icon: TrendingUp, bg: 'bg-amber-50', text: 'text-amber-700', label: 'Divergência' },
  mismatch:    { Icon: TrendingDown, bg: 'bg-red-50', text: 'text-red-700', label: 'Mismatch' },
  unknown:     { Icon: AlertTriangle, bg: 'bg-slate-50', text: 'text-slate-600', label: 'Sem dado' },
};

function CrossValTable16({ cvResults }) {
  const fields = Array.isArray(cvResults?.fields) ? cvResults.fields : [];
  if (!fields.length) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-blue-500" />
            Cross-Validation 16 campos V5.1
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-[#002443]/50 italic text-center py-6">
            Cross-validation ainda não calculada para este caso.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-blue-500" />
          Cross-Validation 16 campos V5.1 ({fields.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#002443]/10">
                <th className="text-left py-2 px-2 font-semibold text-[#002443]/60 text-[10px] uppercase">Campo</th>
                <th className="text-left py-2 px-2 font-semibold text-[#002443]/60 text-[10px] uppercase">Declarado</th>
                <th className="text-left py-2 px-2 font-semibold text-[#002443]/60 text-[10px] uppercase">BDC</th>
                <th className="text-center py-2 px-2 font-semibold text-[#002443]/60 text-[10px] uppercase">Status</th>
                <th className="text-right py-2 px-2 font-semibold text-[#002443]/60 text-[10px] uppercase">Peso</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f, idx) => {
                const sty = STATUS_STYLE[f.status] || STATUS_STYLE.unknown;
                const { Icon } = sty;
                return (
                  <tr key={f.field_id || idx} className="border-b border-[#002443]/5 hover:bg-slate-50/50">
                    <td className="py-2 px-2 font-medium text-[#002443]">{f.label || f.field_id}</td>
                    <td className="py-2 px-2 text-[#002443]/70 font-mono text-[11px]">
                      {f.declared_value != null ? String(f.declared_value) : '—'}
                    </td>
                    <td className="py-2 px-2 text-[#002443]/70 font-mono text-[11px]">
                      {f.bdc_value != null ? String(f.bdc_value) : '—'}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${sty.bg} ${sty.text} text-[10px] font-semibold`}>
                        <Icon className="w-2.5 h-2.5" />
                        {sty.label}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-[10px] text-[#002443]/50">
                      {f.peso_v5_1 ?? '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

const PATCH_DIM_LABELS = {
  tpv_declarado_vs_bdc:       'TPV declarado × BDC financial_market',
  faturamento_doc_vs_ecf:     'Faturamento documental × ECF Receita',
  crc_status:                 'CRC Contador (conselhos_profissionais)',
  fluxo_caixa_open_finance:   'Fluxo de caixa Open Finance',
  coerencia_setor:            'Coerência setorial (CNAE × volumetria)',
};

const PATCH_STATUS_STYLE = {
  verde:    { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'OK' },
  amarelo:  { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Atenção' },
  laranja:  { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Alerta' },
  vermelho: { bg: 'bg-red-50', text: 'text-red-700', label: 'Bloqueio' },
  nao_aplicavel: { bg: 'bg-slate-50', text: 'text-slate-500', label: 'N/A' },
};

function PatchFinanceiroPanel({ status, dimensoes }) {
  if (!dimensoes && !status) return null;
  const dims = dimensoes || {};
  const statusGeral = PATCH_STATUS_STYLE[status] || PATCH_STATUS_STYLE.nao_aplicavel;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Banknote className="w-4 h-4 text-blue-500" />
            Patch Financeiro V5.1 — 5 dimensões
          </CardTitle>
          <Badge className={`${statusGeral.bg} ${statusGeral.text} border-current/20 text-[10px]`}>
            {statusGeral.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {Object.entries(PATCH_DIM_LABELS).map(([key, label]) => {
          const dim = dims[key];
          if (!dim) {
            return (
              <div key={key} className="flex items-center justify-between p-2 rounded border border-slate-200 bg-slate-50/50">
                <span className="text-xs text-[#002443]/60">{label}</span>
                <Badge variant="outline" className="text-[10px]">Sem dados</Badge>
              </div>
            );
          }
          const blocked = !!dim.bloqueio_disparado;
          return (
            <div key={key} className={`flex items-center justify-between p-2 rounded border ${blocked ? 'border-red-200 bg-red-50/50' : 'border-emerald-200 bg-emerald-50/30'}`}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#002443]">{label}</p>
                {(dim.valor_declarado != null || dim.valor_observado != null) && (
                  <p className="text-[10px] text-[#002443]/55 font-mono mt-0.5">
                    decl: {dim.valor_declarado ?? '—'} • bdc: {dim.valor_observado ?? '—'}
                    {dim.divergencia_pct != null && ` • Δ ${(dim.divergencia_pct * 100).toFixed(1)}%`}
                  </p>
                )}
              </div>
              {blocked ? (
                <Badge className="bg-red-100 text-red-700 border border-red-200 text-[10px]">Bloqueio</Badge>
              ) : (
                <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px]">OK</Badge>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function BloqueiosDetalhados({ bloqueios }) {
  if (!bloqueios?.length) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-500" />
          Bloqueios Detalhados ({bloqueios.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5">
          {bloqueios.map((b) => (
            <Badge key={b} className="bg-red-100 text-red-700 border border-red-200 text-[10px] font-mono px-2 py-1">
              {b}
            </Badge>
          ))}
        </div>
        <p className="text-[10px] text-[#002443]/40 mt-3 italic">
          ↗ Fichas DOC5 (severidade, datasets, exceção) disponíveis na aba V5.2 do cadastro.
        </p>
      </CardContent>
    </Card>
  );
}

export default function Tab2Evidencias({ latestCase, latestScore, cafValidations, cafLogs, merchant }) {
  const cvResults = latestScore?.cross_validation_results;
  const patchStatus = latestScore?.patch_financeiro_status || latestCase?.patch_financeiro_status;
  const patchDims = latestScore?.patch_financeiro_dimensoes;
  const bloqueios = latestCase?.bloqueiosAtivos || latestScore?.bloqueios_v5_1_ativos || [];

  return (
    <div className="space-y-4">
      <CrossValTable16 cvResults={cvResults} />
      <PatchFinanceiroPanel status={patchStatus} dimensoes={patchDims} />
      <BloqueiosDetalhados bloqueios={bloqueios} />

      {/* CAF — Biometria + Screening (reaproveita componente V4) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-purple-500" />
            CAF — Biometria & Screening
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnaliseCafCompleta
            cafValidations={cafValidations}
            cafLogs={cafLogs}
            merchant={merchant}
            latestCase={latestCase}
          />
        </CardContent>
      </Card>
    </div>
  );
}