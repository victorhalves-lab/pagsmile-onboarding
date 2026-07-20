import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, CheckCircle2, CircleDot, ArrowRight, Hash } from 'lucide-react';

export function Section({ id, title, icon: Icon, children, badge, expandedSections, toggleSection }) {
  const isOpen = expandedSections[id] ?? false;
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white mb-4 shadow-sm hover:shadow-md transition-shadow">
      <button onClick={() => toggleSection(id)} className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#1356E2]/10 rounded-xl"><Icon className="w-5 h-5 text-[#1356E2]" /></div>
          <h2 className="text-lg font-bold text-[#0A0A0A]">{title}</h2>
          {badge && <Badge variant="secondary" className="ml-2 text-xs">{badge}</Badge>}
        </div>
        {isOpen ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
      </button>
      {isOpen && <div className="px-5 pb-5 pt-0 border-t border-slate-100">{children}</div>}
    </div>
  );
}

export function FlowStep({ number, title, description, icon: Icon, details, color = "bg-[#1356E2]" }) {
  return (
    <div className="flex gap-4 items-start relative">
      <div className={`flex-shrink-0 w-10 h-10 ${color} text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md z-10`}>{number}</div>
      <div className="flex-1 pb-8 border-l-2 border-dashed border-slate-200 pl-6 -ml-5 last:border-0 last:pb-0">
        <div className="flex items-center gap-2 mb-1">
          {Icon && <Icon className="w-4 h-4 text-[#1356E2]" />}
          <h4 className="font-bold text-[#0A0A0A]">{title}</h4>
        </div>
        <p className="text-sm text-[#0A0A0A]/70 leading-relaxed">{description}</p>
        {details && (
          <div className="mt-2 pl-4 border-l-2 border-[#1356E2]/20 space-y-1">
            {details.map((d, i) => (
              <p key={i} className="text-xs text-[#0A0A0A]/60 flex items-start gap-1.5">
                <CircleDot className="w-3 h-3 text-[#1356E2] mt-0.5 shrink-0" />{d}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function FeatureCard({ title, description, icon: Icon, items, color = "bg-[#0A0A0A]/5" }) {
  return (
    <Card className="h-full border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${color} rounded-xl`}><Icon className="w-5 h-5 text-[#0A0A0A]" /></div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-3">{description}</CardDescription>
        {items && (
          <ul className="space-y-1.5">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#0A0A0A]/80">
                <CheckCircle2 className="w-4 h-4 text-[#1356E2] mt-0.5 flex-shrink-0" /><span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function PageDetail({ name, description, access, funcionalidades, subAbas }) {
  return (
    <div className="border border-slate-200 rounded-xl p-5 hover:border-[#1356E2]/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-[#0A0A0A] text-base">{name}</h4>
          <p className="text-sm text-[#0A0A0A]/60 mt-0.5">{description}</p>
        </div>
        <Badge className={access === 'Público' ? 'bg-blue-100 text-blue-700 border-0' : 'bg-[#0A0A0A] text-white border-0'}>{access}</Badge>
      </div>
      <div className="bg-slate-50 rounded-xl p-4 mb-3">
        <h5 className="text-xs font-bold text-[#0A0A0A]/50 uppercase tracking-wider mb-2.5">Funcionalidades</h5>
        <ul className="space-y-2">
          {funcionalidades.map((f, j) => (
            <li key={j} className="flex items-start gap-2 text-sm text-[#0A0A0A]/80">
              <ArrowRight className="w-3.5 h-3.5 text-[#1356E2] mt-0.5 flex-shrink-0" /><span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
      {subAbas && subAbas.length > 0 && (
        <div className="bg-[#0A0A0A]/5 rounded-xl p-4">
          <h5 className="text-xs font-bold text-[#0A0A0A]/50 uppercase tracking-wider mb-2.5">Sub-abas / Seções Internas</h5>
          <ul className="space-y-1.5">
            {subAbas.map((t, i) => (
              <li key={i} className="text-xs text-[#0A0A0A]/60 flex items-start gap-1.5">
                <Hash className="w-3 h-3 text-[#0A0A0A]/30 mt-0.5 shrink-0" />{t}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}