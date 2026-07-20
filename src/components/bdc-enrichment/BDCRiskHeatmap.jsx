import React, { useState } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { MousePointerClick, Info } from 'lucide-react';
import HeatmapDrillDown from '../risk-analysis/HeatmapDrillDown';

/**
 * BDCRiskHeatmap v2 — radar chart + clickable dimensions.
 * Click any dimension (radar axis or legend row) → opens a HeatmapDrillDown panel
 * below with: what the dimension analyses, why the score is X, what high score
 * means and recommended action.
 */

const DIMENSION_LABELS = {
  identity: 'Identidade / Cadastro',
  owners: 'Sócios / QSA',
  digital: 'Presença Digital',
  compliance: 'Compliance / PLD',
  reputation: 'Reputação / Mídia',
  financial: 'Financeiro / Mercado',
  evolution: 'Evolução Histórica',
  esg: 'ESG / Lista Suja',
  contacts: 'Contatos',
  employeesKyc: 'KYC Funcionários',
  sectorial: 'Dados Setoriais',
  assets: 'Ativos Patrimoniais',
};

const DIMENSIONAL_LABELS = {
  identidade: 'Identidade / Cadastro',
  socios: 'Sócios / QSA',
  compliance: 'Compliance / PLD',
  digital: 'Presença Digital',
  reputacao: 'Reputação / Mídia',
  financeiro: 'Financeiro / Mercado',
  biometria: 'Biometria / Liveness',
};

const DIMENSIONAL_TO_BDC_KEY = {
  identidade: 'identity',
  socios: 'owners',
  compliance: 'compliance',
  digital: 'digital',
  reputacao: 'reputation',
  financeiro: 'financial',
  biometria: 'biometria',
};

const VEREDICTO_TO_RISK = {
  REPROVADO: 90, CRITICO: 90, ALTO: 75, ATENCAO: 50, MEDIO: 45,
  OK: 15, APROVADO: 10, BAIXO: 10, NAO_DISPONIVEL: 60,
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

function buildDimensionsFromDimensional(analiseDimensional) {
  return Object.entries(analiseDimensional)
    .filter(([, val]) => val && typeof val === 'object')
    .map(([key, val]) => {
      const risk = VEREDICTO_TO_RISK[val.veredicto] ?? 50;
      const label = DIMENSIONAL_LABELS[key] || key;
      const bdcKey = DIMENSIONAL_TO_BDC_KEY[key] || key;
      return { dimension: label, risk, key: bdcKey, color: getRiskColor(risk), label: getRiskLabel(risk) };
    });
}

export default function BDCRiskHeatmap({ analysis, analiseDimensional }) {
  const [selectedDim, setSelectedDim] = useState(null);

  let dimensions = [];

  if (analysis?.sections) {
    const sections = analysis.sections;
    dimensions = Object.entries(DIMENSION_LABELS).map(([key, label]) => {
      const risk = calculateDimensionRisk(sections[key]);
      return { dimension: label, risk, key, color: getRiskColor(risk), label: getRiskLabel(risk) };
    }).filter(d => sections[d.key]);
  }

  if (dimensions.length < 3 && analiseDimensional && typeof analiseDimensional === 'object') {
    dimensions = buildDimensionsFromDimensional(analiseDimensional);
  }

  if (dimensions.length < 3) return null;

  const radarData = dimensions.map(d => ({
    subject: d.dimension.split(' / ')[0],
    A: d.risk,
    fullMark: 100,
    key: d.key,
  }));

  const selectedDimData = selectedDim ? dimensions.find(d => d.key === selectedDim) : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl leading-none">🗺️</span>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-[#0A0A0A]">Mapa de Calor de Risco por Dimensão</h4>
          <p className="text-[11px] text-[#0A0A0A]/50 mt-0.5 leading-relaxed">
            Cada eixo do radar é uma dimensão de análise (Identidade, Sócios, Financeiro, etc.).
            <strong className="text-[#0A0A0A]/70"> Quanto mais afastado do centro, maior o risco.</strong>
          </p>
          <p className="text-[11px] text-[#1356E2] mt-1 flex items-center gap-1 font-semibold">
            <MousePointerClick className="w-3 h-3" />
            Clique em qualquer dimensão da legenda para ver o detalhamento completo.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Radar */}
        <div className="flex-1" style={{ minHeight: 280 }}>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} outerRadius="75%">
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: '#0A0A0A', fontSize: 11, fontWeight: 600 }}
              />
              <PolarRadiusAxis
                domain={[0, 100]}
                tick={{ fill: '#0A0A0A', fontSize: 9 }}
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

        {/* Clickable legend */}
        <div className="lg:w-[280px] space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#0A0A0A]/50 mb-1 flex items-center gap-1">
            <Info className="w-3 h-3" /> Dimensões — clique para abrir
          </p>
          {dimensions.map(d => {
            const isSelected = selectedDim === d.key;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setSelectedDim(isSelected ? null : d.key)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                  isSelected
                    ? 'bg-[#0A0A0A] text-white ring-2 ring-[#1356E2] shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100 border border-transparent hover:border-[#0A0A0A]/10'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white"
                  style={{ backgroundColor: d.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] font-semibold truncate ${isSelected ? 'text-white' : 'text-[#0A0A0A]'}`}>
                    {d.dimension}
                  </p>
                  <p className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-[#0A0A0A]/40'}`}>
                    Risco: <span className="font-bold" style={{ color: isSelected ? d.color : d.color }}>{d.risk}/100</span> — {d.label}
                  </p>
                </div>
                <MousePointerClick className={`w-3 h-3 shrink-0 ${isSelected ? 'text-[#1356E2]' : 'text-[#0A0A0A]/30'}`} />
              </button>
            );
          })}

          {/* Color legend */}
          <div className="pt-2 mt-2 border-t border-slate-200">
            <div className="flex items-center gap-3 text-[10px] text-[#0A0A0A]/50 flex-wrap">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> 0-39 Baixo</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> 40-69 Moderado</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> 70+ Alto</span>
            </div>
          </div>
        </div>
      </div>

      {/* Drill-down panel */}
      {selectedDimData && (
        <HeatmapDrillDown
          dimKey={selectedDimData.key}
          score={selectedDimData.risk}
          onClose={() => setSelectedDim(null)}
          analysis={analysis}
          analiseDimensional={analiseDimensional}
        />
      )}
    </div>
  );
}