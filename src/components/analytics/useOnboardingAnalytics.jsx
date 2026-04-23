import { useCallback, useEffect, useRef } from 'react';
// SDK-FREE analytics client — public pages must not touch @base44/sdk.
// callPublicFunction hits /functions/* directly via fetch (credentials:'omit').
// Any error here is SWALLOWED — analytics must never break the user flow.
import { callPublicFunction } from '@/lib/publicApi';

// Gera um ID de sessão único
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('onboarding_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('onboarding_session_id', sessionId);
  }
  return sessionId;
};

// Obtém dados do link da URL
const getLinkDataFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    linkCode: urlParams.get('code') || urlParams.get('link') || null,
    utmSource: urlParams.get('utm_source') || null,
    utmMedium: urlParams.get('utm_medium') || null,
    utmCampaign: urlParams.get('utm_campaign') || null
  };
};

// Internal: best-effort telemetry POST. Never throws.
async function fireAndForget(payload) {
  try {
    await callPublicFunction('trackOnboardingEvent', payload);
  } catch (_) {
    // Silent — analytics must never break the user flow.
  }
}

export function useOnboardingAnalytics({
  pageName,
  stepNumber,
  totalSteps,
  flowType,
  linkId,
  linkCode,
  merchantId,
  onboardingCaseId
}) {
  const pageStartTime = useRef(Date.now());
  const hasTrackedView = useRef(false);

  // Rastreia visualização da página ao montar
  useEffect(() => {
    if (hasTrackedView.current) return;
    hasTrackedView.current = true;

    const linkData = getLinkDataFromUrl();

    fireAndForget({
      eventType: 'page_view',
      sessionId: getSessionId(),
      pageName,
      stepNumber,
      totalSteps,
      flowType,
      onboardingLinkId: linkId,
      onboardingLinkCode: linkCode || linkData.linkCode,
      merchantId,
      onboardingCaseId,
      metadata: {
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        utmSource: linkData.utmSource,
        utmMedium: linkData.utmMedium,
        utmCampaign: linkData.utmCampaign
      }
    });

    // Rastreia abandono ao sair da página
    const handleBeforeUnload = () => {
      const timeOnPage = Math.round((Date.now() - pageStartTime.current) / 1000);
      const abandonData = {
        eventType: 'onboarding_abandoned',
        sessionId: getSessionId(),
        pageName,
        stepNumber,
        totalSteps,
        flowType,
        onboardingLinkId: linkId,
        onboardingLinkCode: linkCode || linkData.linkCode,
        merchantId,
        onboardingCaseId,
        metadata: { timeOnPage }
      };
      sessionStorage.setItem('last_page_data', JSON.stringify(abandonData));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageName]);

  const trackEvent = useCallback(async (eventType, data = {}) => {
    const linkData = getLinkDataFromUrl();
    const eventData = {
      eventType,
      sessionId: getSessionId(),
      pageName: data.pageName || pageName,
      stepNumber: data.stepNumber || stepNumber,
      totalSteps: data.totalSteps || totalSteps,
      flowType: data.flowType || flowType,
      onboardingLinkId: data.linkId || linkId,
      onboardingLinkCode: data.linkCode || linkCode || linkData.linkCode,
      merchantId: data.merchantId || merchantId,
      onboardingCaseId: data.onboardingCaseId || onboardingCaseId,
      metadata: {
        ...data.metadata,
        userAgent: navigator.userAgent,
        timeOnPage: Math.round((Date.now() - pageStartTime.current) / 1000)
      }
    };
    await fireAndForget(eventData);
  }, [pageName, stepNumber, totalSteps, flowType, linkId, linkCode, merchantId, onboardingCaseId]);

  const trackPageComplete = useCallback((additionalData = {}) => {
    return trackEvent('page_complete', additionalData);
  }, [trackEvent]);

  const trackFormSubmit = useCallback((additionalData = {}) => {
    return trackEvent('form_submit', additionalData);
  }, [trackEvent]);

  const trackOnboardingComplete = useCallback((additionalData = {}) => {
    sessionStorage.removeItem('last_page_data');
    return trackEvent('onboarding_complete', additionalData);
  }, [trackEvent]);

  const trackLinkClick = useCallback((additionalData = {}) => {
    return trackEvent('link_click', additionalData);
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageComplete,
    trackFormSubmit,
    trackOnboardingComplete,
    trackLinkClick,
    sessionId: getSessionId()
  };
}

// Função utilitária para rastrear clique no link (usar na página inicial)
export async function trackLinkClick(linkCode) {
  const linkData = getLinkDataFromUrl();
  await fireAndForget({
    eventType: 'link_click',
    sessionId: getSessionId(),
    onboardingLinkCode: linkCode || linkData.linkCode,
    pageName: 'ComplianceOnboardingStart',
    metadata: {
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      utmSource: linkData.utmSource,
      utmMedium: linkData.utmMedium,
      utmCampaign: linkData.utmCampaign
    }
  });
}