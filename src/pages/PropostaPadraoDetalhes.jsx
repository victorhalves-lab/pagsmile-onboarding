import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil, Loader2, FileText, Link2, Copy, Check, ExternalLink, Eye, Tag, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import PropostaRevisaoResumo from '@/components/proposals/PropostaRevisaoResumo';
import RentabilidadeDrawer from '@/components/proposals/RentabilidadeDrawer';
import DownloadPdfButton from '@/components/proposals/DownloadPdfButton';
import { useTranslation } from '@/lib/i18n/LanguageContext';

const STATUS_CONFIG = {
  rascunho: { label: 'Rascunho', color: 'bg-slate-100 text-slate-700' },
  ativa: { label: 'Ativa', color: 'bg-green-100 text-green-700' },
  inativa: { label: 'Inativa', color: 'bg-red-100 text-red-700' },
};

export default function PropostaPadraoDetalhes() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const proposalId = urlParams.get('id');
  const [copied, setCopied] = useState(false);
  const [showRentabilidade, setShowRentabilidade] = useState(false);

  const { data: proposta, isLoading } = useQuery({
    queryKey: ['std-proposal-detalhes', proposalId],
    queryFn: () => base44.entities.StandardProposal.filter({ id: proposalId }),
    enabled: !!proposalId,
    select: (data) => data?.[0],
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#1356E2]" /></div>;
  }

  if (!proposta) {
    return (
      <div className="text-center py-20">
        <FileText className="w-12 h-12 mx-auto text-[#0A0A0A]/20 mb-4" />
        <p className="text-[#0A0A0A]/60">{t('spd.not_found')}</p>
        <Button variant="link" onClick={() => navigate('/GestaoPropostasPadrao')} className="mt-2">{t('spd.back')}</Button>
      </div>
    );
  }

  const sCfg = STATUS_CONFIG[proposta.status] || STATUS_CONFIG.rascunho;
  const publicLink = proposta.publicSlug
    ? `${window.location.origin}/pp/${proposta.publicSlug}`
    : proposta.tokenPublico
    ? `${window.location.origin}/PropostaPadraoPublica?token=${proposta.tokenPublico}`
    : null;

  const handleCopy = () => {
    if (!publicLink) return;
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    toast.success(t('spd.link_copied'));
    setTimeout(() => setCopied(false), 3000);
  };

  // Build a "fake" proposta-like object for PropostaRevisaoResumo
  const propostaLike = {
    ...proposta,
    clienteNome: proposta.templateName,
    clienteCnpj: '',
    clienteContato: '',
    clienteMcc: '',
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A0A0A] to-[#E84B1C] rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/GestaoPropostasPadrao')} className="text-white/70 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-white">{proposta.templateName}</h1>
              <Badge className={sCfg.color}>{sCfg.label}</Badge>
              <Badge className="bg-[#1356E2]/20 text-[#E84B1C] border-none">
                <Tag className="w-3 h-3 mr-1" />{proposta.segment}
              </Badge>
            </div>
            <p className="text-white/50 text-sm mt-1">{proposta.codigo} — {t('spd.standard_proposal')}</p>
          </div>
          <Button onClick={() => navigate(`/CriarPropostaPadrao?edit=${proposta.id}`)} className="bg-white/10 hover:bg-white/20 text-white gap-2 rounded-xl">
            <Pencil className="w-4 h-4" /> {t('spd.edit')}
          </Button>
        </div>
        <div className="flex flex-wrap gap-6 text-xs mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-white/50">{t('spd.created')}:</span>
            <span className="font-semibold text-white">{moment(proposta.created_date).format('DD/MM/YYYY HH:mm')}</span>
          </div>
          {proposta.description && (
            <div className="flex items-center gap-2">
              <span className="text-white/50">{t('spd.description')}:</span>
              <span className="font-semibold text-white">{proposta.description}</span>
            </div>
          )}
        </div>
      </div>

      {/* Link section */}
      {proposta.status === 'rascunho' ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0A0A0A]">{t('spd.link_unavailable')}</h2>
              <p className="text-sm text-[#0A0A0A]/60">{t('spd.activate_for_link')}</p>
            </div>
          </div>
        </div>
      ) : publicLink ? (
        <div className="bg-white rounded-2xl border border-[#1356E2]/30 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#1356E2]/10 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-[#1356E2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0A0A0A]">{t('spd.public_link')}</h2>
              <p className="text-sm text-[#0A0A0A]/60">{t('spd.send_link_to')} {proposta.segment}.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#f4f4f4] rounded-xl p-3 mb-4">
            <code className="flex-1 text-sm text-[#0A0A0A]/70 truncate select-all font-mono">{publicLink}</code>
            <Button onClick={handleCopy} size="sm" className={`gap-2 rounded-lg shrink-0 ${copied ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-[#1356E2] hover:bg-[#1356E2]/90 text-white'}`}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? t('spd.copied') : t('spd.copy_link')}
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <a href={publicLink} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2"><ExternalLink className="w-4 h-4" /> {t('spd.open_page')}</Button>
            </a>
            <a href={publicLink} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="gap-2 text-[#0A0A0A]/60"><Eye className="w-4 h-4" /> {t('spd.preview')}</Button>
            </a>
          </div>
        </div>
      ) : null}

      {/* Botão Rentabilidade + Download PDF */}
      <div className="flex justify-end gap-2">
        <DownloadPdfButton
          type="standard_proposal"
          proposalId={proposta.id}
          codigo={proposta.codigo}
        />
        <Button onClick={() => setShowRentabilidade(true)} className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white gap-2 rounded-xl shadow-md">
          <DollarSign className="w-4 h-4" /> {t('pd.simulate_profitability')}
        </Button>
      </div>

      {/* Resumo */}
      <PropostaRevisaoResumo proposta={propostaLike} />

      <div className="flex justify-center pb-8">
        <Button variant="outline" onClick={() => navigate('/GestaoPropostasPadrao')} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> {t('spd.back_standard')}
        </Button>
      </div>

      {/* Rentabilidade Drawer */}
      <RentabilidadeDrawer
        open={showRentabilidade}
        onClose={() => setShowRentabilidade(false)}
        proposal={propostaLike}
      />
    </div>
  );
}