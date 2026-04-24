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
  // CRITICAL: Do NOT put `documentsData`/`formData` in the deps array.
  // The bootstrap hydrates state from the server, which would immediately
  // re-trigger the save effect, creating a feedback loop that serializes
  // the entire documents map every 1.5s — that's what was freezing the tab
  // 2-10s after load ("Página sem resposta"). Instead, we read the latest
  // state from refs and only schedule saves when the user ACTUALLY mutates
  // state (via a dedicated bump counter).
  const formDataRef = useRef(formData);
  const documentsDataRef = useRef(documentsData);
  formDataRef.current = formData;
  documentsDataRef.current = documentsData;

  const [saveBump, setSaveBump] = useState(0);
  const hydratedRef = useRef(false);

  // Wrap setters so we only bump `saveBump` when the state actually changed.
  // `setDocuments(prev => prev)` (used by BulletproofDocumentUploader when
  // localStorage has stale data and server state wins) must NOT trigger a save.
  const setFormDataWithSave = useCallback((updater) => {
    setFormData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (next !== prev && hydratedRef.current) setSaveBump(n => n + 1);
      return next;
    });
  }, []);
  const setDocumentsDataWithSave = useCallback((updater) => {
    setDocumentsData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (next !== prev && hydratedRef.current) setSaveBump(n => n + 1);
      return next;
    });
  }, []);

  useEffect(() => {
    if (status === 'ready') hydratedRef.current = true;
  }, [status]);

  useEffect(() => {
    if (status !== 'ready') return;
    if (saveBump === 0) return; // no real user change yet — don't save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const currentDocs = documentsDataRef.current || {};
      const safeDocs = {};
      for (const [k, v] of Object.entries(currentDocs)) {
        if (!v || typeof v !== 'object') continue;
        safeDocs[k] = {
          url: v.url, uri: v.uri, isPrivate: v.isPrivate,
          name: v.name, size: v.size, type: v.type,
          uploadedAt: v.uploadedAt, documentUploadId: v.documentUploadId,
          persisted: v.persisted,
          notAvailable: v.notAvailable, notAvailableReason: v.notAvailableReason,
          files: Array.isArray(v.files) ? v.files.map(f => ({
            url: f.url, uri: f.uri, isPrivate: f.isPrivate,
            name: f.name, size: f.size, type: f.type,
            uploadedAt: f.uploadedAt, documentUploadId: f.documentUploadId,
            persisted: f.persisted,
          })) : undefined,
        };
      }
      callPublicFunction('publicOnboardingSave', {
        caseId, token, mode,
        formData: formDataRef.current,
        documentsData: safeDocs,
      }).catch(() => {});
    }, 1500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [saveBump, status, caseId, token, mode]);

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
    formData, setFormData: setFormDataWithSave,
    documentsData, setDocumentsData: setDocumentsDataWithSave,
    finalize,
  };
}