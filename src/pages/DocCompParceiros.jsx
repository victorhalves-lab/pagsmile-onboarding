import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Download, Link as LinkIcon, Copy, FileSpreadsheet, RefreshCw, CheckCircle2, Clock } from 'lucide-react';

/**
 * Admin page — "Doc Compliance Parceiros" tab.
 * Lists all compliance cases (Aprovado+Manual auto-selected, Recusado opt-in),
 * shows bank data collection status per case, lets admin:
 *   1. generate bank-data links (individual or bulk)
 *   2. export XLSX in "Pré KYC Pagsmile" format (enriches missing address via BDC)
 */

const AUTO_STATUSES = ['Aprovado', 'Manual'];
const OPTIONAL_STATUSES = ['Recusado', 'Docs Solicitados', 'Em Processamento', 'Pendente'];

const onlyDigits = (s) => String(s || '').replace(/\D/g, '');
const isCnpj = (s) => onlyDigits(s).length === 14;
const isCpf = (s) => onlyDigits(s).length === 11;
const formatDoc = (s) => {
  const d = onlyDigits(s);
  if (d.length === 14) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  if (d.length === 11) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  return s || '—';
};

export default function DocCompParceiros() {
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [merchants, setMerchants] = useState({});
  const [resolvedDocs, setResolvedDocs] = useState({}); // caseId -> { doc, isPJ }
  const [bankMap, setBankMap] = useState({}); // caseId -> BankDataCollection
  const [selected, setSelected] = useState(new Set());
  const [statusFilter, setStatusFilter] = useState('auto');
  const [search, setSearch] = useState('');
  const [generatingLinks, setGeneratingLinks] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const allCases = await base44.entities.OnboardingCase.list('-updated_date', 1000);
      setCases(allCases || []);

      // Fetch merchants in one go
      const merchantIds = [...new Set((allCases || []).map(c => c.merchantId).filter(Boolean))];
      const merchantMap = {};
      await Promise.all(merchantIds.map(async (id) => {
        try { merchantMap[id] = await base44.entities.Merchant.get(id); } catch { /* ignore */ }
      }));
      setMerchants(merchantMap);

      // Fetch bank data for all cases (in chunks to be nice)
      const bankData = await base44.entities.BankDataCollection.list('-created_date', 2000);
      const bmap = {};
      for (const b of (bankData || [])) {
        if (!bmap[b.onboardingCaseId] || new Date(b.created_date) > new Date(bmap[b.onboardingCaseId].created_date)) {
          bmap[b.onboardingCaseId] = b;
        }
      }
      setBankMap(bmap);

      // Auto-select Aprovado + Manual
      const auto = new Set((allCases || []).filter(c => AUTO_STATUSES.includes(c.status)).map(c => c.id));
      setSelected(auto);

      // Resolve CNPJ correto por caso (para PJ): Merchant > Case > Respostas > Lead
      resolveDocsForCases(allCases || [], merchantMap);
    } catch (e) {
      toast({ title: 'Erro ao carregar', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  // Resolves the correct doc (CNPJ for PJ, CPF for PF) for each case by
  // checking Merchant -> Case -> QuestionnaireResponse -> Lead. Runs in background.
  async function resolveDocsForCases(allCases, merchantMap) {
    const resolved = {};

    // First pass: what we already know from merchant/case
    for (const c of allCases) {
      const m = merchantMap[c.merchantId] || {};
      const isPJ = m.type === 'PJ' || isCnpj(m.cpfCnpj) || isCnpj(c.cpfCnpj);

      let doc = '';
      if (isPJ) {
        if (isCnpj(m.cpfCnpj)) doc = onlyDigits(m.cpfCnpj);
        else if (isCnpj(c.cpfCnpj)) doc = onlyDigits(c.cpfCnpj);
      } else {
        doc = onlyDigits(m.cpfCnpj || c.cpfCnpj);
      }
      resolved[c.id] = { doc, isPJ };
    }
    setResolvedDocs({ ...resolved });

    // Second pass: for PJ cases still missing a valid CNPJ, look up QuestionnaireResponse + Lead
    const needsLookup = allCases.filter(c => {
      const r = resolved[c.id];
      return r?.isPJ && !isCnpj(r.doc);
    });

    // Parallel, capped to 10 at a time to avoid spamming the API
    const CHUNK = 10;
    for (let i = 0; i < needsLookup.length; i += CHUNK) {
      const batch = needsLookup.slice(i, i + CHUNK);
      await Promise.all(batch.map(async (c) => {
        try {
          // Look for a CNPJ in the questionnaire responses
          const responses = await base44.entities.QuestionnaireResponse.filter({ onboardingCaseId: c.id });
          for (const r of (responses || [])) {
            const qt = String(r.questionText || '').toLowerCase();
            const val = onlyDigits(r.valueText);
            if (/\bcnpj\b/.test(qt) && val.length === 14) {
              resolved[c.id] = { doc: val, isPJ: true };
              return;
            }
          }
          // Fallback: look up Lead by email
          const m = merchantMap[c.merchantId] || {};
          if (m.email) {
            const leads = await base44.entities.Lead.filter({ email: m.email });
            for (const l of (leads || [])) {
              if (isCnpj(l.cpfCnpj)) {
                resolved[c.id] = { doc: onlyDigits(l.cpfCnpj), isPJ: true };
                return;
              }
            }
          }
        } catch { /* ignore */ }
      }));
      // Update progressively so the UI feels responsive
      setResolvedDocs({ ...resolved });
    }
  }

  const visible = useMemo(() => {
    let list = cases;
    if (statusFilter === 'auto') list = list.filter(c => AUTO_STATUSES.includes(c.status));
    else if (statusFilter === 'all') list = list;
    else list = list.filter(c => c.status === statusFilter);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c => {
        const m = merchants[c.merchantId] || {};
        const resolved = resolvedDocs[c.id]?.doc || '';
        return (
          (resolved || c.cpfCnpj || '').toLowerCase().includes(q) ||
          (m.companyName || '').toLowerCase().includes(q) ||
          (m.fullName || '').toLowerCase().includes(q) ||
          (m.email || '').toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [cases, merchants, statusFilter, search, resolvedDocs]);

  const toggleOne = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };
  const toggleAll = () => {
    if (visible.every(c => selected.has(c.id))) {
      const next = new Set(selected);
      visible.forEach(c => next.delete(c.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      visible.forEach(c => next.add(c.id));
      setSelected(next);
    }
  };

  const generateLink = async (caseIds) => {
    setGeneratingLinks(true);
    try {
      const res = await base44.functions.invoke('generateBankDataLink', { onboardingCaseIds: caseIds });
      const links = res.data?.links || [];
      // Update local state with new bank records (pendente)
      const nextBank = { ...bankMap };
      for (const l of links) {
        if (l.token && !l.error) {
          nextBank[l.caseId] = {
            ...(nextBank[l.caseId] || {}),
            onboardingCaseId: l.caseId,
            token: l.token,
            status: l.status,
            banco: l.banco, agencia: l.agencia, conta: l.conta,
            filledAt: l.filledAt,
          };
        }
      }
      setBankMap(nextBank);
      // Copy single-link to clipboard; bulk shows count
      if (caseIds.length === 1 && links[0]?.url) {
        navigator.clipboard.writeText(links[0].url);
        toast({ title: 'Link copiado!', description: links[0].url });
      } else {
        toast({ title: `${links.length} link(s) gerados`, description: 'Use "Copiar" em cada linha para enviar.' });
      }
    } catch (e) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setGeneratingLinks(false);
    }
  };

  const copyLink = (caseId) => {
    const b = bankMap[caseId];
    if (!b?.token) return;
    const url = `${window.location.origin}/BankDataCollect?token=${b.token}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copiado', description: url });
  };

  const exportXlsx = async () => {
    if (selected.size === 0) {
      toast({ title: 'Selecione ao menos 1 caso', variant: 'destructive' }); return;
    }
    setExporting(true);
    try {
      const res = await base44.functions.invoke('exportPartnerComplianceDoc', {
        onboardingCaseIds: Array.from(selected),
      });
      const { fileBase64, fileName, rowCount, missingBankData } = res.data || {};
      if (!fileBase64) throw new Error('Resposta vazia');

      // Trigger download
      const bin = atob(fileBase64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName || 'PreKYC-Pagsmile.xlsx';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);

      const missingCount = (missingBankData || []).length;
      toast({
        title: 'Planilha gerada!',
        description: `${rowCount} registros exportados${missingCount > 0 ? `. ${missingCount} sem dados bancários — gere links para eles.` : '.'}`,
      });
    } catch (e) {
      toast({ title: 'Erro ao exportar', description: e.message, variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const bankStatus = (caseId) => {
    const b = bankMap[caseId];
    if (!b) return { label: 'Sem link', tone: 'gray' };
    if (b.status === 'preenchido') return { label: 'Preenchido', tone: 'green' };
    if (b.status === 'pendente') return { label: 'Aguardando', tone: 'amber' };
    return { label: b.status, tone: 'gray' };
  };

  const allVisibleChecked = visible.length > 0 && visible.every(c => selected.has(c.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#002443]">Doc Compliance Parceiros</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gere a planilha "Pré KYC Pagsmile" com todos os clientes aprovados. Endereço e razão social são enriquecidos via BigDataCorp automaticamente. Para dados bancários, envie um link de coleta para cada cliente.
        </p>
      </div>

      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-[#002443] mb-1 block">Buscar</label>
            <Input placeholder="CNPJ, razão social, email..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="w-48">
            <label className="text-xs font-semibold text-[#002443] mb-1 block">Filtro de Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Aprovado + Manual</SelectItem>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Aprovado">Aprovado</SelectItem>
                <SelectItem value="Manual">Manual</SelectItem>
                <SelectItem value="Recusado">Recusado</SelectItem>
                <SelectItem value="Docs Solicitados">Docs Solicitados</SelectItem>
                <SelectItem value="Em Processamento">Em Processamento</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            disabled={selected.size === 0 || generatingLinks}
            onClick={() => generateLink(Array.from(selected))}
          >
            {generatingLinks ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LinkIcon className="w-4 h-4 mr-2" />}
            Gerar Links ({selected.size})
          </Button>
          <Button
            className="bg-[#2bc196] hover:bg-[#239b78]"
            disabled={selected.size === 0 || exporting}
            onClick={exportXlsx}
          >
            {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
            Exportar XLSX ({selected.size})
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#2bc196]" />
            <p className="text-sm text-muted-foreground mt-2">Carregando casos...</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">Nenhum caso encontrado.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 text-left w-10">
                  <Checkbox checked={allVisibleChecked} onCheckedChange={toggleAll} />
                </th>
                <th className="p-3 text-left font-semibold text-[#002443]">Cliente</th>
                <th className="p-3 text-left font-semibold text-[#002443]">CPF/CNPJ</th>
                <th className="p-3 text-left font-semibold text-[#002443]">Status Caso</th>
                <th className="p-3 text-left font-semibold text-[#002443]">Dados Bancários</th>
                <th className="p-3 text-right font-semibold text-[#002443]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(c => {
                const m = merchants[c.merchantId] || {};
                const bs = bankStatus(c.id);
                const hasLink = !!bankMap[c.id]?.token;
                return (
                  <tr key={c.id} className="border-b hover:bg-gray-50/50">
                    <td className="p-3"><Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggleOne(c.id)} /></td>
                    <td className="p-3">
                      <div className="font-medium text-[#002443]">{m.companyName || m.fullName || '—'}</div>
                      {m.email && <div className="text-xs text-muted-foreground">{m.email}</div>}
                    </td>
                    <td className="p-3 font-mono text-xs">
                      {(() => {
                        const r = resolvedDocs[c.id];
                        const isPJ = r?.isPJ ?? (m.type === 'PJ');
                        const doc = r?.doc || c.cpfCnpj || m.cpfCnpj || '';
                        const isValid = isPJ ? isCnpj(doc) : isCpf(doc);
                        return (
                          <div className="flex items-center gap-2">
                            <span>{formatDoc(doc)}</span>
                            {isPJ && !isValid && (
                              <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px]">CNPJ não encontrado</Badge>
                            )}
                            {isPJ && isValid && <Badge variant="outline" className="text-[10px]">CNPJ</Badge>}
                            {!isPJ && isValid && <Badge variant="outline" className="text-[10px]">CPF</Badge>}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{c.status}</Badge>
                    </td>
                    <td className="p-3">
                      <Badge
                        className={
                          bs.tone === 'green' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          bs.tone === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-gray-50 text-gray-600 border-gray-200'
                        }
                      >
                        {bs.tone === 'green' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {bs.tone === 'amber' && <Clock className="w-3 h-3 mr-1" />}
                        {bs.label}
                      </Badge>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {hasLink ? (
                        <Button size="sm" variant="outline" onClick={() => copyLink(c.id)}>
                          <Copy className="w-3 h-3 mr-1" /> Copiar link
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => generateLink([c.id])} disabled={generatingLinks}>
                          <LinkIcon className="w-3 h-3 mr-1" /> Gerar link
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <div className="text-xs text-muted-foreground">
        <strong>{visible.length}</strong> casos visíveis • <strong>{selected.size}</strong> selecionados.
      </div>
    </div>
  );
}