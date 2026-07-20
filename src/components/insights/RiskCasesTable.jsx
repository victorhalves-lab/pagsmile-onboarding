import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';

const SF_COLORS = {
  '1A': 'bg-green-100 text-green-800', '1B': 'bg-green-50 text-green-700',
  '2A': 'bg-blue-100 text-blue-700', '2B': 'bg-blue-50 text-blue-600',
  '3A': 'bg-yellow-100 text-yellow-800', '3B': 'bg-amber-100 text-amber-800',
  '4': 'bg-orange-100 text-orange-800', '5': 'bg-red-100 text-red-800',
};

const REC_COLORS = {
  'Aprovado': 'bg-green-100 text-green-700',
  'Aprovado com Condições': 'bg-amber-100 text-amber-700',
  'Revisão Manual': 'bg-orange-100 text-orange-700',
  'Recusado': 'bg-red-100 text-red-700',
};

export default function RiskCasesTable({ scores, cases }) {
  const [search, setSearch] = useState('');
  const [filterSF, setFilterSF] = useState('all');
  const [filterRec, setFilterRec] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const casesMap = useMemo(() => {
    const m = {};
    cases.forEach(c => { m[c.id] = c; });
    return m;
  }, [cases]);

  const filtered = useMemo(() => {
    return scores
      .filter(s => {
        if (filterSF !== 'all' && s.subfaixa !== filterSF) return false;
        if (filterRec !== 'all' && s.recomendacao_final !== filterRec) return false;
        if (search) {
          const c = casesMap[s.onboarding_case_id];
          const text = `${s.segmento} ${s.subfaixa_nome} ${c?.merchantId || ''} ${s.onboarding_case_id}`.toLowerCase();
          if (!text.includes(search.toLowerCase())) return false;
        }
        return true;
      })
      .sort((a, b) => (b.score_final || 0) - (a.score_final || 0));
  }, [scores, filterSF, filterRec, search, casesMap]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold">Detalhamento por Caso ({filtered.length} casos)</CardTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#0A0A0A]/30" />
            <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-xs" />
          </div>
          <Select value={filterSF} onValueChange={setFilterSF}>
            <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Subfaixas</SelectItem>
              {['1A','1B','2A','2B','3A','3B','4','5'].map(sf => (
                <SelectItem key={sf} value={sf}>{sf}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterRec} onValueChange={setFilterRec}>
            <SelectTrigger className="w-[170px] h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Decisões</SelectItem>
              <SelectItem value="Aprovado">Aprovado</SelectItem>
              <SelectItem value="Aprovado com Condições">Com Condições</SelectItem>
              <SelectItem value="Revisão Manual">Revisão Manual</SelectItem>
              <SelectItem value="Recusado">Recusado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 max-h-[500px] overflow-y-auto">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-[#0A0A0A]/40 border-b border-slate-100">
            <div className="col-span-1"></div>
            <div className="col-span-2">Segmento</div>
            <div className="col-span-1 text-center">C1</div>
            <div className="col-span-1 text-center">C2</div>
            <div className="col-span-1 text-center">C3</div>
            <div className="col-span-1 text-center">Final</div>
            <div className="col-span-1 text-center">Subfaixa</div>
            <div className="col-span-1 text-center">RR</div>
            <div className="col-span-3">Decisão</div>
          </div>

          {filtered.slice(0, 100).map(s => {
            const isExpanded = expandedId === s.id;
            return (
              <div key={s.id} className="border border-slate-100 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : s.id)}
                  className="w-full grid grid-cols-12 gap-2 px-3 py-2.5 text-[11px] hover:bg-slate-50 transition-colors items-center"
                >
                  <div className="col-span-1">
                    {isExpanded ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                  </div>
                  <div className="col-span-2 text-left capitalize font-medium text-[#0A0A0A]/70">{(s.segmento || '').replace(/_/g, ' ')}</div>
                  <div className="col-span-1 text-center font-mono text-blue-600">{s.score_base_segmento || 0}</div>
                  <div className="col-span-1 text-center font-mono" style={{ color: (s.score_variaveis || 0) > 0 ? '#ef4444' : '#22c55e' }}>{s.score_variaveis > 0 ? '+' : ''}{s.score_variaveis || 0}</div>
                  <div className="col-span-1 text-center font-mono" style={{ color: (s.score_enriquecimento || 0) > 0 ? '#ef4444' : '#22c55e' }}>{s.score_enriquecimento > 0 ? '+' : ''}{s.score_enriquecimento || 0}</div>
                  <div className="col-span-1 text-center font-bold text-[#0A0A0A]">{s.score_final ?? '—'}</div>
                  <div className="col-span-1 text-center">
                    <Badge className={`${SF_COLORS[s.subfaixa] || 'bg-slate-100'} border-0 text-[9px] font-bold`}>{s.subfaixa || '—'}</Badge>
                  </div>
                  <div className="col-span-1 text-center font-mono text-[#0A0A0A]/60">{s.rolling_reserve_percent ?? 0}%</div>
                  <div className="col-span-3 text-left">
                    <Badge className={`${REC_COLORS[s.recomendacao_final] || 'bg-slate-100'} border-0 text-[9px]`}>{s.recomendacao_final || '—'}</Badge>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-3 pt-1 bg-slate-50 border-t border-slate-100 space-y-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                      <div><span className="text-[#0A0A0A]/40">Case ID:</span> <span className="font-mono">{s.onboarding_case_id}</span></div>
                      <div><span className="text-[#0A0A0A]/40">PIX:</span> {s.is_pix ? 'Sim' : 'Não'}</div>
                      <div><span className="text-[#0A0A0A]/40">Monitoramento:</span> {s.monitoramento_nivel || '—'}</div>
                      <div><span className="text-[#0A0A0A]/40">Automática:</span> {s.decisao_automatica ? 'Sim' : 'Não'}</div>
                    </div>
                    {(s.variaveis_positivas?.length > 0 || s.variaveis_negativas?.length > 0) && (
                      <div className="flex flex-wrap gap-1">
                        {(s.variaveis_negativas || []).map((v, i) => (
                          <Badge key={i} className="bg-red-50 text-red-600 border-0 text-[8px] font-mono">{v}</Badge>
                        ))}
                        {(s.variaveis_positivas || []).map((v, i) => (
                          <Badge key={i} className="bg-green-50 text-green-600 border-0 text-[8px] font-mono">{v}</Badge>
                        ))}
                      </div>
                    )}
                    {(s.bloqueios_ativos?.length > 0) && (
                      <div className="flex flex-wrap gap-1">
                        {s.bloqueios_ativos.map((b, i) => (
                          <Badge key={i} className="bg-red-100 text-red-800 border-0 text-[8px] font-mono">{b}</Badge>
                        ))}
                      </div>
                    )}
                    {(s.condicoes_automaticas?.length > 0) && (
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-amber-700">Condições:</p>
                        {s.condicoes_automaticas.map((c, i) => (
                          <p key={i} className="text-[10px] text-[#0A0A0A]/60">• {c}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}