import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Link as LinkIcon, Copy, Check, Search, Loader2, 
  Building2, Users, Plus, ExternalLink, ToggleLeft, ToggleRight, Calendar
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function GerenciarSubsellerLinks() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  // Buscar merchants aprovados (sellers)
  const { data: merchants = [], isLoading: loadingMerchants } = useQuery({
    queryKey: ['approvedMerchants'],
    queryFn: () => base44.entities.Merchant.filter({ onboardingStatus: 'Aprovado' }),
  });

  // Buscar links de subsellers do merchant selecionado
  const { data: subsellerLinks = [], isLoading: loadingLinks } = useQuery({
    queryKey: ['subsellerLinks', selectedMerchant?.id],
    queryFn: () => base44.entities.OnboardingLink.filter({ 
      parentMerchantId: selectedMerchant.id,
      linkType: 'SUBSELLER_COMPLIANCE'
    }),
    enabled: !!selectedMerchant?.id
  });

  // Buscar subsellers vinculados ao merchant selecionado
  const { data: subsellers = [] } = useQuery({
    queryKey: ['subsellers', selectedMerchant?.id],
    queryFn: () => base44.entities.Merchant.filter({ parentMerchantId: selectedMerchant.id }),
    enabled: !!selectedMerchant?.id
  });

  // Gerar link via backend function
  const createLinkMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateSubsellerLink', {
        parentMerchantId: selectedMerchant.id,
        parentMerchantName: selectedMerchant.fullName || selectedMerchant.companyName,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subsellerLinks'] });
      toast.success('Link gerado com sucesso!');
      copyLink(data.link.uniqueCode);
    },
    onError: (error) => {
      toast.error('Erro ao gerar link: ' + (error.response?.data?.error || error.message));
    }
  });

  // Toggle ativo/inativo
  const toggleLinkMutation = useMutation({
    mutationFn: async ({ linkId, isActive }) => {
      await base44.entities.OnboardingLink.update(linkId, { isActive: !isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subsellerLinks'] });
      toast.success('Status do link atualizado!');
    }
  });

  const copyLink = (code) => {
    const url = `${window.location.origin}/SubsellerQuestionnaire?ref=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    toast.success('Link copiado!');
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const filteredMerchants = merchants.filter(m => {
    const term = searchTerm.toLowerCase();
    return (m.fullName?.toLowerCase().includes(term) || 
            m.companyName?.toLowerCase().includes(term) || 
            m.cpfCnpj?.includes(term));
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--pagsmile-blue)]">Links de Compliance - Subcontas</h1>
        <p className="text-sm text-[var(--pagsmile-blue)]/60 mt-1">
          Gere links para subsellers preencherem o questionário de compliance simplificado.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Merchants */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Selecione o Seller (Aprovado)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Buscar por nome ou CNPJ..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              {loadingMerchants ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : filteredMerchants.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">Nenhum merchant aprovado encontrado.</p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {filteredMerchants.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMerchant(m)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        selectedMerchant?.id === m.id 
                          ? 'border-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/5' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="text-sm font-semibold text-[var(--pagsmile-blue)] truncate">
                        {m.fullName || m.companyName}
                      </p>
                      <p className="text-xs text-[var(--pagsmile-blue)]/50 mt-0.5">{m.cpfCnpj}</p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detalhes e Links */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedMerchant ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Building2 className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-slate-400 font-medium">Selecione um Seller aprovado para gerenciar seus links de subcontas.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Info do Seller */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-[var(--pagsmile-blue)]">
                        {selectedMerchant.fullName || selectedMerchant.companyName}
                      </h3>
                      <p className="text-sm text-[var(--pagsmile-blue)]/50">{selectedMerchant.cpfCnpj}</p>
                      <div className="flex gap-3 mt-3">
                        <Badge className="bg-emerald-100 text-emerald-700">Aprovado</Badge>
                        <Badge variant="outline" className="gap-1">
                          <Users className="w-3 h-3" /> {subsellers.length} subseller{subsellers.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      onClick={() => createLinkMutation.mutate()}
                      disabled={createLinkMutation.isPending}
                      className="bg-[var(--pagsmile-green)] text-white"
                    >
                      {createLinkMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      Gerar Link
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Links existentes */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" /> Links Gerados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingLinks ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    </div>
                  ) : subsellerLinks.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">
                      Nenhum link gerado ainda. Clique em "Gerar Link" para criar o primeiro.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {subsellerLinks.map(link => {
                        const url = `${window.location.origin}/SubsellerQuestionnaire?ref=${link.uniqueCode}`;
                        const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
                        return (
                          <div key={link.id} className={`border rounded-xl p-4 ${!link.isActive || isExpired ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}>
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                                    {link.uniqueCode}
                                  </code>
                                  {isExpired ? (
                                    <Badge className="bg-red-100 text-red-700 text-[10px]">Expirado</Badge>
                                  ) : link.isActive ? (
                                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Ativo</Badge>
                                  ) : (
                                    <Badge className="bg-red-100 text-red-700 text-[10px]">Inativo</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 mt-1 truncate">{url}</p>
                                {link.expiresAt && (
                                  <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Expira: {new Date(link.expiresAt).toLocaleDateString('pt-BR')}
                                  </p>
                                )}
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  Criado: {link.created_date ? new Date(link.created_date).toLocaleDateString('pt-BR') : '—'}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-center px-2">
                                  <p className="text-lg font-bold text-[var(--pagsmile-blue)]">{link.submissionCount || 0}</p>
                                  <p className="text-[10px] text-slate-400">Submissões</p>
                                </div>
                                <div className="text-center px-2">
                                  <p className="text-lg font-bold text-[var(--pagsmile-blue)]">{link.completedCount || 0}</p>
                                  <p className="text-[10px] text-slate-400">Concluídos</p>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                  <Switch
                                    checked={link.isActive}
                                    onCheckedChange={() => toggleLinkMutation.mutate({ linkId: link.id, isActive: link.isActive })}
                                    disabled={toggleLinkMutation.isPending}
                                  />
                                  <span className="text-[9px] text-slate-400">{link.isActive ? 'Ativo' : 'Inativo'}</span>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => copyLink(link.uniqueCode)}
                                >
                                  {copiedCode === link.uniqueCode ? (
                                    <Check className="w-4 h-4 text-[var(--pagsmile-green)]" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Subsellers vinculados */}
              {subsellers.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Users className="w-4 h-4" /> Subsellers ({subsellers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {subsellers.map(sub => (
                        <div key={sub.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl">
                          <div>
                            <p className="text-sm font-semibold text-[var(--pagsmile-blue)]">{sub.fullName}</p>
                            <p className="text-xs text-[var(--pagsmile-blue)]/50">{sub.cpfCnpj}</p>
                          </div>
                          <Badge className={
                            sub.onboardingStatus === 'Aprovado' ? 'bg-emerald-100 text-emerald-700' :
                            sub.onboardingStatus === 'Recusado' ? 'bg-red-100 text-red-700' :
                            sub.onboardingStatus === 'Manual' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-600'
                          }>
                            {sub.onboardingStatus}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}