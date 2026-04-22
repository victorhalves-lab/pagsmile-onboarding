import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Single hook that owns the whole /onboarding V2 state.
 *
 * - Bootstraps everything in one call (case + template + questions + merchant + session).
 * - Exposes persistent state: formData, documentsData, currentStep.
 * - Debounced autosave every 1.5s — no UI blocking.
 * - `finalize(extra)` hits publicOnboardingFinalize.
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
        const res = await base44.functions.invoke('publicOnboardingBootstrap', { caseId, token, mode });
        if (cancelled) return;
        const payload = res?.data;
        if (!payload?.ok) {
          setStatus('error'); setErrorReason(payload?.reason || 'unknown'); return;
        }
        setData(payload);
        // Restore persisted state (if any)
        if (payload.session?.formData && Object.keys(payload.session.formData).length > 0) {
          setFormData(payload.session.formData);
        }
        if (payload.session?.documentsData && Object.keys(payload.session.documentsData).length > 0) {
          setDocumentsData(payload.session.documentsData);
        }
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        console.warn('[useOnboarding] bootstrap failed:', err?.message);
        setStatus('error'); setErrorReason('network');
      }
    })();
    return () => { cancelled = true; };
  }, [caseId, token, mode]);

  // ── Debounced autosave ──
  // currentStep is a string key ("q","d","r","c","done") — we don't persist it in the
  // ComplianceSession.currentStep numeric field; it's derived from which sections have
  // data. We just send formData + documentsData, which is all the UI needs to rehydrate.
  useEffect(() => {
    if (status !== 'ready') return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        base44.functions.invoke('publicOnboardingSave', {
          caseId, token, mode,
          formData,
          documentsData,
        }).catch(() => {});
      } catch (_) {}
    }, 1500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [formData, documentsData, status, caseId, token, mode]);

  // ── Finalize ──
  const finalize = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('publicOnboardingFinalize', {
        caseId, token, mode,
        formData: mode === 'full' ? formData : undefined,
      });
      return res?.data || { ok: false };
    } catch (err) {
      return { ok: false, reason: 'network', message: err?.message };
    }
  }, [caseId, token, mode, formData]);

  return {
    status, errorReason,
    data,           // { case, merchant, template, questions, uploadedDocs }
    formData, setFormData,
    documentsData, setDocumentsData,
    finalize,
  };
}