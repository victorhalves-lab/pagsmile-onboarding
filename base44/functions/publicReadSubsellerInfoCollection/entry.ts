// Endpoint público para o /SubsellerInfoForm carregar o contexto do link
// (gateway_name etc.) sem precisar de auth. Devolve apenas os campos seguros —
// nunca expõe notes internas ou contatos do Gateway.
//
// A entidade SubsellerInfoCollection tem RLS read: admin-only, então o SDK
// direto a partir do navegador (visitante anônimo) não retorna nada. Por isso
// precisamos desta função com asServiceRole.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }
    const { token } = (await req.json()) || {};
    if (!token || typeof token !== 'string') {
      return Response.json({ error: 'Token obrigatório' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const list = await base44.asServiceRole.entities.SubsellerInfoCollection.filter({ unique_token: token });
    const c = list?.[0];

    if (!c) {
      return Response.json({ status: 'not_found' }, { status: 404 });
    }
    if (c.is_active === false) {
      return Response.json({ status: 'inactive' }, { status: 403 });
    }
    if (c.expires_at && new Date(c.expires_at) < new Date()) {
      return Response.json({ status: 'expired' }, { status: 403 });
    }

    // Devolve só campos públicos — nada de notes, contact_email do Gateway, etc.
    return Response.json({
      status: 'ok',
      collection: {
        id: c.id,
        gateway_name: c.gateway_name,
        collection_mode: c.collection_mode || 'full',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});