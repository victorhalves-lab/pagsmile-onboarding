import React, { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, Layers, Copy, FileText, Sparkles } from 'lucide-react';
import MCCSearchModal from '@/components/leads/MCCSearchModal';
import { getMccLabel } from './proposalMccHelpers';

/**
 * Modal de 2 passos para adicionar um MCC adicional em proposta multi-MCC.
 *
 * Passo 1: Escolher o código MCC (reusa MCCSearchModal embutido).
 * Passo 2: Escolher a fonte das taxas:
 *   - 'active'  → copia do MCC ativo (default, comportamento legado)
 *   - 'segment' → carrega de SegmentDefaultRates (Gateway/Marketplace/etc.)
 *   - 'blank'   → começa zerado
 *
 * onConfirm({ mccCode, mccLabel, source, segmentRates? }) — quem chama monta o entry.
 */
export default function AddMccWithSourceModal({ isOpen, onClose, onConfirm }) {
  const [step, setStep] = useState(1);
  const [picked, setPicked] = useState(null); // { mcc, label }
  const [source, setSource] = useState('active');
  const [segmentName, setSegmentName] = useState('');
  const [segments, setSegments] = useState([]);
  const [loadingSegments, setLoadingSegments] = useState(false);
  const [mccSearchOpen, setMccSearchOpen] = useState(false);
  // Ref síncrono: distingue "usuário fechou sem escolher" de "MCCSearchModal
  // chamou onClose logo após onSelect" (state batched — picked ainda é null).
  const justPickedRef = useRef(false);

  // Reset ao abrir
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setPicked(null);
      setSource('active');
      setSegmentName('');
      setMccSearchOpen(true);
      justPickedRef.current = false;
    }
  }, [isOpen]);

  // Carrega segmentos quando precisar (step 2 + source segment)
  useEffect(() => {
    if (step !== 2 || segments.length > 0) return;
    setLoadingSegments(true);
    base44.entities.SegmentDefaultRates.list()
      .then(list => setSegments(Array.isArray(list) ? list : []))
      .finally(() => setLoadingSegments(false));
  }, [step, segments.length]);

  if (!isOpen) return null;

  // Passo 1: usamos o MCCSearchModal real (já existente). Quando o usuário escolhe um
  // MCC, capturamos e avançamos pro passo 2 — em vez de fechar o fluxo todo.
  const handleMccPicked = (mccCode) => {
    justPickedRef.current = true;
    setPicked({ mcc: String(mccCode), label: getMccLabel(mccCode) });
    setMccSearchOpen(false);
    setStep(2);
  };

  const handleMccSearchClose = () => {
    setMccSearchOpen(false);
    // Se o MCCSearchModal chamou onClose logo após onSelect, justPickedRef
    // já estará true (refs são síncronos) → NÃO fecha o fluxo.
    // Só fecha o fluxo se o usuário fechou sem escolher nenhum MCC.
    if (!justPickedRef.current && !picked) onClose();
  };

  const handleConfirm = () => {
    if (!picked) return;
    const chosenSegment = source === 'segment'
      ? segments.find(s => s.segmentName === segmentName)
      : null;
    onConfirm({
      mccCode: picked.mcc,
      mccLabel: picked.label,
      source,
      segmentRates: chosenSegment || null,
    });
    onClose();
  };

  // Enquanto está no passo 1, delegamos para o MCCSearchModal embutido.
  if (step === 1) {
    return (
      <MCCSearchModal
        isOpen={mccSearchOpen}
        onClose={handleMccSearchClose}
        onSelect={handleMccPicked}
      />
    );
  }

  // Passo 2 — escolha da fonte das taxas
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-xl flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-[#0A0A0A]">Taxas iniciais do novo MCC</h2>
            <p className="text-xs text-[#0A0A0A]/60 mt-1">
              MCC <span className="font-mono font-bold">{picked.mcc}</span> — {picked.label}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setStep(1); setMccSearchOpen(true); }} className="h-8 text-xs">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Trocar MCC
          </Button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-2">
          <p className="text-[11px] uppercase tracking-wider font-bold text-[#0A0A0A]/40 mb-3">
            Como preencher as taxas deste MCC?
          </p>

          {/* Opção 1 — copiar do MCC ativo */}
          <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
            source === 'active' ? 'border-[#1356E2] bg-[#1356E2]/5' : 'border-slate-200 hover:border-slate-300'
          }`}>
            <input
              type="radio"
              name="source"
              value="active"
              checked={source === 'active'}
              onChange={() => setSource('active')}
              className="mt-1 accent-[#1356E2]"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Copy className="w-4 h-4 text-[#0A0A0A]/70" />
                <span className="text-sm font-bold text-[#0A0A0A]">Copiar do MCC ativo</span>
              </div>
              <p className="text-xs text-[#0A0A0A]/60 mt-1">
                Usa as mesmas taxas do MCC que você está editando agora como ponto de partida (depois você ajusta o que quiser).
              </p>
            </div>
          </label>

          {/* Opção 2 — segmento padrão */}
          <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
            source === 'segment' ? 'border-[#1356E2] bg-[#1356E2]/5' : 'border-slate-200 hover:border-slate-300'
          }`}>
            <input
              type="radio"
              name="source"
              value="segment"
              checked={source === 'segment'}
              onChange={() => setSource('segment')}
              className="mt-1 accent-[#1356E2]"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E84B1C]" />
                <span className="text-sm font-bold text-[#0A0A0A]">Usar taxas padrão de um segmento</span>
              </div>
              <p className="text-xs text-[#0A0A0A]/60 mt-1">
                Ex.: aplicar as taxas de referência de <em>Gateway</em>, <em>Marketplace</em>, <em>E-commerce</em>, etc.
              </p>

              {source === 'segment' && (
                <div className="mt-3">
                  <select
                    value={segmentName}
                    onChange={e => setSegmentName(e.target.value)}
                    disabled={loadingSegments}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#1356E2]"
                  >
                    <option value="">
                      {loadingSegments ? 'Carregando segmentos…' : 'Selecione um segmento…'}
                    </option>
                    {segments.map(s => (
                      <option key={s.id} value={s.segmentName}>
                        {s.segmentName} — à vista {s.mdrAvista ?? '—'}%, 2-6x {s.mdr2a6x ?? '—'}%
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </label>

          {/* Opção 3 — branco */}
          <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
            source === 'blank' ? 'border-[#1356E2] bg-[#1356E2]/5' : 'border-slate-200 hover:border-slate-300'
          }`}>
            <input
              type="radio"
              name="source"
              value="blank"
              checked={source === 'blank'}
              onChange={() => setSource('blank')}
              className="mt-1 accent-[#1356E2]"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0A0A0A]/70" />
                <span className="text-sm font-bold text-[#0A0A0A]">Começar em branco</span>
              </div>
              <p className="text-xs text-[#0A0A0A]/60 mt-1">
                Cria a aba zerada — você digita cada taxa manualmente.
              </p>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-4 border-t border-slate-200 bg-slate-50/50 rounded-b-2xl">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleConfirm}
            disabled={source === 'segment' && !segmentName}
            className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white"
          >
            Adicionar MCC <Check className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}