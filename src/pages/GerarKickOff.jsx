import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Printer, Presentation, RotateCcw, Link as LinkIcon, Copy, Check, Loader2, Plus, Building2, ExternalLink, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import ClientSelector from '@/components/kickoff/ClientSelector';
import KickOffPresentation from '@/components/kickoff/KickOffPresentation';

function generateToken() {
  const c = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let t = '';
  for (let i = 0; i < 24; i++) t += c.charAt(Math.floor(Math.random() * c.length));
  return t;
}

export default function GerarKickOff() {
  const [mode, setMode] = useState('list'); // list | select | preview
  const [selectedData, setSelectedData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [copied, setCopied] = useState(false);

  const { data: presentations = [], isLoading, refetch } = useQuery({
    queryKey: ['kickoff-presentations'],
    queryFn: () => base44.entities.KickOffPresentation.filter({ status: 'ativa' }, '-created_date', 50),
  });

  const handleSelect = (data) => {
    setSelectedData(data);
    setSavedId(null);
    setMode('preview');
  };

  const handleSave = async () => {
    if (!selectedData) return;
    setSaving(true);
    const { proposal, contract } = selectedData;
    const token = generateToken();
    let user = null;
    try { user = await base44.auth.me(); } catch {}

    const record = await base44.entities.KickOffPresentation.create({
      clientName: proposal?.clienteNome || contract?.clientName || 'Cliente',
      clientCnpj: proposal?.clienteCnpj || contract?.clientDocument || '',
      proposalId: proposal?.id || '',
      proposalCodigo: proposal?.codigo || '',
      contractId: contract?.id || '',
      contractCodigo: contract?.codigo || '',
      segment: proposal?.businessSubCategory || '',
      publicToken: token,
      proposalData: proposal || {},
      contractData: contract || {},
      responsavelId: user?.id || user?.email || '',
      responsavelNome: user?.full_name || '',
      status: 'ativa',
    });

    setSavedId(record.id);
    setSaving(false);
    refetch();
    toast.success('Apresentação salva com sucesso!');
  };

  const getPublicUrl = (token) => {
    return `${window.location.origin}/KickOffPublico?token=${token}`;
  };

  const handleCopy = (token) => {
    navigator.clipboard.writeText(getPublicUrl(token));
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (id) => {
    await base44.entities.KickOffPresentation.update(id, { status: 'arquivada' });
    refetch();
    toast.success('Apresentação arquivada');
  };

  const handleOpenSaved = (pres) => {
    setSelectedData({ proposal: pres.proposalData, contract: pres.contractData });
    setSavedId(pres.id);
    setMode('preview');
  };

  // ─── LIST MODE ───
  if (mode === 'list') {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#0A0A0A] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1356E2] to-[#0A0A0A] flex items-center justify-center">
                <Presentation className="w-5 h-5 text-white" />
              </div>
              Apresentações de Kick-Off
            </h1>
            <p className="text-sm text-[#0A0A0A]/50 mt-1">Gerencie e compartilhe apresentações com seus clientes</p>
          </div>
          <Button onClick={() => setMode('select')} className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white rounded-xl px-6 font-bold">
            <Plus className="w-4 h-4 mr-2" /> Nova Apresentação
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#1356E2]" />
          </div>
        ) : presentations.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-[#0A0A0A]/5 flex items-center justify-center mx-auto mb-4">
              <Presentation className="w-10 h-10 text-[#0A0A0A]/20" />
            </div>
            <p className="text-[#0A0A0A]/40 mb-4">Nenhuma apresentação criada ainda</p>
            <Button onClick={() => setMode('select')} variant="outline" className="rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Criar primeira apresentação
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {presentations.map(pres => (
              <div key={pres.id} className="bg-white rounded-2xl border border-[#0A0A0A]/5 p-5 hover:shadow-lg transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A0A0A] to-[#0A0A0A]/80 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-[#1356E2]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0A0A0A]">{pres.clientName}</h3>
                      <p className="text-[10px] text-[#0A0A0A]/50">
                        {pres.clientCnpj || '—'} • {pres.proposalCodigo || '—'} • {pres.segment || '—'}
                      </p>
                      <p className="text-[10px] text-[#0A0A0A]/30 mt-0.5">
                        Criada em {new Date(pres.created_date).toLocaleDateString('pt-BR')} por {pres.responsavelNome || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => handleCopy(pres.publicToken)}
                      className="rounded-lg text-xs border-[#0A0A0A]/10"
                    >
                      <Copy className="w-3.5 h-3.5 mr-1.5" /> Copiar Link
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => window.open(getPublicUrl(pres.publicToken), '_blank')}
                      className="rounded-lg text-xs border-[#0A0A0A]/10"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Abrir
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => handleOpenSaved(pres)}
                      className="rounded-lg text-xs border-[#0A0A0A]/10"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => handleDelete(pres.id)}
                      className="rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 w-8 h-8"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── SELECT MODE ───
  if (mode === 'select') {
    return (
      <div>
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setMode('list')} className="rounded-xl text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar à lista
          </Button>
        </div>
        <div className="min-h-[60vh] flex items-center justify-center">
          <ClientSelector onSelect={handleSelect} />
        </div>
      </div>
    );
  }

  // ─── PREVIEW MODE ───
  const { proposal, contract } = selectedData;
  const currentToken = savedId ? presentations.find(p => p.id === savedId)?.publicToken : null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:hidden sticky top-0 z-10 bg-[#f4f4f4] py-3 -mx-4 px-4 lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setMode('list'); setSelectedData(null); }} className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-[#0A0A0A] flex items-center gap-2">
              <Presentation className="w-5 h-5 text-[#1356E2]" />
              Kick-Off — {proposal?.clienteNome || 'Cliente'}
            </h1>
            <p className="text-xs text-[#0A0A0A]/50">
              {proposal?.codigo || '—'} • {proposal?.businessSubCategory || '—'}
              {contract?.codigo ? ` • Contrato: ${contract.codigo}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentToken && (
            <Button variant="outline" onClick={() => handleCopy(currentToken)} className="rounded-xl text-sm border-[#0A0A0A]/10">
              {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copiado!' : 'Copiar Link'}
            </Button>
          )}
          {currentToken && (
            <Button variant="outline" onClick={() => window.open(getPublicUrl(currentToken), '_blank')} className="rounded-xl text-sm border-[#0A0A0A]/10">
              <ExternalLink className="w-4 h-4 mr-2" /> Abrir Link Externo
            </Button>
          )}
          {!savedId && (
            <Button onClick={handleSave} disabled={saving} className="bg-[#0A0A0A] hover:bg-[#0A0A0A]/90 text-white rounded-xl px-5 font-bold">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LinkIcon className="w-4 h-4 mr-2" />}
              Salvar & Gerar Link
            </Button>
          )}
          <Button onClick={() => window.print()} className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white rounded-xl px-5 font-bold">
            <Printer className="w-4 h-4 mr-2" /> Exportar PDF
          </Button>
        </div>
      </div>

      <KickOffPresentation proposal={proposal} contract={contract} />

      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          @page { size: landscape; margin: 0; }
        }
      `}</style>
    </div>
  );
}