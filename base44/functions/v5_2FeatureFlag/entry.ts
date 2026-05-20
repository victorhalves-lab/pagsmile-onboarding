// ─────────────────────────────────────────────────────────────────────
// v5_2FeatureFlag — Gerencia flag server-side `score_engine_v5_2`
// ─────────────────────────────────────────────────────────────────────
// Esta flag controla se NOVOS OnboardingCases nascem com
// framework_version='v5.2' (true) ou 'v4.0' (false/default).
//
// Casos JÁ existentes NUNCA são alterados — DNA é imutável.
//
// Armazenamento: registro único em IntegrationConfig com provider='V5_2_Flags'
// (reaproveita entidade existente, evita criar schema novo).
//
// Operações:
//   GET    → retorna { enabled: bool, updatedAt, updatedBy }
//   POST   → { enabled: bool } → admin-only, persiste novo valor
// ─────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const PROVIDER_KEY = 'V5_2_Flags';
const FLAG_NAME = 'V5.2 Feature Flags';
const FLAG_KEY = 'score_engine_v5_2';

// Armazenamento: usamos `services_enabled` (array) — se contém FLAG_KEY → ativo.
// O campo `settings` tem schema fixo no IntegrationConfig e não aceita chaves arbitrárias.
async function getOrCreateConfig(base44) {
  const rows = await base44.asServiceRole.entities.IntegrationConfig.filter({ provider: PROVIDER_KEY });
  if (rows[0]) return rows[0];
  return await base44.asServiceRole.entities.IntegrationConfig.create({
    provider: PROVIDER_KEY,
    name: FLAG_NAME,
    is_active: true,
    environment: 'production',
    services_enabled: [],
  });
}

function readFlag(cfg) {
  return Array.isArray(cfg?.services_enabled) && cfg.services_enabled.includes(FLAG_KEY);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const action = body.action || (req.method === 'GET' ? 'read' : (typeof body.enabled === 'boolean' ? 'write' : 'read'));

    if (action === 'read') {
      const cfg = await getOrCreateConfig(base44);
      return Response.json({
        enabled: readFlag(cfg),
        updatedAt: cfg.updated_date,
        updatedBy: cfg.created_by,
      });
    }

    if (action === 'write') {
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
      }
      if (typeof body.enabled !== 'boolean') {
        return Response.json({ error: 'enabled (boolean) required' }, { status: 400 });
      }

      const cfg = await getOrCreateConfig(base44);
      const wasEnabled = readFlag(cfg);
      const current = Array.isArray(cfg.services_enabled) ? cfg.services_enabled : [];
      const next = body.enabled
        ? Array.from(new Set([...current, FLAG_KEY]))
        : current.filter(s => s !== FLAG_KEY);

      await base44.asServiceRole.entities.IntegrationConfig.update(cfg.id, {
        services_enabled: next,
      });

      console.log(`[v5_2FeatureFlag] ${user.email} → ${FLAG_KEY}=${body.enabled} (was ${wasEnabled})`);

      return Response.json({ ok: true, enabled: body.enabled });
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
});