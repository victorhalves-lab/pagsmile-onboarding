import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, GitCommit, AlertTriangle, Sparkles, Bug, Wrench, Shield, Zap, Palette, Rocket, FileText, Database, Server, History, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import ChangelogDetailModal from './ChangelogDetailModal';
import ChangelogFormModal from './ChangelogFormModal';

const categoryConfig = {
  FEATURE:     { icon: Sparkles, color: 'bg-emerald-100 text-emerald-700', label: 'Feature' },
  BUGFIX:      { icon: Bug, color: 'bg-red-100 text-red-700', label: 'Bugfix' },
  REFACTOR:    { icon: Wrench, color: 'bg-blue-100 text-blue-700', label: 'Refactor' },
  SECURITY:    { icon: Shield, color: 'bg-violet-100 text-violet-700', label: 'Segurança' },
  COMPLIANCE:  { icon: FileText, color: 'bg-indigo-100 text-indigo-700', label: 'Compliance' },
  INTEGRATION: { icon: Server, color: 'bg-cyan-100 text-cyan-700', label: 'Integração' },
  UI_UX:       { icon: Palette, color: 'bg-pink-100 text-pink-700', label: 'UI/UX' },
  PERFORMANCE: { icon: Zap, color: 'bg-amber-100 text-amber-700', label: 'Performance' },
  GOVERNANCE:  { icon: Shield, color: 'bg-slate-100 text-slate-700', label: 'Governança' },
  DATA_MODEL:  { icon: Database, color: 'bg-purple-100 text-purple-700', label: 'Modelo de Dados' },
  INFRA:       { icon: Rocket, color: 'bg-orange-100 text-orange-700', label: 'Infra' },
};

const severityConfig = {
  LOW:      { color: 'bg-slate-100 text-slate-600', label: 'Baixo' },
  MEDIUM:   { color: 'bg-blue-100 text-blue-700', label: 'Médio' },
  HIGH:     { color: 'bg-amber-100 text-amber-700', label: 'Alto' },
  CRITICAL: { color: 'bg-red-100 text-red-700', label: 'Crítico' },
};

export default function ChangelogTimeline({ entries, onRefresh }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [reconstructing, setReconstructing] = useState(false);

  const handleReconstruct = async () => {
    if (!confirm('Reconstruir histórico retroativo?\n\nIsso vai usar IA para gerar entradas de changelog para ~21 épicos da plataforma desde o início (Jun/2025 → hoje), com base nas entidades, páginas e functions existentes.\n\nAs entradas serão marcadas com [reconstruído] para diferenciar de mudanças futuras reais. Operação idempotente (pode rodar mais de uma vez).')) return;
    setReconstructing(true);
    try {
      const res = await base44.functions.invoke('seedHistoricalChangelog', { force: false });
      const d = res.data || {};
      toast.success(`Reconstruído: ${d.created} novos · ${d.skipped} já existiam · ${d.errors} erros`);
      onRefresh();
    } catch (e) {
      toast.error('Erro ao reconstruir histórico: ' + e.message);
    } finally {
      setReconstructing(false);
    }
  };

  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      if (severityFilter !== 'all' && e.severity !== severityFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${e.title || ''} ${e.summary || ''} ${e.userRequest || ''} ${(e.tags || []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [entries, search, categoryFilter, severityFilter]);

  // Group by month
  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach(e => {
      const date = new Date(e.implementedAt || e.created_date);
      const key = format(date, 'yyyy-MM');
      const label = format(date, "MMMM 'de' yyyy", { locale: ptBR });
      if (!map.has(key)) map.set(key, { label, items: [] });
      map.get(key).items.push(e);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#0A0A0A]/40" />
            <Input placeholder="Buscar por título, descrição, tag..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {Object.entries(categoryConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toda severidade</SelectItem>
              {Object.entries(severityConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowForm(true)} className="bg-[#1356E2] hover:bg-[#1356E2]/90">
            <Plus className="w-4 h-4 mr-1" /> Registrar Mudança
          </Button>
          <Button onClick={handleReconstruct} disabled={reconstructing} variant="outline" title="Reconstrói retroativamente o histórico de implementações usando IA + estrutura do código">
            {reconstructing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <History className="w-4 h-4 mr-1" />}
            Reconstruir Histórico
          </Button>
        </div>
      </Card>

      {filtered.length === 0 && (
        <Card className="p-12 text-center">
          <GitCommit className="w-12 h-12 text-[#0A0A0A]/20 mx-auto mb-3" />
          <p className="text-[#0A0A0A]/60">Nenhuma mudança registrada ainda.</p>
          <p className="text-xs text-[#0A0A0A]/40 mt-1">Use "Registrar Mudança" para documentar implementações feitas via chat.</p>
        </Card>
      )}

      {grouped.map(([key, group]) => (
        <div key={key}>
          <h3 className="text-sm font-bold text-[#0A0A0A]/60 uppercase tracking-wider mb-3">{group.label} <span className="text-xs font-normal">({group.items.length})</span></h3>
          <div className="space-y-3">
            {group.items.map(e => {
              const cat = categoryConfig[e.category] || categoryConfig.FEATURE;
              const sev = severityConfig[e.severity] || severityConfig.MEDIUM;
              const Icon = cat.icon;
              return (
                <Card key={e.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelected(e)}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${cat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-[#0A0A0A] text-sm">{e.title}</h4>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Badge className={cat.color}>{cat.label}</Badge>
                          <Badge className={sev.color}>{sev.label}</Badge>
                          {e.breakingChanges && <Badge className="bg-red-100 text-red-700"><AlertTriangle className="w-3 h-3 mr-1" />Breaking</Badge>}
                        </div>
                      </div>
                      <p className="text-xs text-[#0A0A0A]/70 line-clamp-2">{e.summary}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-[#0A0A0A]/50">
                        <span>{format(new Date(e.implementedAt || e.created_date), 'dd/MM/yyyy HH:mm')}</span>
                        {e.implementedBy && <span>· {e.implementedBy}</span>}
                        {e.filesChanged?.length > 0 && <span>· {e.filesChanged.length} arquivo(s)</span>}
                        {e.tags?.length > 0 && (
                          <div className="flex gap-1">
                            {e.tags.slice(0, 3).map(t => <span key={t} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">{t}</span>)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {selected && <ChangelogDetailModal entry={selected} onClose={() => setSelected(null)} categoryConfig={categoryConfig} severityConfig={severityConfig} />}
      {showForm && <ChangelogFormModal onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); onRefresh(); }} />}
    </div>
  );
}