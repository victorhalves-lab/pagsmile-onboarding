import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

/**
 * BDCRiskHeatmap — Visual radar chart showing risk across 6 dimensions.
 * Green = low risk, Yellow = medium, Red = high.
 */

const DIMENSION_LABELS = {
  identity: 'Identidade / Cadastro',
  owners: 'Sócios / QSA',
  digital: 'Presença Digital',
  compliance: 'Compliance / PLD',
  reputation: 'Reputação / Mídia',
  financial: 'Financeiro / Mercado',
};

function calculateDimensionRisk(section) {
  if (!section?.items || section.items.length === 0) return 0;
  let totalWeight = 0;
  let riskPoints = 0;
  for (const item of section.items) {
    const w = Math.abs(item.points || 0) + 1;
    totalWeight += w;
    if (item.risk === 'CRITICO') riskPoints += w * 100;
    else if (item.risk === 'ALTO') riskPoints += w * 75;
    else if (item.risk === 'MEDIO') riskPoints += w * 40;
    else if (item.risk === 'BAIXO') riskPoints += w * 15;
    else riskPoints += 0;
  }
  return totalWeight > 0 ? Math.min(100, Math.round(riskPoints / totalWeight)) : 0;
}

function getRiskColor(val) {
  if (val >= 70) return '#dc2626';
  if (val >= 40) return '#f59e0b';
  return '#22c55e';
}

function getRiskLabel(val) {
  if (val >= 70) return 'Alto';
  if (val >= 40) return 'Moderado';
  return 'Baixo';
}

export default function BDCRiskHeatmap({ analysis }) {
  if (!analysis?.sections) return null;

  const sections = analysis.sections;
  const dimensions = Object.entries(DIMENSION_LABELS).map(([key, label]) => {
    const risk = calculateDimensionRisk(sections[key]);
    return { dimension: label, risk, key, color: getRiskColor(risk), label: getRiskLabel(risk) };
  }).filter(d => sections[d.key]);

  if (dimensions.length < 3) return null;

  const radarData = dimensions.map(d => ({
    subject: d.dimension.split(' / ')[0],
    A: d.risk,
    fullMark: 100,
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h4 className="text-sm font-bold text-[#002443] mb-1">🗺️ Mapa de Calor de Risco</h4>
      <p className="text-[10px] text-[#002443]/40 mb-4">
        Visão geral do nível de risco em cada dimensão de análise (0 = sem risco, 100 = risco máximo)
      </p>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Radar */}
        <div className="flex-1" style={{ minHeight: 280 }}>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} outerRadius="75%">
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: '#002443', fontSize: 11, fontWeight: 600 }}
              />
              <PolarRadiusAxis 
                domain={[0, 100]} 
                tick={{ fill: '#002443', fontSize: 9 }}
                tickCount={5}
              />
              <Radar 
                name="Risco" 
                dataKey="A" 
                stroke="#dc2626" 
                fill="#dc2626" 
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="lg:w-[240px] space-y-2">
          {dimensions.map(d => (
            <div key={d.key} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50">
              <div 
                className="w-3 h-3 rounded-full shrink-0" 
                style={{ backgroundColor: d.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-[#002443] truncate">{d.dimension}</p>
                <p className="text-[10px] text-[#002443]/40">
                  Risco: <span className="font-bold" style={{ color: d.color }}>{d.risk}/100</span> — {d.label}
                </p>
              </div>
            </div>
          ))}
          {/* Color legend */}
          <div className="pt-2 mt-2 border-t border-slate-200">
            <div className="flex items-center gap-4 text-[10px] text-[#002443]/50">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> 0-39 Baixo</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> 40-69 Moderado</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> 70+ Alto</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}