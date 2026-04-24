import { useEffect, useRef, useState } from 'react';

const DRAFT_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const STORAGE_KEY_PREFIX = 'pagsmile_lead_v5_draft_';

/**
 * Autosave draft to localStorage for the Pagsmile Lead V5 questionnaire.
 * - Saves debounced (1s) on every form change
 * - Returns a recoverable draft if found (<24h old) for the same link
 * - Exposes clear() to wipe the draft after a successful submit
 *
 * Safe on SSR / private-mode browsers (falls back to no-op).
 */
export default function useLeadV5Autosave({ form, step, linkCode }) {
  const key = `${STORAGE_KEY_PREFIX}${linkCode || 'default'}`;
  const [recoverable, setRecoverable] = useState(null);
  const timerRef = useRef(null);
  const hasHydratedRef = useRef(false);

  // ── Check for recoverable draft on mount ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed?.savedAt || !parsed?.form) return;
      const age = Date.now() - parsed.savedAt;
      if (age < DRAFT_TTL_MS && Object.keys(parsed.form).length > 0) {
        setRecoverable({ form: parsed.form, step: parsed.step || 0, savedAt: parsed.savedAt });
      } else {
        localStorage.removeItem(key);
      }
    } catch {
      // private mode / quota / corrupt → ignore
    }
  }, [key]);

  // ── Debounced save whenever form/step changes ──
  useEffect(() => {
    // Skip the very first render (before any user input)
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      return;
    }
    if (!form || Object.keys(form).length === 0) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        // Strip heavy BDC enrichment blobs — they're re-fetched by CNPJ on recover
        const { _bdcQuickData, ...lean } = form;
        const payload = { form: lean, step, savedAt: Date.now() };
        localStorage.setItem(key, JSON.stringify(payload));
      } catch {
        // quota exceeded / private mode → silent
      }
    }, 1000);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [form, step, key]);

  const clear = () => {
    try { localStorage.removeItem(key); } catch {}
    setRecoverable(null);
  };

  const discardRecoverable = () => setRecoverable(null);

  return { recoverable, clear, discardRecoverable };
}