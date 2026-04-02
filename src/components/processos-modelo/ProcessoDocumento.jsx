import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function Section({ title, number, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-5 py-3.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
        {open ? <ChevronDown className="w-4 h-4 text-[#2bc196] shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
        <span className="text-sm font-bold text-[#002443]">{number}. {title}</span>
      </button>
      {open && <div className="px-5 py-4">{children}</div>}
    </div>
  );
}

function IdentTable({ rows }) {
  return (
    <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
      <thead><tr className="bg-[#f0fdf8]"><th className="text-left py-2 px-3 font-bold text-[#002443]/70 w-40 border-b border-slate-200">ID</th><th className="text-left py-2 px-3 font-bold text-[#002443]/70 border-b border-slate-200">Descrição</th></tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-slate-100 last:border-0"><td className="py-2 px-3 font-semibold text-[#002443]">{r.id}</td><td className="py-2 px-3 text-[#002443]/70">{r.desc}</td></tr>)}</tbody>
    </table>
  );
}

function StepTable({ steps }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px] border border-slate-200 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-[#f0fdf8]">
            <th className="py-2 px-2 font-bold text-[#002443]/70 text-left w-10 border-b border-slate-200">ID</th>
            <th className="py-2 px-2 font-bold text-[#002443]/70 text-left w-24 border-b border-slate-200">Responsável</th>
            <th className="py-2 px-2 font-bold text-[#002443]/70 text-left border-b border-slate-200">Atividade</th>
            <th className="py-2 px-2 font-bold text-[#002443]/70 text-left w-36 border-b border-slate-200">Decisão / Condição</th>
            <th className="py-2 px-2 font-bold text-[#002443]/70 text-center w-12 border-b border-slate-200">Gate</th>
            <th className="py-2 px-2 font-bold text-[#002443]/70 text-center w-14 border-b border-slate-200">SLA</th>
            <th className="py-2 px-2 font-bold text-[#002443]/70 text-left border-b border-slate-200">Saída / Registro (evidência)</th>
            <th className="py-2 px-2 font-bold text-[#002443]/70 text-center w-14 border-b border-slate-200">Próximo</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((s, i) => (
            <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-[#2bc196]/5">
              <td className="py-2 px-2 font-bold text-[#002443]">{s.id}</td>
              <td className="py-2 px-2"><Badge className="bg-[#002443]/10 text-[#002443] border-0 text-[9px] font-semibold">{s.resp}</Badge></td>
              <td className="py-2 px-2 text-[#002443]/80 font-medium">{s.atividade}</td>
              <td className="py-2 px-2 text-[#002443]/60 italic">{s.decisao || '—'}</td>
              <td className="py-2 px-2 text-center">{s.gate ? <Badge className="bg-amber-100 text-amber-700 border-0 text-[9px]">{s.gate}</Badge> : '—'}</td>
              <td className="py-2 px-2 text-center text-[#002443]/60 font-mono">{s.sla || '—'}</td>
              <td className="py-2 px-2 text-[#002443]/70">{s.saida}</td>
              <td className="py-2 px-2 text-center font-bold text-[#2bc196]">{s.proximo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RACITable({ roles, activities }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px] border border-slate-200 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-[#f0fdf8]">
            <th className="py-2 px-2 text-left font-bold text-[#002443]/70 border-b border-slate-200">Atividade</th>
            {roles.map((r, i) => <th key={i} className="py-2 px-2 text-center font-bold text-[#002443]/70 border-b border-slate-200">{r}</th>)}
          </tr>
        </thead>
        <tbody>
          {activities.map((a, i) => (
            <tr key={i} className="border-b border-slate-100 last:border-0">
              <td className="py-1.5 px-2 text-[#002443]/80 font-medium">{a.name}</td>
              {a.values.map((v, j) => (
                <td key={j} className={`py-1.5 px-2 text-center font-bold ${v === 'R' ? 'text-red-600 bg-red-50' : v === 'A' ? 'text-blue-600 bg-blue-50' : v === 'C' ? 'text-amber-600 bg-amber-50' : v === 'I' ? 'text-green-600 bg-green-50' : 'text-slate-300'}`}>{v || '—'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BulletList({ items, ordered = false }) {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag className={`space-y-1.5 ${ordered ? 'list-decimal' : 'list-disc'} pl-5`}>
      {items.map((item, i) => (
        <li key={i} className="text-xs text-[#002443]/70 leading-relaxed">
          {typeof item === 'string' ? item : <><span className="font-semibold text-[#002443]">{item.bold}</span>{item.text}</>}
        </li>
      ))}
    </Tag>
  );
}

export default function ProcessoDocumento({ processo }) {
  const p = processo;
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002443] to-[#003a66] rounded-2xl p-5 text-white">
        <h2 className="text-xl font-extrabold mb-1">{p.nome}</h2>
        <p className="text-white/60 text-xs">v{p.versao} • {p.data} • {p.area}</p>
      </div>

      {/* 1. Identificação */}
      <Section title="Identificação" number="1" defaultOpen>
        <IdentTable rows={[
          { id: 'Processo', desc: p.nome },
          { id: 'Versão', desc: p.versao },
          { id: 'Data', desc: p.data },
          { id: 'Elaborado por', desc: p.elaboradoPor },
          { id: 'Área(s) Funcional', desc: p.area },
        ]} />
      </Section>

      {/* 2. Objetivo */}
      <Section title="Objetivo" number="2" defaultOpen>
        <p className="text-xs text-[#002443]/70 leading-relaxed mb-3">{p.objetivo}</p>
        {p.objetivoItens && <BulletList items={p.objetivoItens} />}
      </Section>

      {/* 3. Escopo */}
      <Section title="Escopo" number="3" defaultOpen>
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold text-[#002443] mb-1.5">3.1 Inclui</h4>
            <BulletList items={p.escopoInclui} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#002443] mb-1.5">3.2 Não inclui</h4>
            <BulletList items={p.escopoNaoInclui} />
          </div>
        </div>
      </Section>

      {/* 4. Processo */}
      <Section title="Processo — Passo a Passo" number="4" defaultOpen>
        <StepTable steps={p.steps} />
      </Section>

      {/* 5. Regras de Negócio */}
      <Section title="Regras de Negócio" number="5" defaultOpen>
        <BulletList items={p.regrasNegocio} />
      </Section>

      {/* 6. Compliance & Segurança */}
      <Section title="Compliance & Segurança" number="6">
        <p className="text-xs text-[#002443]/70 leading-relaxed mb-3">{p.complianceIntro || 'Segregação de funções garantida:'}</p>
        <BulletList items={p.complianceItens} />
      </Section>

      {/* 7. Observações de Governança */}
      <Section title="Observações de Governança" number="7">
        <BulletList items={p.governanca} />
      </Section>

      {/* 8. Matriz RACI */}
      <Section title="Matriz RACI" number="8">
        <p className="text-[10px] text-[#002443]/50 mb-2 italic">R = Responsável (executa) · A = Aprovador (autoriza) · C = Consultado · I = Informado</p>
        <RACITable roles={p.raciRoles} activities={p.raciActivities} />
      </Section>
    </div>
  );
}