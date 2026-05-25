// Endpoint público para o link unificado /u/:slug
// Ações:
//   - load: retorna o pacote + todas as propostas vinculadas (BR + Global) pelo slug
//   - accept_br: aceita o lado Brasil (atualiza a proposta BR correspondente)
//   - accept_global: aceita o lado Global (atualiza GlobalProposal + dispara onProposalAccepted)
// Fluxos de aceite individuais são preservados — apenas reutilizamos as funções existentes.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const { action, slug, payload } = (await req.json()) || {};

    if (!slug || typeof slug !== 'string') {
      return Response.json({ error: 'Missing slug' }, { status: 400 });
    }

    const list = await base44.asServiceRole.entities.UnifiedProposalPackage.filter({ public_slug: slug });
    const pkg = list[0];
    if (!pkg) return Response.json({ error: 'Package not found' }, { status: 404 });

    // ── LOAD: carrega tudo que o link precisa exibir ──
    if (action === 'load') {
      const [brCustom, brStandard, brPix, global] = await Promise.all([
        pkg.br_proposal_id          ? base44.asServiceRole.entities.Proposal.filter({ id: pkg.br_proposal_id }).then(r => r[0] || null).catch(() => null) : null,
        pkg.br_standard_proposal_id ? base44.asServiceRole.entities.StandardProposal.filter({ id: pkg.br_standard_proposal_id }).then(r => r[0] || null).catch(() => null) : null,
        pkg.br_pix_proposal_id      ? base44.asServiceRole.entities.PixProposal.filter({ id: pkg.br_pix_proposal_id }).then(r => r[0] || null).catch(() => null) : null,
        pkg.global_proposal_id      ? base44.asServiceRole.entities.GlobalProposal.filter({ id: pkg.global_proposal_id }).then(r => r[0] || null).catch(() => null) : null,
      ]);

      return Response.json({
        package: pkg,
        br: { custom: brCustom, standard: brStandard, pix: brPix },
        global,
      });
    }

    // ── ACCEPT_BR: marca o pacote e a proposta BR como aceita ──
    if (action === 'accept_br') {
      // Identifica qual proposta BR está vinculada (prioridade: custom > standard > pix)
      let updatedAny = false;
      if (pkg.br_proposal_id) {
        await base44.asServiceRole.entities.Proposal.update(pkg.br_proposal_id, { status: 'accepted' }).catch(() => {});
        updatedAny = true;
      } else if (pkg.br_standard_proposal_id) {
        await base44.asServiceRole.entities.StandardProposal.update(pkg.br_standard_proposal_id, { status: 'accepted' }).catch(() => {});
        updatedAny = true;
      } else if (pkg.br_pix_proposal_id) {
        await base44.asServiceRole.entities.PixProposal.update(pkg.br_pix_proposal_id, { status: 'accepted' }).catch(() => {});
        updatedAny = true;
      }
      if (!updatedAny) return Response.json({ error: 'No BR proposal linked' }, { status: 400 });

      const newStatus = pkg.global_accepted_at ? 'fully_accepted' : 'br_accepted';
      const updated = await base44.asServiceRole.entities.UnifiedProposalPackage.update(pkg.id, {
        status: newStatus,
        br_accepted_at: new Date().toISOString(),
      });
      return Response.json({ ok: true, package: updated });
    }

    // ── ACCEPT_GLOBAL: marca a GlobalProposal como aceita (mantém fluxo onProposalAccepted) ──
    if (action === 'accept_global') {
      if (!pkg.global_proposal_id) return Response.json({ error: 'No Global proposal linked' }, { status: 400 });
      await base44.asServiceRole.entities.GlobalProposal.update(pkg.global_proposal_id, { status: 'accepted' });

      const newStatus = pkg.br_accepted_at ? 'fully_accepted' : 'global_accepted';
      const updated = await base44.asServiceRole.entities.UnifiedProposalPackage.update(pkg.id, {
        status: newStatus,
        global_accepted_at: new Date().toISOString(),
      });
      return Response.json({ ok: true, package: updated });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[publicUnifiedProposal] error', error);
    return Response.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
});