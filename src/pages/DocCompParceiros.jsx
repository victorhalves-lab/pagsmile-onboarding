import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Download, Link as LinkIcon, Copy, FileSpreadsheet, RefreshCw, CheckCircle2, Clock, ChevronDown, ChevronRight, Building2, Users } from 'lucide-react';
import CaseRow from '@/components/doc-comp-parceiros/CaseRow';

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
  const [hierarchyFilter, setHierarchyFilter] = useState('all'); // all | sellers | subsellers
  const [search, setSearch] = useState('');
  const [generatingLinks, setGeneratingLinks] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [expandedSellers, setExpandedSellers] = useState(new Set()); // sellerMerchantId -> expanded?

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const allCases = await base44.entities.OnboardingCase.list('-updated_date', 1000);
      setCases(allCases || []);

      // Fetch merchants in one go (and also fetch parent merchants so we can show seller names)
      const merchantIds = [...new Set((allCases || []).map(c => c.merchantId).filter(Boolean))];
      const merchantMap = {};
      await Promise.all(merchantIds.map(async (id) => {
        try { merchantMap[id] = await base44.entities.Merchant.get(id); } catch { /* ignore */ }
      }));
      // Fetch any parent merchants not already loaded (subsellers whose seller has no case)
      const parentIdsToFetch = [...new Set(
        Object.values(merchantMap)
          .map(m => m?.parentMerchantId)
          .filter(pid => pid && !merchantMap[pid])
      )];
      await Promise.all(parentIdsToFetch.map(async (id) => {
        try { merchantMap[id] = await base44.entities.Merchant.get(id); } catch { /* ignore */ }
      }));
      setMerchants(merchantMap);
      // Default: expand all sellers that have subsellers
      const sellerIdsWithSubs = new Set(
        Object.values(merchantMap).map(m => m?.parentMerchantId).filter(Boolean)
      );
      setExpandedSellers(sellerIdsWithSubs);

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

  // Resolves the correct doc (CNPJ for PJ, CPF for PF) for each case using
  // MICROSCOPIC search across: Merchant -> Case -> Parent Merchant ->
  // QuestionnaireResponse (explicit + free-text scan) -> Lead (cpfCnpj +
  // bdcEnrichmentData + questionnaireData). Runs progressively in the background.
  async function resolveDocsForCases(allCases, merchantMap) {
    const resolved = {};

    // First pass: what we already know from merchant/case/parent
    for (const c of allCases) {
      const m = merchantMap[c.merchantId] || {};
      const parent = m.parentMerchantId ? merchantMap[m.parentMerchantId] : null;
      const isPJ = m.type === 'PJ' || isCnpj(m.cpfCnpj) || isCnpj(c.cpfCnpj) || isCnpj(parent?.cpfCnpj);

      let doc = '';
      if (isPJ) {
        if (isCnpj(m.cpfCnpj)) doc = onlyDigits(m.cpfCnpj);
        else if (isCnpj(c.cpfCnpj)) doc = onlyDigits(c.cpfCnpj);
        else if (isCnpj(parent?.cpfCnpj)) doc = onlyDigits(parent.cpfCnpj);
      } else {
        // PF
        if (isCpf(m.cpfCnpj)) doc = onlyDigits(m.cpfCnpj);
        else if (isCpf(c.cpfCnpj)) doc = onlyDigits(c.cpfCnpj);
      }
      resolved[c.id] = { doc, isPJ };
    }
    setResolvedDocs({ ...resolved });

    // Second pass: deep search for cases still missing a valid doc
    const needsLookup = allCases.filter(c => {
      const r = resolved[c.id];
      if (!r) return true;
      if (r.isPJ) return !isCnpj(r.doc);
      return !isCpf(r.doc);
    });

    const findDocInResponses = (responses, wantCnpj) => {
      for (const r of (responses || [])) {
        const qt = String(r.questionText || '').toLowerCase();
        const raw = String(r.valueText ?? (Array.isArray(r.valueArray) ? r.valueArray.join(' ') : '') ?? '');
        const valDigits = onlyDigits(raw);
        // Pergunta explícita
        if (wantCnpj && /\bcnpj\b/.test(qt) && valDigits.length === 14) return valDigits;
        if (!wantCnpj && /\bcpf\b/.test(qt) && valDigits.length === 11) return valDigits;
        // Padrão dentro do texto livre
        if (wantCnpj) {
          const fmt = raw.match(/(\d{2}[.\s]?\d{3}[.\s]?\d{3}[/\s]?\d{4}[-\s]?\d{2})/);
          if (fmt && onlyDigits(fmt[0]).length === 14) return onlyDigits(fmt[0]);
          const seq = raw.match(/\b\d{14}\b/);
          if (seq) return seq[0];
        } else {
          const fmt = raw.match(/(\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?\d{2})/);
          if (fmt && onlyDigits(fmt[0]).length === 11) return onlyDigits(fmt[0]);
          const seq = raw.match(/\b\d{11}\b/);
          if (seq) return seq[0];
        }
      }
      return '';
    };

    const findDocInLeadJson = (lead, wantCnpj) => {
      const blob = JSON.stringify(lead?.bdcEnrichmentData || {}) + JSON.stringify(lead?.questionnaireData || {});
      const len = wantCnpj ? 14 : 11;
      const re = new RegExp(`\\b\\d{${len}}\\b`);
      const m = blob.match(re);
      return m ? m[0] : '';
    };

    const CHUNK = 8;
    for (let i = 0; i < needsLookup.length; i += CHUNK) {
      const batch = needsLookup.slice(i, i + CHUNK);
      await Promise.all(batch.map(async (c) => {
        try {
          const r = resolved[c.id] || { isPJ: true, doc: '' };
          const wantCnpj = !!r.isPJ;

          // 1) Respostas
          const responses = await base44.entities.QuestionnaireResponse.filter({ onboardingCaseId: c.id });
          const fromResponses = findDocInResponses(responses, wantCnpj);
          if (fromResponses) {
            resolved[c.id] = { doc: fromResponses, isPJ: wantCnpj };
            return;
          }

          // 2) Leads (por email, cpfCnpj, ou onboardingCaseId)
          const m = merchantMap[c.merchantId] || {};
          const leadCandidates = [];
          if (m.email) {
            const byEmail = await base44.entities.Lead.filter({ email: m.email }).catch(() => []);
            leadCandidates.push(...(byEmail || []));
          }
          if (m.cpfCnpj) {
            const byDoc = await base44.entities.Lead.filter({ cpfCnpj: m.cpfCnpj }).catch(() => []);
            leadCandidates.push(...(byDoc || []));
          }
          const byCase = await base44.entities.Lead.filter({ onboardingCaseId: c.id }).catch(() => []);
          leadCandidates.push(...(byCase || []));

          for (const l of leadCandidates) {
            if (wantCnpj && isCnpj(l?.cpfCnpj)) {
              resolved[c.id] = { doc: onlyDigits(l.cpfCnpj), isPJ: true };
              return;
            }
            if (!wantCnpj && isCpf(l?.cpfCnpj)) {
              resolved[c.id] = { doc: onlyDigits(l.cpfCnpj), isPJ: false };
              return;
            }
            const fromLeadJson = findDocInLeadJson(l, wantCnpj);
            if (fromLeadJson && ((wantCnpj && fromLeadJson.length === 14) || (!wantCnpj && fromLeadJson.length === 11))) {
              resolved[c.id] = { doc: fromLeadJson, isPJ: wantCnpj };
              return;
            }
          }
        } catch { /* ignore */ }
      }));
      // Progressive update
      setResolvedDocs({ ...resolved });
    }
  }

  // Step 1: cases after status + search filter
  const filteredCases = useMemo(() => {
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

  // Step 2: group cases by seller.
  // - Each row in filteredCases is a case of a merchant.
  // - If merchant.isSubseller => the row is a subseller, grouped under merchant.parentMerchantId
  // - Else => the row is a seller (top-level). Its subsellers (if any) come from other cases
  //   whose merchant.parentMerchantId matches this merchant.id.
  // - "Orphan" subsellers (parent has no case in the filtered list) still get rendered under
  //   a placeholder seller group so nothing is hidden.
  const groups = useMemo(() => {
    const sellerCaseByMerchantId = new Map(); // sellerMerchantId -> case
    const subsellerCasesBySellerId = new Map(); // sellerMerchantId -> [cases]
    const orphanSubsellerCases = []; // subsellers whose parent merchant isn't in scope

    for (const c of filteredCases) {
      const m = merchants[c.merchantId] || {};
      if (m.isSubseller && m.parentMerchantId) {
        const arr = subsellerCasesBySellerId.get(m.parentMerchantId) || [];
        arr.push(c);
        subsellerCasesBySellerId.set(m.parentMerchantId, arr);
      } else {
        // Top-level seller case. Keep the latest if multiple.
        const prev = sellerCaseByMerchantId.get(c.merchantId);
        if (!prev || new Date(c.updated_date || c.created_date) > new Date(prev.updated_date || prev.created_date)) {
          sellerCaseByMerchantId.set(c.merchantId, c);
        }
      }
    }

    // Detect orphans: subseller groups whose seller isn't in sellerCaseByMerchantId
    for (const [sellerId, subs] of subsellerCasesBySellerId.entries()) {
      if (!sellerCaseByMerchantId.has(sellerId)) {
        orphanSubsellerCases.push({ sellerId, subs });
      }
    }

    // Build groups array in the order of sellerCaseByMerchantId (which follows filteredCases order)
    const out = [];
    for (const [sellerId, sellerCase] of sellerCaseByMerchantId.entries()) {
      out.push({
        sellerMerchantId: sellerId,
        sellerCase,
        subsellerCases: subsellerCasesBySellerId.get(sellerId) || [],
      });
    }
    // Append orphans at the end
    for (const { sellerId, subs } of orphanSubsellerCases) {
      out.push({
        sellerMerchantId: sellerId,
        sellerCase: null, // no case for the seller in the filtered view
        subsellerCases: subs,
      });
    }

    // Apply hierarchy filter
    if (hierarchyFilter === 'sellers') {
      return out.filter(g => g.sellerCase).map(g => ({ ...g, subsellerCases: [] }));
    }
    if (hierarchyFilter === 'subsellers') {
      return out.filter(g => g.subsellerCases.length > 0).map(g => ({ ...g, sellerCase: null }));
    }
    return out;
  }, [filteredCases, merchants, hierarchyFilter]);

  // Flat list of all case IDs currently visible (for "select all" and stats)
  const visibleCaseIds = useMemo(() => {
    const ids = [];
    for (const g of groups) {
      if (g.sellerCase) ids.push(g.sellerCase.id);
      for (const s of g.subsellerCases) ids.push(s.id);
    }
    return ids;
  }, [groups]);
  const visibleCount = visibleCaseIds.length;

  const toggleOne = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };
  const toggleAll = () => {
    const allChecked = visibleCaseIds.length > 0 && visibleCaseIds.every(id => selected.has(id));
    const next = new Set(selected);
    if (allChecked) visibleCaseIds.forEach(id => next.delete(id));
    else visibleCaseIds.forEach(id => next.add(id));
    setSelected(next);
  };
  const toggleSellerGroup = (sellerMerchantId) => {
    const next = new Set(expandedSellers);
    if (next.has(sellerMerchantId)) next.delete(sellerMerchantId); else next.add(sellerMerchantId);
    setExpandedSellers(next);
  };
  const toggleAllInGroup = (group) => {
    const ids = [
      ...(group.sellerCase ? [group.sellerCase.id] : []),
      ...group.subsellerCases.map(s => s.id),
    ];
    const allChecked = ids.every(id => selected.has(id));
    const next = new Set(selected);
    if (allChecked) ids.forEach(id => next.delete(id));
    else ids.forEach(id => next.add(id));
    setSelected(next);
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

  const allVisibleChecked = visibleCaseIds.length > 0 && visibleCaseIds.every(id => selected.has(id));

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
          <div className="w-44">
            <label className="text-xs font-semibold text-[#002443] mb-1 block">Hierarquia</label>
            <Select value={hierarchyFilter} onValueChange={setHierarchyFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sellers + Subsellers</SelectItem>
                <SelectItem value="sellers">Apenas Sellers</SelectItem>
                <SelectItem value="subsellers">Apenas Subsellers</SelectItem>
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
        ) : visibleCount === 0 ? (
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
              {groups.map((g) => {
                const sellerMerchant = merchants[g.sellerMerchantId] || {};
                const isExpanded = expandedSellers.has(g.sellerMerchantId);
                const subCount = g.subsellerCases.length;

                return (
                  <React.Fragment key={g.sellerMerchantId}>
                    {/* Divider / group header when there are subsellers */}
                    {subCount > 0 && (
                      <tr className="bg-gradient-to-r from-blue-50/60 to-transparent border-b">
                        <td className="p-2 pl-3" colSpan={6}>
                          <button
                            onClick={() => toggleSellerGroup(g.sellerMerchantId)}
                            className="flex items-center gap-2 text-xs font-semibold text-[#002443] hover:text-[#2bc196] transition-colors"
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            <Building2 className="w-3.5 h-3.5" />
                            <span>{sellerMerchant.companyName || sellerMerchant.fullName || 'Seller'}</span>
                            <span className="text-[#002443]/50 font-normal">→</span>
                            <Users className="w-3.5 h-3.5 text-purple-500" />
                            <span className="text-purple-700">{subCount} subseller{subCount > 1 ? 's' : ''}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 ml-2 text-[10px]"
                              onClick={(e) => { e.stopPropagation(); toggleAllInGroup(g); }}
                            >
                              Selecionar grupo
                            </Button>
                          </button>
                        </td>
                      </tr>
                    )}

                    {/* Seller row — or placeholder if seller has no case in scope but has subsellers */}
                    {g.sellerCase ? (
                      <CaseRow
                        caseRecord={g.sellerCase}
                        merchant={sellerMerchant}
                        role="seller"
                        resolvedDoc={resolvedDocs[g.sellerCase.id]}
                        bankRecord={bankMap[g.sellerCase.id]}
                        selected={selected.has(g.sellerCase.id)}
                        onToggleSelect={toggleOne}
                        onGenerateLink={generateLink}
                        onCopyLink={copyLink}
                        generatingLinks={generatingLinks}
                        subsellerCount={subCount}
                      />
                    ) : subCount > 0 ? (
                      <CaseRow
                        role="seller-placeholder"
                        merchant={sellerMerchant}
                        subsellerCount={subCount}
                      />
                    ) : null}

                    {/* Subseller rows (only when expanded) */}
                    {isExpanded && g.subsellerCases.map((sc) => (
                      <CaseRow
                        key={sc.id}
                        caseRecord={sc}
                        merchant={merchants[sc.merchantId] || {}}
                        role="subseller"
                        resolvedDoc={resolvedDocs[sc.id]}
                        bankRecord={bankMap[sc.id]}
                        selected={selected.has(sc.id)}
                        onToggleSelect={toggleOne}
                        onGenerateLink={generateLink}
                        onCopyLink={copyLink}
                        generatingLinks={generatingLinks}
                      />
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <div className="text-xs text-muted-foreground flex flex-wrap gap-4">
        <span><strong>{visibleCount}</strong> casos visíveis</span>
        <span><strong>{groups.filter(g => g.sellerCase).length}</strong> sellers</span>
        <span><strong>{groups.reduce((acc, g) => acc + g.subsellerCases.length, 0)}</strong> subsellers</span>
        <span><strong>{selected.size}</strong> selecionados</span>
      </div>
    </div>
  );
}