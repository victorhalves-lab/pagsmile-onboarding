/**
 * emailPendencyRequest
 * --------------------------------------------------------------------
 * Envia e-mail formatado ao cliente com o link público para preencher
 * a solicitação de pendências. Chamado por createPendencyRequest e
 * também disponível para reenvio manual pelo analista.
 *
 * Body:
 *   - pendencyRequestId (string, required)
 *
 * Não falha o fluxo principal se o e-mail não for enviado — retorna
 * { ok: true, sent: false } nesses casos.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ALLOWED_HOSTS_ENV = Deno.env.get('PUBLIC_APP_HOSTS') || '';
const DEFAULT_HOSTS = ['pagsmile-onboarding.base44.app', 'app.base44.com'];
const HOSTS = ALLOWED_HOSTS_ENV ? ALLOWED_HOSTS_ENV.split(',').map(h => h.trim()) : DEFAULT_HOSTS;

function buildPublicUrl(token, hostOverride) {
  const host = hostOverride || HOSTS[0];
  return `https://${host}/CompletarPendencias?token=${encodeURIComponent(token)}`;
}

function summarizeItems(items = []) {
  const docs = items.filter(i => i.kind === 'document').length;
  const qs = items.filter(i => i.kind === 'question').length;
  const parts = [];
  if (docs) parts.push(`${docs} documento${docs > 1 ? 's' : ''}`);
  if (qs) parts.push(`${qs} pergunta${qs > 1 ? 's' : ''}`);
  return parts.join(' e ');
}

function formatDeadline(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}

function buildHtml({ toName, publicUrl, generalMessage, items, expiresAt }) {
  const greeting = toName ? `Olá, ${toName}!` : 'Olá!';
  const summary = summarizeItems(items);
  const deadline = formatDeadline(expiresAt);
  const itemsList = (items || []).slice(0, 10).map((it) => {
    const icon = it.kind === 'document' ? '📎' : '❓';
    return `<li style="margin:6px 0;color:#475569;font-size:13px">${icon} ${escapeHtml(it.label)}</li>`;
  }).join('');
  const more = items && items.length > 10 ? `<li style="margin:6px 0;color:#94a3b8;font-size:12px;font-style:italic">+ ${items.length - 10} item(ns) adicional(is)</li>` : '';
  const messageBlock = generalMessage ? `
    <div style="background:#f8fafc;border-left:3px solid #2bc196;padding:12px 16px;margin:16px 0;border-radius:4px">
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap">${escapeHtml(generalMessage)}</p>
    </div>` : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:620px;margin:0 auto;padding:20px">
    <div style="background:linear-gradient(135deg,#002443,#003366);padding:32px 28px;border-radius:16px 16px 0 0;text-align:center">
      <h1 style="color:#2bc196;margin:0;font-size:22px;font-weight:700">📋 Documentos pendentes</h1>
      <p style="color:rgba(255,255,255,0.75);margin:10px 0 0;font-size:14px">Sua análise de cadastro continua. Precisamos de algumas informações adicionais.</p>
    </div>
    <div style="background:#fff;padding:28px;border:1px solid #e2e8f0;border-top:none">
      <p style="color:#002443;font-size:16px;font-weight:600;margin:0 0 12px">${greeting}</p>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 8px">
        Nosso time de compliance solicitou <strong>${summary || 'informações adicionais'}</strong> para concluir a análise do seu cadastro.
      </p>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 6px">
        📅 <strong>Prazo:</strong> até <strong>${deadline}</strong>
      </p>
      ${messageBlock}
      ${items && items.length > 0 ? `
      <div style="margin:18px 0">
        <p style="color:#002443;font-size:13px;font-weight:600;margin:0 0 6px">O que precisamos:</p>
        <ul style="margin:0;padding-left:18px">${itemsList}${more}</ul>
      </div>` : ''}
      <div style="text-align:center;margin:28px 0 12px">
        <a href="${publicUrl}" style="display:inline-block;background:#2bc196;color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px">Preencher pendências</a>
      </div>
      <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:14px 0 0">
        Você pode salvar e voltar a qualquer momento usando o mesmo link, dentro do prazo.<br>
        Ou copie este endereço no navegador:<br>
        <span style="word-break:break-all;color:#475569">${publicUrl}</span>
      </p>
    </div>
    <div style="background:#f8fafc;padding:18px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;text-align:center">
      <p style="color:#94a3b8;font-size:11px;margin:0">Pagsmile — Este é um e-mail automático. Não responda.</p>
    </div>
  </div>
</body></html>`;
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ ok: false, error: 'method_not_allowed' }, { status: 405 });
    }
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { pendencyRequestId } = body;
    if (!pendencyRequestId) {
      return Response.json({ ok: false, error: 'missing_pendency_id' }, { status: 400 });
    }

    const pendency = await base44.asServiceRole.entities.PendencyRequest.get(pendencyRequestId).catch(() => null);
    if (!pendency) return Response.json({ ok: false, error: 'pendency_not_found' }, { status: 404 });

    const merchant = await base44.asServiceRole.entities.Merchant.get(pendency.merchantId).catch(() => null);
    if (!merchant?.email) {
      return Response.json({ ok: true, sent: false, reason: 'merchant_email_missing' });
    }

    const publicUrl = buildPublicUrl(pendency.publicToken);

    const html = buildHtml({
      toName: merchant.fullName || merchant.companyName,
      publicUrl,
      generalMessage: pendency.generalMessage,
      items: pendency.items,
      expiresAt: pendency.expiresAt,
    });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: merchant.email,
      subject: `Documentos pendentes — Pagsmile`,
      body: html,
      from_name: 'Pagsmile Compliance (não responda)',
    });

    return Response.json({ ok: true, sent: true });
  } catch (error) {
    console.error('[emailPendencyRequest] Error:', error);
    return Response.json({ ok: false, sent: false, error: error.message }, { status: 500 });
  }
});