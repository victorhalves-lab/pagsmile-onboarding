import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const { event, data, old_data } = body;

    // Only trigger when OnboardingCase status changes to "Aprovado"
    if (event?.type === 'update') {
      const wasNotApproved = old_data?.status !== 'Aprovado';
      const isNowApproved = data?.status === 'Aprovado';

      if (!wasNotApproved || !isNowApproved) {
        return Response.json({ message: 'Status não mudou para Aprovado, ignorando.' });
      }
    } else if (event?.type === 'create' && data?.status !== 'Aprovado') {
      return Response.json({ message: 'Caso criado mas não aprovado, ignorando.' });
    }

    const onboardingCaseId = event?.entity_id || data?.id;
    const merchantId = data?.merchantId;

    // 1. Buscar Merchant
    const merchants = await base44.asServiceRole.entities.Merchant.filter({ id: merchantId });
    if (!merchants || merchants.length === 0) {
      return Response.json({ error: 'Merchant não encontrado' }, { status: 404 });
    }
    const merchant = merchants[0];
    const cnpj = merchant.cpfCnpj;

    // 2. Verificar se já existe contrato para este CNPJ/case
    const existingContracts = await base44.asServiceRole.entities.Contract.filter({ onboardingCaseId: onboardingCaseId });
    if (existingContracts && existingContracts.length > 0) {
      return Response.json({ message: 'Contrato já existe para este caso.' });
    }

    // 3. Buscar Lead pelo CNPJ
    const leads = await base44.asServiceRole.entities.Lead.filter({ cpfCnpj: cnpj });
    const lead = leads && leads.length > 0 ? leads[0] : null;

    // 4. Buscar Proposal aceita pelo leadId
    let proposal = null;
    if (lead) {
      const proposals = await base44.asServiceRole.entities.Proposal.filter({ leadId: lead.id, status: 'aceita' });
      if (proposals && proposals.length > 0) {
        proposal = proposals[0];
      }
    }

    // 5. Buscar respostas do questionário de compliance
    const responses = await base44.asServiceRole.entities.QuestionnaireResponse.filter({ onboardingCaseId: onboardingCaseId });

    // Helper: buscar resposta por texto da pergunta (match parcial)
    const findResponse = (keyword) => {
      if (!responses) return null;
      const found = responses.find(r => 
        r.questionText && r.questionText.toLowerCase().includes(keyword.toLowerCase())
      );
      return found ? (found.valueText || found.valueNumber || found.valueArray?.join(', ') || '') : null;
    };

    // 6. Montar dados pré-preenchidos
    const preFilledFields = [];
    const missingFields = [];

    const addField = (fieldName, value) => {
      if (value !== null && value !== undefined && value !== '') {
        preFilledFields.push(fieldName);
        return value;
      } else {
        missingFields.push(fieldName);
        return value;
      }
    };

    // Gerar código único
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
    const codigo = `CONTR-${year}-${random}`;

    // Gerar publicLinkCode
    const publicLinkCode = crypto.randomUUID().replace(/-/g, '').substring(0, 16);

    // Dados do cliente
    const clientName = addField('clientName', lead?.fullName || merchant.fullName || '');
    const clientDocument = addField('clientDocument', cnpj);
    const clientEmail = addField('clientEmail', lead?.email || merchant.email || '');
    const clientPhone = addField('clientPhone', lead?.phone || merchant.phone || '');

    // Dados de endereço (do compliance)
    const clientAddress = addField('clientAddress', findResponse('endereço') || findResponse('logradouro') || '');
    const clientCity = addField('clientCity', findResponse('cidade') || findResponse('município') || '');
    const clientState = addField('clientState', findResponse('estado') || findResponse('uf') || '');
    const clientZipCode = addField('clientZipCode', findResponse('cep') || '');

    // Representante legal (do compliance)
    const clientRepresentativeName = addField('clientRepresentativeName', findResponse('representante') || findResponse('responsável legal') || findResponse('nome do sócio') || '');
    const clientRepresentativeRole = addField('clientRepresentativeRole', findResponse('cargo do representante') || findResponse('cargo do responsável') || '');
    const clientRepresentativeCPF = addField('clientRepresentativeCPF', findResponse('cpf do representante') || findResponse('cpf do responsável') || findResponse('cpf do sócio') || '');

    // Dados bancários (do compliance)
    const bankInstitution = addField('bankInstitution', findResponse('banco') || findResponse('instituição bancária') || '');
    const bankAgency = addField('bankAgency', findResponse('agência') || '');
    const bankAccountNumber = addField('bankAccountNumber', findResponse('conta') || findResponse('número da conta') || '');

    // Taxas da proposta
    let rates = null;
    let projectedTpvMonth1 = null;
    let projectedTpvMonth2 = null;
    let projectedTpvMonth3 = null;
    let proposalLocked = false;

    if (proposal && proposal.rates) {
      rates = {
        cartao: proposal.rates.cartao || {},
        debito: proposal.rates.debito || {},
        pix: proposal.rates.pix || {},
        boleto: proposal.rates.boleto || null,
        antifraude: proposal.rates.antifraude || null,
        feeTransacao: proposal.rates.feeTransacao || null,
        rav: proposal.rates.rav || {},
        percentualAntecipacao: proposal.rates.percentualAntecipacao || null,
        alertaPreChargeback: proposal.rates.alertaPreChargeback || null
      };
      preFilledFields.push('rates');

      // TPV projetado (vem do minimoGarantido da proposta)
      if (proposal.rates.minimoGarantido) {
        projectedTpvMonth1 = proposal.rates.minimoGarantido.mes1 || null;
        projectedTpvMonth2 = proposal.rates.minimoGarantido.mes2 || null;
        projectedTpvMonth3 = proposal.rates.minimoGarantido.mes3 || null;
        if (projectedTpvMonth1) preFilledFields.push('projectedTpvMonth1');
        if (projectedTpvMonth2) preFilledFields.push('projectedTpvMonth2');
        if (projectedTpvMonth3) preFilledFields.push('projectedTpvMonth3');
      }

      proposalLocked = true;
    } else {
      missingFields.push('rates');
    }

    // Prazo de liquidação
    const paymentTerm = addField('paymentTerm', proposal?.rates?.rav?.prazo || '');

    // 7. Criar o rascunho do contrato
    const contractData = {
      leadId: lead?.id || '',
      proposalId: proposal?.id || '',
      onboardingCaseId: onboardingCaseId,
      merchantId: merchantId,
      clientCnpj: cnpj,
      codigo: codigo,
      status: 'pre_generated',
      publicLinkCode: publicLinkCode,

      clientName,
      clientDocument,
      clientAddress,
      clientCity,
      clientState,
      clientZipCode,
      clientEmail,
      clientPhone,
      clientRepresentativeName,
      clientRepresentativeRole,
      clientRepresentativeCPF,

      rates: rates || {},
      projectedTpvMonth1,
      projectedTpvMonth2,
      projectedTpvMonth3,
      paymentTerm,

      bankInstitution,
      bankAgency,
      bankAccountNumber,

      proposalLocked,
      preFilledFields,
      missingFields,

      responsavelNome: proposal?.responsavelNome || '',
      responsavelId: proposal?.responsavelId || ''
    };

    const contract = await base44.asServiceRole.entities.Contract.create(contractData);

    // 8. Notificar no Slack (#comercial-sub)
    const accessToken = await base44.asServiceRole.connectors.getAccessToken("slackbot");

    // Buscar canal #comercial-sub
    const channelsRes = await fetch('https://slack.com/api/conversations.list', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
    });
    const channelsData = await channelsRes.json();
    let channelId = null;
    if (channelsData.ok && channelsData.channels) {
      const ch = channelsData.channels.find(c => c.name === 'comercial-sub');
      if (ch) channelId = ch.id;
    }

    if (channelId) {
      const missingCount = missingFields.length;
      const preFilledCount = preFilledFields.length;

      const slackMessage = {
        channel: channelId,
        username: 'Pagsmile Contratos',
        icon_emoji: ':page_facing_up:',
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: '📄 Novo Contrato Pré-Gerado!', emoji: true }
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Cliente:*\n${clientName || 'Não informado'}` },
              { type: 'mrkdwn', text: `*CNPJ:*\n${cnpj}` },
              { type: 'mrkdwn', text: `*Código:*\n${codigo}` },
              { type: 'mrkdwn', text: `*Status:*\nRascunho Pré-gerado` }
            ]
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Campos Preenchidos:*\n${preFilledCount} campos ✅` },
              { type: 'mrkdwn', text: `*Campos Pendentes:*\n${missingCount} campos ⚠️` }
            ]
          },
          {
            type: 'section',
            text: { type: 'mrkdwn', text: `👉 Acesse o sistema para revisar e completar o contrato.` }
          }
        ]
      };

      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage)
      });
    }

    // 9. Registrar no AuditLog
    await base44.asServiceRole.entities.AuditLog.create({
      entityName: 'Contract',
      entityId: contract.id,
      actionType: 'CREATE',
      actionDescription: `Contrato ${codigo} pré-gerado automaticamente após aprovação de compliance do CNPJ ${cnpj}`,
      changedBy: 'sistema_automacao',
      changeDate: new Date().toISOString(),
      details: {
        preFilledFields,
        missingFields,
        proposalLocked,
        leadId: lead?.id,
        proposalId: proposal?.id
      }
    });

    return Response.json({ 
      success: true, 
      contractId: contract.id,
      codigo: codigo,
      preFilledCount: preFilledFields.length,
      missingCount: missingFields.length
    });

  } catch (error) {
    console.error('Erro ao pré-gerar contrato:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});