import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Inbox, Search, Download, Building2, ExternalLink, Calendar, Users, FileSpreadsheet, ChevronDown, ChevronRight, FileText, User, Package, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_LABELS = {
  pending: { label: 'Pendente', color: 'bg-amber-50 text-amber-700' },
  in_review: { label: 'Em revisão', color: 'bg-blue-50 text-blue-700' },
  processed: { label: 'Processado', color: 'bg-green-50 text-green-700' },
  archived: { label: 'Arquivado', color: 'bg-slate-100 text-slate-600' },
};

export default function SubsellerInfoRecebidos() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gatewayFilter, setGatewayFilter] = useState('all');
  const [expanded, setExpanded] = useState(new Set());
  const [detailOpen, setDetailOpen] = useState(null);
  const [dossieLoading, setDossieLoading] = useState(null); // string key: gateway name OR `sub:${id}:${idx}`

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['subsellerInfoSubmissions'],
    queryFn: () => base44.entities.SubsellerInfoSubmission.list('-created_date', 500),
    initialData: [],
  });

  const { data: collections = [] } = useQuery({
    queryKey: ['subsellerInfoCollections'],
    queryFn: () => base44.entities.SubsellerInfoCollection.list('-created_date', 200),
    initialData: [],
  });

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }) => base44.entities.SubsellerInfoSubmission.update(id, {
      status, reviewed_at: new Date().toISOString(),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subsellerInfoSubmissions'] }),
  });

  const gateways = useMemo(() => {
    const set = new Set(submissions.map(s => s.gateway_name).filter(Boolean));
    return Array.from(set).sort();
  }, [submissions]);

  // Agrupa por gateway
  const grouped = useMemo(() => {
    const filtered = submissions.filter(s => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (gatewayFilter !== 'all' && s.gateway_name !== gatewayFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hit = (s.gateway_name || '').toLowerCase().includes(q) ||
                    (s.submitter_email || '').toLowerCase().includes(q) ||
                    (s.subsellers || []).some(sub =>
                      (sub.company_name || '').toLowerCase().includes(q) ||
                      (sub.cnpj || '').toLowerCase().includes(q)
                    );
        if (!hit) return false;
      }
      return true;
    });
    const map = new Map();
    for (const s of filtered) {
      const k = s.gateway_name || 'Sem nome';
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(s);
    }
    return Array.from(map.entries()).map(([gateway, subs]) => ({
      gateway,
      submissions: subs,
      totalSubsellers: subs.reduce((sum, x) => sum + (x.subsellers_count || x.subsellers?.length || 0), 0),
    })).sort((a, b) => b.totalSubsellers - a.totalSubsellers);
  }, [submissions, search, statusFilter, gatewayFilter]);

  const toggleExpand = (key) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const exportGatewayXlsx = (gateway, subs) => {
    const rows = [];
    for (const sub of subs) {
      for (const s of sub.subsellers || []) {
        rows.push({
          'Gateway': gateway,
          'Data Envio': sub.created_date ? format(new Date(sub.created_date), 'dd/MM/yyyy HH:mm') : '',
          'Preenchido por': sub.submitter_name || '',
          'Email preenchedor': sub.submitter_email || '',
          'Status': STATUS_LABELS[sub.status]?.label || sub.status,
          'Tipo': s.person_type || 'PJ',
          'Nome / Razão Social': s.company_name || '',
          'CNPJ': s.cnpj || '',
          'CPF': s.cpf || '',
          'RG': s.rg || '',
          'CNAE': s.cnae || '',
          'Modelo de Negócio': s.business_model === 'outro' ? `outro: ${s.business_model_other || ''}` : (s.business_model || ''),
          'O que vende': s.what_they_sell || '',
          'Site / Link da oferta': s.offer_url || '',
          'Explicação da oferta': s.offer_explanation || '',
          'TPV Mensal (R$)': s.monthly_tpv || '',
          'Ticket Médio (R$)': s.average_ticket || '',
          'Banco': s.bank_name || '',
          'Agência': s.bank_agency || '',
          'Conta': s.bank_account || '',
          'Tipo Conta': s.bank_account_type || '',
          'Titular': s.bank_holder_name || '',
          'CPF/CNPJ Titular': s.bank_holder_document || '',
          'Documentos enviados': (s.documents || []).length,
        });
      }
    }
    if (rows.length === 0) { toast.error('Sem subsellers para exportar.'); return; }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Subsellers');
    XLSX.writeFile(wb, `subsellers_${gateway.replace(/[^a-z0-9]/gi, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success(`Exportado: ${rows.length} subsellers`);
  };

  // Baixa ZIP (dossiê) chamando a function e tratando como blob binário
  const downloadDossie = async ({ gatewayKey, payload, fileFallback }) => {
    setDossieLoading(gatewayKey);
    try {
      const res = await base44.functions.invoke('downloadSubsellerDossie', payload, {
        responseType: 'blob',
      });
      const blob = res?.data instanceof Blob ? res.data : new Blob([res?.data], { type: 'application/zip' });
      if (!blob || blob.size === 0) throw new Error('Arquivo vazio');

      // Pega filename do header se vier
      const disposition = res?.headers?.['content-disposition'] || '';
      const match = /filename="?([^"]+)"?/.exec(disposition);
      const fileName = match?.[1] || fileFallback;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      const added = res?.headers?.['x-docs-added'];
      const failed = res?.headers?.['x-docs-failed'];
      toast.success(`Dossiê gerado${added ? ` · ${added} doc(s)` : ''}${failed && Number(failed) > 0 ? ` · ${failed} falha(s)` : ''}`);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao gerar dossiê. Tente novamente.');
    } finally {
      setDossieLoading(null);
    }
  };

  const exportAll = () => {
    const rows = [];
    for (const { gateway, submissions: subs } of grouped) {
      for (const sub of subs) {
        for (const s of sub.subsellers || []) {
          rows.push({
            'Gateway': gateway,
            'Data Envio': sub.created_date ? format(new Date(sub.created_date), 'dd/MM/yyyy HH:mm') : '',
            'Status': STATUS_LABELS[sub.status]?.label || sub.status,
            'Razão Social': s.company_name || '',
            'CNPJ': s.cnpj || '',
            'Modelo de Negócio': s.business_model || '',
            'O que vende': s.what_they_sell || '',
            'Site / Link da oferta': s.offer_url || '',
            'Explicação da oferta': s.offer_explanation || '',
            'TPV Mensal (R$)': s.monthly_tpv || '',
            'Ticket Médio (R$)': s.average_ticket || '',
            'Banco': s.bank_name || '',
            'Agência': s.bank_agency || '',
            'Conta': s.bank_account || '',
            'Titular': s.bank_holder_name || '',
            'CPF/CNPJ Titular': s.bank_holder_document || '',
          });
        }
      }
    }
    if (rows.length === 0) { toast.error('Sem dados.'); return; }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Todos Subsellers');
    XLSX.writeFile(wb, `subsellers_todos_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#002443]/5 flex items-center justify-center">
            <Inbox className="w-5 h-5 text-[#002443]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#002443]">Inbox — Subsellers Recebidos</h1>
            <p className="text-sm text-[#002443]/60">Submissões dos Gateways, separadas por cliente. Exporte em XLSX por gateway ou tudo de uma vez.</p>
          </div>
        </div>
        <Button onClick={exportAll} variant="outline">
          <FileSpreadsheet className="w-4 h-4 mr-2" /> Exportar tudo
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Gateways', value: gateways.length, icon: Building2 },
          { label: 'Submissões', value: submissions.length, icon: Inbox },
          { label: 'Subsellers totais', value: submissions.reduce((s, x) => s + (x.subsellers_count || x.subsellers?.length || 0), 0), icon: Users },
          { label: 'Pendentes', value: submissions.filter(s => s.status === 'pending').length, icon: Calendar },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#002443]/5 p-4">
            <div className="flex items-center gap-2 mb-1">
              <k.icon className="w-4 h-4 text-[#2bc196]" />
              <p className="text-xl font-bold text-[#002443]">{k.value}</p>
            </div>
            <p className="text-[10px] text-[#002443]/40">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card><CardContent className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#002443]/30" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por gateway, CNPJ, razão social..." className="pl-9" />
          </div>
          <Select value={gatewayFilter} onValueChange={setGatewayFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Gateway" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os gateways</SelectItem>
              {gateways.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardContent></Card>

      {/* Grouped list */}
      {isLoading ? (
        <Card><CardContent className="p-8 text-center text-sm text-[#002443]/40">Carregando...</CardContent></Card>
      ) : grouped.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <Inbox className="w-10 h-10 text-[#002443]/20 mx-auto mb-3" />
          <p className="text-sm text-[#002443]/60">Nenhuma submissão recebida ainda.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {grouped.map(({ gateway, submissions: subs, totalSubsellers }) => {
            const key = gateway;
            const isOpen = expanded.has(key);
            return (
              <Card key={key}>
                <CardContent className="p-0">
                  <button onClick={() => toggleExpand(key)} className="w-full flex items-center justify-between p-4 hover:bg-[#f4f4f4]/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {isOpen ? <ChevronDown className="w-5 h-5 text-[#002443]/40" /> : <ChevronRight className="w-5 h-5 text-[#002443]/40" />}
                      <div className="w-10 h-10 rounded-xl bg-[#2bc196]/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-[#2bc196]" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm font-bold text-[#002443]">{gateway}</h3>
                        <p className="text-[11px] text-[#002443]/50">
                          {subs.length} {subs.length === 1 ? 'submissão' : 'submissões'} · {totalSubsellers} subsellers
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); exportGatewayXlsx(gateway, subs); }}>
                        <Download className="w-3.5 h-3.5 mr-1.5" /> XLSX
                      </Button>
                      <Button
                        size="sm"
                        className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white"
                        disabled={dossieLoading === key}
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadDossie({
                            gatewayKey: key,
                            payload: { scope: 'gateway', gateway_name: gateway },
                            fileFallback: `Dossie_${gateway.replace(/[^a-z0-9]/gi, '_')}.zip`,
                          });
                        }}
                      >
                        {dossieLoading === key
                          ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          : <Package className="w-3.5 h-3.5 mr-1.5" />}
                        Dossiê (ZIP)
                      </Button>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-[#002443]/5 divide-y divide-[#002443]/5">
                      {subs.map(sub => (
                        <div key={sub.id} className="p-4 hover:bg-[#f4f4f4]/30">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STATUS_LABELS[sub.status]?.color || 'bg-slate-100'}`}>
                                  {STATUS_LABELS[sub.status]?.label || sub.status}
                                </span>
                                <span className="text-xs text-[#002443]/50">
                                  {sub.created_date ? format(new Date(sub.created_date), "dd 'de' MMM 'às' HH:mm", { locale: ptBR }) : ''}
                                </span>
                              </div>
                              <p className="text-xs text-[#002443]/60">
                                {sub.subsellers_count || sub.subsellers?.length || 0} subseller(s)
                                {sub.submitter_name && ` · enviado por ${sub.submitter_name}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Select value={sub.status} onValueChange={(v) => updateStatusMut.mutate({ id: sub.id, status: v })}>
                                <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <Button size="sm" variant="ghost" onClick={() => setDetailOpen(sub)}>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!detailOpen} onOpenChange={(o) => !o && setDetailOpen(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailOpen?.gateway_name} — Submissão</DialogTitle>
          </DialogHeader>
          {detailOpen && (
            <div className="space-y-3 pt-2">
              <div className="text-xs text-[#002443]/60">
                Enviado em {detailOpen.created_date ? format(new Date(detailOpen.created_date), "dd/MM/yyyy 'às' HH:mm") : ''}
                {detailOpen.submitter_name && ` · por ${detailOpen.submitter_name}`}
                {detailOpen.submitter_email && ` (${detailOpen.submitter_email})`}
              </div>
              {(detailOpen.subsellers || []).map((s, i) => {
                const isPJ = (s.person_type || 'PJ') === 'PJ';
                return (
                  <div key={i} className="border border-[#002443]/10 rounded-xl p-4 bg-[#f4f4f4]/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#2bc196] text-white flex items-center justify-center text-xs font-bold">{i + 1}</div>
                        <h4 className="text-sm font-bold text-[#002443]">{s.company_name || '(sem nome)'}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isPJ ? 'bg-[#002443]/10 text-[#002443]' : 'bg-amber-50 text-amber-700'}`}>
                          {isPJ ? <Building2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          {isPJ ? 'PJ' : 'PF'}
                        </span>
                        {(() => {
                          const subKey = `sub:${detailOpen.id}:${i}`;
                          return (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px]"
                              disabled={dossieLoading === subKey}
                              onClick={() => downloadDossie({
                                gatewayKey: subKey,
                                payload: { scope: 'subseller', submission_id: detailOpen.id, subseller_index: i },
                                fileFallback: `Subseller_${(s.company_name || `n${i + 1}`).replace(/[^a-z0-9]/gi, '_')}.zip`,
                              })}
                            >
                              {dossieLoading === subKey
                                ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                : <Package className="w-3 h-3 mr-1" />}
                              Dossiê
                            </Button>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      {isPJ ? (
                        <>
                          <div><span className="text-[#002443]/40">CNPJ:</span> {s.cnpj || '—'}</div>
                          <div><span className="text-[#002443]/40">CNAE:</span> {s.cnae || '—'}</div>
                        </>
                      ) : (
                        <>
                          <div><span className="text-[#002443]/40">CPF:</span> {s.cpf || '—'}</div>
                          <div><span className="text-[#002443]/40">RG:</span> {s.rg || '—'}</div>
                        </>
                      )}
                      <div><span className="text-[#002443]/40">Modelo:</span> {s.business_model || '—'}</div>
                      <div><span className="text-[#002443]/40">Vende:</span> {s.what_they_sell || '—'}</div>
                      {s.business_model === 'outro' && s.business_model_other && (
                        <div className="col-span-2"><span className="text-[#002443]/40">Detalhe "outro":</span> {s.business_model_other}</div>
                      )}
                      <div><span className="text-[#002443]/40">TPV:</span> R$ {s.monthly_tpv || '—'}</div>
                      <div><span className="text-[#002443]/40">Ticket:</span> R$ {s.average_ticket || '—'}</div>
                      <div className="col-span-2"><span className="text-[#002443]/40">Site:</span> {s.offer_url || '—'}</div>
                      {s.offer_explanation && <div className="col-span-2"><span className="text-[#002443]/40">Oferta:</span> {s.offer_explanation}</div>}
                      <div className="col-span-2 pt-2 mt-2 border-t border-[#002443]/10">
                        <span className="text-[#002443]/40">Conta:</span> {s.bank_name} · Ag {s.bank_agency} · Cc {s.bank_account} ({s.bank_account_type})
                        {s.bank_holder_name && ` · Titular: ${s.bank_holder_name}`}
                      </div>

                      {/* Documentos */}
                      {(s.documents || []).length > 0 && (
                        <div className="col-span-2 pt-2 mt-2 border-t border-[#002443]/10">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#002443]/40 mb-1.5">
                            Documentos enviados ({(s.documents || []).length})
                          </div>
                          <div className="space-y-1">
                            {(s.documents || []).map((doc, dIdx) => (
                              <div key={dIdx} className="flex items-center justify-between bg-white rounded px-2 py-1.5">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="w-3.5 h-3.5 text-[#002443]/40 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <div className="text-[11px] font-semibold text-[#002443] truncate">{doc.doc_label || doc.doc_type}</div>
                                    <div className="text-[10px] text-[#002443]/40 truncate">{doc.file_name}</div>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 flex-shrink-0"
                                  onClick={async () => {
                                    try {
                                      const res = await base44.functions.invoke('getPrivateDocumentUrl', {
                                        file_uri: doc.file_uri,
                                      });
                                      const url = res?.data?.signed_url;
                                      if (url) window.open(url, '_blank');
                                      else toast.error('Não foi possível gerar o link.');
                                    } catch (e) {
                                      toast.error('Erro ao baixar documento.');
                                    }
                                  }}
                                >
                                  <Download className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}