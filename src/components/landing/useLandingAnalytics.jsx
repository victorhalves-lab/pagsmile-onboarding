import { useCallback, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

function getSessionId() {
  let id = sessionStorage.getItem('lp_session_id');
  if (!id) {
    id = `lps_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    sessionStorage.setItem('lp_session_id', id);
  }
  return id;
}

function getDeviceType() {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

export default function useLandingAnalytics({ introducerId, referralCode, slug }) {
  const sessionId = getSessionId();
  const hasTrackedView = useRef(false);

  const track = useCallback((eventType, extra = {}) => {
    const data = {
      introducerId,
      referralCode,
      slug,
      eventType,
      sessionId,
      deviceType: getDeviceType(),
      referrer: document.referrer || '',
      userAgent: navigator.userAgent,
      ...extra,
    };
    // Fire and forget — don't block UI
    base44.functions.invoke('trackLandingPageEvent', data).catch(() => {});
  }, [introducerId, referralCode, slug, sessionId]);

  // Track page view once on mount
  useEffect(() => {
    if (hasTrackedView.current || !slug) return;
    hasTrackedView.current = true;
    track('page_view');
  }, [slug, track]);

  const trackSegmentView = useCallback((segmentName) => {
    track('segment_view', { segmentName });
  }, [track]);

  const trackSegmentInfo = useCallback((segmentName) => {
    track('segment_info', { segmentName });
  }, [track]);

  const trackCtaContratar = useCallback((segmentName) => {
    track('cta_contratar', { segmentName });
  }, [track]);

  const trackCtaProposta = useCallback(() => {
    track('cta_proposta');
  }, [track]);

  const trackCalculatorInteract = useCallback((segmentName) => {
    track('calculator_interact', { segmentName });
  }, [track]);

  return {
    trackSegmentView,
    trackSegmentInfo,
    trackCtaContratar,
    trackCtaProposta,
    trackCalculatorInteract,
  };
}