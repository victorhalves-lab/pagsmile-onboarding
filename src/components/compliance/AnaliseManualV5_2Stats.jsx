import React from 'react';
import { CheckCircle2, AlertTriangle, Eye, XCircle, ShieldAlert, ShieldCheck } from 'lucide-react';

/**
 * [V5.2 Fase 6.5.1] Stats clicáveis por categoria_decisao_v5_2 (cat 1-5).
 *
 * Aparece SOMENTE quando frameworkFilter === 'v5.2' na página AnaliseManual.
 * Cada chip filtra a fila pela categoria correspondente.
 *
 * - cat_1_auto_approve: na fila manual NÃO aparece (já foi auto-aprovado), mantemos só para auditoria.
 * - cat_2_conditional, cat_3_manual_review, cat_4_block, cat_5_intensive_monitoring: focos reais.
 */
const CAT_CONFIG = {
  cat_2_conditional:          { label: 'Com Condições',   Icon: AlertTriangle, color: 'bg-blue-100 text-blue-700' },
  cat_3_manual_review:        { label: 'Revisão Manual',   Icon: Eye,           color: 'bg-orange-100 text-orange-600' },
  cat_4_block:                { label: 'Recusa Sugerida',  Icon: XCircle,       color: 'bg-red-100 text-red-700' },
  cat_5_intensive_monitoring: { label: 'Monit. Intensivo', Icon: ShieldAlert,   color: 'bg-purple-100 text-purple-700' },
};

export default function AnaliseManualV5_2Stats({ cases, categoriaFilter, onCategoriaChange, bloqueiosFilter, onBloqueiosChange }) {
  const stats = React.useMemo(() => {
    const byCat = { cat_2_conditional: 0, cat_3_manual_review: 0, cat_4_block: 0, cat_5_intensive_monitoring: 0 };
    let comBloqueios = 0;
    let transicionais = 0;
    for (const c of cases) {
      const cat = c.categoria_decisao_v5_2;
      if (cat && byCat[cat] != null) byCat[cat]++;
      if (Array.isArray(c.bloqueiosAtivos) && c.bloqueiosAtivos.length > 0) comBloqueios++;
      if (c.is_transitional_case === true) transicionais++;
    }
    return { byCat, comBloqueios, transicionais };
  }, [cases]);

  const Chip = ({ Icon, label, value, color, active, onClick, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
        active
          ? 'bg-white border-[#2bc196] shadow-md ring-2 ring-[#2bc196]/20'
          : disabled
          ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed'
          : 'bg-white/80 border-[#002443]/10 hover:border-[#2bc196]/40'
      }`}
    >
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-left">
        <p className="text-[10px] font-semibold text-[#002443]/60 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-[#002443] leading-none mt-0.5">{value}</p>
      </div>
    </button>
  );

  return (
    <div className="rounded-xl border-2 border-dashed border-[#2bc196]/40 bg-[#2bc196]/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#2bc196]" />
        <p className="text-xs font-bold text-[#002443] uppercase tracking-wide">
          Filtros V5.2 — Categoria de Decisão & Bloqueios
        </p>
        {stats.transicionais > 0 && (
          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
            {stats.transicionais} caso(s) transicional(is)
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {Object.entries(CAT_CONFIG).map(([cat, cfg]) => (
          <Chip
            key={cat}
            Icon={cfg.Icon}
            label={cfg.label}
            value={stats.byCat[cat]}
            color={cfg.color}
            active={categoriaFilter === cat}
            disabled={stats.byCat[cat] === 0}
            onClick={() => onCategoriaChange(categoriaFilter === cat ? 'all' : cat)}
          />
        ))}
        <Chip
          Icon={AlertTriangle}
          label="Com Bloqueios Ativos"
          value={stats.comBloqueios}
          color="bg-red-100 text-red-700"
          active={bloqueiosFilter === true}
          disabled={stats.comBloqueios === 0}
          onClick={() => onBloqueiosChange(!bloqueiosFilter)}
        />
      </div>
    </div>
  );
}