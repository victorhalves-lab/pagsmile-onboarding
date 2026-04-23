import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// PUBLIC endpoint. Nenhum auth. Só retorna identificação mínima do caso para a página de coleta.
// Input: { token }
// Output: { companyName, cpfCnpj, status, filled: {banco, agencia, ...} | null }

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

    let companyName = '';
    if (record.merchantId) {
      const merchant = await base44.asServiceRole.entities.Merchant.get(record.merchantId).catch(() => null);
      companyName = merchant?.companyName || merchant?.fullName || '';
    }

    return Response.json({
      status: record.status,
      cpfCnpj: record.cpfCnpj || '',
      companyName,
      filled: record.status === 'preenchido' ? {
        banco: record.banco || '',
        agencia: record.agencia || '',
        digitoAgencia: record.digitoAgencia || '',
        conta: record.conta || '',
        digitoConta: record.digitoConta || '',
        filledAt: record.filledAt,
      } : null,
    });
  } catch (error) {
    console.error('publicBankDataRead error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});