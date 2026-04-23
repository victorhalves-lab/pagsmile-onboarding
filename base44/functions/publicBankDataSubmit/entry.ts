import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// PUBLIC endpoint. Cliente final envia dados bancários usando seu token.
// Input: { token, banco, agencia, digitoAgencia, conta, digitoConta }
// Output: { ok: true }

function sanitize(v, max = 60) {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { token } = body || {};
    if (!token || typeof token !== 'string' || token.length < 20) {
      return Response.json({ error: 'invalid_token' }, { status: 400 });
    }

    const records = await base44.asServiceRole.entities.BankDataCollection.filter({ token }).catch(() => []);
    const record = records?.[0];
    if (!record) {
      return Response.json({ error: 'not_found' }, { status: 404 });
    }
    if (record.status === 'expirado') {
      return Response.json({ error: 'expired' }, { status: 410 });
    }

    const banco = sanitize(body.banco, 80);
    const agencia = sanitize(body.agencia, 10);
    const digitoAgencia = sanitize(body.digitoAgencia, 2);
    const conta = sanitize(body.conta, 20);
    const digitoConta = sanitize(body.digitoConta, 2);

    if (!banco || !agencia || !conta) {
      return Response.json({ error: 'missing_required_fields' }, { status: 400 });
    }

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';

    await base44.asServiceRole.entities.BankDataCollection.update(record.id, {
      banco,
      agencia,
      digitoAgencia,
      conta,
      digitoConta,
      status: 'preenchido',
      filledAt: new Date().toISOString(),
      clientIp: clientIp.slice(0, 60),
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error('publicBankDataSubmit error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});