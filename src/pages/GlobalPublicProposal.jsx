import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { XCircle, MessageSquare, CheckCircle2, AlertTriangle, DollarSign, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { usePublicGlobalI18n } from '@/components/global/public/usePublicGlobalI18n';
import PublicGlobalShell from '@/components/global/public/PublicGlobalShell';
import ProposalAcceptedScreen from '@/components/global/public/ProposalAcceptedScreen';

/**
 * Página pública da proposta Global. Acessada via ?token=<public_link_token>.
 * Permite aceitar, recusar ou enviar contraproposta.
 */
export default function GlobalPublicProposal() {
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [actionState, setActionState] = useState(null); // 'accepted' | 'rejected' | 'counter_sent'
  const [counterOpen, setCounterOpen] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const initialLang = (proposal?.language) || 'en';
  const { lang, setLang, t } = usePublicGlobalI18n(initialLang);

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return; }
    (async () => {
      try {
        const res = await base44.functions.invoke('publicGlobalProposal', { action: 'load', token });
        if (res?.data?.proposal) {
          setProposal(res.data.proposal);
          // Quando o lang inicial vier da proposta, força a troca no hook.
          if (res.data.proposal.language) setLang(res.data.proposal.language);
        } else setNotFound(true);
      } catch (e) {
        setNotFound(true);
      } finally { setLoading(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const accept = async () => {
    await base44.functions.invoke('publicGlobalProposal', { action: 'accept', token });
    setActionState('accepted');
  };
  const reject = async () => {
    await base44.functions.invoke('publicGlobalProposal', { action: 'reject', token });
    setActionState('rejected');
  };

  if (loading) {
    return (
      <PublicGlobalShell title="Pin Bank Global" lang={lang} setLang={setLang}>
        <div className="p-12 text-center text-[#0A0A0A]/60">{t('loading')}</div>
      </PublicGlobalShell>
    );
  }

  if (notFound) {
    return (
      <PublicGlobalShell title="Pin Bank Global" lang={lang} setLang={setLang}>
        <div className="p-10 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-[#0A0A0A]/70">{t('prop_not_found')}</p>
        </div>
      </PublicGlobalShell>
    );
  }

  if (actionState === 'accepted' || proposal.status === 'accepted') {
    return (
      <PublicGlobalShell title={t('prop_title')} lang={lang} setLang={setLang}>
        <ProposalAcceptedScreen t={t} lang={lang} />
      </PublicGlobalShell>
    );
  }
  if (actionState === 'rejected' || proposal.status === 'rejected') {
    return (
      <PublicGlobalShell title={t('prop_title')} lang={lang} setLang={setLang}>
        <div className="p-10 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-[#0A0A0A] mb-2">{t('prop_rejected_title')}</h2>
          <p className="text-[#0A0A0A]/70">{t('prop_rejected_desc')}</p>
        </div>
      </PublicGlobalShell>
    );
  }
  if (actionState === 'counter_sent') {
    return (
      <PublicGlobalShell title={t('prop_title')} lang={lang} setLang={setLang}>
        <div className="p-10 text-center">
          <MessageSquare className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-[#0A0A0A] mb-2">{t('prop_counter_sent')}</h2>
          <p className="text-[#0A0A0A]/70">{t('prop_counter_sent_desc')}</p>
        </div>
      </PublicGlobalShell>
    );
  }

  const fmtUsd = (v) => `$${Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  const fmtPct = (v) => `${Number(v || 0).toFixed(3)}%`;

  return (
    <PublicGlobalShell title={t('prop_title')} lang={lang} setLang={setLang} maxWidth="4xl">
      <div className="p-6 md:p-8 space-y-6">
        {/* Intro */}
        <p className="text-[#0A0A0A]/70">{t('prop_intro', { name: proposal.contact_name || proposal.client_name })}</p>

        {/* Hero: taxa final + fixo */}
        <div className="grid md:grid-cols-2 gap-4">
          <HeroBox icon={DollarSign} label={t('prop_final_rate')} value={fmtPct(proposal.final_rate_percentage)} accent />
          <HeroBox icon={DollarSign} label={t('prop_fixed_fee')} value={fmtUsd(proposal.final_fixed_fee)} accent />
        </div>

        {/* Breakdown */}
        <div className="bg-[#f4f4f4]/50 rounded-2xl p-5 border border-[#0A0A0A]/5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]/60 mb-3">{t('prop_breakdown')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <BreakdownItem label={t('prop_base')} value={fmtPct(proposal.base_cost_percentage)} />
            <BreakdownItem label={t('prop_interchange')} value={`${fmtPct(proposal.interchange_percentage)} + ${fmtUsd(proposal.interchange_fixed)}`} />
            <BreakdownItem label={t('prop_markup')} value={fmtPct(proposal.markup_percentage)} />
          </div>
        </div>

        {/* Outros termos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <InfoBox icon={Clock}      label={t('prop_settlement')}      value={proposal.settlement_days || '—'} />
          <InfoBox icon={DollarSign} label={t('prop_rolling_reserve')} value={`${proposal.rolling_reserve_percentage || 0}% · ${proposal.rolling_reserve_days || 0}d`} />
          <InfoBox icon={DollarSign} label={t('prop_setup')}           value={fmtUsd(proposal.setup_fee)} />
          <InfoBox icon={DollarSign} label={t('prop_chargeback')}      value={fmtUsd(proposal.chargeback_fee)} />
        </div>

        {/* Detalhes adicionais */}
        <div className="text-xs text-[#0A0A0A]/60 space-y-1">
          <div>{t('prop_refund')}: <strong className="text-[#0A0A0A]">{fmtUsd(proposal.refund_fee)}</strong></div>
          {proposal.risk_control_fee != null && <div>{t('prop_risk')}: <strong className="text-[#0A0A0A]">{fmtUsd(proposal.risk_control_fee)}</strong></div>}
          {proposal.valid_until && <div>{t('prop_valid_until')}: <strong className="text-[#0A0A0A]">{proposal.valid_until}</strong></div>}
          {proposal.mccs?.length > 0 && <div>MCCs: <strong className="text-[#0A0A0A]">{proposal.mccs.join(', ')}</strong></div>}
          {proposal.target_markets?.length > 0 && <div>Markets: <strong className="text-[#0A0A0A]">{proposal.target_markets.join(', ')}</strong></div>}
        </div>

        {/* Ações */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-[#0A0A0A]/5">
          <Button onClick={accept} className="bg-[#1356E2] hover:bg-[#1356E2]/90">
            <CheckCircle2 className="w-4 h-4 mr-1.5" /> {t('prop_accept')}
          </Button>
          <Button variant="outline" onClick={() => setCounterOpen(true)}>
            <MessageSquare className="w-4 h-4 mr-1.5" /> {t('prop_counter')}
          </Button>
          <Button variant="ghost" onClick={reject} className="text-red-500 hover:text-red-600 hover:bg-red-50">
            <XCircle className="w-4 h-4 mr-1.5" /> {t('prop_reject')}
          </Button>
        </div>
      </div>

      <CounterProposalDialog
        open={counterOpen} onClose={() => setCounterOpen(false)}
        proposal={proposal} token={token} t={t}
        onSent={() => { setCounterOpen(false); setActionState('counter_sent'); }}
      />
    </PublicGlobalShell>
  );
}

function HeroBox({ icon: Icon, label, value, accent }) {
  return (
    <div className={`rounded-2xl p-5 border ${accent ? 'border-[#1356E2]/30 bg-gradient-to-br from-[#1356E2]/5 to-[#E84B1C]/5' : 'border-[#0A0A0A]/5 bg-white'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-[#1356E2]" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A0A0A]/60">{label}</span>
      </div>
      <div className="text-3xl font-bold font-mono text-[#0A0A0A]">{value}</div>
    </div>
  );
}
function InfoBox({ icon: Icon, label, value }) {
  return (
    <div className="bg-white rounded-xl border border-[#0A0A0A]/5 p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 text-[#0A0A0A]/40" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-[#0A0A0A]/50">{label}</span>
      </div>
      <div className="text-sm font-semibold text-[#0A0A0A]">{value}</div>
    </div>
  );
}
function BreakdownItem({ label, value }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[#0A0A0A]/50">{label}</div>
      <div className="font-mono text-sm text-[#0A0A0A] mt-0.5">{value}</div>
    </div>
  );
}

function CounterProposalDialog({ open, onClose, proposal, token, t, onSent }) {
  const [rate, setRate] = useState('');
  const [fixed, setFixed] = useState('');
  const [settlement, setSettlement] = useState(proposal?.settlement_days || 'D+2');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await base44.functions.invoke('publicGlobalProposal', {
        action: 'counter',
        token,
        payload: {
          counter_rate: rate ? Number(rate) : undefined,
          counter_fixed_fee: fixed ? Number(fixed) : undefined,
          counter_settlement: settlement,
          counter_notes: notes,
        },
      });
      onSent();
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t('prop_counter_title')}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">{t('prop_counter_rate')}</Label>
            <Input type="number" step="0.01" value={rate} onChange={e => setRate(e.target.value)} placeholder={String(proposal?.final_rate_percentage || '')} />
          </div>
          <div>
            <Label className="text-xs">{t('prop_counter_fixed')}</Label>
            <Input type="number" step="0.01" value={fixed} onChange={e => setFixed(e.target.value)} placeholder={String(proposal?.final_fixed_fee || '')} />
          </div>
          <div>
            <Label className="text-xs">{t('prop_counter_settlement')}</Label>
            <Select value={settlement} onValueChange={setSettlement}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>{['D+1','D+2','D+7','D+15','D+30'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{t('prop_counter_notes')}</Label>
            <Textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>{t('back')}</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? t('loading') : t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}