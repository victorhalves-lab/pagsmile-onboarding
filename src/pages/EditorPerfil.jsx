import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Search, Shield } from 'lucide-react';
import { PAGES_REGISTRY, getAllPageIds } from '@/lib/permissionsRegistry';
import ProfileSectionGroup from '@/components/admin/profiles/ProfileSectionGroup';
import SidebarPreview from '@/components/admin/profiles/SidebarPreview';
import { toast } from 'sonner';

const COLORS = ['#ef4444','#f59e0b','#2bc196','#14b8a6','#3b82f6','#8b5cf6','#ec4899','#64748b'];
const ICONS = ['Shield','ShieldCheck','Crown','Briefcase','Users','Handshake','DollarSign','Eye','Inbox','Stamp','Database','BarChart3','Wrench','Plug','Settings','BookOpen'];

export default function EditorPerfil() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const isNew = params.get('new') === '1';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [profile, setProfile] = useState({
    name: '', slug: '', description: '', color: '#2bc196', icon: 'Shield',
    isSystem: false, isActive: true, requiresAdminCode: true, homePage: 'Home',
    pagePermissions: []
  });

  useEffect(() => {
    if (isNew) { setLoading(false); return; }
    if (!id) return;
    (async () => {
      try {
        const list = await base44.entities.AccessProfile.filter({ id });
        if (list[0]) setProfile({ ...list[0], pagePermissions: list[0].pagePermissions || [] });
      } catch { toast.error('Erro ao carregar perfil'); }
      setLoading(false);
    })();
  }, [id, isNew]);

  const pagePermMap = useMemo(() => {
    const m = {};
    for (const p of profile.pagePermissions || []) m[p.pageId] = p;
    return m;
  }, [profile.pagePermissions]);

  const updatePagePerm = (pageId, value) => {
    const arr = [...(profile.pagePermissions || [])];
    const idx = arr.findIndex(p => p.pageId === pageId);
    const merged = { pageId, ...value };
    if (idx >= 0) arr[idx] = merged; else arr.push(merged);
    setProfile({ ...profile, pagePermissions: arr });
  };

  const filteredSections = useMemo(() => {
    if (!search.trim()) return PAGES_REGISTRY;
    const q = search.toLowerCase();
    return PAGES_REGISTRY.map(s => ({
      ...s,
      pages: s.pages.filter(p => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
    })).filter(s => s.pages.length > 0);
  }, [search]);

  const allPageIds = useMemo(() => getAllPageIds(), []);

  const handleSave = async () => {
    if (!profile.name || !profile.slug) { toast.error('Nome e slug obrigatórios'); return; }
    setSaving(true);
    try {
      await base44.functions.invoke('adminUpsertProfile', { profile });
      toast.success('Perfil salvo');
      navigate('/GestaoPerfis');
    } catch (e) {
      const msg = e?.response?.data?.error || 'Erro ao salvar';
      toast.error(msg);
    }
    setSaving(false);
  };

  if (loading) return <p className="text-center py-12 text-slate-500">Carregando...</p>;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/GestaoPerfis')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#002443] flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#2bc196]" />
              {isNew ? 'Novo Perfil' : `Editar: ${profile.name}`}
            </h1>
            <p className="text-sm text-[#002443]/60 mt-1">Configure quais páginas, abas, sub-abas e ações este perfil pode acessar.</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-[#2bc196] hover:bg-[#2bc196]/90">
          <Save className="w-4 h-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar Perfil'}
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Dados básicos + lista de páginas */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {/* Metadados */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="font-semibold text-[#002443] text-sm">Informações Gerais</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Nome</Label>
                <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Ex: Analista de Compliance" />
              </div>
              <div>
                <Label className="text-xs">Slug (identificador único)</Label>
                <Input
                  value={profile.slug}
                  onChange={(e) => setProfile({ ...profile, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                  placeholder="compliance_analyst"
                  disabled={!isNew}
                  className="font-mono text-sm"
                />
                {!isNew && <p className="text-[10px] text-slate-400 mt-1">Slug não pode ser alterado após criação</p>}
              </div>
            </div>
            <div>
              <Label className="text-xs">Descrição</Label>
              <Textarea rows={2} value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} placeholder="Papel e responsabilidades deste perfil" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Cor</Label>
                <div className="flex gap-1.5 mt-1.5">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setProfile({ ...profile, color: c })}
                      className={`w-7 h-7 rounded-full border-2 ${profile.color === c ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs">Ícone</Label>
                <Select value={profile.icon} onValueChange={(v) => setProfile({ ...profile, icon: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ICONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Home Page</Label>
                <Select value={profile.homePage} onValueChange={(v) => setProfile({ ...profile, homePage: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {allPageIds.map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={profile.isActive} onCheckedChange={(v) => setProfile({ ...profile, isActive: !!v })} />
                <span className="text-sm">Ativo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={profile.requiresAdminCode} onCheckedChange={(v) => setProfile({ ...profile, requiresAdminCode: !!v })} />
                <span className="text-sm">Exige código admin (2FA)</span>
              </label>
            </div>
          </div>

          {/* Lista de páginas */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#002443] text-sm">Permissões por Página</h2>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar página..." className="pl-9 w-64" />
              </div>
            </div>
            <div className="space-y-3">
              {filteredSections.map(section => (
                <ProfileSectionGroup
                  key={section.section}
                  section={section}
                  pagePermissions={profile.pagePermissions}
                  onChange={updatePagePerm}
                  defaultExpanded={!!search}
                />
              ))}
            </div>
            {filteredSections.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-8">Nenhuma página encontrada.</p>
            )}
          </div>
        </div>

        {/* Preview lateral */}
        <div className="col-span-12 lg:col-span-4">
          <SidebarPreview pagePermissions={profile.pagePermissions} />
        </div>
      </div>
    </div>
  );
}