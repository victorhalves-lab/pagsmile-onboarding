import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Shield, Users, Edit2, Trash2, Lock, CheckCircle2, XCircle } from 'lucide-react';
import { getIcon } from '@/lib/iconMap';
import { toast } from 'sonner';

export default function GestaoPerfis() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('adminListProfiles', {});
      setProfiles(res.data?.profiles || []);
    } catch (e) {
      toast.error('Erro ao carregar perfis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (profile) => {
    if (profile.isSystem) return;
    if (!confirm(`Deletar perfil "${profile.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await base44.functions.invoke('adminDeleteProfile', { id: profile.id });
      toast.success('Perfil deletado');
      load();
    } catch (e) {
      const msg = e?.response?.data?.error || 'Erro ao deletar';
      const assigned = e?.response?.data?.assignedUsers;
      if (assigned && assigned.length > 0) {
        toast.error(`${msg}: ${assigned.map(u => u.full_name || u.email).join(', ')}`);
      } else {
        toast.error(msg);
      }
    }
  };

  const handleSeed = async () => {
    if (!confirm('Reexecutar seed dos perfis padrão? Cria ausentes e atualiza os de sistema.')) return;
    try {
      const res = await base44.functions.invoke('seedAccessProfiles', {});
      toast.success(`Seed: ${res.data?.created || 0} criados, ${res.data?.updated || 0} atualizados`);
      load();
    } catch {
      toast.error('Erro no seed');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#002443] flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#2bc196]" /> Gestão de Perfis de Acesso
          </h1>
          <p className="text-sm text-[#002443]/60 mt-1">Crie, edite e gerencie perfis de acesso da plataforma.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeed}>Executar Seed</Button>
          <Button onClick={() => navigate('/EditorPerfil?new=1')}>
            <Plus className="w-4 h-4 mr-2" /> Novo Perfil
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-center py-12 text-slate-500">Carregando...</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map(p => {
            const Icon = getIcon(p.icon);
            return (
              <Card key={p.id} className="hover:shadow-lg transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: (p.color || '#64748b') + '20' }}>
                        <Icon className="w-5 h-5" style={{ color: p.color || '#64748b' }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#002443]">{p.name}</h3>
                        <p className="text-[11px] text-slate-400 font-mono">{p.slug}</p>
                      </div>
                    </div>
                    {p.isSystem && (
                      <Badge variant="secondary" className="text-[10px]">
                        <Lock className="w-3 h-3 mr-1" /> Sistema
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2 min-h-[2rem]">{p.description || 'Sem descrição'}</p>

                  <div className="flex items-center gap-3 mb-4 text-xs">
                    <div className="flex items-center gap-1 text-slate-600">
                      <Users className="w-3.5 h-3.5" />
                      <span className="font-semibold">{p.userCount}</span>
                      <span className="text-slate-400">usuário{p.userCount !== 1 ? 's' : ''}</span>
                    </div>
                    {p.isActive ? (
                      <Badge className="bg-green-100 text-green-700 text-[10px]">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Ativo
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 text-[10px]">
                        <XCircle className="w-3 h-3 mr-1" /> Inativo
                      </Badge>
                    )}
                    {p.requiresAdminCode && (
                      <Badge variant="outline" className="text-[10px]">
                        <Lock className="w-3 h-3 mr-1" /> 2FA
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/EditorPerfil?id=${p.id}`)}>
                      <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Editar
                    </Button>
                    {!p.isSystem && (
                      <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(p)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}