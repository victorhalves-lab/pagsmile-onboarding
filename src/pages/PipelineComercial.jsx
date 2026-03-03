import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Search, Eye, Pencil, BarChart3, Loader2, X,
  DollarSign, TrendingUp, Phone
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import LeadKanbanCard from '../components/pipeline/LeadKanbanCard';
import PipelineMetrics from '../components/pipeline/PipelineMetrics';
import PipelineAgingAlerts from '../components/pipeline/PipelineAgingAlerts';
import PipelineConversionChart from '../components/pipeline/PipelineConversionChart';

const COLUNAS = [
  { id: 'leads_completo', name: 'Leads (Quest. Completo)', color: '#6B7280', statuses: ['questionario_preenchido', 'analisado_priscila'], questionnaireType: 'FULL' },
  { id: 'em_contato_simplificado', name: 'Em Contato + Quest. Simplificado', color: '#F59E0B', statuses: ['em_contato_comercial'], questionnaireType: 'ANY' },
  { id: 'proposta_enviada', name: 'Proposta Enviada', color: '#3B82F6', statuses: ['proposta_enviada'] },
  { id: 'proposta_aceita', name: 'Proposta Aceita', color: '#8B5CF6', statuses: ['proposta_aceita'] },
  { id: 'kyc_aprovado', name: 'KYC Aprovado', color: '#10B981', statuses: ['kyc_iniciado', 'kyc_aprovado', 'kyc_revisao_manual'] },
  { id: 'ativado', name: 'Ativado', color: '#059669', statuses: ['ativado'] },
  { id: 'perdido', name: 'Perdido', color: '#EF4444', statuses: ['perdido', 'proposta_recusada'] },
];

const formatMoeda = (val) => {
  if (!val) return 'R$ 0';
  return `R$ ${val.toLocaleString('pt-BR')}`;
};

export default function PipelineComercial() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('month');

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['pipeline-leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 500)
  });

  const { data: onboardingLinks = [] } = useQuery({
    queryKey: ['pipeline-onboarding-links'],
    queryFn: () => base44.entities.OnboardingLink.list('-created_date', 500)
  });

  // Map linkCode -> linkType for quick lookup
  const linkTypeMap = React.useMemo(() => {
    const map = {};
    onboardingLinks.forEach(link => {
      if (link.uniqueCode) map[link.uniqueCode] = link.linkType;
    });
    return map;
  }, [onboardingLinks]);

  const moveMutation = useMutation({
    mutationFn: async ({ leadId, newStatus }) => {
      await base44.entities.Lead.update(leadId, {
        status: newStatus,
        lastInteractionDate: new Date().toISOString()
      });
      await base44.entities.LeadActivity.create({
        leadId,
        activityType: 'status_alterado_manual',
        description: `Lead movido para: ${newStatus}`,
        performedBy: 'admin',
        activityDate: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-leads'] });
      toast.success('Lead movido!');
    }
  });

  const handleCardAction = async (action, lead) => {
    if (action === 'contact') {
      await base44.entities.Lead.update(lead.id, { status: 'em_contato_comercial', lastInteractionDate: new Date().toISOString() });
      await base44.entities.LeadActivity.create({ leadId: lead.id, activityType: 'contato_iniciado', description: 'Contato iniciado via pipeline', performedBy: 'admin', activityDate: new Date().toISOString() });
      queryClient.invalidateQueries({ queryKey: ['pipeline-leads'] });
      toast.success('Contato iniciado!');
    }
  };

  // Filter by period
  const filteredLeads = useMemo(() => {
    let result = leads;

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(l =>
        (l.fullName || '').toLowerCase().includes(s) ||
        (l.cpfCnpj || '').includes(s) ||
        (l.companyName || '').toLowerCase().includes(s)
      );
    }

    if (period !== 'all') {
      const now = moment();
      const map = { week: 7, month: 30, '3months': 90, '6months': 180, '12months': 365 };
      const days = map[period] || 30;
      result = result.filter(l => moment(l.created_date).isAfter(now.clone().subtract(days, 'days')));
    }

    return result;
  }, [leads, search, period]);

  // Group leads by column (considering questionnaire type)
  const columns = useMemo(() => {
    return COLUNAS.map(col => ({
      ...col,
      leads: filteredLeads.filter(l => {
        if (!col.statuses.includes(l.status)) return false;

        // For "Leads (Quest. Completo)" — only leads from LEAD_QUESTIONNAIRE (or no link = direct)
        if (col.questionnaireType === 'FULL') {
          const lt = l.onboardingLinkCode ? linkTypeMap[l.onboardingLinkCode] : 'LEAD_QUESTIONNAIRE';
          return lt !== 'LEAD_SIMPLIFICADO';
        }

        return true;
      })
    }));
  }, [filteredLeads, linkTypeMap]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const destColId = result.destination.droppableId;
    const leadId = result.draggableId;
    const destCol = COLUNAS.find(c => c.id === destColId);
    if (!destCol) return;

    const newStatus = destCol.statuses[0];
    moveMutation.mutate({ leadId, newStatus });
  };

  // Pipeline metrics
  const totalTPV = filteredLeads.reduce((sum, l) => sum + (l.tpvMensal || 0), 0);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#002443] to-[#36706c] rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/10">
              <BarChart3 className="w-6 h-6 text-[#5cf7cf]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Pipeline Comercial</h1>
              <div className="flex gap-3 text-xs text-white/60 mt-1.5">
                <span className="bg-white/10 px-2 py-0.5 rounded-md">{filteredLeads.length} leads</span>
                <span className="bg-white/10 px-2 py-0.5 rounded-md flex items-center gap-1"><DollarSign className="w-3 h-3" /> TPV: {formatMoeda(totalTPV)}</span>
                <span className="bg-[#2bc196]/20 text-[#5cf7cf] px-2 py-0.5 rounded-md flex items-center gap-1 font-medium"><TrendingUp className="w-3 h-3" /> Receita: {formatMoeda(totalTPV * 0.025)}</span>
              </div>
            </div>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px] h-9 border-white/20 text-white bg-white/10 rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="3months">3 Meses</SelectItem>
              <SelectItem value="6months">6 Meses</SelectItem>
              <SelectItem value="12months">12 Meses</SelectItem>
              <SelectItem value="all">Lifetime</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metrics */}
      <PipelineMetrics leads={filteredLeads} />

      {/* Conversion chart + Aging alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PipelineConversionChart leads={filteredLeads} />
        <PipelineAgingAlerts leads={filteredLeads} />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pagsmile-blue)]/40" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por CNPJ, Nome ou Razão Social..." className="pl-10 h-9" />
        {search && (
          <Button variant="ghost" size="sm" onClick={() => setSearch('')} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0">
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Kanban */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
          {columns.map(col => {
            const colTPVMensal = col.leads.reduce((s, l) => s + (l.tpvMensal || 0), 0);
            const colTPVAnual = colTPVMensal * 12;
            const colReceitaMensal = colTPVMensal * 0.025;
            const colReceitaAnual = colReceitaMensal * 12;
            return (
              <div key={col.id} className="flex-shrink-0 w-[260px]">
              {/* Column header */}
              <div className="mb-3 bg-white rounded-2xl p-3 border border-[#002443]/5 shadow-sm">
                <div className="h-1 rounded-full mb-2" style={{ backgroundColor: col.color }} />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#002443]">{col.name}</span>
                  <Badge className="text-[10px] bg-[#002443]/5 text-[#002443] border-0">{col.leads.length}</Badge>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] bg-[#f4f4f4] rounded-xl p-2 border border-[#002443]/5">
                    <div>
                      <span className="text-[var(--pagsmile-blue)]/40">TPV/mês</span>
                      <p className="font-bold text-[var(--pagsmile-blue)]">{formatMoeda(colTPVMensal)}</p>
                    </div>
                    <div>
                      <span className="text-[var(--pagsmile-blue)]/40">TPV/ano</span>
                      <p className="font-bold text-[var(--pagsmile-blue)]">{formatMoeda(colTPVAnual)}</p>
                    </div>
                    <div>
                      <span className="text-[var(--pagsmile-blue)]/40">Receita/mês</span>
                      <p className="font-bold text-[var(--pagsmile-green)]">{formatMoeda(colReceitaMensal)}</p>
                    </div>
                    <div>
                      <span className="text-[var(--pagsmile-blue)]/40">Receita/ano</span>
                      <p className="font-bold text-[var(--pagsmile-green)]">{formatMoeda(colReceitaAnual)}</p>
                    </div>
                  </div>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2 min-h-[100px] rounded-xl p-2 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-[#2bc196]/5 border-2 border-dashed border-[#2bc196]/30' : 'bg-[#f4f4f4]/50'
                      }`}
                    >
                      {col.leads.map((lead, idx) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={idx}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-xl border border-[#002443]/5 p-3 transition-all ${
                                snapshot.isDragging ? 'shadow-lg ring-2 ring-[#2bc196]/30 -rotate-1' : 'hover:shadow-md hover:-translate-y-0.5'
                              }`}
                            >
                              <LeadKanbanCard lead={lead} onAction={handleCardAction} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {col.leads.length === 0 && (
                        <p className="text-xs text-center text-[var(--pagsmile-blue)]/40 py-4">Nenhum lead</p>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}