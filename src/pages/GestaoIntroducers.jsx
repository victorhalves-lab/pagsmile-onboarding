import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Search, RefreshCw, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import IntroducerKPIs from '../components/introducers/IntroducerKPIs';
import IntroducerTable from '../components/introducers/IntroducerTable';
import IntroducerFormModal from '../components/introducers/IntroducerFormModal';

export default function GestaoIntroducers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIntroducer, setEditingIntroducer] = useState(null);

  const { data: introducers = [], isLoading: loadingIntroducers } = useQuery({
    queryKey: ['introducers'],
    queryFn: () => base44.entities.Introducer.list('-created_date', 500)
  });

  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ['leads-for-introducers'],
    queryFn: () => base44.entities.Lead.list('-created_date', 1000)
  });

  const { data: proposals = [], isLoading: loadingProposals } = useQuery({
    queryKey: ['proposals-for-introducers'],
    queryFn: () => base44.entities.Proposal.list('-created_date', 1000)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Introducer.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['introducers'] });
      toast.success('Introducer criado com sucesso!');
      setModalOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Introducer.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['introducers'] });
      toast.success('Introducer atualizado!');
      setModalOpen(false);
      setEditingIntroducer(null);
    }
  });

  const handleSave = async (formData) => {
    // Check unique referralCode
    if (!editingIntroducer) {
      const existing = introducers.find(i => i.referralCode === formData.referralCode);
      if (existing) { toast.error('Já existe um Introducer com este código de referência'); return; }
      createMutation.mutate(formData);
    } else {
      const existing = introducers.find(i => i.referralCode === formData.referralCode && i.id !== editingIntroducer.id);
      if (existing) { toast.error('Já existe um Introducer com este código de referência'); return; }
      updateMutation.mutate({ id: editingIntroducer.id, data: formData });
    }
  };

  const handleEdit = (intro) => {
    setEditingIntroducer(intro);
    setModalOpen(true);
  };

  const handleNewIntroducer = () => {
    setEditingIntroducer(null);
    setModalOpen(true);
  };

  const filtered = useMemo(() => {
    let result = introducers;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(i => i.name.toLowerCase().includes(s) || i.referralCode.toLowerCase().includes(s) || (i.contactEmail || '').toLowerCase().includes(s));
    }
    if (statusFilter !== 'all') result = result.filter(i => i.status === statusFilter);
    return result;
  }, [introducers, search, statusFilter]);

  const isLoading = loadingIntroducers || loadingLeads || loadingProposals;
  const hasFilters = search || statusFilter !== 'all';

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002443] to-[#36706c] rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/10">
              <Users className="w-6 h-6 text-[#5cf7cf]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Gestão de Introducers</h1>
              <p className="text-white/60 text-sm mt-1">Gerencie seus parceiros de indicação e acompanhe a performance</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries()} className="border-white/20 text-white hover:bg-white/10 rounded-xl">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={handleNewIntroducer} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Novo Introducer
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <IntroducerKPIs introducers={introducers} leads={leads} proposals={proposals} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002443]/40" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, código UTM ou e-mail..." className="pl-10 h-10 rounded-xl" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] h-10 rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); }}>
            <X className="w-4 h-4 mr-1" /> Limpar
          </Button>
        )}
      </div>

      {/* Table */}
      <IntroducerTable introducers={filtered} leads={leads} proposals={proposals} onEdit={handleEdit} />

      {/* Modal */}
      <IntroducerFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingIntroducer(null); }}
        introducer={editingIntroducer}
        onSave={handleSave}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}