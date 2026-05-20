import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * [V5.2 Fase 6.3] Modal multi-step para aplicar uma exceção V5.2 a bloqueios ativos
 *
 * Steps:
 *  1. Escolher Categoria de Exceção (cat_1 a cat_5) e bloqueios a mitigar
 *  2. Se cat_5: configurar TPV cap, rolling reserve, gatilhos off-boarding
 *  3. Justificativa + confirmação
 *  4. Resultado
 *
 * Props:
 *  - caseId: string
 *  - bloqueiosAtivos: string[] (códigos B-* atualmente ativos)
 *  - onApplied: () => void  (callback após sucesso para refetch)
 */
export default function V5_2ExceptionWorkflow({ caseId, bloqueiosAtivos = [], onApplied }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [excecoes, setExcecoes] = useState([]);
  const [loadingExcecoes, setLoadingExcecoes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Form state
  const [exceptionCodigo, setExceptionCodigo] = useState('');
  const [bloqueiosSelecionados, setBloqueiosSelecionados] = useState([]);
  const [justificativa, setJustificativa] = useState('');
  const [tpvCapInicialPct, setTpvCapInicialPct] = useState(50);
  const [rollingReserveAdicionalPct, setRollingReserveAdicionalPct] = useState(5);
  const [frequenciaRevisaoDias, setFrequenciaRevisaoDias] = useState(30);
  const [gatilhosOffBoarding, setGatilhosOffBoarding] = useState('');

  const excecaoSelecionada = excecoes.find((e) => e.codigo === exceptionCodigo);
  const isCat5 = exceptionCodigo === 'cat_5_monitoramento_intensivo';

  useEffect(() => {
    if (!open) return;
    setLoadingExcecoes(true);
    base44.entities.Exception.filter({ ativo: true })
      .then((data) => {
        setExcecoes((data || []).sort((a, b) => (a.codigo || '').localeCompare(b.codigo || '')));
      })
      .finally(() => setLoadingExcecoes(false));
  }, [open]);

  // Aplica defaults da exceção quando ela muda
  useEffect(() => {
    if (excecaoSelecionada) {
      if (excecaoSelecionada.tpv_cap_inicial_pct_padrao != null) {
        setTpvCapInicialPct(excecaoSelecionada.tpv_cap_inicial_pct_padrao);
      }
      if (excecaoSelecionada.rolling_reserve_adicional_pct_padrao != null) {
        setRollingReserveAdicionalPct(excecaoSelecionada.rolling_reserve_adicional_pct_padrao);
      }
    }
  }, [exceptionCodigo, excecaoSelecionada]);

  const reset = () => {
    setStep(1);
    setExceptionCodigo('');
    setBloqueiosSelecionados([]);
    setJustificativa('');
    setTpvCapInicialPct(50);
    setRollingReserveAdicionalPct(5);
    setFrequenciaRevisaoDias(30);
    setGatilhosOffBoarding('');
    setResult(null);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(reset, 300);
  };

  const toggleBloqueio = (codigo) => {
    setBloqueiosSelecionados((prev) =>
      prev.includes(codigo) ? prev.filter((b) => b !== codigo) : [...prev, codigo]
    );
  };

  const canAdvanceStep1 = exceptionCodigo && bloqueiosSelecionados.length > 0;
  const canAdvanceStep2 = !isCat5 || (tpvCapInicialPct > 0 && tpvCapInicialPct <= 100);
  const canSubmit = justificativa.trim().length >= 20;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        onboardingCaseId: caseId,
        exceptionCodigo,
        bloqueiosMitigados: bloqueiosSelecionados,
        justificativa: justificativa.trim(),
      };
      if (isCat5) {
        payload.tpvCapInicialPct = Number(tpvCapInicialPct);
        payload.rollingReserveAdicionalPct = Number(rollingReserveAdicionalPct);
        payload.frequenciaRevisaoDias = Number(frequenciaRevisaoDias);
        payload.gatilhosOffBoarding = gatilhosOffBoarding
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
      }
      const res = await base44.functions.invoke('applyV5_2Exception', payload);
      if (res.data?.success) {
        setResult(res.data);
        setStep(4);
        toast.success('Exceção aplicada com sucesso');
        if (onApplied) onApplied();
      } else {
        toast.error(res.data?.error || 'Erro ao aplicar exceção');
      }
    } catch (err) {
      toast.error(err.message || 'Erro ao aplicar exceção');
    } finally {
      setSubmitting(false);
    }
  };

  if (!bloqueiosAtivos || bloqueiosAtivos.length === 0) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="border-amber-300 text-amber-700 hover:bg-amber-50"
      >
        <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
        Aplicar Exceção V5.2
      </Button>

      <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              Aplicar Exceção V5.2
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                Passo {step} de {isCat5 ? 4 : 3}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {/* STEP 1 — escolher categoria + bloqueios */}
          {step === 1 && (
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Categoria de Exceção</Label>
                {loadingExcecoes ? (
                  <p className="text-xs text-slate-500">Carregando categorias…</p>
                ) : (
                  <Select value={exceptionCodigo} onValueChange={setExceptionCodigo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria…" />
                    </SelectTrigger>
                    <SelectContent>
                      {excecoes.map((e) => (
                        <SelectItem key={e.codigo} value={e.codigo}>
                          {e.nome} · {e.papel_requerido?.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {excecaoSelecionada && (
                  <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                    {excecaoSelecionada.descricao}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold mb-1.5 block">
                  Bloqueios a mitigar ({bloqueiosSelecionados.length} de {bloqueiosAtivos.length})
                </Label>
                <div className="border border-[#002443]/8 rounded-md p-2 max-h-48 overflow-y-auto space-y-1.5">
                  {bloqueiosAtivos.map((b) => (
                    <label key={b} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 p-1 rounded">
                      <Checkbox
                        checked={bloqueiosSelecionados.includes(b)}
                        onCheckedChange={() => toggleBloqueio(b)}
                      />
                      <span className="font-mono text-[#002443]/80">{b}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — configuração Cat 5 (se aplicável) */}
          {step === 2 && isCat5 && (
            <div className="space-y-4 py-2">
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-900">
                <p className="font-semibold mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Categoria 5 — Monitoramento Intensivo
                </p>
                <p>Será criado um PlanoMonitoramento + TermoAdicionalV5_2 que precisa ser aceito pelo seller antes de ativar.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">TPV Cap Inicial (%)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={tpvCapInicialPct}
                    onChange={(e) => setTpvCapInicialPct(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Rolling Reserve Adicional (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={50}
                    value={rollingReserveAdicionalPct}
                    onChange={(e) => setRollingReserveAdicionalPct(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Frequência de Revisão (dias)</Label>
                  <Input
                    type="number"
                    min={7}
                    max={180}
                    value={frequenciaRevisaoDias}
                    onChange={(e) => setFrequenciaRevisaoDias(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Gatilhos de off-boarding 24-48h (um por linha)</Label>
                <Textarea
                  rows={4}
                  placeholder={'Ex:\nChargeback > 3%\nFraude > 0.5%\nVolume acima do cap'}
                  value={gatilhosOffBoarding}
                  onChange={(e) => setGatilhosOffBoarding(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* STEP 3 — justificativa final */}
          {((step === 2 && !isCat5) || step === 3) && (
            <div className="space-y-3 py-2">
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs space-y-1">
                <p><strong>Categoria:</strong> {excecaoSelecionada?.nome}</p>
                <p><strong>Papel requerido:</strong> {excecaoSelecionada?.papel_requerido?.replace(/_/g, ' ')}</p>
                <p><strong>Bloqueios a mitigar:</strong> {bloqueiosSelecionados.join(', ')}</p>
                {isCat5 && (
                  <>
                    <p><strong>TPV cap:</strong> {tpvCapInicialPct}% · <strong>Rolling reserve adicional:</strong> {rollingReserveAdicionalPct}%</p>
                  </>
                )}
              </div>
              <div>
                <Label className="text-xs font-semibold">Justificativa (mín. 20 caracteres)</Label>
                <Textarea
                  rows={5}
                  placeholder="Explique a razão técnica/regulatória/comercial para aplicar esta exceção…"
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                />
                <p className="text-[10px] text-slate-500 mt-1">{justificativa.length} / 20 mínimo</p>
              </div>
            </div>
          )}

          {/* STEP 4 — resultado */}
          {step === 4 && result && (
            <div className="space-y-3 py-2 text-sm">
              <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4 text-emerald-900">
                <p className="font-semibold mb-2">✓ Exceção aplicada com sucesso</p>
                <ul className="text-xs space-y-1">
                  <li>• Bloqueios mitigados: {result.bloqueiosMitigados?.join(', ')}</li>
                  <li>• Bloqueios restantes: {result.bloqueiosRestantes?.length || 0}</li>
                  <li>• Snapshot imutável: <code className="font-mono">{result.snapshot_id}</code></li>
                  {result.plano_monitoramento_id && (
                    <li>• Plano de Monitoramento: <code className="font-mono">{result.plano_monitoramento_id}</code></li>
                  )}
                  {result.requiresSellerAcceptance && (
                    <li className="text-amber-700 mt-2 pt-2 border-t border-emerald-200">
                      ⚠ Aguardando aceite do seller no TermoAdicionalV5_2 para ativar o plano.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {step === 1 && (
              <>
                <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                <Button
                  disabled={!canAdvanceStep1}
                  onClick={() => setStep(isCat5 ? 2 : 2)}
                >
                  Próximo
                </Button>
              </>
            )}
            {step === 2 && isCat5 && (
              <>
                <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
                <Button disabled={!canAdvanceStep2} onClick={() => setStep(3)}>Próximo</Button>
              </>
            )}
            {step === 2 && !isCat5 && (
              <>
                <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
                <Button disabled={!canSubmit || submitting} onClick={handleSubmit}>
                  {submitting ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Aplicando…</> : 'Aplicar Exceção'}
                </Button>
              </>
            )}
            {step === 3 && (
              <>
                <Button variant="outline" onClick={() => setStep(isCat5 ? 2 : 1)}>Voltar</Button>
                <Button disabled={!canSubmit || submitting} onClick={handleSubmit}>
                  {submitting ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Aplicando…</> : 'Aplicar Exceção'}
                </Button>
              </>
            )}
            {step === 4 && (
              <Button onClick={handleClose}>Fechar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}