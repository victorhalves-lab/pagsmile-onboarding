import { useState, useEffect, useRef, useCallback } from 'react';
import { callPublicFunction } from '@/lib/publicApi';

/**
 * Single hook that owns the whole /onboarding V2 state.
 *
 * Uses SDK-FREE publicApi (raw fetch) to bypass Base44 SDK initialization
 * crashes. The backend functions validate the URL token server-side via
 * asServiceRole, so anonymous POSTs are safe.
 *
 * - Bootstraps everything in one call (case + template + questions + merchant + session).
 * - Exposes persistent state: formData, documentsData.
 * - Debounced autosave every 1.5s — no UI blocking.
 * - `finalize()` hits publicOnboardingFinalize.
 * - Every network error is swallowed — the caller never sees a throw.
 */
export function useOnboarding({ caseId, token, mode }) {
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [errorReason, setErrorReason] = useState(null);
  const [data, setData] = useState(null);

  const [formData, setFormData] = useState({});
  const [documentsData, setDocumentsData] = useState({});

  const saveTimerRef = useRef(null);

  // ── Bootstrap ──
  useEffect(() => {
    let cancelled = false;
    if (!caseId || !token || !mode) {
      setStatus('error'); setErrorReason('missing_params'); return;
    }
    (async () => {
      try {
        const payload = await callPublicFunction('publicOnboardingBootstrap', { caseId, token, mode });
        if (cancelled) return;
        if (!payload?.ok) {
          setStatus('error'); setErrorReason(payload?.reason || 'unknown'); return;
        }
        setData(payload);
        if (payload.session?.formData && Object.keys(payload.session.formData).length > 0) {
          setFormData(payload.session.formData);
        }
        if (payload.session?.documentsData && Object.keys(payload.session.documentsData).length > 0) {
          setDocumentsData(payload.session.documentsData);
        }
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        const msg = err?.message || String(err);
        console.error('[useOnboarding] bootstrap failed:', msg, err);
        // Surface full error in sessionStorage so we can inspect it from the UI.
        try {
          sessionStorage.setItem('__onboardingBootstrapError', JSON.stringify({
            message: msg,
            caseId, token, mode,
            at: new Date().toISOString(),
          }));
        } catch {}
        setStatus('error'); setErrorReason('network');
      }
    })();
    return () => { cancelled = true; };
  }, [caseId, token, mode]);

  // ── Debounced autosave ──
  useEffect(() => {
    if (status !== 'ready') return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      callPublicFunction('publicOnboardingSave', {
        caseId, token, mode,
        formData,
        documentsData,
      }).catch(() => {});
    }, 1500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [formData, documentsData, status, caseId, token, mode]);

  // ── Finalize ──
  const finalize = useCallback(async () => {
    try {
      const body = await callPublicFunction('publicOnboardingFinalize', {
        caseId, token, mode,
        formData: mode === 'full' ? formData : undefined,
      });
      return body || { ok: false };
    } catch (err) {
      return { ok: false, reason: 'network', message: err?.message };
    }
  }, [caseId, token, mode, formData]);

  return {
    status, errorReason,
    data,
    formData, setFormData,
    documentsData, setDocumentsData,
    finalize,
  };
}