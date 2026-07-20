import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronDown, ChevronRight, Building2, User, Mail, Phone, Globe, CalendarDays, ShieldCheck, ShieldAlert, ShieldX, Clock, FileWarning } from 'lucide-react';
import moment from 'moment';

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

const REC_ICONS = {
  'Aprovado': ShieldCheck,
  'Aprovado com Condições': ShieldAlert,
  'Revisão Manual': Clock,
  'Recusado': ShieldX,
};

const VAR_DESCRIPTIONS = {
  V04: 'CNAE vs Segmento incoerente', V05: 'Setor regulado sem licença', V06: 'Empresa < 6 meses',
  V07: 'Empresa 6-12 meses', V08: 'Capital desproporcional', V10: 'E-mail gratuito (intermediário)',
  V11: 'Zero presença digital', V12: 'Google Maps ≥50 aval. ≥4★', V13: 'Sede física verificada',
  V14: 'Site ativo + SSL + plataforma', V15: 'Empresa > 5 anos', V16: 'PEP direto',
  V17: 'PEP parente/associado', V19: 'CEIS/CNEP', V20: 'Processos crimes financeiros',
  V21: 'Crimes sist. financeiro', V23: 'CPF irregular', V24: 'Adverse media',
  V25: 'PEP divergente', V26: 'Checks limpos', V27: '>10 anos + limpa',
  V28: 'CB > 2%', V29: 'CB 1-2%', V30: 'CB < 0,5%', V31: 'MED > 1%',
  V32: 'MED 0,5-1%', V33: 'MED < 0,1%', V34: 'Vol > limite porte',
  V35: 'Conta encerrada', V36: 'Encerrada por PLD', V37: 'Notificado COAF',
  V38: 'Sem antifraude', V39: 'NFs divergentes', V40: 'Vol consistente NFs',
  V41: 'CB=0% + >2 anos', V42: 'Sem BCB/BaaS', V43: 'Sem PLD/FT',
  V44: 'Sem KYC merchants', V45: 'Sem TM', V46: 'Sem anti-bolção',
  V47: 'Split não validado', V48: 'Merchants transferem 3os', V49: 'Repasse >D+14',
  V52: 'Todos controles OK', V53: 'CO nomeado', V54: 'Afiliados sem supervisão',
  V55: 'Regulado sem credencial', V56: 'Fornecedor sem contrato', V58: 'SaaS processa pgto 3os',
  V59: 'Negativada + PIX', V60: 'Dívida ativa + PIX',
  E01: 'PEP divergente (enriq.)', E02: 'Processos divergentes', E03: 'Volume >> NFs',
  E04: 'Vol alto + 0 empregados', E05: 'BCB não confirmado', E06: 'Site offline',
  E07: 'Negativação oculta', E08: 'Deepfake', E09: 'Face Match <50%',
  E10: 'Doc falsificado', E11: 'Tudo confirma BDC+CAF',
};

export default function RiskClientsList({ scores, cases, merchants }) {
  const [search, setSearch] = useState('');
  const [filterDecision, setFilterDecision] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [sortBy, setSortBy] = useState('score_desc');

  const merchantsMap = useMemo(() => {
    const m = {};
    (merchants || []).forEach(mc => { m[mc.id] = mc; });
    return m;
  }, [merchants]);

  const casesMap = useMemo(() => {
    const m = {};
    (cases || []).forEach(c => { m[c.id] = c; });
    return m;
  }, [cases]);

  // Build enriched client list
  const clients = useMemo(() => {
    return scores.map(s => {
      const caseItem = casesMap[s.onboarding_case_id] || {};
      const merchant = merchantsMap[caseItem.merchantId] || {};
      return {
        ...s,
        merchantName: merchant.fullName || merchant.companyName || '—',
        merchantEmail: merchant.email || '—',
        merchantPhone: merchant.phone || '',
        merchantCpfCnpj: merchant.cpfCnpj || '',
        merchantType: merchant.type || '',
        merchantWebsite: caseItem.website || '',
        caseStatus: caseItem.status || '',
        caseDate: caseItem.submissionDate || caseItem.created_date || '',
        assignedAnalyst: caseItem.assignedAnalystName || '',
        priority: caseItem.priority || '',
      };
    });
  }, [scores, casesMap, merchantsMap]);

  const filtered = useMemo(() => {
    let result = clients.filter(c => {
      if (filterDecision !== 'all' && c.recomendacao_final !== filterDecision) return false;
      if (search) {
        const text = `${c.merchantName} ${c.merchantEmail} ${c.merchantCpfCnpj} ${c.segmento} ${c.subfaixa_nome}`.toLowerCase();
        if (!text.includes(search.toLowerCase())) return false;
      }
      return true;
    });

    if (sortBy === 'score_desc') result.sort((a, b) => (b.score_final || 0) - (a.score_final || 0));
    else if (sortBy === 'score_asc') result.sort((a, b) => (a.score_final || 0) - (b.score_final || 0));
    else if (sortBy === 'name') result.sort((a, b) => a.merchantName.localeCompare(b.merchantName));
    else if (sortBy === 'date') result.sort((a, b) => new Date(b.caseDate || 0) - new Date(a.caseDate || 0));

    return result;
  }, [clients, filterDecision, search, sortBy]);

  // Summary counters
  const counts = useMemo(() => {
    const c = { aprovado: 0, condicoes: 0, manual: 0, recusado: 0 };
    clients.forEach(cl => {
      if (cl.recomendacao_final === 'Aprovado') c.aprovado++;
      else if (cl.recomendacao_final === 'Aprovado com Condições') c.condicoes++;
      else if (cl.recomendacao_final === 'Revisão Manual') c.manual++;
      else if (cl.recomendacao_final === 'Recusado') c.recusado++;
    });
    return c;
  }, [clients]);

  return (
    <div className="space-y-4">
      {/* Decision summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Aprovados', count: counts.aprovado, color: '#22c55e', bgColor: 'bg-green-50 border-green-200', icon: ShieldCheck, filter: 'Aprovado' },
          { label: 'Aprovados c/ Condições', count: counts.condicoes, color: '#eab308', bgColor: 'bg-amber-50 border-amber-200', icon: ShieldAlert, filter: 'Aprovado com Condições' },
          { label: 'Revisão Manual', count: counts.manual, color: '#f97316', bgColor: 'bg-orange-50 border-orange-200', icon: Clock, filter: 'Revisão Manual' },
          { label: 'Recusados / Bloqueados', count: counts.recusado, color: '#ef4444', bgColor: 'bg-red-50 border-red-200', icon: ShieldX, filter: 'Recusado' },
        ].map((item, i) => {
          const Icon = item.icon;
          const isActive = filterDecision === item.filter;
          return (
            <button
              key={i}
              onClick={() => setFilterDecision(isActive ? 'all' : item.filter)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${isActive ? 'ring-2 ring-offset-1' : ''} ${item.bgColor}`}
              style={isActive ? { ringColor: item.color } : {}}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5" style={{ color: item.color }} />
                <span className="text-2xl font-extrabold" style={{ color: item.color }}>{item.count}</span>
              </div>
              <p className="text-[10px] font-bold text-[#0A0A0A]/60">{item.label}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold">Clientes ({filtered.length})</CardTitle>
            <Badge className="bg-[#0A0A0A] text-white border-0 text-[10px]">{clients.length} total</Badge>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#0A0A0A]/30" />
              <Input placeholder="Buscar por nome, CNPJ, e-mail, segmento..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-xs" />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="score_desc">Score (maior → menor)</SelectItem>
                <SelectItem value="score_asc">Score (menor → maior)</SelectItem>
                <SelectItem value="name">Nome (A-Z)</SelectItem>
                <SelectItem value="date">Data (recente)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filtered.length === 0 && (
              <div className="text-center py-12 text-[#0A0A0A]/30">
                <FileWarning className="w-8 h-8 mx-auto mb-2" />
                <p className="text-xs font-medium">Nenhum cliente encontrado com os filtros selecionados</p>
              </div>
            )}
            {filtered.slice(0, 100).map(client => {
              const isExpanded = expandedId === client.id;
              const DecIcon = REC_ICONS[client.recomendacao_final] || ShieldCheck;
              const negVars = client.variaveis_negativas || [];
              const posVars = client.variaveis_positivas || [];
              const bloqs = client.bloqueios_ativos || [];
              const conds = client.condicoes_automaticas || [];

              return (
                <div key={client.id} className="border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-colors">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : client.id)}
                    className="w-full px-4 py-3 flex items-center gap-4 hover:bg-slate-50/50 transition-colors text-left"
                  >
                    {/* Expand icon */}
                    <div className="flex-shrink-0">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    </div>

                    {/* Client name & info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#0A0A0A] truncate">{client.merchantName}</span>
                        {client.merchantType && (
                          <Badge variant="outline" className="text-[8px] font-mono shrink-0">{client.merchantType}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {client.merchantCpfCnpj && <span className="text-[10px] text-[#0A0A0A]/40 font-mono">{client.merchantCpfCnpj}</span>}
                        <span className="text-[10px] text-[#0A0A0A]/40 capitalize">{(client.segmento || '').replace(/_/g, ' ')}</span>
                        {client.caseDate && <span className="text-[10px] text-[#0A0A0A]/30">{moment(client.caseDate).format('DD/MM/YYYY')}</span>}
                      </div>
                    </div>

                    {/* Score gauge */}
                    <div className="flex-shrink-0 text-center w-16">
                      <p className="text-lg font-extrabold text-[#0A0A0A]">{client.score_final ?? '—'}</p>
                      <p className="text-[8px] text-[#0A0A0A]/30">SCORE</p>
                    </div>

                    {/* Subfaixa */}
                    <div className="flex-shrink-0">
                      <Badge className={`${SF_COLORS[client.subfaixa] || 'bg-slate-100'} border-0 text-[9px] font-bold`}>
                        {client.subfaixa || '—'} {client.subfaixa_nome || ''}
                      </Badge>
                    </div>

                    {/* RR */}
                    <div className="flex-shrink-0 text-center w-12">
                      <p className="text-sm font-bold text-[#0A0A0A]/70">{client.rolling_reserve_percent ?? 0}%</p>
                      <p className="text-[8px] text-[#0A0A0A]/30">RR</p>
                    </div>

                    {/* Decision */}
                    <div className="flex-shrink-0">
                      <Badge className={`${REC_COLORS[client.recomendacao_final] || 'bg-slate-100'} border-0 text-[10px] flex items-center gap-1`}>
                        <DecIcon className="w-3 h-3" />
                        {client.recomendacao_final || '—'}
                      </Badge>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-5 pb-4 pt-2 bg-slate-50/80 border-t border-slate-100">
                      {/* Client details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <DetailItem icon={Building2} label="Empresa" value={client.merchantName} />
                        <DetailItem icon={Mail} label="E-mail" value={client.merchantEmail} />
                        <DetailItem icon={Phone} label="Telefone" value={client.merchantPhone || '—'} />
                        <DetailItem icon={Globe} label="Segmento" value={(client.segmento || '').replace(/_/g, ' ')} />
                      </div>

                      {/* Score breakdown */}
                      <div className="bg-white rounded-lg p-3 border border-slate-100 mb-3">
                        <p className="text-[9px] font-bold text-[#0A0A0A]/50 uppercase tracking-wider mb-2">Composição do Score</p>
                        <div className="grid grid-cols-4 gap-3 text-center">
                          <div>
                            <p className="text-lg font-bold text-blue-600">{client.score_base_segmento || 0}</p>
                            <p className="text-[9px] text-[#0A0A0A]/40">C1 Base</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold" style={{ color: (client.score_variaveis || 0) > 0 ? '#ef4444' : '#22c55e' }}>
                              {client.score_variaveis > 0 ? '+' : ''}{client.score_variaveis || 0}
                            </p>
                            <p className="text-[9px] text-[#0A0A0A]/40">C2 Variáveis</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold" style={{ color: (client.score_enriquecimento || 0) > 0 ? '#ef4444' : '#22c55e' }}>
                              {client.score_enriquecimento > 0 ? '+' : ''}{client.score_enriquecimento || 0}
                            </p>
                            <p className="text-[9px] text-[#0A0A0A]/40">C3 Enriquecimento</p>
                          </div>
                          <div className="bg-[#0A0A0A]/5 rounded-lg p-1">
                            <p className="text-lg font-extrabold text-[#0A0A0A]">{client.score_final ?? 0}</p>
                            <p className="text-[9px] text-[#0A0A0A]/40">Final</p>
                          </div>
                        </div>
                      </div>

                      {/* Monitoring & status */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-[10px]">
                        <div className="bg-white rounded-lg p-2 border border-slate-100">
                          <span className="text-[#0A0A0A]/40">Monitoramento:</span>
                          <p className="font-bold text-[#0A0A0A]">{(client.monitoramento_nivel || 'PADRAO').replace(/_/g, ' ')}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-slate-100">
                          <span className="text-[#0A0A0A]/40">Decisão:</span>
                          <p className="font-bold text-[#0A0A0A]">{client.decisao_automatica ? 'Automática' : 'Manual'}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-slate-100">
                          <span className="text-[#0A0A0A]/40">PIX:</span>
                          <p className="font-bold text-[#0A0A0A]">{client.is_pix ? 'Sim' : 'Não'}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-slate-100">
                          <span className="text-[#0A0A0A]/40">Analista:</span>
                          <p className="font-bold text-[#0A0A0A]">{client.assignedAnalyst || '—'}</p>
                        </div>
                      </div>

                      {/* Bloqueios */}
                      {bloqs.length > 0 && (
                        <div className="bg-red-50 rounded-lg p-3 border border-red-100 mb-3">
                          <p className="text-[9px] font-bold text-red-700 uppercase tracking-wider mb-1.5">Bloqueios Ativos ({bloqs.length})</p>
                          <div className="flex flex-wrap gap-1">
                            {bloqs.map((b, i) => (
                              <Badge key={i} className="bg-red-200 text-red-800 border-0 text-[9px] font-mono">{b.replace(/_/g, ' ')}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Variáveis penalizadoras */}
                      {negVars.length > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-red-100 mb-3">
                          <p className="text-[9px] font-bold text-red-600 uppercase tracking-wider mb-1.5">Variáveis Penalizadoras ({negVars.length})</p>
                          <div className="space-y-1">
                            {negVars.map((v, i) => (
                              <div key={i} className="flex items-center gap-2 text-[10px]">
                                <Badge className="bg-red-100 text-red-700 border-0 text-[8px] font-mono w-10 justify-center shrink-0">{v}</Badge>
                                <span className="text-[#0A0A0A]/60">{VAR_DESCRIPTIONS[v] || v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Variáveis positivas */}
                      {posVars.length > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-green-100 mb-3">
                          <p className="text-[9px] font-bold text-green-600 uppercase tracking-wider mb-1.5">Variáveis Positivas ({posVars.length})</p>
                          <div className="space-y-1">
                            {posVars.map((v, i) => (
                              <div key={i} className="flex items-center gap-2 text-[10px]">
                                <Badge className="bg-green-100 text-green-700 border-0 text-[8px] font-mono w-10 justify-center shrink-0">{v}</Badge>
                                <span className="text-[#0A0A0A]/60">{VAR_DESCRIPTIONS[v] || v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Condições */}
                      {conds.length > 0 && (
                        <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                          <p className="text-[9px] font-bold text-amber-700 uppercase tracking-wider mb-1.5">Condições Aplicadas ({conds.length})</p>
                          <div className="space-y-1">
                            {conds.map((c, i) => (
                              <p key={i} className="text-[10px] text-[#0A0A0A]/60 flex items-start gap-1.5">
                                <span className="text-amber-500 shrink-0">•</span> {c}
                              </p>
                            ))}
                          </div>
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
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2 text-[10px]">
      <Icon className="w-3.5 h-3.5 text-[#0A0A0A]/30 shrink-0 mt-0.5" />
      <div>
        <p className="text-[#0A0A0A]/40">{label}</p>
        <p className="font-medium text-[#0A0A0A] capitalize">{value}</p>
      </div>
    </div>
  );
}