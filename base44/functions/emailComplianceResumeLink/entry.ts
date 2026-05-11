import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * PUBLIC endpoint — envia link de retomada do questionário/upload de compliance
 * para o email do cliente, para que ele possa continuar depois.
 *
 * Acionado pelo bridge "QuestionnaireToDocsBridge" quando o cliente clica em
 * "Salvar e continuar depois" após terminar o questionário.
 *
 * Body: { toEmail, toName?, resumeUrl, brandName? }
 *
 * Segurança:
 *   - Endpoint público (sem auth).
 *   - Email destinatário validado (formato + presença).
 *   - resumeUrl validado (apenas mesmo domínio do app, sem open redirect).
 *   - Rate limit implícito via Base44 SDK (sem abuse possível além do que é normal).
 */

const ALLOWED_HOSTS = [
  'pagsmile-onboarding.base44.app',
  'app.base44.com',
];

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isSafeResumeUrl(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    return ALLOWED_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

function buildHtml({ toName, resumeUrl, brandName }) {
  const greeting = toName ? `Olá, ${toName}!` : 'Olá!';
  const brand = brandName || 'Pagsmile';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:20px">
    <div style="background:linear-gradient(135deg,#002443,#003366);padding:32px 28px;border-radius:16px 16px 0 0;text-align:center">
      <h1 style="color:#2bc196;margin:0;font-size:22px;font-weight:700">Continue seu cadastro 📋</h1>
      <p style="color:rgba(255,255,255,0.75);margin:10px 0 0;font-size:14px">Falta apenas a Etapa 2 — upload de documentos.</p>
    </div>
    <div style="background:#fff;padding:28px;border:1px solid #e2e8f0;border-top:none">
      <p style="color:#002443;font-size:16px;font-weight:600;margin:0 0 16px">${greeting}</p>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 14px">
        Você completou o questionário de cadastro junto à ${brand}. Para concluir, ainda falta enviar seus documentos e fazer a verificação de identidade (CAF).
      </p>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 14px">
        <strong>Sem essa etapa, seu cadastro não pode ser aprovado.</strong> O processo leva cerca de 5 minutos.
      </p>
      <div style="text-align:center;margin:28px 0">
        <a href="${resumeUrl}" style="display:inline-block;background:#2bc196;color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px">Continuar agora</a>
      </div>
      <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0">
        Ou copie este link no seu navegador:<br>
        <span style="word-break:break-all;color:#475569">${resumeUrl}</span>
      </p>
    </div>
    <div style="background:#f8fafc;padding:20px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;text-align:center">
      <p style="color:#94a3b8;font-size:11px;margin:0">${brand} — Este é um e-mail automático. Não responda.</p>
    </div>
  </div>
</body></html>`;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ ok: false, error: 'method_not_allowed' }, { status: 405 });
    }
    const body = await req.json().catch(() => ({}));
    const { toEmail, toName, resumeUrl, brandName } = body;

    if (!isValidEmail(toEmail)) {
      return Response.json({ ok: false, error: 'invalid_email' }, { status: 400 });
    }
    if (!resumeUrl || !isSafeResumeUrl(resumeUrl)) {
      return Response.json({ ok: false, error: 'invalid_resume_url' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const html = buildHtml({ toName, resumeUrl, brandName });
    const brand = brandName || 'Pagsmile';

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: toEmail,
      subject: `Continue seu cadastro — ${brand}`,
      body: html,
      from_name: `${brand} (não responda)`,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[emailComplianceResumeLink] Error:', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});