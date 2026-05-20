import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Activity, ShieldAlert, CheckCircle2, Clock, FileText, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * [V5.2 Fase 6.3] Card que mostra o PlanoMonitoramento vinculado a um caso V5.2 (cat_5).
 * Renderiza:
 *  - Status do plano + condições operacionais
 *  - Gatilhos de off-boarding
 *  - Status do TermoAdicionalV5_2 (aceito ou aguardando)
 *  - Botão admin para marcar aceite manualmente (se necessário)
 *
 * Props: caseId
 */
export default function V5_2PlanoMonitoramentoCard({ caseId }) {
  const [plano, setPlano] = useState(null);
  const [termo, setTermo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [acceptForm, setAcceptForm] = useState({ nome: '', email: '', cpf: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const planos = await base44.entities.PlanoMonitoramento.filter({ onboarding_case_id: caseId });
      if (!planos || planos.length === 0) {
        setPlano(null);
        setTermo(null);
        return;
      }
      const p = planos[0];
      setPlano(p);
      if (p.termo_adicional_id) {
        const t = await base44.entities.TermoAdicionalV5_2.get(p.termo_adicional_id);
        setTermo(t);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) loadData();
  }, [caseId]);

  const handleAccept = async () => {
    if (!acceptForm.nome.trim() || !acceptForm.email.trim()) {
      toast.error('Nome e email são obrigatórios');
      return;
    }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke('acceptTermoAdicionalV5_2', {
        termoAdicionalId: termo.id,
        aceitoPorNome: acceptForm.nome.trim(),
        aceitoPorEmail: acceptForm.email.trim(),
        aceitoPorCpf: acceptForm.cpf.trim() || undefined,
      });
      if (res.data?.success) {
        toast.success('Termo aceito com sucesso');
        setAcceptOpen(false);
        loadData();
      } else {
        toast.error(res.data?.error || 'Erro ao aceitar termo');
      }
    } catch (err) {
      toast.error(err.message || 'Erro ao aceitar termo');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-xs text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
          Carregando plano de monitoramento…
        </CardContent>
      </Card>
    );
  }

  if (!plano) return null;

  const statusColor = {
    ativo: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    em_revisao: 'bg-amber-50 text-amber-700 border-amber-200',
    promovido: 'bg-blue-50 text-blue-700 border-blue-200',
    off_boarded: 'bg-red-50 text-red-700 border-red-200',
    cancelado: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-600" />
            Plano de Monitoramento Intensivo (Cat 5)
            <Badge className={`text-[10px] border ${statusColor[plano.status] || statusColor.ativo}`}>
              {plano.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Condições operacionais */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-[#002443]/50 text-[10px] uppercase font-semibold tracking-wide">TPV Cap</p>
              <p className="font-mono text-base font-bold text-[#002443]">{plano.tpv_cap_inicial_pct}%</p>
            </div>
            <div>
              <p className="text-[#002443]/50 text-[10px] uppercase font-semibold tracking-wide">Rolling Reserve+</p>
              <p className="font-mono text-base font-bold text-[#002443]">{plano.rolling_reserve_adicional_pct}%</p>
            </div>
            <div>
              <p className="text-[#002443]/50 text-[10px] uppercase font-semibold tracking-wide">Revisão</p>
              <p className="font-mono text-base font-bold text-[#002443]">{plano.frequencia_revisao_dias}d</p>
            </div>
          </div>

          {/* Bloqueios mitigados */}
          {Array.isArray(plano.bloqueios_mitigados) && plano.bloqueios_mitigados.length > 0 && (
            <div>
              <p className="text-[10px] uppercase text-[#002443]/50 font-semibold mb-1">Bloqueios Mitigados</p>
              <div className="flex flex-wrap gap-1">
                {plano.bloqueios_mitigados.map((b) => (
                  <Badge key={b} className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-mono">
                    {b}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Gatilhos off-boarding */}
          {Array.isArray(plano.gatilhos_off_boarding_agil) && plano.gatilhos_off_boarding_agil.length > 0 && (
            <div>
              <p className="text-[10px] uppercase text-[#002443]/50 font-semibold mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                Gatilhos de Off-Boarding 24-48h
              </p>
              <ul className="text-xs text-[#002443]/75 space-y-0.5">
                {plano.gatilhos_off_boarding_agil.map((g, i) => (
                  <li key={i} className="flex gap-1.5"><span className="text-red-500">●</span>{g}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3 text-[11px] text-[#002443]/70 border-t border-[#002443]/8 pt-2">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>Próx. revisão: <strong>{plano.data_proxima_revisao || '—'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" />
              <span>Elegível promoção: <strong>{plano.data_promocao_elegivel || '—'}</strong></span>
            </div>
          </div>

          {/* Termo Adicional */}
          {termo && (
            <div className={`rounded-md p-3 border ${termo.aceito_em ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Termo Adicional V5.2
                </p>
                <Badge className={`text-[10px] border ${termo.aceito_em ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'}`}>
                  {termo.aceito_em ? '✓ Aceito' : 'Aguardando aceite'}
                </Badge>
              </div>
              {termo.aceito_em ? (
                <div className="text-[11px] text-[#002443]/70 space-y-0.5">
                  <p>Aceito por <strong>{termo.aceito_por_nome}</strong> ({termo.aceito_por_email})</p>
                  <p>Em: {new Date(termo.aceito_em).toLocaleString('pt-BR')}</p>
                  <p className="font-mono text-[9px] text-[#002443]/40 truncate">hash: {termo.hash_integridade}</p>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-[#002443]/70">O plano só fica plenamente ativo após aceite formal do seller.</p>
                  <Button size="sm" variant="outline" onClick={() => setAcceptOpen(true)}>
                    Registrar aceite
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={acceptOpen} onOpenChange={setAcceptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar aceite do Termo Adicional V5.2</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Nome completo de quem aceita</Label>
              <Input value={acceptForm.nome} onChange={(e) => setAcceptForm({ ...acceptForm, nome: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input type="email" value={acceptForm.email} onChange={(e) => setAcceptForm({ ...acceptForm, email: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">CPF (opcional)</Label>
              <Input value={acceptForm.cpf} onChange={(e) => setAcceptForm({ ...acceptForm, cpf: e.target.value })} />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded p-2 text-[11px] text-amber-900">
              O aceite gera um hash de integridade SHA-256 imutável vinculando o conteúdo do termo aos dados informados.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptOpen(false)}>Cancelar</Button>
            <Button onClick={handleAccept} disabled={submitting}>
              {submitting ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Registrando…</> : 'Confirmar aceite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}