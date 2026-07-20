import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Users, Search, UserCog, UserPlus, Mail, ShieldOff } from 'lucide-react';
import { getIcon } from '@/lib/iconMap';
import { toast } from 'sonner';

export default function GestaoUsuarios() {
  const [data, setData] = useState({ users: [], profiles: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [newProfile, setNewProfile] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ email: '', fullName: '', profileSlug: 'admin', reason: '' });
  const [inviting, setInviting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('adminListUsersWithProfiles', {});
      setData({ users: res.data?.users || [], profiles: res.data?.profiles || [] });
    } catch { toast.error('Erro ao carregar usuários'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = data.users.filter(u => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return u.email?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q);
  });

  const openAssign = (u) => {
    setSelected(u);
    setNewProfile(u.role || '');
    setReason('');
  };

  const handleAssign = async () => {
    if (!newProfile) { toast.error('Selecione um perfil'); return; }
    setSaving(true);
    try {
      await base44.functions.invoke('adminAssignProfile', {
        userId: selected.id, profileSlug: newProfile, reason
      });
      toast.success('Perfil atribuído');
      setSelected(null);
      load();
    } catch (e) {
      const msg = e?.response?.data?.error || 'Erro ao atribuir';
      toast.error(msg);
    }
    setSaving(false);
  };

  const handleReset2FA = async (u) => {
    if (!window.confirm(`Resetar a autenticação em 2 fatores de ${u.email}?\n\nIsso remove o TOTP, o PIN e os códigos de backup. O usuário precisará reconfigurar tudo no próximo login.`)) return;
    try {
      await base44.functions.invoke('twoFactorResetUser', { userId: u.id, reason: 'Reset manual pelo admin' });
      toast.success('2FA resetado. Usuário precisará reconfigurar no próximo login.');
      load();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Erro ao resetar 2FA');
    }
  };

  const handleInvite = async () => {
    const email = invite.email.trim().toLowerCase();
    if (!email || !email.includes('@')) { toast.error('Email inválido'); return; }
    if (!invite.profileSlug) { toast.error('Selecione um perfil'); return; }
    setInviting(true);
    try {
      // 1) Invite via frontend SDK (Base44 sends the email)
      const baseRole = invite.profileSlug === 'admin' ? 'admin' : 'user';
      await base44.users.inviteUser(email, baseRole);

      // 2) Backend assigns profile + creates audit trail
      const res = await base44.functions.invoke('adminInviteUser', {
        email,
        fullName: invite.fullName,
        profileSlug: invite.profileSlug,
        reason: invite.reason || 'Convite inicial'
      });

      if (res.data?.pending) {
        toast.success(`Convite enviado para ${email}. O perfil será atribuído no primeiro login.`);
      } else {
        toast.success(`Convite enviado para ${email} com perfil atribuído.`);
      }
      setInviteOpen(false);
      setInvite({ email: '', fullName: '', profileSlug: 'admin', reason: '' });
      load();
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Erro ao convidar';
      toast.error(msg);
    }
    setInviting(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0A0A0A] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#1356E2]" /> Gestão de Usuários
          </h1>
          <p className="text-sm text-[#0A0A0A]/60 mt-1">Atribua perfis de acesso aos usuários da plataforma.</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar usuário..." className="pl-9 w-72" />
          </div>
          <Button onClick={() => setInviteOpen(true)} className="bg-[#1356E2] hover:bg-[#1356E2]/90">
            <UserPlus className="w-4 h-4 mr-2" /> Convidar Usuário
          </Button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Perfil Atual</th>
              <th className="px-4 py-3 w-40">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-12 text-slate-400">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12 text-slate-400">Nenhum usuário encontrado.</td></tr>
            ) : filtered.map(u => {
              const p = u.profile;
              const Icon = p ? getIcon(p.icon) : Users;
              return (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-[#0A0A0A]">{u.full_name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    {p ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: (p.color || '#64748b') + '20' }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: p.color }} />
                        </div>
                        <span className="text-sm text-[#0A0A0A]">{p.name}</span>
                        {!p.isActive && <Badge variant="destructive" className="text-[10px]">Inativo</Badge>}
                      </div>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Sem perfil ({u.role || 'none'})</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => openAssign(u)}>
                        <UserCog className="w-3.5 h-3.5 mr-1.5" /> Atribuir
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReset2FA(u)} title="Resetar 2FA (TOTP + PIN)" className="text-amber-700 hover:bg-amber-50 border-amber-200">
                        <ShieldOff className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Perfil</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                <strong>{selected.full_name}</strong><br />
                <span className="text-xs text-slate-500">{selected.email}</span>
              </div>
              <div>
                <Label className="text-xs">Perfil</Label>
                <Select value={newProfile} onValueChange={setNewProfile}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {data.profiles.filter(p => p.isActive).map(p => (
                      <SelectItem key={p.slug} value={p.slug}>{p.name} ({p.slug})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Motivo (opcional)</Label>
                <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: Promovido para analista sênior" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancelar</Button>
            <Button onClick={handleAssign} disabled={saving} className="bg-[#1356E2]">
              {saving ? 'Salvando...' : 'Atribuir Perfil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Convidar novo usuário */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#1356E2]" /> Convidar novo usuário
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
              <div className="flex gap-2">
                <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Como funciona:</strong> o usuário receberá um email da Base44 e fará login com a conta Google do email informado. O perfil será atribuído automaticamente.
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs">Email *</Label>
              <Input type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} placeholder="usuario@empresa.com" />
            </div>
            <div>
              <Label className="text-xs">Nome completo (opcional)</Label>
              <Input value={invite.fullName} onChange={(e) => setInvite({ ...invite, fullName: e.target.value })} placeholder="Ex: Victor Alves" />
            </div>
            <div>
              <Label className="text-xs">Perfil *</Label>
              <Select value={invite.profileSlug} onValueChange={(v) => setInvite({ ...invite, profileSlug: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {data.profiles.filter(p => p.isActive).map(p => (
                    <SelectItem key={p.slug} value={p.slug}>{p.name} ({p.slug})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Motivo (opcional)</Label>
              <Textarea rows={2} value={invite.reason} onChange={(e) => setInvite({ ...invite, reason: e.target.value })} placeholder="Ex: Admin inicial da plataforma" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={inviting}>Cancelar</Button>
            <Button onClick={handleInvite} disabled={inviting} className="bg-[#1356E2]">
              {inviting ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}