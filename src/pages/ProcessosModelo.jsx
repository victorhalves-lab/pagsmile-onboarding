import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, ChevronRight, Download, FileDown } from 'lucide-react';
import ProcessoDocumento from '@/components/processos-modelo/ProcessoDocumento';
import { PROCESSOS } from '@/components/processos-modelo/processosData';
import { generateProcessosPdf } from '@/components/processos-modelo/ProcessosPdfGenerator';

export default function ProcessosModelo() {
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = PROCESSOS.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    p.area.toLowerCase().includes(search.toLowerCase())
  );

  const selected = PROCESSOS.find(p => p.id === selectedId);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#0A0A0A] to-[#003a66] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#1356E2]/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[#1356E2]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold">Processos Modelo</h1>
            <p className="text-white/60 text-xs">Documentação formal de todos os processos da plataforma — formato padrão v2.0</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Badge className="bg-[#1356E2]/20 text-[#E84B1C] border-0">{PROCESSOS.length} Processos</Badge>
          <Badge className="bg-white/10 text-white/80 border-0">Identificação • Objetivo • Escopo • Passo a Passo • Regras • Compliance • Governança • RACI</Badge>
        </div>
        <div className="mt-4">
          <Button
            size="sm"
            onClick={() => generateProcessosPdf('all')}
            className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white text-xs gap-2 px-4 py-2"
          >
            <Download className="w-4 h-4" />
            Baixar Todos os {PROCESSOS.length} Processos (PDF)
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar — Lista de Processos */}
        <div className="w-80 shrink-0 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A0A0A]/30" />
            <Input
              placeholder="Buscar processo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>
          <div className="space-y-1.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
            {filtered.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all text-xs ${
                  selectedId === p.id
                    ? 'bg-[#1356E2]/10 border-[#1356E2]/30 text-[#0A0A0A]'
                    : 'bg-white border-slate-200 text-[#0A0A0A]/70 hover:border-[#1356E2]/20 hover:bg-[#1356E2]/5'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Badge className="bg-[#0A0A0A]/10 text-[#0A0A0A] border-0 text-[8px] font-mono shrink-0">{p.id}</Badge>
                      <span className="text-[9px] text-[#0A0A0A]/40">v{p.versao}</span>
                    </div>
                    <p className="font-semibold truncate text-[11px]">{p.nome}</p>
                    <p className="text-[9px] text-[#0A0A0A]/40 mt-0.5 truncate">{p.area}</p>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${selectedId === p.id ? 'text-[#1356E2]' : 'text-slate-300'}`} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {selected ? (
            <ProcessoDocumento processo={selected} />
          ) : (
            <div className="flex items-center justify-center h-96 bg-white rounded-2xl border border-slate-200">
              <div className="text-center">
                <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-[#0A0A0A]/40">Selecione um processo à esquerda</p>
                <p className="text-xs text-[#0A0A0A]/20 mt-1">{PROCESSOS.length} processos documentados no formato padrão v2.0</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}