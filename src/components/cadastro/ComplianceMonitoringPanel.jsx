import React from 'react';
import { Eye, Calendar, Gauge, ArrowUpRight, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const MONITORING_LEVELS = {
  'PADRAO': { color: 'bg-green-100 text-green-700', label: 'Padrão', desc: 'Monitoramento rotineiro. Alertas por desvio de padrão.' },
  'REFORÇADO_LEVE': { color: 'bg-blue-100 text-blue-700', label: 'Reforçado Leve', desc: 'Revisão trimestral. Alertas para cb e variações médias.' },
  'REFORÇADO': { color: 'bg-indigo-100 text-indigo-700', label: 'Reforçado', desc: 'Revisão bimestral. Alertas para chargebacks e variações.' },
  'INTENSO': { color: 'bg-amber-100 text-amber-700', label: 'Intenso', desc: 'Revisão mensal. Alertas agressivos. Limites restritivos.' },
  'INTENSO_PLUS': { color: 'bg-orange-100 text-orange-700', label: 'Intenso+', desc: 'Revisão quinzenal. Alertas máximos. Rolling Reserve ativo.' },
  'MAXIMO': { color: 'bg-red-100 text-red-700', label: 'Máximo', desc: 'Revisão semanal. Todas as flags ativas. Bloqueio parcial possível.' },
};

export default function ComplianceMonitoringPanel({ score }) {
  const hasData = score.rolling_reserve_percent > 0 || score.monitoramento_nivel || score.monitoramento_detalhes || score.promocao_proxima_data;
  if (!hasData) return null;

  const monConfig = MONITORING_LEVELS[score.monitoramento_nivel] || { color: 'bg-gray-100 text-gray-600', label: score.monitoramento_nivel || '—', desc: '' };
  const details = score.monitoramento_detalhes || {};

  return (
    <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-5">
      <h3 className="text-sm font-semibold text-[var(--pagsmile-blue)] mb-4 flex items-center gap-2">
        <Gauge className="w-4 h-4 text-[var(--pagsmile-green)]" />
        Monitoramento & Reservas
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Monitoring Level */}
        <div className={`p-4 rounded-lg ${monConfig.color}`}>
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4" />
            <p className="text-xs font-bold">Nível: {monConfig.label}</p>
          </div>
          <p className="text-[11px] opacity-80">{monConfig.desc}</p>
        </div>

        {/* Rolling Reserve */}
        {score.rolling_reserve_percent > 0 && (
          <div className="p-4 rounded-lg bg-orange-50">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-orange-600" />
              <p className="text-xs font-bold text-orange-700">Rolling Reserve: {score.rolling_reserve_percent}%</p>
            </div>
            <p className="text-[11px] text-orange-600/80">Percentual retido sobre cada transação como garantia contra fraude/chargeback.</p>
          </div>
        )}
      </div>

      {/* Monitoring Details */}
      {Object.keys(details).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {details.frequencia_revisao && (
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <Calendar className="w-4 h-4 mx-auto text-[var(--pagsmile-blue)]/40 mb-1" />
              <p className="text-xs font-bold text-[var(--pagsmile-blue)]">{details.frequencia_revisao}</p>
              <p className="text-[10px] text-[var(--pagsmile-blue)]/50">Frequência Revisão</p>
            </div>
          )}
          {details.alertas_cb != null && (
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs font-bold text-[var(--pagsmile-blue)]">{details.alertas_cb}</p>
              <p className="text-[10px] text-[var(--pagsmile-blue)]/50">Alertas CB</p>
            </div>
          )}
          {details.alertas_med != null && (
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs font-bold text-[var(--pagsmile-blue)]">{details.alertas_med}</p>
              <p className="text-[10px] text-[var(--pagsmile-blue)]/50">Alertas Médios</p>
            </div>
          )}
          {details.alertas_pico != null && (
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs font-bold text-[var(--pagsmile-blue)]">{details.alertas_pico}</p>
              <p className="text-[10px] text-[var(--pagsmile-blue)]/50">Alertas Pico</p>
            </div>
          )}
          {details.revisao_periodica && (
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs font-bold text-[var(--pagsmile-blue)]">{details.revisao_periodica}</p>
              <p className="text-[10px] text-[var(--pagsmile-blue)]/50">Revisão Periódica</p>
            </div>
          )}
        </div>
      )}

      {/* Promotion Path */}
      {(score.promocao_proxima_data || score.promocao_destino) && (
        <div className="p-3 bg-green-50 rounded-lg flex items-center gap-3">
          <ArrowUpRight className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-xs font-semibold text-green-700">Promoção de Subfaixa</p>
            <p className="text-[11px] text-green-600/80">
              {score.promocao_proxima_data && `Próxima promoção: ${new Date(score.promocao_proxima_data).toLocaleDateString('pt-BR')}`}
              {score.promocao_proxima_data && score.promocao_destino && ' — '}
              {score.promocao_destino && `Destino: ${score.promocao_destino}`}
            </p>
            <p className="text-[10px] text-green-600/60 mt-0.5">Promoção condicionada à ausência de incidentes no período.</p>
          </div>
        </div>
      )}
    </div>
  );
}