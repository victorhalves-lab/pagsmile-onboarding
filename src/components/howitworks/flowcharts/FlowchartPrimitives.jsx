import React from 'react';
import { Badge } from '@/components/ui/badge';

// ── Formas do Flowchart ──

/** Início / Fim (oval) */
export function TerminalNode({ label, type = 'start', className = '' }) {
  const bg = type === 'start' ? 'bg-[#2bc196] text-white' : 'bg-[#002443] text-white';
  return (
    <div className={`flex justify-center ${className}`}>
      <div className={`${bg} rounded-full px-6 py-2 text-xs font-bold shadow-md text-center min-w-[140px]`}>
        {label}
      </div>
    </div>
  );
}

/** Processo (retângulo) */
export function ProcessNode({ label, sublabel, actor, highlight, className = '' }) {
  const border = highlight ? 'border-[#2bc196] bg-[#2bc196]/5' : 'border-slate-300 bg-white';
  return (
    <div className={`flex justify-center ${className}`}>
      <div className={`border-2 ${border} rounded-lg px-4 py-2.5 text-center shadow-sm min-w-[180px] max-w-[280px]`}>
        <p className="text-[11px] font-bold text-[#002443] leading-snug">{label}</p>
        {sublabel && <p className="text-[9px] text-[#002443]/50 mt-0.5 leading-tight">{sublabel}</p>}
        {actor && <Badge className="mt-1.5 text-[8px] bg-slate-100 text-slate-600 border-0 font-medium">{actor}</Badge>}
      </div>
    </div>
  );
}

/** Decisão (losango via CSS) */
export function DecisionNode({ label, className = '' }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <div className="relative">
        <div className="w-[160px] h-[80px] bg-amber-50 border-2 border-amber-400 shadow-sm flex items-center justify-center"
          style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}>
        </div>
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <p className="text-[9px] font-bold text-amber-800 text-center leading-tight">{label}</p>
        </div>
      </div>
    </div>
  );
}

/** Documento / Dado externo (retângulo com onda) */
export function DataNode({ label, sublabel, className = '' }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <div className="border-2 border-blue-300 bg-blue-50 rounded-lg px-4 py-2 text-center shadow-sm min-w-[160px] max-w-[240px] border-b-4">
        <p className="text-[10px] font-bold text-blue-800 leading-snug">{label}</p>
        {sublabel && <p className="text-[8px] text-blue-600/60 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}

/** Sub-processo (retângulo com bordas duplas) */
export function SubProcessNode({ label, sublabel, className = '' }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <div className="border-2 border-purple-300 bg-purple-50 rounded-lg px-4 py-2 text-center shadow-sm min-w-[160px] max-w-[240px] ring-2 ring-purple-200 ring-offset-1">
        <p className="text-[10px] font-bold text-purple-800 leading-snug">{label}</p>
        {sublabel && <p className="text-[8px] text-purple-600/60 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}

/** Seta vertical */
export function ArrowDown({ label, className = '' }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="w-0.5 h-5 bg-slate-400" />
      {label && <span className="text-[8px] text-slate-500 font-medium my-0.5">{label}</span>}
      <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-slate-400" />
    </div>
  );
}

/** Bifurcação (seta para dois caminhos) */
export function BranchSplit({ leftLabel, rightLabel }) {
  return (
    <div className="flex items-start justify-center gap-0 relative my-1">
      <div className="flex flex-col items-center flex-1">
        <div className="h-4 w-0.5 bg-slate-400" />
        <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-slate-400" />
        {leftLabel && <span className="text-[8px] text-green-600 font-bold mt-0.5">{leftLabel}</span>}
      </div>
      <div className="flex flex-col items-center flex-1">
        <div className="h-4 w-0.5 bg-slate-400" />
        <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-slate-400" />
        {rightLabel && <span className="text-[8px] text-red-600 font-bold mt-0.5">{rightLabel}</span>}
      </div>
      {/* Horizontal connector */}
      <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-slate-400" />
    </div>
  );
}

/** Container de swimlane (faixa de responsável) */
export function SwimLane({ actor, color = 'bg-slate-50', borderColor = 'border-slate-200', children }) {
  return (
    <div className={`${color} border ${borderColor} rounded-xl p-4 space-y-1`}>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-dashed border-slate-300">
        <div className={`w-2 h-2 rounded-full ${borderColor.replace('border-', 'bg-')}`} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{actor}</span>
      </div>
      {children}
    </div>
  );
}

/** Container de fluxo completo */
export function FlowchartContainer({ title, description, actor, icon: Icon, color = 'border-slate-200', children }) {
  return (
    <div className={`border-2 ${color} rounded-2xl overflow-hidden bg-white shadow-sm`}>
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          {Icon && <div className="p-2 bg-[#002443]/5 rounded-lg"><Icon className="w-5 h-5 text-[#002443]" /></div>}
          <div className="flex-1">
            <h4 className="font-bold text-[#002443] text-sm">{title}</h4>
            {description && <p className="text-[10px] text-[#002443]/50 mt-0.5">{description}</p>}
          </div>
          {actor && <Badge className="bg-[#002443] text-white border-0 text-[9px]">{actor}</Badge>}
        </div>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

/** Micro-etapa inline (para detalhes dentro de um processo) */
export function MicroStep({ steps }) {
  return (
    <div className="flex flex-wrap items-center gap-1 justify-center mt-1.5">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <span className="text-[8px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{s}</span>
          {i < steps.length - 1 && <span className="text-[8px] text-slate-400">→</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

/** Grupo paralelo */
export function ParallelGroup({ children }) {
  return (
    <div className="flex gap-3 justify-center flex-wrap">
      {children}
    </div>
  );
}