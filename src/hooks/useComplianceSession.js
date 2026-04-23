import { useState, useEffect, useCallback, useRef } from 'react';
// SDK-FREE: compliance session runs on PUBLIC pages (anonymous clients).
// The @base44/sdk mock on public routes blocks functions.invoke by design.
// callPublicFunction hits /functions/* directly via fetch — the session backend
// functions (loadComplianceProgress, saveComplianceProgress) validate the
// sessionToken server-side via asServiceRole, so anonymous POST is safe.
import { callPublicFunction } from '@/lib/publicApi';

// Generate a unique session token
function generateSessionToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `cs_${Date.now()}_${token}`;
}

// Session storage key — scoped by leadId to prevent cross-lead contamination
function getSessionTokenKey() {
  const leadId = typeof window !== 'undefined' ? localStorage.getItem('lead_id_for_compliance') : null;
  if (leadId) return `compliance_session_token_${leadId}`;
  // Fallback: also check URL param
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const urlLeadId = urlParams?.get('leadId');
  if (urlLeadId) return `compliance_session_token_${urlLeadId}`;
  return 'compliance_session_token';
}

export function useComplianceSession({ flowType, templateModel, storageKey }) {
  const [sessionToken, setSessionToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [savedFormData, setSavedFormData] = useState(null);
  const [savedStep, setSavedStep] = useState(null);
  const [savedPhase, setSavedPhase] = useState(null);
  const [savedDocumentsData, setSavedDocumentsData] = useState(null);
  const saveTimeoutRef = useRef(null);
  const lastSavedRef = useRef(null);

  // Initialize or load session
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      
      const SESSION_TOKEN_KEY = getSessionTokenKey();
      
      // Check URL for session token first (resume link)
      const urlParams = new URLSearchParams(window.location.search);
      let token = urlParams.get('session');
      
      // Then check localStorage (scoped by leadId)
      if (!token) {
        token = localStorage.getItem(SESSION_TOKEN_KEY);
      }

      if (token) {
        // Try to load existing session
        try {
          const response = await callPublicFunction('loadComplianceProgress', { sessionToken: token });
          // callPublicFunction returns the body directly (no .data wrapper).
          if (response?.found && response?.session?.status === 'active') {
            const session = response.session;
            setSessionToken(token);
            localStorage.setItem(SESSION_TOKEN_KEY, token);
            setSavedFormData(session.formData || {});
            setSavedStep(session.currentStep || 1);
            setSavedPhase(session.currentPhase || 'questionnaire');
            setSavedDocumentsData(session.documentsData || {});
            
            // Also restore localStorage storage keys
            if (session.formData && Object.keys(session.formData).length > 0 && storageKey) {
              localStorage.setItem(storageKey, JSON.stringify(session.formData));
            }
            
            setSessionLoaded(true);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Failed to load session:', e);
        }
      }

      // Create new session
      const newToken = generateSessionToken();
      setSessionToken(newToken);
      localStorage.setItem(getSessionTokenKey(), newToken);
      
      try {
        await callPublicFunction('saveComplianceProgress', {
          sessionToken: newToken,
          flowType,
          templateModel,
          currentPhase: 'questionnaire',
          currentStep: 1,
          formData: {},
          documentsData: {},
          linkCode: localStorage.getItem('onboarding_link_code') || ''
        });
      } catch (e) {
        console.warn('Failed to create session:', e);
      }
      
      setSessionLoaded(true);
      setIsLoading(false);
    }

    init();
  }, [flowType, templateModel, storageKey]);

  // Save progress (debounced) — HARDENED: ALL errors swallowed, NEVER blocks the UI.
  const saveProgress = useCallback(({ currentStep, currentPhase, formData, documentsData, clientEmail, clientName }) => {
    if (!sessionToken) return;

    // Debounce saves to avoid flooding
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const payload = {
          sessionToken,
          flowType,
          templateModel,
          linkCode: localStorage.getItem('onboarding_link_code') || ''
        };

        if (currentStep !== undefined) payload.currentStep = currentStep;
        if (currentPhase !== undefined) payload.currentPhase = currentPhase;
        if (formData !== undefined) payload.formData = formData;
        if (documentsData !== undefined) payload.documentsData = documentsData;
        if (clientEmail) payload.clientEmail = clientEmail;
        if (clientName) payload.clientName = clientName;

        await callPublicFunction('saveComplianceProgress', payload);
        lastSavedRef.current = new Date();
      } catch (e) {
        // Auto-save failures are NON-FATAL — user's data is still in localStorage.
        console.warn('[useComplianceSession] auto-save failed (non-fatal):', e?.message);
      }
    }, 1500); // 1.5s debounce
  }, [sessionToken, flowType, templateModel]);

  // Immediate save (no debounce) — for step changes
  const saveProgressNow = useCallback(async ({ currentStep, currentPhase, formData, documentsData, clientEmail, clientName }) => {
    if (!sessionToken) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const payload = {
      sessionToken,
      flowType,
      templateModel,
      linkCode: localStorage.getItem('onboarding_link_code') || ''
    };
    
    if (currentStep !== undefined) payload.currentStep = currentStep;
    if (currentPhase !== undefined) payload.currentPhase = currentPhase;
    if (formData !== undefined) payload.formData = formData;
    if (documentsData !== undefined) payload.documentsData = documentsData;
    if (clientEmail) payload.clientEmail = clientEmail;
    if (clientName) payload.clientName = clientName;

    try {
      await callPublicFunction('saveComplianceProgress', payload);
      lastSavedRef.current = new Date();
    } catch (e) {
      console.warn('Failed to save progress:', e);
    }
  }, [sessionToken, flowType, templateModel]);

  // Mark session as completed
  const completeSession = useCallback(async () => {
    if (!sessionToken) return;
    try {
      await callPublicFunction('saveComplianceProgress', {
        sessionToken,
        currentPhase: 'completed',
        flowType,
        templateModel
      });
      localStorage.removeItem(getSessionTokenKey());
    } catch (e) {
      console.warn('Failed to complete session:', e);
    }
  }, [sessionToken, flowType, templateModel]);

  // Get resume URL
  const getResumeUrl = useCallback(() => {
    if (!sessionToken) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/ComplianceResume?session=${sessionToken}`;
  }, [sessionToken]);

  return {
    sessionToken,
    isLoading,
    sessionLoaded,
    savedFormData,
    savedStep,
    savedPhase,
    savedDocumentsData,
    saveProgress,
    saveProgressNow,
    completeSession,
    getResumeUrl,
    lastSaved: lastSavedRef.current
  };
}