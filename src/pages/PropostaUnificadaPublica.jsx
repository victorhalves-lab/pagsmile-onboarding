import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Globe2, Flag, CheckCircle2, Clock, ExternalLink, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Página pública do pacote unificado. URL: /u/:slug
 * Renderiza header com cliente + tabs Brasil/Global. Cada tab embute
 * a página pública existente (PropostaPadraoPublica, PropostaPixPublica,
 * PropostaPublica, GlobalPublicProposal) via iframe — preservando 100%
 * dos fluxos de aceite/compliance.
 */
export default function PropostaUnificadaPublica() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('br');
  const [lang, setLang] = useState('pt');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke('publicUnifiedProposal', { action: 'load', slug });
        if (cancelled) return;
        if (res.data?.error) { setError(res.data.error); return; }
        setData(res.data);
        setLang(res.data?.package?.default_language || 'pt');
        // Define aba inicial baseada no que está disponível
        const hasBr = !!(res.data.br?.custom || res.data.br?.standard || res.data.br?.pix);
        setActiveTab(hasBr ? 'br' : 'global');
      } catch (e) {
        setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const pkg = data?.package;
  const hasBr = !!(data?.br?.custom || data?.br?.standard || data?.br?.pix);
  const hasGlobal = !!data?.global;

  // URL embed do iframe — qual proposta BR usar? Prioridade: custom > standard > pix
  const brEmbedUrl = useMemo(() => {
    if (!data?.br) return null;
    const origin = window.location.origin;
    if (data.br.custom?.public_link_token)   return `${origin}/PropostaPublica?token=${data.br.custom.public_link_token}&embed=1`;
    if (data.br.standard?.public_link_token) return `${origin}/PropostaPadraoPublica?token=${data.br.standard.public_link_token}&embed=1`;
    if (data.br.pix?.public_link_token)      return `${origin}/PropostaPixPublica?token=${data.br.pix.public_link_token}&embed=1`;
    return null;
  }, [data]);

  const globalEmbedUrl = useMemo(() => {
    if (!data?.global?.public_link_token) return null;
    return `${window.location.origin}/GlobalPublicProposal?token=${data.global.public_link_token}&embed=1&lang=${lang}`;
  }, [data, lang]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4]">
      <div className="w-10 h-10 border-4 border-[#2bc196] border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  if (error || !pkg) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4]">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[#002443]">Link não encontrado</h2>
        <p className="text-sm text-[#002443]/60 mt-2">{error || 'O link pode ter expirado ou estar incorreto.'}</p>
      </div>
    </div>;
  }

  const brStatus = data.br?.custom?.status || data.br?.standard?.status || data.br?.pix?.status;
  const globalStatus = data.global?.status;

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      {/* Header */}
      <header className="bg-[#002443] text-white">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png" alt="Pagsmile" className="h-7" />
              <div className="h-6 w-px bg-white/20" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/50">Proposta para</div>
                <div className="text-base font-bold">{pkg.client_name}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              {pkg.valid_until && (
                <div className="flex items-center gap-1.5 text-white/70">
                  <Clock className="w-3.5 h-3.5" /> Válida até {new Date(pkg.valid_until).toLocaleDateString('pt-BR')}
                </div>
              )}
              <select value={lang} onChange={e => setLang(e.target.value)}
                className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs">
                <option value="pt" className="text-[#002443]">🇧🇷 PT</option>
                <option value="en" className="text-[#002443]">🇺🇸 EN</option>
                <option value="zh" className="text-[#002443]">🇨🇳 ZH</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="flex gap-1">
            {hasBr && (
              <TabButton
                active={activeTab === 'br'}
                onClick={() => setActiveTab('br')}
                icon={<Flag className="w-4 h-4" />}
                label="Brasil"
                status={brStatus}
              />
            )}
            {hasGlobal && (
              <TabButton
                active={activeTab === 'global'}
                onClick={() => setActiveTab('global')}
                icon={<Globe2 className="w-4 h-4" />}
                label="Global"
                status={globalStatus}
              />
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo da tab */}
      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-6">
        {activeTab === 'br' && hasBr && (
          <ProposalEmbed url={brEmbedUrl} fallbackTitle="Proposta Brasil" />
        )}
        {activeTab === 'global' && hasGlobal && (
          <ProposalEmbed url={globalEmbedUrl} fallbackTitle="Proposta Global" />
        )}
      </main>

      {/* Aviso de fluxos separados */}
      <div className="max-w-6xl mx-auto px-4 lg:px-8 pb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
          <strong>💡 Como funciona:</strong> Cada proposta (Brasil e Global) tem seu próprio aceite e compliance, conforme regulação local.
          Ao aceitar Brasil, você inicia o KYC brasileiro. Ao aceitar Global, você inicia o KYC internacional. Os fluxos são independentes.
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, status }) {
  const accepted = status === 'accepted';
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 rounded-t-lg transition-all border-b-2 ${
        active
          ? 'bg-[#f4f4f4] text-[#002443] border-[#2bc196]'
          : 'bg-transparent text-white/70 border-transparent hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="text-sm font-semibold">{label}</span>
      {accepted && <CheckCircle2 className="w-3.5 h-3.5 text-[#2bc196]" />}
    </button>
  );
}

function ProposalEmbed({ url, fallbackTitle }) {
  if (!url) {
    return <div className="bg-white rounded-2xl p-6 text-center text-[#002443]/60">
      <p>Proposta não disponível.</p>
    </div>;
  }
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-[#f4f4f4]/80 border-b border-[#002443]/5">
        <span className="text-xs text-[#002443]/60">{fallbackTitle}</span>
        <a href={url.replace('&embed=1', '').replace('?embed=1', '')} target="_blank" rel="noopener noreferrer"
          className="text-xs text-[#2bc196] hover:underline flex items-center gap-1">
          Abrir em tela cheia <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <iframe
        src={url}
        className="w-full"
        style={{ height: 'calc(100vh - 220px)', minHeight: 600, border: 0 }}
        title={fallbackTitle}
      />
    </div>
  );
}