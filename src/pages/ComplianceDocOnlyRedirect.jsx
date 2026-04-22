import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Keeps links like /ComplianceDocOnly?caseId=X&token=Y&mode=docs_and_caf working forever,
 * by translating them to the new /onboarding?case=X&token=Y&mode=docs_caf route.
 *
 * Replaces instead of pushes so the back button doesn't loop.
 */
export default function ComplianceDocOnlyRedirect() {
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const caseId = p.get('caseId') || p.get('case');
    const token = p.get('token');
    let mode = p.get('mode') || p.get('ca_mode') || 'docs_caf';
    if (mode === 'docs_and_caf') mode = 'docs_caf';

    const qs = new URLSearchParams();
    if (caseId) qs.set('case', caseId);
    if (token) qs.set('token', token);
    qs.set('mode', mode);
    window.location.replace(`/onboarding?${qs.toString()}`);
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-[#2bc196]" />
    </div>
  );
}