import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import IntroducerPortalHeader from '../components/introducer-portal/IntroducerPortalHeader';
import IntroducerPortalKPIs from '../components/introducer-portal/IntroducerPortalKPIs';
import IntroducerPortalLeadsTable from '../components/introducer-portal/IntroducerPortalLeadsTable';
import IntroducerPortalCharts from '../components/introducer-portal/IntroducerPortalCharts';
import IntroducerShareLink from '../components/introducer-portal/IntroducerShareLink';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function IntroducerDashboard() {
  const { t } = useTranslation();
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const isIntroducer = user?.role === 'introducer' && user?.introducerId;

  const { data: introducer, isLoading: loadingIntroducer } = useQuery({
    queryKey: ['my-introducer', user?.introducerId],
    queryFn: async () => {
      const results = await base44.entities.Introducer.filter({ id: user.introducerId });
      return results[0] || null;
    },
    enabled: !!isIntroducer,
  });

  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ['my-introducer-leads', user?.introducerId],
    queryFn: () => base44.entities.Lead.filter({ introducerId: user.introducerId }, '-created_date', 500),
    enabled: !!isIntroducer,
  });

  const { data: proposals = [], isLoading: loadingProposals } = useQuery({
    queryKey: ['my-introducer-proposals'],
    queryFn: async () => {
      const allProposals = await base44.entities.Proposal.list('-created_date', 500);
      const leadIds = leads.map(l => l.id);
      return allProposals.filter(p => leadIds.includes(p.leadId));
    },
    enabled: leads.length > 0,
  });

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1356E2]" />
      </div>
    );
  }

  if (!isIntroducer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4]">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow-lg border border-[#0A0A0A]/5">
          <ShieldAlert className="w-16 h-16 mx-auto text-red-400 mb-4" />
          <h1 className="text-xl font-bold text-[#0A0A0A] mb-2">{t('idash.restricted_title')}</h1>
          <p className="text-sm text-[#0A0A0A]/60 mb-6">
            {t('idash.restricted_desc')}
          </p>
          <Button onClick={() => base44.auth.logout()} className="bg-[#0A0A0A] hover:bg-[#0A0A0A]/90 text-white rounded-xl">
            {t('idash.back_login')}
          </Button>
        </div>
      </div>
    );
  }

  const isLoading = loadingIntroducer || loadingLeads;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1356E2] mx-auto mb-3" />
          <p className="text-sm text-[#0A0A0A]/50">{t('idash.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <IntroducerPortalHeader user={user} introducer={introducer} />
        <IntroducerPortalKPIs leads={leads} proposals={proposals} />
        <IntroducerShareLink introducer={introducer} />
        <IntroducerPortalCharts leads={leads} />
        <div>
          <h2 className="text-lg font-bold text-[#0A0A0A] mb-3">{t('idash.my_leads')}</h2>
          <IntroducerPortalLeadsTable leads={leads} />
        </div>
      </div>
    </div>
  );
}