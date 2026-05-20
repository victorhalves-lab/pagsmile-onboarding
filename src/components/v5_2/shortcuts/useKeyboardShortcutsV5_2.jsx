import { useEffect, useRef } from 'react';
import { SHORTCUTS_V5_2 } from './shortcutsCatalog';

/**
 * [V5.2 Fase 6.5.5] Hook global de atalhos de teclado V5.2.
 *
 * Princípios de implementação (DOC6 §5.5 + Princípio 7):
 *  - Ignora teclas quando foco está em <input>, <textarea>, contenteditable,
 *    ou Radix dialog aberto.
 *  - Sequências (ex: "g c") têm janela de 1000ms.
 *  - Disparo via `handlers[id]` (mapa de funções).
 *  - Atalhos shift-* (ex: "?") detectados via `event.key`.
 *  - Sem `preventDefault` quando alvo é input — nunca atrapalha digitação.
 *
 * Uso:
 *   useKeyboardShortcutsV5_2({
 *     tab_resumo: () => setTab('resumo'),
 *     help: () => setHelpOpen(true),
 *     ...
 *   });
 */

const SEQUENCE_TIMEOUT_MS = 1000;

const isTypingTarget = (target) => {
  if (!target) return false;
  const tag = (target.tagName || '').toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  // Radix dialog/modal/popover: usuário pode estar digitando dentro
  if (target.closest?.('[role="dialog"] input, [role="dialog"] textarea')) return true;
  return false;
};

const isModalOpen = () => {
  if (typeof document === 'undefined') return false;
  // Painel de atalhos próprio é gerenciado pelo handler — aqui detectamos
  // OUTROS modais (radix dialog/alert-dialog/sheet) que devem bloquear atalhos.
  // O painel de atalhos marca-se com `data-shortcut-panel="true"` para não
  // bloquear o `Esc` que fecha ele mesmo.
  const dialogs = document.querySelectorAll('[role="dialog"][data-state="open"]');
  for (const d of dialogs) {
    if (d.getAttribute('data-shortcut-panel') === 'true') continue;
    return true;
  }
  return false;
};

/** Normaliza event.key para comparar com os catálogos. */
const normalizeKey = (event) => {
  if (event.key === 'Escape') return 'Esc';
  if (event.key === '?') return '?';
  if (event.key === '/') return '/';
  // dígitos e letras retornam o próprio key
  return event.key.length === 1 ? event.key.toLowerCase() : event.key;
};

/**
 * Mapa pré-computado:
 *   - singles: { '1': shortcutId, 'a': shortcutId, ... }
 *   - sequences: { 'g': { 'c': shortcutId } }  (árvore 2 níveis)
 */
const buildKeyMaps = () => {
  const singles = {};
  const sequences = {};
  for (const s of SHORTCUTS_V5_2) {
    if (s.type === 'single') {
      const k = s.keys[0] === 'Esc' ? 'Esc' : s.keys[0].toLowerCase();
      singles[k] = s.id;
    } else if (s.type === 'sequence' && s.keys.length === 2) {
      const k1 = s.keys[0].toLowerCase();
      const k2 = s.keys[1].toLowerCase();
      if (!sequences[k1]) sequences[k1] = {};
      sequences[k1][k2] = s.id;
    }
  }
  return { singles, sequences };
};

export default function useKeyboardShortcutsV5_2(handlers = {}, options = {}) {
  const { enabled = true, allowEscapeOnPanel = true } = options;
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const pendingSequenceRef = useRef(null); // { firstKey, timeoutId }
  const keyMapsRef = useRef(null);
  if (!keyMapsRef.current) keyMapsRef.current = buildKeyMaps();

  useEffect(() => {
    if (!enabled) return;

    const clearPendingSequence = () => {
      if (pendingSequenceRef.current) {
        clearTimeout(pendingSequenceRef.current.timeoutId);
        pendingSequenceRef.current = null;
      }
    };

    const dispatch = (shortcutId, event) => {
      const fn = handlersRef.current?.[shortcutId];
      if (typeof fn === 'function') {
        event.preventDefault();
        fn(event);
      }
    };

    const handleKeyDown = (event) => {
      // Não atrapalhar combinações nativas
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      const key = normalizeKey(event);
      const { singles, sequences } = keyMapsRef.current;

      // Caso especial: Esc no painel de atalhos sempre passa adiante
      if (key === 'Esc' && allowEscapeOnPanel) {
        clearPendingSequence();
        dispatch(singles['Esc'], event);
        return;
      }

      // Outro modal aberto? bloqueia todos os atalhos exceto Esc tratado acima
      if (isModalOpen()) return;

      // Verifica se é continuação de sequência
      if (pendingSequenceRef.current) {
        const { firstKey } = pendingSequenceRef.current;
        const seqMap = sequences[firstKey];
        const id = seqMap?.[key];
        clearPendingSequence();
        if (id) {
          dispatch(id, event);
          return;
        }
        // sequência inválida — não cai para singles para evitar duplo disparo
      }

      // Verifica se inicia uma sequência válida
      if (sequences[key]) {
        const timeoutId = setTimeout(clearPendingSequence, SEQUENCE_TIMEOUT_MS);
        pendingSequenceRef.current = { firstKey: key, timeoutId };
        return;
      }

      // Atalho de tecla única
      const id = singles[key];
      if (id) dispatch(id, event);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearPendingSequence();
    };
  }, [enabled, allowEscapeOnPanel]);
}