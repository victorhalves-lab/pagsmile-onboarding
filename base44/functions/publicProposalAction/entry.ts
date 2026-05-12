import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * PUBLIC endpoint — actions on a proposal from the public link.
 * The caller does NOT need to be authenticated, but MUST provide a valid tokenPublico.
 * We look up the proposal by token (server-side) and perform the action with service role.
 *
 * action: 'view' | 'accept' | 'reject' | 'counter'
 * type:   'proposal' | 'pix_proposal'
 */
Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const { token, type, action, payload, slug } = body;

    if (!token || !type || !action) {
      return Response.json({ error: 'Missing required params: token, type, action' }, { status: 400 });
    }
    if (!['proposal', 'pix_proposal'].includes(type)) {
      return Response.json({ error: 'Invalid type' }, { status: 400 });
    }
    if (!['view', 'accept', 'reject', 'counter'].includes(action)) {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const entityName = type === 'proposal' ? 'Proposal' : 'PixProposal';
    const actLabel   = type === 'proposal' ? 'Proposta'  : 'Proposta PIX';

    // 1. Lookup proposal (service role, never trust payload IDs).
    // Busca por token primeiro; se falhar, tenta por publicSlug como fallback.
    // Isso protege contra clientes usando links antigos cujo token foi rotacionado.
    let results = await base44.asServiceRole.entities[entityName].filter({ tokenPublico: token });

    if ((!results || results.length === 0) && slug) {
      try {
        results = await base44.asServiceRole.entities[entityName].filter({ publicSlug: slug });
      } catch (_) { /* ignore */ }
    }

    if (!results || results.length === 0) {
      return Response.json({ error: 'Proposta não encontrada' }, { status: 404 });
    }

    // Se múltiplos matches (versionamento), prefere a versão atual
    let proposta = results[0];
    if (results.length > 1) {
      const current = results.find(r => r.isCurrentVersion === true);
      proposta = current || results.sort((a, b) => (b.version || 1) - (a.version || 1))[0];
    }

    // VERSION REDIRECT: se o token/slug bateu numa versão antiga, substituir
    // silenciosamente pela versão atual do mesmo rootProposalId. Assim qualquer
    // link antigo continua funcionando, mas SEMPRE opera sobre a versão mais
    // recente — impede cliente aceitar/recusar condições obsoletas.
    if (proposta.isCurrentVersion === false) {
      const rootId = proposta.rootProposalId || proposta.id;
      try {
        const currentMatches = await base44.asServiceRole.entities[entityName].filter({
          rootProposalId: rootId,
          isCurrentVersion: true,
        });
        if (currentMatches.length > 0) {
          proposta = currentMatches[0];
        } else {
          // Fallback: talvez o "proposta" atual seja a raiz (rootId === proposta.id)
          const childCurrent = await base44.asServiceRole.entities[entityName].filter({
            rootProposalId: proposta.id,
            isCurrentVersion: true,
          });
          if (childCurrent.length > 0) proposta = childCurrent[0];
        }
      } catch (_) { /* se falhar, segue com a proposta original */ }
    }

    // Edge case: a versão current está em estado TERMINAL (recusada/cancelada/aceita/expirada)
    // — não permite regressão de estado por ação pública. Mensagem clara para o cliente.
    // BUG-009 fix: anteriormente apenas recusada/cancelada eram bloqueadas, o que permitia
    // um cliente com o token público transformar uma proposta ACEITA em RECUSADA ou
    // CONTRAPROPOSTA, quebrando o pipeline comercial.
    //
    // Transições permitidas por ação pública:
    //   - view:    sempre permitido (idempotente)
    //   - accept:  apenas se status ∈ {enviada, visualizada, contraproposta, expirada(grace)}
    //   - reject:  apenas se status ∈ {enviada, visualizada, contraproposta}
    //   - counter: apenas se status ∈ {enviada, visualizada}
    //
    // Estados terminais (aceita/recusada/cancelada) não podem mais ser modificados
    // por link público — só o admin pode cancelar/reverter via interface interna.
    const terminalStates = new Set(['aceita', 'recusada', 'cancelada']);
    if (terminalStates.has(proposta.status) && action !== 'view') {
      // "accept" em proposta já aceita é idempotente (tratado abaixo no switch);
      // deixamos passar para retornar o { skipped: true }.
      if (!(action === 'accept' && proposta.status === 'aceita')) {
        return Response.json({
          error: `Esta proposta não está mais ativa (${proposta.status}). Entre em contato com seu consultor.`
        }, { status: 409 });
      }
    }

    const now = new Date().toISOString();

    // 2. Build updates based on action
    let proposalUpdates = {};
    let leadStatus = null;
    let activityType = null;
    let activityDescription = '';

    switch (action) {
      case 'view':
        if (proposta.status !== 'enviada') {
          // idempotent — no-op if already viewed/accepted/etc.
          return Response.json({ ok: true, skipped: true });
        }
        proposalUpdates = { status: 'visualizada' };
        activityType = 'proposta_visualizada';
        activityDescription = `${actLabel} ${proposta.codigo || ''} visualizada pelo cliente`;
        break;

      case 'accept':
        // Idempotent: if already accepted, return ok without re-writing (prevents duplicate activities)
        if (proposta.status === 'aceita') {
          return Response.json({ ok: true, skipped: true, proposta });
        }
        // Do not allow accepting an already-rejected/cancelled proposal
        if (['recusada', 'cancelada'].includes(proposta.status)) {
          return Response.json({ error: `Proposta já está ${proposta.status} e não pode ser aceita.` }, { status: 409 });
        }
        // POLÍTICA: Propostas expiradas ainda podem ser aceitas pelo cliente.
        // Cenário real (Garena / ALLPES / etc): o cliente recebe o link, trava
        // na decisão interna, e volta semanas depois querendo aceitar. Bloquear
        // o aceite obriga o comercial a criar manualmente nova versão e reenviar
        // tudo — atrito desnecessário. A validade serve apenas como referência
        // comercial, não como trava absoluta.
        //
        // O aceite registra o timestamp real do aceite (acceptedDate = now), então
        // o histórico sempre mostra que foi aceito FORA do prazo original — útil
        // para auditoria e para o comercial revalidar condições comerciais se for
        // o caso. Se o comercial precisar impedir o aceite, basta cancelar a
        // proposta (status 'cancelada'), que é terminal.
        proposalUpdates = { status: 'aceita', acceptedDate: now };
        leadStatus = 'proposta_aceita';
        activityType = 'proposta_aceita';
        activityDescription = proposta.status === 'expirada'
          ? `${actLabel} ${proposta.codigo || ''} aceita pelo cliente APÓS expirada (validade: ${proposta.validUntil ? new Date(proposta.validUntil).toLocaleDateString('pt-BR') : 'n/d'})`
          : `${actLabel} ${proposta.codigo || ''} aceita pelo cliente`;
        break;

      case 'reject': {
        const motivo = payload?.motivo || 'Não informado';
        const detalhe = payload?.detalhe || '';
        proposalUpdates = {
          status: 'recusada',
          rejectedDate: now,
          rejectedReason: `${motivo}${detalhe ? `: ${detalhe}` : ''}`,
        };
        leadStatus = 'proposta_recusada';
        activityType = 'proposta_recusada';
        activityDescription = `${actLabel} ${proposta.codigo || ''} recusada: ${motivo}`;
        break;
      }

      case 'counter':
        proposalUpdates = {
          status: 'contraproposta',
          counterProposalDetails: payload?.details || {},
        };
        leadStatus = 'em_contato_comercial';
        activityType = 'proposta_contraproposta';
        activityDescription = `Contraproposta recebida para ${actLabel} ${proposta.codigo || ''}`;
        break;
    }

    // FIX BUG #2: auto-link Lead by CNPJ if proposal has no leadId. This makes
    // the Lead status transition ("proposta_aceita"/"proposta_recusada") reach
    // the commercial pipeline even for proposals created without a Lead link.
    let effectiveLeadId = proposta.leadId || '';
    const cnpj = (proposta.clienteCnpj || '').replace(/\D/g, '');
    if (!effectiveLeadId && cnpj.length === 14) {
      try {
        const leads = await base44.asServiceRole.entities.Lead.filter({ cpfCnpj: cnpj });
        if (leads.length > 0) effectiveLeadId = leads[0].id;
      } catch (_) {}
    }
    // Persist the auto-link back on the proposal so future actions don't re-search.
    if (effectiveLeadId && !proposta.leadId) {
      proposalUpdates.leadId = effectiveLeadId;
    }

    // 3. Apply proposal update
    await base44.asServiceRole.entities[entityName].update(proposta.id, proposalUpdates);

    // 4. Update Lead (if linked or auto-linked)
    if (effectiveLeadId && leadStatus) {
      try {
        await base44.asServiceRole.entities.Lead.update(effectiveLeadId, {
          status: leadStatus,
          lastInteractionDate: now,
          currentProposalId: proposta.id,
        });
      } catch (_) { /* lead may not exist, ignore */ }
    }

    // 5. Create LeadActivity
    if (activityType && effectiveLeadId) {
      try {
        await base44.asServiceRole.entities.LeadActivity.create({
          leadId: effectiveLeadId,
          activityType,
          description: activityDescription,
          performedBy: 'cliente',
          activityDate: now,
        });
      } catch (_) { /* non-blocking */ }
    }

    // Audit trail — non-blocking
    try {
      const headers = req.headers;
      const ip = headers.get('cf-connecting-ip') || (headers.get('x-forwarded-for') || '').split(',')[0].trim() || headers.get('x-real-ip') || null;
      base44.asServiceRole.entities.AccessTrail.create({
        eventType: 'proposal_action',
        proposalId: proposta.id,
        leadId: effectiveLeadId || undefined,
        action,
        ip,
        country: headers.get('cf-ipcountry') || null,
        region: headers.get('cf-region') || null,
        city: headers.get('cf-ipcity') || null,
        userAgent: (headers.get('user-agent') || '').slice(0, 500),
        referer: (headers.get('referer') || '').slice(0, 500),
        metadata: { type, status: proposalUpdates.status, codigo: proposta.codigo, rejectedReason: proposalUpdates.rejectedReason },
        serverTimestamp: new Date().toISOString(),
      }).catch(() => {});
    } catch (_) { /* silent */ }

    // 6. Return the updated proposal (so frontend can use its fields, e.g. leadId for compliance redirect)
    const updated = await base44.asServiceRole.entities[entityName].filter({ id: proposta.id });
    return Response.json({ ok: true, proposta: updated[0] || proposta });

  } catch (error) {
    console.error('publicProposalAction error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});