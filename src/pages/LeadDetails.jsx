import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft, Loader2, Building2, Mail, Phone, Globe,
  ShieldCheck, AlertTriangle, TrendingUp, Clock,
  FileText, Send, XCircle, CheckCircle2, User,
  ShoppingCart, Network
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import LeadQuickActions from '../components/leads/LeadQuickActions';
import LeadProposals from '../components/leads/LeadProposals';
import LeadSLAIndicator from '../components/leads/LeadSLAIndicator';
import LeadQualifierPanel from '../components/leads/LeadQualifierPanel';

const STATUS_CONFIG = {
  questionario_preenchido: { label: 'Questionário Preenchido', color: 'bg-blue-100 text-blue-700' },
  analisado_priscila: { label: 'Analisado PRISCILA', color: 'bg-purple-100 text-purple-700' },
  em_contato_comercial: { label: 'Em Contato', color: 'bg-amber-100 text-amber-700' },
  proposta_enviada: { label: 'Proposta Enviada', color: 'bg-indigo-100 text-indigo-700' },
  proposta_aceita: { label: 'Proposta Aceita', color: 'bg-green-100 text-green-700' },
  proposta_recusada: { label: 'Proposta Recusada', color: 'bg-red-100 text-red-700' },
  kyc_iniciado: { label: 'KYC Iniciado', color: 'bg-teal-100 text-teal-700' },
  kyc_aprovado: { label: 'KYC Aprovado', color: 'bg-green-100 text-green-800' },
  kyc_revisao_manual: { label: 'KYC Revisão', color: 'bg-orange-100 text-orange-700' },
  ativado: { label: 'Ativado', color: 'bg-emerald-100 text-emerald-800' },
  perdido: { label: 'Perdido', color: 'bg-slate-100 text-slate-600' },
};

export default function LeadDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const leadId = urlParams.get('id');

  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      const leads = await base44.entities.Lead.filter({ id: leadId });
      return leads[0] || null;
    },
    enabled: !!leadId
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['leadActivities', leadId],
    queryFn: () => base44.entities.LeadActivity.filter({ leadId }, '-activityDate'),
    enabled: !!leadId
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status) => {
      await base44.entities.Lead.update(leadId, { status, lastInteractionDate: new Date().toISOString() });
      await base44.entities.LeadActivity.create({
        leadId,
        activityType: 'status_alterado_manual',
        description: `Status alterado para: ${STATUS_CONFIG[status]?.label || status}`,
        performedBy: 'admin',
        activityDate: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leadActivities', leadId] });
      toast.success('Status atualizado');
    }
  });

  const addNoteMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.LeadActivity.create({
        leadId,
        activityType: 'nota_adicionada',
        description: note,
        performedBy: 'admin',
        activityDate: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leadActivities', leadId] });
      setNote('');
      toast.success('Nota adicionada');
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-[var(--pagsmile-blue)]">Lead não encontrado</h2>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[lead.status] || { label: lead.status, color: 'bg-slate-100' };
  const SubCatIcon = lead.businessSubCategory === 'GATEWAY' ? Network :
                     lead.businessSubCategory === 'MARKETPLACE' ? Building2 : ShoppingCart;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[var(--pagsmile-blue)]">{lead.fullName || lead.email}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
            {lead.businessSubCategory && (
              <Badge variant="outline" className="gap-1">
                <SubCatIcon className="w-3 h-3" />
                {lead.businessSubCategory}
              </Badge>
            )}
            {lead.protocolo && <span className="text-xs font-mono text-[var(--pagsmile-blue)]/50">{lead.protocolo}</span>}
            <LeadSLAIndicator lead={lead} />
          </div>
        </div>
        <Select value={newStatus || lead.status} onValueChange={(v) => { setNewStatus(v); updateStatusMutation.mutate(v); }}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Alterar Status" /></SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quick Actions Bar */}
      <LeadQuickActions lead={lead} />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="leadqualifier">Lead Qualifier IA</TabsTrigger>
          <TabsTrigger value="priscila">Análise PRISCILA</TabsTrigger>
          <TabsTrigger value="questionnaire">Questionário</TabsTrigger>
          <TabsTrigger value="proposals">Propostas</TabsTrigger>
          <TabsTrigger value="history">Histórico ({activities.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Dados da Empresa */}
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Building2 className="w-4 h-4" /> Dados da Empresa</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><span className="text-[var(--pagsmile-blue)]/60">Razão Social:</span><p className="font-medium">{lead.fullName || '-'}</p></div>
                <div><span className="text-[var(--pagsmile-blue)]/60">Nome Fantasia:</span><p className="font-medium">{lead.companyName || '-'}</p></div>
                <div><span className="text-[var(--pagsmile-blue)]/60">CNPJ:</span><p className="font-medium">{lead.cpfCnpj || '-'}</p></div>
                <div><span className="text-[var(--pagsmile-blue)]/60">MCC:</span><p className="font-medium">{lead.mcc || '-'}</p></div>
                {lead.website && (
                  <div className="flex items-center gap-1">
                    <Globe className="w-3 h-3 text-[var(--pagsmile-blue)]/60" />
                    <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-[var(--pagsmile-green)] text-xs">{lead.website}</a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contato */}
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4" /> Contato</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><span className="text-[var(--pagsmile-blue)]/60">Nome:</span><p className="font-medium">{lead.contactName || '-'}</p></div>
                <div><span className="text-[var(--pagsmile-blue)]/60">Cargo:</span><p className="font-medium">{lead.contactRole || '-'}</p></div>
                <div className="flex items-center gap-1"><Mail className="w-3 h-3" /><span>{lead.email || '-'}</span></div>
                <div className="flex items-center gap-1"><Phone className="w-3 h-3" /><span>{lead.phone || '-'}</span></div>
              </CardContent>
            </Card>

            {/* Score e Financeiro */}
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Score & Financeiro</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--pagsmile-blue)]/60">Score PRISCILA:</span>
                  <span className={`text-2xl font-bold ${
                    (lead.priscilaQualityScore || 0) >= 70 ? 'text-green-600' :
                    (lead.priscilaQualityScore || 0) >= 40 ? 'text-amber-600' : 'text-red-600'
                  }`}>{lead.priscilaQualityScore ?? '-'}</span>
                </div>
                <div><span className="text-[var(--pagsmile-blue)]/60">TPV Mensal:</span><p className="font-medium">R$ {lead.tpvMensal?.toLocaleString('pt-BR') || '-'}</p></div>
                <div><span className="text-[var(--pagsmile-blue)]/60">Ticket Médio:</span><p className="font-medium">R$ {lead.ticketMedio?.toLocaleString('pt-BR') || '-'}</p></div>
                <div><span className="text-[var(--pagsmile-blue)]/60">Expectativa:</span><p className="font-medium">{lead.expectativaCrescimento || '-'}</p></div>
              </CardContent>
            </Card>
          </div>

          {/* Adicionar Nota */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Adicionar Nota</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Textarea 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)} 
                  placeholder="Escreva uma nota sobre este lead..."
                  rows={2}
                  className="flex-1"
                />
                <Button 
                  onClick={() => addNoteMutation.mutate()} 
                  disabled={!note.trim() || addNoteMutation.isPending}
                  className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90 self-end"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leadqualifier" className="mt-4">
          <LeadQualifierPanel lead={lead} />
        </TabsContent>

        <TabsContent value="priscila" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-purple-600" /> Relatório PRISCILA</CardTitle></CardHeader>
            <CardContent>
              {lead.priscilaAnalysisReport ? (
                <div className="space-y-4">
                  {lead.priscilaAnalysisReport.resumoExecutivo && (
                    <div>
                      <h4 className="font-semibold text-sm text-[var(--pagsmile-blue)] mb-1">Resumo Executivo</h4>
                      <p className="text-sm text-[var(--pagsmile-blue)]/80">{lead.priscilaAnalysisReport.resumoExecutivo}</p>
                    </div>
                  )}
                  {lead.priscilaAnalysisReport.pontosFortes?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-green-700 mb-1">Pontos Fortes</h4>
                      <ul className="space-y-1">
                        {lead.priscilaAnalysisReport.pontosFortes.map((p, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            {p.descricao || p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {lead.priscilaAnalysisReport.pontosDeAtencao?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-amber-700 mb-1">Pontos de Atenção</h4>
                      <ul className="space-y-1">
                        {lead.priscilaAnalysisReport.pontosDeAtencao.map((p, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                            {p.descricao || p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {lead.priscilaAnalysisReport.pontosDeRisco?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-red-700 mb-1">Pontos de Risco</h4>
                      <ul className="space-y-1">
                        {lead.priscilaAnalysisReport.pontosDeRisco.map((p, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                            {p.descricao || p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShieldCheck className="w-12 h-12 mx-auto text-[var(--pagsmile-blue)]/30 mb-3" />
                  <p className="text-[var(--pagsmile-blue)]/60">Análise PRISCILA ainda não disponível</p>
                  <p className="text-xs text-[var(--pagsmile-blue)]/40 mt-1">A análise será executada automaticamente após a submissão</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questionnaire" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Dados do Questionário</CardTitle></CardHeader>
            <CardContent>
              {lead.questionnaireData && Object.keys(lead.questionnaireData).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(lead.questionnaireData)
                    .filter(([k]) => !k.startsWith('aceite_'))
                    .map(([key, value]) => (
                    <div key={key} className="border-b border-slate-100 pb-2">
                      <p className="text-xs text-[var(--pagsmile-blue)]/50 font-medium">{key}</p>
                      <p className="text-sm text-[var(--pagsmile-blue)]">
                        {Array.isArray(value) ? value.join(', ') : typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : String(value || '-')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-[var(--pagsmile-blue)]/60">Dados do questionário não disponíveis</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proposals" className="mt-4">
          <LeadProposals leadId={leadId} />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" /> Histórico de Atividades</CardTitle></CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-center py-8 text-[var(--pagsmile-blue)]/60">Nenhuma atividade registrada</p>
              ) : (
                <div className="space-y-4">
                  {activities.map(act => (
                    <div key={act.id} className="flex gap-3 border-l-2 border-slate-200 pl-4 pb-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[var(--pagsmile-blue)]">{act.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{act.activityType}</Badge>
                          <span className="text-xs text-[var(--pagsmile-blue)]/50">
                            {act.activityDate ? moment(act.activityDate).format('DD/MM/YY HH:mm') : act.created_date ? moment(act.created_date).format('DD/MM/YY HH:mm') : ''}
                          </span>
                          <span className="text-xs text-[var(--pagsmile-blue)]/40">por {act.performedBy}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}