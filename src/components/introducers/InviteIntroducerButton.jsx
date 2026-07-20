import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { UserPlus, Loader2, Check, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function InviteIntroducerButton({ introducer }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const inviteMutation = useMutation({
    mutationFn: async () => {
      // 1. Convidar o usuário com role 'introducer'
      await base44.users.inviteUser(introducer.contactEmail, 'introducer');
      
      // 2. Buscar o user recém-criado para vincular
      const users = await base44.entities.User.list('-created_date', 50);
      const matchedUser = users.find(u => u.email === introducer.contactEmail);
      
      if (matchedUser) {
        // 3. Vincular introducerId no User
        await base44.entities.User.update(matchedUser.id, { introducerId: introducer.id });
        // 4. Vincular linkedUserId no Introducer
        await base44.entities.Introducer.update(introducer.id, { linkedUserId: matchedUser.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['introducers'] });
      toast.success(`Convite enviado para ${introducer.contactEmail}!`);
      setOpen(false);
    },
    onError: (err) => {
      toast.error(`Erro ao convidar: ${err.message}`);
    }
  });

  if (!introducer.contactEmail) {
    return (
      <Button variant="ghost" size="sm" disabled className="h-7 text-[#0A0A0A]/30">
        <Mail className="w-3.5 h-3.5 mr-1" /> Sem e-mail
      </Button>
    );
  }

  if (introducer.linkedUserId) {
    return (
      <Button variant="ghost" size="sm" disabled className="h-7 text-green-600">
        <Check className="w-3.5 h-3.5 mr-1" /> Vinculado
      </Button>
    );
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="h-7 text-[#1356E2] hover:text-[#1356E2] hover:bg-[#1356E2]/10">
        <UserPlus className="w-3.5 h-3.5 mr-1" /> Convidar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convidar Introducer para o Portal</DialogTitle>
            <DialogDescription>
              Isso criará uma conta para o Introducer acessar o Dashboard de Performance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="p-4 rounded-xl bg-[#f4f4f4] border border-[#0A0A0A]/5">
              <p className="text-sm font-bold text-[#0A0A0A]">{introducer.name}</p>
              <p className="text-xs text-[#0A0A0A]/50">{introducer.contactEmail}</p>
              <p className="text-[10px] text-[#0A0A0A]/30 mt-1">Código: {introducer.referralCode}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-xs text-blue-700">
                O parceiro receberá um e-mail com instruções para criar senha e acessar o portal dedicado em <span className="font-mono font-bold">/IntroducerDashboard</span>.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button
              onClick={() => inviteMutation.mutate()}
              disabled={inviteMutation.isPending}
              className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white rounded-xl"
            >
              {inviteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
              Enviar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}