/**
 * Onboarding step tracking via base44.analytics.track()
 * Tracks step completions, drop-off points, and questionnaire submission.
 */
import { base44 } from '@/api/base44Client';

const getSessionId = () => {
  let id = sessionStorage.getItem('onboarding_session_id');
  if (!id) {
    id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('onboarding_session_id', id);
  }
  return id;
};

const getDevice = () => {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
};

export function trackOnboardingStepCompleted({ stepNumber, totalSteps, stepTitle, flowType, templateModel, timeOnStepSec }) {
  base44.analytics.track({
    eventName: 'onboarding_step_completed',
    properties: {
      step_number: stepNumber,
      total_steps: totalSteps,
      step_title: stepTitle || '',
      flow_type: flowType || templateModel || '',
      template_model: templateModel || '',
      progress_pct: Math.round((stepNumber / totalSteps) * 100),
      time_on_step_sec: timeOnStepSec || 0,
      session_id: getSessionId(),
      device: getDevice(),
    }
  });
}

export function trackOnboardingDropoff({ stepNumber, totalSteps, stepTitle, flowType, templateModel, timeOnStepSec }) {
  base44.analytics.track({
    eventName: 'onboarding_dropoff',
    properties: {
      step_number: stepNumber,
      total_steps: totalSteps,
      step_title: stepTitle || '',
      flow_type: flowType || templateModel || '',
      template_model: templateModel || '',
      progress_pct: Math.round((stepNumber / totalSteps) * 100),
      time_on_step_sec: timeOnStepSec || 0,
      session_id: getSessionId(),
      device: getDevice(),
    }
  });
}

export function trackOnboardingStarted({ totalSteps, flowType, templateModel }) {
  base44.analytics.track({
    eventName: 'onboarding_started',
    properties: {
      total_steps: totalSteps,
      flow_type: flowType || templateModel || '',
      template_model: templateModel || '',
      session_id: getSessionId(),
      device: getDevice(),
    }
  });
}

export function trackOnboardingCompleted({ totalSteps, flowType, templateModel, totalTimeSec }) {
  base44.analytics.track({
    eventName: 'onboarding_completed',
    properties: {
      total_steps: totalSteps,
      flow_type: flowType || templateModel || '',
      template_model: templateModel || '',
      total_time_sec: totalTimeSec || 0,
      session_id: getSessionId(),
      device: getDevice(),
    }
  });
}

export function trackOnboardingValidationFailed({ stepNumber, totalSteps, stepTitle, flowType, templateModel, missingFieldsCount }) {
  base44.analytics.track({
    eventName: 'onboarding_validation_failed',
    properties: {
      step_number: stepNumber,
      total_steps: totalSteps,
      step_title: stepTitle || '',
      flow_type: flowType || templateModel || '',
      template_model: templateModel || '',
      missing_fields_count: missingFieldsCount,
      session_id: getSessionId(),
    }
  });
}