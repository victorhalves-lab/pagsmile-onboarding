import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Admin-only: gera (ou reutiliza) um link público para o cliente preencher dados bancários.
// Input: { onboardingCaseId } OU { onboardingCaseIds: [] }  (bulk)
// Output: { links: [{ caseId, token, url, status }] }

function makeToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const ids = Array.isArray(body.onboardingCaseIds)
      ? body.onboardingCaseIds
      : (body.onboardingCaseId ? [body.onboardingCaseId] : []);

    if (ids.length === 0) {
      return Response.json({ error: 'onboardingCaseId required' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || req.headers.get('referer') || '';
    const baseUrl = origin.replace(/\/+$/, '');

    const results = [];
    for (const caseId of ids) {
      const caseRecord = await base44.asServiceRole.entities.OnboardingCase.get(caseId).catch(() => null);
      if (!caseRecord) {
        results.push({ caseId, error: 'case_not_found' });
        continue;
      }

      // Reutiliza registro existente pendente (idempotência)
      const existing = await base44.asServiceRole.entities.BankDataCollection
        .filter({ onboardingCaseId: caseId }, '-created_date', 1)
        .catch(() => []);

      let record = existing?.[0];
      if (!record || record.status === 'expirado') {
        const token = makeToken();
        record = await base44.asServiceRole.entities.BankDataCollection.create({
          onboardingCaseId: caseId,
          merchantId: caseRecord.merchantId,
          cpfCnpj: caseRecord.cpfCnpj || '',
          token,
          status: 'pendente',
          linkSentAt: new Date().toISOString(),
        });
      }

      results.push({
        caseId,
        token: record.token,
        status: record.status,
        url: `${baseUrl}/BankDataCollect?token=${record.token}`,
        banco: record.banco || null,
        agencia: record.agencia || null,
        conta: record.conta || null,
        filledAt: record.filledAt || null,
      });
    }

    return Response.json({ links: results });
  } catch (error) {
    console.error('generateBankDataLink error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});