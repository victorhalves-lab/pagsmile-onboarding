import React from 'react';

const FAIXAS = [
  { max: 100, label: '1A', nome: 'VERDE EXPRESS', color: '#16a34a', bg: 'bg-green-50' },
  { max: 200, label: '1B', nome: 'VERDE', color: '#22c55e', bg: 'bg-green-50' },
  { max: 300, label: '2A', nome: 'AZUL', color: '#3b82f6', bg: 'bg-blue-50' },
  { max: 400, label: '2B', nome: 'AZUL CLARO', color: '#60a5fa', bg: 'bg-blue-50' },
  { max: 500, label: '3A', nome: 'AMARELO', color: '#eab308', bg: 'bg-amber-50' },
  { max: 600, label: '3B', nome: 'LARANJA', color: '#f97316', bg: 'bg-orange-50' },
  { max: 849, label: '4', nome: 'VERMELHO', color: '#ef4444', bg: 'bg-red-50' },
  { max: 1000, label: '5', nome: 'BLOQUEIO', color: '#7f1d1d', bg: 'bg-red-100' },
];

export default function ScoreGauge({ score, subfaixa, subfaixaNome }) {
  if (score == null) return null;
  const clamped = Math.max(0, Math.min(score, 1000));
  const pct = (clamped / 1000) * 100;
  const faixa = FAIXAS.find(f => clamped <= f.max) || FAIXAS[FAIXAS.length - 1];

  return (
    <div className="p-5 bg-white rounded-xl border border-[var(--pagsmile-blue)]/8">
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-[10px] font-bold text-[var(--pagsmile-blue)]/40 uppercase tracking-wider">Score Final V4</p>
          <p className="text-4xl font-black" style={{ color: faixa.color }}>{score}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold" style={{ color: faixa.color }}>{subfaixa || faixa.label}</p>
          <p className="text-xs text-[var(--pagsmile-blue)]/50">{subfaixaNome || faixa.nome}</p>
        </div>
      </div>

      {/* Gauge bar */}
      <div className="relative h-4 rounded-full overflow-hidden bg-gray-100 mb-2">
        {FAIXAS.map((f, i) => {
          const prev = i === 0 ? 0 : FAIXAS[i - 1].max;
          const w = ((f.max - prev) / 1000) * 100;
          const left = (prev / 1000) * 100;
          return (
            <div key={i} className="absolute top-0 h-full" style={{ left: `${left}%`, width: `${w}%`, backgroundColor: f.color, opacity: 0.25 }} />
          );
        })}
        <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: faixa.color }} />
        <div className="absolute top-0 h-full w-0.5 bg-white/80 transition-all duration-700" style={{ left: `${pct}%` }} />
      </div>

      {/* Scale labels */}
      <div className="flex justify-between text-[8px] text-[var(--pagsmile-blue)]/30 font-bold">
        <span>0</span>
        <span>200</span>
        <span>400</span>
        <span>600</span>
        <span>849</span>
        <span>1000</span>
      </div>

      {/* Faixa explanation */}
      <div className="mt-3 p-3 rounded-lg border" style={{ backgroundColor: `${faixa.color}10`, borderColor: `${faixa.color}30` }}>
        <p className="text-[11px] leading-relaxed" style={{ color: faixa.color }}>
          {clamped <= 100 && 'Risco mínimo — aprovação express automática, sem condições adicionais.'}
          {clamped > 100 && clamped <= 200 && 'Risco muito baixo — aprovação automática com monitoramento padrão.'}
          {clamped > 200 && clamped <= 300 && 'Risco baixo — aprovação com condições leves (monitoramento reforçado).'}
          {clamped > 300 && clamped <= 400 && 'Risco moderado — aprovação com condições e rolling reserve possível.'}
          {clamped > 400 && clamped <= 500 && 'Risco elevado — aprovação condicional com rolling reserve obrigatório.'}
          {clamped > 500 && clamped <= 600 && 'Risco alto — requer revisão manual e condições rigorosas.'}
          {clamped > 600 && clamped <= 849 && 'Risco muito alto — revisão manual obrigatória, possível recusa.'}
          {clamped > 849 && 'Bloqueio total — ativado por bloqueios B01-B10, requer resolução.'}
        </p>
      </div>
    </div>
  );
}