import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import moment from 'moment';
import { useTranslation } from '@/lib/i18n/LanguageContext';

const STATUS_LABELS_BASE = {
  questionario_preenchido: { label: 'Questionário Preenchido', color: 'bg-blue-100 text-blue-700' },
  analisado_priscila: { label: 'Em Análise', color: 'bg-purple-100 text-purple-700' },
  em_contato_comercial: { label: 'Contato Comercial', color: 'bg-amber-100 text-amber-700' },
  proposta_enviada: { label: 'Proposta Enviada', color: 'bg-indigo-100 text-indigo-700' },
  proposta_aceita: { label: 'Proposta Aceita', color: 'bg-green-100 text-green-700' },
  proposta_recusada: { label: 'Proposta Recusada', color: 'bg-red-100 text-red-700' },
  kyc_iniciado: { label: 'KYC Iniciado', color: 'bg-cyan-100 text-cyan-700' },
  kyc_aprovado: { label: 'KYC Aprovado', color: 'bg-emerald-100 text-emerald-700' },
  kyc_revisao_manual: { label: 'KYC em Revisão', color: 'bg-orange-100 text-orange-700' },
  ativado: { label: 'Ativado', color: 'bg-green-100 text-green-700' },
  perdido: { label: 'Perdido', color: 'bg-slate-100 text-slate-500' },
};

export default function IntroducerPortalLeadsTable({ leads }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const STATUS_LABELS = {
    questionario_preenchido: { label: t('idash.status_questionario'), color: 'bg-blue-100 text-blue-700' },
    analisado_priscila: { label: t('idash.status_analisado'), color: 'bg-purple-100 text-purple-700' },
    em_contato_comercial: { label: t('idash.status_contato'), color: 'bg-amber-100 text-amber-700' },
    proposta_enviada: { label: t('idash.status_proposta_enviada'), color: 'bg-indigo-100 text-indigo-700' },
    proposta_aceita: { label: t('idash.status_proposta_aceita'), color: 'bg-green-100 text-green-700' },
    proposta_recusada: { label: t('idash.status_proposta_recusada'), color: 'bg-red-100 text-red-700' },
    kyc_iniciado: { label: t('idash.status_kyc_iniciado'), color: 'bg-cyan-100 text-cyan-700' },
    kyc_aprovado: { label: t('idash.status_kyc_aprovado'), color: 'bg-emerald-100 text-emerald-700' },
    kyc_revisao_manual: { label: t('idash.status_kyc_revisao'), color: 'bg-orange-100 text-orange-700' },
    ativado: { label: t('idash.status_ativado'), color: 'bg-green-100 text-green-700' },
    perdido: { label: t('idash.status_perdido'), color: 'bg-slate-100 text-slate-500' },
  };

  const filtered = useMemo(() => {
    let result = leads;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(l =>
        (l.fullName || '').toLowerCase().includes(s) ||
        (l.companyName || '').toLowerCase().includes(s) ||
        (l.email || '').toLowerCase().includes(s)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(l => l.status === statusFilter);
    }
    return result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [leads, search, statusFilter]);

  const hasFilters = search || statusFilter !== 'all';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A0A0A]/40" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('idash.search_placeholder')}
            className="pl-10 h-10 rounded-xl"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] h-10 rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('idash.all_statuses')}</SelectItem>
            {Object.entries(STATUS_LABELS_BASE).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); }}>
            <X className="w-4 h-4 mr-1" /> {t('idash.clear')}
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('idash.col_lead')}</TableHead>
                <TableHead>{t('idash.col_company')}</TableHead>
                <TableHead>{t('idash.col_type')}</TableHead>
                <TableHead>{t('idash.col_status')}</TableHead>
                <TableHead className="text-center">{t('idash.col_score')}</TableHead>
                <TableHead className="text-right">{t('idash.col_tpv')}</TableHead>
                <TableHead>{t('idash.col_date')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <p className="text-[#0A0A0A]/50">{t('idash.no_leads')}</p>
                  </TableCell>
                </TableRow>
              ) : filtered.map(lead => {
                const st = STATUS_LABELS[lead.status] || { label: lead.status, color: 'bg-slate-100 text-slate-500' };
                return (
                  <TableRow key={lead.id} className="hover:bg-[#f4f4f4] transition-colors">
                    <TableCell>
                      <p className="font-semibold text-sm">{lead.fullName}</p>
                      <p className="text-[10px] text-[#0A0A0A]/40">{lead.email}</p>
                    </TableCell>
                    <TableCell><span className="text-sm">{lead.companyName || '-'}</span></TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {lead.businessSubCategory || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${st.color} text-[10px] border-0`}>{st.label}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {lead.leadQualifierScore != null ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${
                          lead.leadQualifierScore >= 70 ? 'text-green-600 bg-green-50 border-green-200' :
                          lead.leadQualifierScore >= 40 ? 'text-amber-600 bg-amber-50 border-amber-200' :
                          'text-red-600 bg-red-50 border-red-200'
                        }`}>
                          <Star className="w-3 h-3" /> {lead.leadQualifierScore}
                        </span>
                      ) : <span className="text-xs text-[#0A0A0A]/30">-</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-sm">
                        {lead.tpvMensal ? `R$ ${lead.tpvMensal.toLocaleString()}` : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-[#0A0A0A]/50">
                        {lead.created_date ? moment(lead.created_date).format('DD/MM/YY') : '-'}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
      <p className="text-[10px] text-[#0A0A0A]/30 text-right">{t('idash.leads_count', { filtered: filtered.length, total: leads.length })}</p>
    </div>
  );
}