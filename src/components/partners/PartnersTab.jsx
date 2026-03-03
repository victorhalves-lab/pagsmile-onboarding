import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Edit, Loader2, Star, ArrowLeft, Handshake } from 'lucide-react';
import { toast } from 'sonner';
import PartnerForm from './PartnerForm';
import MCCRatesEditor from './MCCRatesEditor';

export default function PartnersTab() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('list'); // list | form | detail
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [partnerForm, setPartnerForm] = useState({ name: '', isPrincipal: false, transactionFee: 0, antifraudCost: 0, threeDSCost: 0, percentualAntecipacao: 0, notes: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data: partners = [], isLoading: loadingPartners } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partner.list('-created_date')
  });

  const { data: allMCCRates = [] } = useQuery({
    queryKey: ['partnerCosts'],
    queryFn: () => base44.entities.PartnerCost.list()
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      // Se marcando como principal, desmarcar os outros
      if (data.isPrincipal) {
        const currentPrincipal = partners.find(p => p.isPrincipal && p.id !== selectedPartner?.id);
        if (currentPrincipal) {
          await base44.entities.Partner.update(currentPrincipal.id, { isPrincipal: false });
        }
      }
      if (selectedPartner?.id) {
        return base44.entities.Partner.update(selectedPartner.id, data);
      }
      return base44.entities.Partner.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      toast.success(selectedPartner?.id ? 'Parceiro atualizado!' : 'Parceiro criado!');
      setView('list');
      setSelectedPartner(null);
    },
    onError: (err) => toast.error('Erro: ' + err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      // Deletar também os MCCRates do parceiro
      const rates = allMCCRates.filter(r => r.partnerId === id);
      for (const r of rates) {
        await base44.entities.PartnerCost.delete(r.id);
      }
      return base44.entities.Partner.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      queryClient.invalidateQueries({ queryKey: ['partnerCosts'] });
      toast.success('Parceiro excluído!');
      setDeleteConfirm(null);
      if (view === 'detail') { setView('list'); setSelectedPartner(null); }
    }
  });

  const saveMCCRateMutation = useMutation({
    mutationFn: async ({ data, existingId }) => {
      if (existingId) {
        return base44.entities.PartnerCost.update(existingId, data);
      }
      return base44.entities.PartnerCost.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerCosts'] });
      toast.success('Taxas do MCC salvas!');
    },
    onError: (err) => toast.error('Erro: ' + err.message)
  });

  const deleteMCCRateMutation = useMutation({
    mutationFn: (id) => base44.entities.PartnerCost.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerCosts'] });
      toast.success('MCC excluído!');
    }
  });

  const handleNewPartner = () => {
    setSelectedPartner(null);
    setPartnerForm({ name: '', isPrincipal: false, transactionFee: 0, antifraudCost: 0, threeDSCost: 0, percentualAntecipacao: 0, notes: '' });
    setView('form');
  };

  const handleEditPartner = (partner) => {
    setSelectedPartner(partner);
    setPartnerForm({
      name: partner.name || '',
      isPrincipal: partner.isPrincipal || false,
      transactionFee: partner.transactionFee || 0,
      antifraudCost: partner.antifraudCost || 0,
      threeDSCost: partner.threeDSCost || 0,
      percentualAntecipacao: partner.percentualAntecipacao || 0,
      notes: partner.notes || ''
    });
    setView('form');
  };

  const handleViewDetail = (partner) => {
    setSelectedPartner(partner);
    setView('detail');
  };

  const partnerMCCRates = selectedPartner ? allMCCRates.filter(r => r.partnerId === selectedPartner.id) : [];

  // LISTA
  if (view === 'list') {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-[#002443]/5 p-6 space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-[#002443]">Parceiros Adquirentes</h2>
              <p className="text-xs text-[#002443]/40">Gerencie parceiros e suas taxas base para precificação</p>
            </div>
            <Button onClick={handleNewPartner} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Novo Parceiro
            </Button>
          </div>

          {loadingPartners ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#2bc196]" /></div>
          ) : partners.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-[#f4f4f4] flex items-center justify-center mx-auto mb-4">
                <Handshake className="w-7 h-7 text-[#002443]/20" />
              </div>
              <p className="text-sm text-[#002443]/50">Nenhum parceiro cadastrado</p>
              <p className="text-xs text-[#002443]/30 mt-1">Cadastre um parceiro adquirente para começar</p>
            </div>
          ) : (
            <div className="rounded-xl border border-[#002443]/5 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f4f4f4]">
                    {['Parceiro', 'Fee Trans.', 'Antifraude', '3DS', 'Antecipação', 'MCCs', ''].map((h, i) => (
                      <TableHead key={i} className={`text-[10px] font-bold text-[#002443]/40 uppercase ${i === 6 ? 'text-right' : ''}`}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((partner) => {
                    const mccCount = allMCCRates.filter(r => r.partnerId === partner.id).length;
                    return (
                      <TableRow key={partner.id} className="cursor-pointer hover:bg-[#f4f4f4]/50" onClick={() => handleViewDetail(partner)}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {partner.isPrincipal && <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />}
                            <div>
                              <p className="font-semibold text-sm text-[#002443]">{partner.name}</p>
                              {partner.isPrincipal && <Badge className="bg-amber-500/10 text-amber-600 border-0 text-[10px]">Principal</Badge>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-[#002443]">R$ {(partner.transactionFee || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-[#002443]">R$ {(partner.antifraudCost || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-[#002443]">R$ {(partner.threeDSCost || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-[#002443]">{(partner.percentualAntecipacao || 0).toFixed(2)}%</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-[#002443]/10 text-[#002443]/50 text-[10px]">{mccCount} MCC(s)</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); handleEditPartner(partner); }}>
                            <Edit className="w-4 h-4 text-[#002443]/40" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(partner); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Parceiro</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir "{deleteConfirm?.name}"? Todas as taxas MCCs associadas serão excluídas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteMutation.mutate(deleteConfirm.id)} className="bg-red-500 hover:bg-red-600 text-white rounded-xl">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // FORM (criar/editar)
  if (view === 'form') {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => { setView('list'); setSelectedPartner(null); }} className="text-[#002443]/50 hover:text-[#002443] rounded-xl">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <PartnerForm
          form={partnerForm}
          onChange={setPartnerForm}
          onSave={() => saveMutation.mutate(partnerForm)}
          saving={saveMutation.isPending}
          isEditing={!!selectedPartner?.id}
        />
      </div>
    );
  }

  // DETAIL (visualizar parceiro + MCCs)
  if (view === 'detail') {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => { setView('list'); setSelectedPartner(null); }} className="text-[#002443]/50 hover:text-[#002443] rounded-xl">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>

        {/* Header do parceiro */}
        <div className="bg-white rounded-2xl border border-[#002443]/5 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedPartner.isPrincipal && <Star className="w-5 h-5 text-amber-500 fill-amber-500" />}
              <div>
                <h2 className="text-lg font-bold text-[#002443]">{selectedPartner.name}</h2>
                {selectedPartner.isPrincipal && <Badge className="bg-amber-500/10 text-amber-600 border-0 text-xs">Parceiro Principal</Badge>}
              </div>
            </div>
            <Button variant="outline" onClick={() => handleEditPartner(selectedPartner)} className="rounded-xl border-[#002443]/10">
              <Edit className="w-4 h-4 mr-2" /> Editar
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="p-3 rounded-xl bg-[#f4f4f4]">
              <p className="text-[10px] text-[#002443]/40 uppercase font-bold">Fee Transação</p>
              <p className="text-lg font-bold text-[#002443]">R$ {(selectedPartner.transactionFee || 0).toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#f4f4f4]">
              <p className="text-[10px] text-[#002443]/40 uppercase font-bold">Antifraude</p>
              <p className="text-lg font-bold text-[#002443]">R$ {(selectedPartner.antifraudCost || 0).toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#f4f4f4]">
              <p className="text-[10px] text-[#002443]/40 uppercase font-bold">3DS</p>
              <p className="text-lg font-bold text-[#002443]">R$ {(selectedPartner.threeDSCost || 0).toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#f4f4f4]">
              <p className="text-[10px] text-[#002443]/40 uppercase font-bold">Antecipação</p>
              <p className="text-lg font-bold text-[#002443]">{(selectedPartner.percentualAntecipacao || 0).toFixed(2)}%</p>
              <p className="text-[10px] text-[#2bc196] font-semibold">mín. {(Math.round((selectedPartner.percentualAntecipacao || 0) * 1.20 * 100) / 100).toFixed(2)}%</p>
            </div>
          </div>
        </div>

        {/* MCC Rates */}
        <div className="bg-white rounded-2xl border border-[#002443]/5 p-6">
          <MCCRatesEditor
            partnerId={selectedPartner.id}
            partnerAntecipacao={selectedPartner.percentualAntecipacao || 0}
            mccRates={partnerMCCRates}
            onSave={(data, existingId) => saveMCCRateMutation.mutate({ data, existingId })}
            onDelete={(id) => deleteMCCRateMutation.mutate(id)}
            saving={saveMCCRateMutation.isPending}
          />
        </div>
      </div>
    );
  }
}