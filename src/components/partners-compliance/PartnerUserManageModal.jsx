import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, UserPlus, Trash2 } from 'lucide-react';

export default function PartnerUserManageModal({ open, onClose, partner }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('analyst');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    if (!partner?.id) return;
    setLoading(true);
    try {
      const all = await base44.entities.CompliancePartnerUser.filter({ partnerId: partner.id }, '-assignedAt');
      setLinks(all || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (open) load(); }, [open, partner?.id]);

  const handleAdd = async () => {
    if (!email.trim()) {
      toast.error('Informe o email do usuário.');
      return;
    }
    setAdding(true);
    try {
      // Buscar User pelo email
      const users = await base44.entities.User.filter({ email: email.trim().toLowerCase() });
      if (!users || users.length === 0) {
        toast.error('Usuário não encontrado. Convide-o para a plataforma primeiro.');
        return;
      }
      const user = users[0];

      // Verifica duplicata ativa
      const existing = await base44.entities.CompliancePartnerUser.filter({
        userId: user.id, partnerId: partner.id, isActive: true
      });
      if (existing && existing.length > 0) {
        toast.error('Este usuário já está vinculado ao parceiro.');
        return;
      }

      const me = await base44.auth.me();
      await base44.entities.CompliancePartnerUser.create({
        userId: user.id,
        userEmail: user.email,
        userFullName: user.full_name || '',
        partnerId: partner.id,
        partnerName: partner.name,
        partnerRole: role,
        isActive: true,
        assignedBy: me.email,
        assignedByName: me.full_name,
        assignedAt: new Date().toISOString()
      });
      toast.success('Usuário vinculado.');
      setEmail('');
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRevoke = async (link) => {
    if (!confirm(`Revogar acesso de ${link.userEmail}?`)) return;
    try {
      const me = await base44.auth.me();
      await base44.entities.CompliancePartnerUser.update(link.id, {
        isActive: false,
        revokedAt: new Date().toISOString(),
        revokedBy: me.email
      });
      toast.success('Acesso revogado.');
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Usuários de {partner?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new */}
          <div className="flex items-end gap-2 border rounded-lg p-3 bg-slate-50">
            <div className="flex-1">
              <Label className="text-xs">E-mail do usuário</Label>
              <Input placeholder="usuario@parceiro.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Papel</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAdd} disabled={adding}>
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Vincular
            </Button>
          </div>

          {/* List */}
          <div className="border rounded-lg overflow-hidden">
            {loading ? (
              <div className="text-center py-6"><Loader2 className="w-5 h-5 animate-spin inline" /></div>
            ) : links.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-500">Nenhum usuário vinculado.</div>
            ) : (
              <div className="divide-y">
                {links.map(l => (
                  <div key={l.id} className="flex items-center justify-between p-3">
                    <div>
                      <div className="font-medium text-sm text-[#0A0A0A]">{l.userFullName || l.userEmail}</div>
                      <div className="text-xs text-slate-500">{l.userEmail}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={l.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'}>
                        {l.partnerRole}
                      </Badge>
                      {!l.isActive && <Badge className="bg-red-100 text-red-700 border-red-200">Revogado</Badge>}
                      {l.isActive && (
                        <Button size="sm" variant="ghost" onClick={() => handleRevoke(l)}>
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}