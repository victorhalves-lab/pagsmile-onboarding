import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Loader2, Handshake } from 'lucide-react';
import { toast } from 'sonner';
import PartnerFormModal from '@/components/partners/PartnerFormModal';
import PartnerCard from '@/components/partners/PartnerCard';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function ConfiguracaoParceiros() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partner.list('-created_date')
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (data.isPrincipal) {
        const currentPrincipal = partners.find(p => p.isPrincipal && p.id !== editingPartner?.id);
        if (currentPrincipal) {
          await base44.entities.Partner.update(currentPrincipal.id, { isPrincipal: false });
        }
      }
      if (editingPartner?.id) {
        return base44.entities.Partner.update(editingPartner.id, data);
      }
      return base44.entities.Partner.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      toast.success(editingPartner?.id ? t('cp.partner_updated') : t('cp.partner_created'));
      setModalOpen(false);
      setEditingPartner(null);
    },
    onError: (err) => toast.error(t('cp.error') + err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Partner.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      toast.success(t('cp.partner_deleted'));
      setDeleteConfirm(null);
    }
  });

  const handleNew = () => {
    setEditingPartner(null);
    setModalOpen(true);
  };

  const handleEdit = (partner) => {
    setEditingPartner(partner);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#002443]">{t('cp.title')}</h1>
          <p className="text-sm text-[#002443]/50 mt-0.5">
            {t('cp.subtitle')}
          </p>
        </div>
        <Button onClick={handleNew} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> {t('cp.new_partner')}
        </Button>
      </div>

      {/* Lista de Parceiros */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#2bc196]" />
        </div>
      ) : partners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#002443]/5 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#f4f4f4] flex items-center justify-center mx-auto mb-4">
            <Handshake className="w-7 h-7 text-[#002443]/20" />
          </div>
          <p className="text-sm font-semibold text-[#002443]/60">{t('cp.no_partners')}</p>
          <p className="text-xs text-[#002443]/30 mt-1">{t('cp.no_partners_hint')}</p>
          <Button onClick={handleNew} className="mt-4 bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> {t('cp.first_partner')}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {partners.map(partner => (
            <PartnerCard
              key={partner.id}
              partner={partner}
              onEdit={() => handleEdit(partner)}
              onDelete={() => setDeleteConfirm(partner)}
            />
          ))}
        </div>
      )}

      {/* Modal de Criar/Editar */}
      <PartnerFormModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingPartner(null);
        }}
        partner={editingPartner}
        onSave={(data) => saveMutation.mutate(data)}
        saving={saveMutation.isPending}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('cp.delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('cp.delete_desc', { name: deleteConfirm?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('cp.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteConfirm.id)}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
            >
              {t('cp.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}