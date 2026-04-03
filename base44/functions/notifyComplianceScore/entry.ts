import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SLACK_CHANNEL = '#compliance-sub';

async function sendSlack(token, channel, text, blocks) {
  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, text, blocks, username: 'Pagsmile Compliance', icon_emoji: ':bar_chart:' }),
  });
  return res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event?.type !== 'create') return Response.json({ message: 'skip' });

    const score = data;
    const scoreVal = score.score_final || score.score_geral_composto || score.score_questionario || 0;
    const recomendacao = score.recomendacao_final || 'Pendente';
    const subfaixa = score.subfaixa_nome || score.subfaixa || 'N/A';
    const classificacao = score.classificacao_geral || score.classificacao_questionario || 'N/A';

    const emoji = recomendacao === 'Aprovado' ? '🟢' : recomendacao === 'Recusado' ? '🔴' : '🟡';

    // Try to get merchant name from onboarding case
    let empresaNome = 'N/A';
    if (score.onboarding_case_id) {
      try {
        const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: score.onboarding_case_id });
        if (cases?.length > 0 && cases[0].merchantId) {
          const merchants = await base44.asServiceRole.entities.Merchant.filter({ id: cases[0].merchantId });
          if (merchants?.length > 0) empresaNome = merchants[0].fullName || merchants[0].companyName || 'N/A';
        }
      } catch (e) { /* ignore */ }
    }

    const blocks = [
      { type: 'header', text: { type: 'plain_text', text: `${emoji} Score de Compliance Gerado`, emoji: true } },
      { type: 'section', fields: [
        { type: 'mrkdwn', text: `*Empresa:*\n${empresaNome}` },
        { type: 'mrkdwn', text: `*Score:*\n${scoreVal}` },
        { type: 'mrkdwn', text: `*Classificação:*\n${classificacao}` },
        { type: 'mrkdwn', text: `*Recomendação:*\n${recomendacao}` },
      ]},
    ];

    if (score.subfaixa_nome) {
      blocks.push({ type: 'section', fields: [
        { type: 'mrkdwn', text: `*Subfaixa:*\n${subfaixa}` },
        { type: 'mrkdwn', text: `*Rolling Reserve:*\n${score.rolling_reserve_percent || 0}%` },
      ]});
    }

    if (score.red_flags?.length > 0) {
      blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `🚩 *Red Flags:* ${score.red_flags.join(', ')}` } });
    }

    if (score.sumario_executivo) {
      const summary = score.sumario_executivo.length > 200 ? score.sumario_executivo.substring(0, 200) + '...' : score.sumario_executivo;
      blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `📝 ${summary}` } });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('slackbot');
    const result = await sendSlack(accessToken, SLACK_CHANNEL,
      `${emoji} Score Compliance: ${empresaNome} — ${recomendacao} (${scoreVal})`, blocks);

    return Response.json({ ok: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});