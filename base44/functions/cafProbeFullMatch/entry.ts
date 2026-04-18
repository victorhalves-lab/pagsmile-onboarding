import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafProbeFullMatch — Testa envio de imagem diretamente no body de /v1/transactions
 * 
 * Diferentes formatos que o CAF aceita:
 *   1. files: [{ type: 'selfie', base64: '...' }]
 *   2. files: [{ type: 'selfie', url: '...' }]
 *   3. images: { selfie: 'base64' }
 *   4. parameters: { selfie_base64: '...' }
 *   5. selfie: 'base64'
 */

const CAF_API_BASE = 'https://api.combateafraude.com';

// Base64 tiny 1x1 PNG (only for probing API structure; real usage sends actual selfie)
const TINY_IMG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const authToken = Deno.env.get('CAF_CLIENT_SECRET');
    const cpf = '74123947891';
    const name = 'Alexandre Silva';

    const attempts = [];

    const payloads = [
      {
        name: '1_files_base64_array',
        body: {
          template: { services: ['peopleFaceAuthenticator'] },
          attributes: { cpf, name },
          files: [{ type: 'selfie', base64: TINY_IMG_B64 }],
        },
      },
      {
        name: '2_images_obj',
        body: {
          template: { services: ['peopleFaceAuthenticator'] },
          attributes: { cpf, name },
          images: { selfie: TINY_IMG_B64 },
        },
      },
      {
        name: '3_parameters_selfie_base64',
        body: {
          template: { services: ['peopleFaceAuthenticator'] },
          parameters: { cpf, name, selfie_base64: TINY_IMG_B64 },
        },
      },
      {
        name: '4_parameters_selfie',
        body: {
          template: { services: ['peopleFaceAuthenticator'] },
          parameters: { cpf, name, selfie: TINY_IMG_B64 },
        },
      },
      {
        name: '5_attributes_with_selfie',
        body: {
          template: { services: ['peopleFaceAuthenticator'] },
          attributes: { cpf, name, selfie: TINY_IMG_B64 },
        },
      },
      // faceAuthenticator singular
      {
        name: '6_singular_service',
        body: {
          template: { services: ['faceAuthenticator'] },
          attributes: { cpf, name },
          files: [{ type: 'selfie', base64: TINY_IMG_B64 }],
        },
      },
    ];

    for (const p of payloads) {
      const a = { name: p.name };
      try {
        const res = await fetch(`${CAF_API_BASE}/v1/transactions`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(p.body),
        });
        a.status = res.status;
        const t = await res.text();
        a.response_preview = t.substring(0, 1800);
        a.ok = res.ok;
      } catch (e) { a.error = e.message; }
      attempts.push(a);
    }

    // Depois tentar buscar resultado com mais tempo
    await new Promise(r => setTimeout(r, 3000));

    // Buscar resultado da transação de face_auth que rodou antes
    const oldTxId = '69e3c9c4ff3d5d00022cb51e';
    try {
      const res = await fetch(`${CAF_API_BASE}/v1/transactions/${oldTxId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const t = await res.text();
      attempts.push({
        name: '7_get_result_after_3s',
        status: res.status,
        response_preview: t.substring(0, 2500),
        ok: res.ok,
      });
    } catch (e) {
      attempts.push({ name: '7_get_result_after_3s', error: e.message });
    }

    return Response.json({ attempts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});