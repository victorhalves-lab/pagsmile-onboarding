import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Globe, Plus, Pencil, ExternalLink, Eye, EyeOff, Search,
  Loader2, Copy, Check, LayoutTemplate
} from 'lucide-react';
import { toast } from 'sonner';
import IntroducerFormModal from '@/components/introducers/IntroducerFormModal';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function GestaoLandingPages() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIntroducer, setEditingIntroducer] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const { data: introducers = [], isLoading } = useQuery({
    queryKey: ['introducers-lp'],
    queryFn: () => base44.entities.Introducer.list('-created_date', 200),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads-for-lp'],
    queryFn: () => base44.entities.Lead.list('-created_date', 500),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingIntroducer) {
        await base44.entities.Introducer.update(editingIntroducer.id, data);
      } else {
        await base44.entities.Introducer.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['introducers-lp'] });
      setModalOpen(false);
      setEditingIntroducer(null);
      toast.success(editingIntroducer ? t('glp.updated') : t('glp.created'));
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }) => {
      await base44.entities.Introducer.update(id, { landingPageActive: active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['introducers-lp'] });
      toast.success(t('glp.status_updated'));
    },
  });

  // Filter only company-type introducers that have a landing page slug
  const companyIntroducers = introducers.filter(i => i.type === 'company');
  const filtered = companyIntroducers.filter(i => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (i.companyName || '').toLowerCase().includes(s) ||
           (i.name || '').toLowerCase().includes(s) ||
           (i.uniqueLandingPageSlug || '').toLowerCase().includes(s);
  });

  const handleEdit = (intro) => {
    setEditingIntroducer(intro);
    setModalOpen(true);
  };

  const handleNew = () => {
    setEditingIntroducer(null);
    setModalOpen(true);
  };

  const copyLink = (slug) => {
    const url = `${window.location.origin}/parceiro/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(slug);
    toast.success(t('glp.link_copied'));
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getLeadCount = (intro) => {
    return leads.filter(l => l.introducerId === intro.id || l.introducerReferralCode === intro.referralCode).length;
  };

  const appBaseUrl = window.location.origin;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#002443]">{t('glp.title')}</h1>
          <p className="text-sm text-[#002443]/50 mt-1">{t('glp.subtitle')}</p>
        </div>
        <Button onClick={handleNew} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> {t('glp.new')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={t('glp.landing_pages')} value={companyIntroducers.length} icon={LayoutTemplate} />
        <StatCard label={t('glp.active')} value={companyIntroducers.filter(i => i.landingPageActive !== false).length} icon={Eye} color="green" />
        <StatCard label={t('glp.inactive')} value={companyIntroducers.filter(i => i.landingPageActive === false).length} icon={EyeOff} color="slate" />
        <StatCard label={t('glp.leads_generated')} value={companyIntroducers.reduce((sum, i) => sum + getLeadCount(i), 0)} icon={Globe} color="blue" />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002443]/30" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('glp.search_placeholder')}
          className="pl-10 rounded-xl"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#002443]/5 p-12 text-center">
          <LayoutTemplate className="w-12 h-12 text-[#002443]/15 mx-auto mb-4" />
          <h3 className="font-bold text-[#002443] mb-1">{t('glp.no_found')}</h3>
          <p className="text-sm text-[#002443]/50 mb-4">{t('glp.no_found_desc')}</p>
          <Button onClick={handleNew} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> {t('glp.create')}
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('glp.partner')}</TableHead>
                <TableHead>{t('glp.url')}</TableHead>
                <TableHead className="text-center">{t('glp.segments')}</TableHead>
                <TableHead className="text-center">{t('glp.status')}</TableHead>
                <TableHead className="text-center">{t('glp.leads')}</TableHead>
                <TableHead className="text-right">{t('glp.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(intro => (
                <TableRow key={intro.id} className="hover:bg-[#f4f4f4] transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {intro.companyLogoUrl ? (
                        <img src={intro.companyLogoUrl} alt="" className="w-9 h-9 rounded-lg object-contain border border-[#002443]/5 p-0.5" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-[#2bc196]/10 flex items-center justify-center">
                          <Globe className="w-4 h-4 text-[#2bc196]" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-sm text-[#002443]">{intro.companyName || intro.name}</p>
                        <p className="text-[10px] text-[#002443]/40">{t('glp.code')}: {intro.referralCode}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {intro.uniqueLandingPageSlug ? (
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-[#f4f4f4] px-2 py-1 rounded-lg text-[#002443]/60 font-mono">
                          /parceiro/{intro.uniqueLandingPageSlug}
                        </code>
                        <button onClick={() => copyLink(intro.uniqueLandingPageSlug)} className="text-[#002443]/30 hover:text-[#2bc196] transition-colors">
                          {copiedId === intro.uniqueLandingPageSlug ? <Check className="w-3.5 h-3.5 text-[#2bc196]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-[#002443]/30">{t('glp.not_configured')}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      {(intro.standardRates || []).length > 0 ? (
                        <Badge className="bg-[#2bc196]/10 text-[#2bc196] text-[10px] border-0">
                          {t('glp.n_segments', { count: intro.standardRates.length })}
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 text-[10px] border-0">
                          {t('glp.no_rates')}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      onClick={() => toggleActiveMutation.mutate({ id: intro.id, active: intro.landingPageActive === false })}
                      className="inline-flex items-center"
                    >
                      <Badge className={`text-xs cursor-pointer transition-all ${intro.landingPageActive !== false ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                        {intro.landingPageActive !== false ? t('glp.active_status') : t('glp.inactive_status')}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-sm text-[#002443]">{getLeadCount(intro)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {intro.uniqueLandingPageSlug && (
                        <Link to={`/parceiro/${intro.uniqueLandingPageSlug}`} target="_blank">
                          <Button variant="ghost" size="sm" className="h-7 text-[#2bc196]" title="Visualizar Landing Page">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(intro)} className="h-7" title="Editar">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <IntroducerFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingIntroducer(null); }}
        introducer={editingIntroducer}
        onSave={(data) => saveMutation.mutate(data)}
        isSaving={saveMutation.isPending}
      />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color = 'emerald' }) {
  const colorMap = {
    emerald: 'bg-[#2bc196]/10 text-[#2bc196]',
    green: 'bg-green-100 text-green-600',
    slate: 'bg-slate-100 text-slate-500',
    blue: 'bg-blue-100 text-blue-600',
  };
  return (
    <div className="bg-white rounded-xl border border-[#002443]/5 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-2xl font-bold text-[#002443]">{value}</p>
          <p className="text-xs text-[#002443]/50">{label}</p>
        </div>
      </div>
    </div>
  );
}