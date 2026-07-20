import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import KeyboardShortcutsPanel from './KeyboardShortcutsPanel';
import SearchOverlay from './SearchOverlay';
import ShortcutsHintBadge from './ShortcutsHintBadge';
import useKeyboardShortcutsV5_2 from './useKeyboardShortcutsV5_2';
import { buildDossieV5_2, downloadBlob } from '@/lib/v5_2/dossieBuilder';
import { generateDossiePdf } from '@/components/v5_2/dossie/dossiePdfGenerator';

/**
 * [V5.2 Fase 6.5.5] Orquestrador dos 15 atalhos para a tela AnaliseCompleta V5.2.
 *
 * Responsável por:
 *  - Manter estado do painel de atalhos ("?") e do overlay de busca ("/")
 *  - Receber callbacks de troca de aba (1/2/3/4)
 *  - Encaminhar ações de decisão (a/c/m/r/s/e) para /AnaliseManual ou abrir o caso
 *  - Disparar download do dossiê (p)
 *  - Copiar ID do caso (g c)
 *  - j/k: scroll entre cards visíveis [data-shortcut-item]
 *  - Esc: fecha qualquer overlay aberto; senão volta ao CadastroDetalhe
 *
 * Não acopla LÓGICA DE NEGÓCIO de decisão — apenas roteia para as telas
 * existentes (AnaliseManual, CadastroDetalhe) com query params.
 */
export default function V5_2ShortcutsProvider({
  caseId,
  merchantId,
  merchantName,
  activeTab,
  onTabChange,
  onGeneratePdf,
}) {
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  // ── j/k navigation: scroll entre [data-shortcut-item] visíveis ──
  const jkIndexRef = useRef(-1);
  const scrollToShortcutItem = useCallback((direction) => {
    const nodes = Array.from(document.querySelectorAll('[data-shortcut-item]'))
      .filter(n => n.offsetParent !== null); // só visíveis
    if (nodes.length === 0) return;
    let idx = jkIndexRef.current;
    idx = direction === 'next' ? idx + 1 : idx - 1;
    if (idx < 0) idx = nodes.length - 1;
    if (idx >= nodes.length) idx = 0;
    jkIndexRef.current = idx;
    const el = nodes[idx];
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('ring-2', 'ring-[#1356E2]', 'ring-offset-2');
    setTimeout(() => el.classList.remove('ring-2', 'ring-[#1356E2]', 'ring-offset-2'), 900);
  }, []);

  // ── Resetar índice quando troca de aba ──
  useEffect(() => {
    jkIndexRef.current = -1;
  }, [activeTab]);

  // ── Esc: fecha painéis primeiro; depois volta uma tela ──
  const handleEscape = useCallback(() => {
    if (helpOpen) { setHelpOpen(false); return; }
    if (searchOpen) { setSearchOpen(false); return; }
    if (merchantId) {
      navigate(`/CadastroDetalhe?id=${merchantId}`);
    }
  }, [helpOpen, searchOpen, merchantId, navigate]);

  // ── Ações de decisão: roteia para AnaliseManual ──
  const routeAction = useCallback((actionLabel, actionParam) => {
    if (!caseId) {
      toast.info(`Atalho "${actionLabel}" registrado, mas nenhum caso ativo.`);
      return;
    }
    toast.success(`${actionLabel} → abrindo Análise Manual`);
    // Passa o caseId pra que AnaliseManual possa pré-filtrar/expandir o caso.
    navigate(`/AnaliseManual?caseId=${caseId}&action=${actionParam}`);
  }, [caseId, navigate]);

  // ── Copy case id ──
  const copyCaseId = useCallback(async () => {
    if (!caseId) {
      toast.info('Nenhum ID de caso disponível.');
      return;
    }
    try {
      await navigator.clipboard.writeText(caseId);
      toast.success(`ID copiado: ${caseId.slice(0, 8)}…`);
    } catch {
      toast.error('Não foi possível copiar — clipboard bloqueado pelo navegador.');
    }
  }, [caseId]);

  // ── Gerar PDF (Dossiê) ──
  // Estratégia: se o pai forneceu onGeneratePdf, usa; senão, dispara o
  // pipeline padrão do Dossiê V5.2 (buildDossie → generatePdf → download).
  const triggerPdf = useCallback(async () => {
    if (typeof onGeneratePdf === 'function') {
      onGeneratePdf();
      return;
    }
    if (!caseId) {
      toast.info('Atalho registrado, mas nenhum caso ativo para gerar PDF.');
      return;
    }
    if (pdfBusy) {
      toast.info('Já estamos gerando o dossiê — aguarde.');
      return;
    }
    setPdfBusy(true);
    const toastId = toast.loading('Gerando Dossiê PDF V5.2…');
    try {
      const dossie = await buildDossieV5_2({ caseId });
      const blob = generateDossiePdf(dossie);
      const slug = (merchantName || 'merchant')
        .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40);
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      downloadBlob(blob, `dossie-v5_2_${slug}_${ts}.pdf`);
      toast.success('Dossiê PDF gerado', {
        id: toastId,
        description: `Hash SHA-256: ${dossie.hash.substring(0, 16)}…`,
      });
    } catch (err) {
      console.error('[Shortcut p — dossiê] erro:', err);
      toast.error('Erro ao gerar dossiê', {
        id: toastId,
        description: err?.message || 'Tente novamente.',
      });
    } finally {
      setPdfBusy(false);
    }
  }, [onGeneratePdf, caseId, merchantName, pdfBusy]);

  // ── Mapa de handlers para o hook ──
  const handlers = useMemo(() => ({
    tab_resumo:      () => onTabChange?.('resumo'),
    tab_evidencias:  () => onTabChange?.('evidencias'),
    tab_dimensional: () => onTabChange?.('dimensional'),
    tab_sentinel:    () => onTabChange?.('sentinel'),

    next_item: () => scrollToShortcutItem('next'),
    prev_item: () => scrollToShortcutItem('prev'),
    escape:    handleEscape,

    action_aprovar:           () => routeAction('Aprovar', 'aprovar'),
    action_aprovar_condicoes: () => routeAction('Aprovar c/ Condições', 'aprovar_condicoes'),
    action_manual:            () => routeAction('Revisão Manual', 'manual'),
    action_recusar:           () => routeAction('Recusar', 'recusar'),
    action_solicitar_docs:    () => routeAction('Solicitar Docs', 'solicitar_docs'),
    action_escalar:           () => routeAction('Escalar Senior', 'escalar'),

    search:       () => setSearchOpen(true),
    generate_pdf: triggerPdf,
    copy_case_id: copyCaseId,
    help:         () => setHelpOpen(true),
  }), [onTabChange, scrollToShortcutItem, handleEscape, routeAction, triggerPdf, copyCaseId]);

  useKeyboardShortcutsV5_2(handlers, { enabled: true, allowEscapeOnPanel: true });

  return (
    <>
      <KeyboardShortcutsPanel open={helpOpen} onOpenChange={setHelpOpen} />
      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
      <ShortcutsHintBadge onClick={() => setHelpOpen(true)} />
    </>
  );
}