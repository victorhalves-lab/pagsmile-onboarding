import React from 'react';
import { Sec, H1, H2, H3, P, B, C, CodeBlock, Table, Note, Source } from '../DocPrimitives';

/**
 * Capítulo 17 — Categoria 5 (Monitoramento Intensivo) + Exceções V5.2
 *
 * A grande inovação operacional do V5.2: em vez de "bloquear ou liberar",
 * existe a Cat 5 — libera com cap de TPV inicial, rolling reserve adicional,
 * plano explícito de monitoramento (PlanoMonitoramento), aceite formal do
 * seller (TermoAdicionalV5_2) e gatilhos de off-boarding ágil.
 *
 * Fonte real:
 *   functions/applyV5_2Exception.js
 *   functions/acceptTermoAdicionalV5_2.js
 *   entities/PlanoMonitoramento.json
 *   entities/TermoAdicionalV5_2.json
 *   entities/Exception.json (ampliada)
 *   entities/SentinelFeedback.json
 *   entities/BdcMonitoringEvent.json
 *   components/cadastro/V5_2ExceptionWorkflow.jsx
 *   components/cadastro/V5_2PlanoMonitoramentoCard.jsx
 *   components/v5_2/feedback/FeedbackSentinelPanel.jsx
 */
export default function Ch17_Cat5_Excecoes() {
  return (
    <Sec id="ch-17">
      <H1 num="17">Categoria 5 — Monitoramento Intensivo, Exceções Avançadas e Feedback Loop</H1>

      <P>Este capítulo cobre o que <B>não existe no V4</B>: a Categoria 5 da Matriz de Decisão V5.2 (Cap. 15.6) e o ecossistema de exceções/monitoramento/feedback que orbita ao redor dela. Premissa central: <B>bloquear é a última opção</B> — antes de recusar, V5.2 sempre pergunta "podemos liberar com monitoramento intensivo e aceite formal do seller?".</P>

      <Note title="Cat 5 NÃO é 'aprovação fácil'" kind="rule">
        <p>É o contrário: <B>aprovação MAIS DIFÍCIL que Cat 2/Cat 3</B>. Exige: (a) Head Compliance ou superior aprovar a exceção, (b) seller assinar termo adicional aceitando condições restritivas, (c) plano de monitoramento com gatilhos automáticos de off-boarding, (d) TPV cap inicial reduzido, (e) rolling reserve adicional. É a alternativa ao "recusado" para sellers com bloqueio comum (não absoluto) mas valor comercial justificável.</p>
      </Note>

      <H2 num="17.1">Anatomia da Categoria 5</H2>

      <H3 num="17.1.1">Quando Cat 5 é aplicável (e quando NÃO é)</H3>
      <Table headers={['Situação', 'Cat 5 aplicável?', 'Justificativa']} rows={[
        ['Bloqueio absoluto ativo (10 absolutos do Cap. 15.3.2)', '🚫 NÃO', 'Bloqueios absolutos são intransponíveis — nem Head Compliance pode liberar'],
        ['Bloqueio comum ativo (62 dos 72 bloqueios)', '✅ Sim', 'Pode ser exceção via Cat 5 se aprovador habilitado decidir'],
        ['Score alto sem bloqueio (apenas findings acumulados)', '✅ Sim — opcional', 'Caso comum: Compliance Officer escolhe entre Cat 3 (manual review) ou aplicar Cat 5 direto'],
        ['Patch Financeiro vermelho com bloqueio B-FIN-*', '✅ Sim — comum', 'Caso típico: seller bom comercialmente mas com incoerência financeira'],
        ['CAF fraude biométrica confirmada (binary)', '🚫 NÃO', 'Veto biométrico CAF sobrescreve V5.2 (Princípio inviolável do Ch14.1)'],
        ['SENTINEL nivel_confianca < 60', '⚠️ Possível', 'Geralmente vai pra Cat 3 (manual) primeiro — analista decide se eleva para Cat 5'],
      ]} />

      <H3 num="17.1.2">Os 5 Componentes Operacionais da Cat 5</H3>
      <P>Aplicar Cat 5 envolve criar simultaneamente 5 elementos persistentes:</P>

      <Table headers={['Componente', 'Entidade', 'Função']} rows={[
        [<B key="1">1. Exception</B>, <C key="1c">Exception (categoria cat_5_monitoramento_intensivo)</C>, 'Cataloga o tipo de exceção aplicada — papel necessário, prazo, doc justificativa'],
        [<B key="2">2. Aprovação Hierárquica</B>, '— (registro em AuditLog)', 'Head Compliance ou superior precisa aprovar — não é botão de admin comum'],
        [<B key="3">3. PlanoMonitoramento</B>, <C key="3c">PlanoMonitoramento</C>, 'Cap TPV inicial, % rolling reserve adicional, gatilhos automáticos, prazo revisão'],
        [<B key="4">4. TermoAdicionalV5_2</B>, <C key="4c">TermoAdicionalV5_2</C>, 'Aceite formal do seller via link assinado — pré-condição para ativar a conta'],
        [<B key="5">5. SentinelFeedback</B>, <C key="5c">SentinelFeedback</C>, 'Analista grava por que aplicou Cat 5 (alimenta retreinamento do SENTINEL)'],
      ]} />

      <H2 num="17.2">Entidade Exception (Ampliada V5.2)</H2>

      <P>V5.1 tinha 4 categorias de exceção (documental, operacional, estrutural, estratégica). V5.2 adiciona uma quinta:</P>

      <Table headers={['Codigo', 'Nome', 'Papel mínimo', 'Exige termo adicional?', 'Exige plano monitoramento?']} rows={[
        ['cat_1_documental', 'Documental', 'analista_compliance', '—', '—'],
        ['cat_2_operacional', 'Operacional', 'analista_compliance', '—', '—'],
        ['cat_3_estrutural', 'Estrutural', 'head_compliance', '—', '—'],
        ['cat_4_estrategica', 'Estratégica', 'cco', '—', '—'],
        [<B key="cm">cat_5_monitoramento_intensivo</B>, <B key="cmn">Monitoramento Intensivo (NOVO V5.2)</B>, <B key="cp">head_compliance</B>, '✅ Sim', '✅ Sim'],
      ]} />

      <P>Schema completo da entidade <C>Exception</C> (campos chave):</P>

      <CodeBlock language="js">{`{
  codigo: 'cat_5_monitoramento_intensivo',
  nome: 'Monitoramento Intensivo',
  descricao: 'Aplicada quando há bloqueio comum + valor comercial + aprovação Head Compliance',
  papel_requerido: 'head_compliance',         // analista_compliance | head_compliance | cco | comite_credito
  documentos_justificativa: ['parecer_head_compliance', 'analise_comercial_assinada'],
  duracao_dias: 90,                            // validade da exceção
  registra_em_snapshot: true,                  // sempre true em Cat 5
  exige_termo_adicional: true,                 // NOVO V5.2 — força aceite seller
  exige_plano_monitoramento: true,             // NOVO V5.2 — cria PlanoMonitoramento
  tpv_cap_inicial_pct_padrao: 30,              // 30% do TPV declarado nos primeiros 90 dias
  rolling_reserve_adicional_pct_padrao: 10,    // +10% além do que a subfaixa indicaria
  framework_version: 'v5.2',
  ativo: true,
}`}</CodeBlock>

      <H2 num="17.3">PlanoMonitoramento</H2>

      <P>Entidade criada exclusivamente quando Cat 5 é aplicada. Atrelada 1:1 ao <C>OnboardingCase</C>. Campos:</P>

      <Table headers={['Campo', 'Tipo', 'Função']} rows={[
        ['onboardingCaseId', 'string (FK)', 'Caso ao qual o plano se atrela'],
        ['exceptionId', 'string (FK)', 'FK Exception (cat_5_monitoramento_intensivo)'],
        ['tpv_cap_atual_brl', 'number', 'Cap de TPV mensal vigente. Inicia em (declarado × tpv_cap_inicial_pct). Pode ser elevado em revisões.'],
        ['rolling_reserve_adicional_pct', 'number', 'Adicional ao % padrão da subfaixa. Ex: subfaixa 3B normal = 20%, com Cat 5 vira 30%.'],
        ['frequencia_revisao_dias', 'number', 'A cada N dias o caso é re-avaliado. Default 30.'],
        ['proxima_revisao_em', 'datetime', 'Data calculada da próxima revisão obrigatória.'],
        ['gatilhos_off_boarding', 'array<object>', 'Lista de condições que disparam off-boarding automático — ver 17.3.1.'],
        ['historico_revisoes', 'array<object>', 'Log imutável de cada revisão: data, analista, decisão, novo TPV cap, observações.'],
        ['status', 'enum', 'ativo | em_revisao | promovido_categoria_inferior | off_boarded | encerrado'],
        ['promovido_em', 'datetime', 'Quando seller foi promovido para Cat 2/Cat 3 (saiu da Cat 5).'],
        ['off_boarded_em', 'datetime', 'Se aplicável.'],
        ['off_boarded_razao', 'string', 'Qual gatilho disparou off-boarding.'],
      ]} />

      <H3 num="17.3.1">Gatilhos de Off-Boarding Ágil</H3>
      <P>Lista de condições que, se disparadas, encerram a operação automaticamente sem nova análise. Schema:</P>

      <CodeBlock language="js">{`gatilhos_off_boarding: [
  {
    tipo: 'tpv_excede_cap',
    threshold: 'tpv_cap_atual_brl * 1.10',     // 10% acima do cap
    duracao_meses: 1,                            // se manter por 1 mês acima
    acao: 'off_boarding_imediato',
  },
  {
    tipo: 'chargeback_rate',
    threshold: 0.02,                             // 2% — qualquer valor acima
    janela_dias: 30,
    acao: 'off_boarding_imediato',
  },
  {
    tipo: 'novo_bloqueio_detectado',
    condicao: 'qualquer B-XXX-NN ativar em revalidação BDC',
    acao: 'off_boarding_imediato',
  },
  {
    tipo: 'falha_sla_documental',
    condicao: 'seller não envia doc complementar solicitado em 15d',
    acao: 'suspensao_temporaria',                // não off-boarding, suspende até resolver
  },
  // ... até 10 gatilhos por plano
]`}</CodeBlock>

      <H3 num="17.3.2">Renderização — V5_2PlanoMonitoramentoCard</H3>
      <P>Componente <C>components/cadastro/V5_2PlanoMonitoramentoCard.jsx</C> aparece na página do dossiê de qualquer caso Cat 5. Mostra: status atual, cap TPV, rolling reserve adicional, próxima revisão, gatilhos ativos com indicadores de proximidade (ex: "Chargeback atual: 1.8% — atenção, 0.2% do gatilho"), botões "Revisar agora", "Promover para Cat inferior", "Off-board manualmente".</P>

      <H2 num="17.4">TermoAdicionalV5_2 — Aceite Formal do Seller</H2>

      <P>Cat 5 só pode ser ATIVADA depois do seller aceitar formalmente as condições adicionais. Funciona como contrato eletrônico mini — um link público enviado por e-mail. Sem aceite, a conta operacional não é liberada.</P>

      <H3 num="17.4.1">Schema TermoAdicionalV5_2</H3>
      <Table dense headers={['Campo', 'Tipo', 'Função']} rows={[
        ['onboardingCaseId', 'string (FK)', '—'],
        ['exceptionId', 'string (FK)', 'FK Exception cat_5'],
        ['planoMonitoramentoId', 'string (FK)', 'FK PlanoMonitoramento'],
        ['textoTermo', 'string (HTML)', 'Texto completo do termo (gerado por template a partir do plano)'],
        ['publicToken', 'string (192-bit hex)', 'Token único para acesso público — link enviado por e-mail'],
        ['publicSlug', 'string', 'Slug amigável /t/{slug} (opcional)'],
        ['enviado_em', 'datetime', '—'],
        ['enviado_para_email', 'string', 'Email do representante legal'],
        ['visualizado_em', 'datetime', 'Quando seller abriu o link'],
        ['aceito_em', 'datetime', 'Quando seller clicou aceitar'],
        ['aceito_por_nome', 'string', 'Nome de quem aceitou'],
        ['aceito_por_cpf', 'string', 'CPF de quem aceitou'],
        ['aceito_ip', 'string', 'IP de quem aceitou (forense)'],
        ['aceito_user_agent', 'string', 'User-agent'],
        ['recusado_em', 'datetime', 'Se aplicável — força reset do caso (volta a Cat 4)'],
        ['expirou_em', 'datetime', 'Se aplicável — 30 dias default'],
        ['status', 'enum', 'enviado | visualizado | aceito | recusado | expirado'],
      ]} />

      <H3 num="17.4.2">Função `acceptTermoAdicionalV5_2`</H3>
      <CodeBlock language="js">{`// functions/acceptTermoAdicionalV5_2.js — fluxo essencial
Deno.serve(async (req) => {
  const { token, nomeAceitador, cpfAceitador } = await req.json();
  const base44 = createClient(); // service role (público)

  // 1. Valida token
  const termo = (await base44.entities.TermoAdicionalV5_2.filter({ publicToken: token }))[0];
  if (!termo) return Response.json({ error: 'invalid_token' }, { status: 404 });
  if (termo.status === 'aceito') return Response.json({ error: 'already_accepted' }, { status: 409 });
  if (termo.status === 'expirado') return Response.json({ error: 'expired' }, { status: 410 });

  // 2. Captura forense
  const ip = req.headers.get('x-forwarded-for') || '';
  const userAgent = req.headers.get('user-agent') || '';

  // 3. Persiste aceite
  await base44.entities.TermoAdicionalV5_2.update(termo.id, {
    status: 'aceito',
    aceito_em: new Date().toISOString(),
    aceito_por_nome: nomeAceitador,
    aceito_por_cpf: cpfAceitador,
    aceito_ip: ip,
    aceito_user_agent: userAgent,
  });

  // 4. Ativa o PlanoMonitoramento associado
  await base44.entities.PlanoMonitoramento.update(termo.planoMonitoramentoId, { status: 'ativo' });

  // 5. Libera o caso para operação (status 'Aprovado')
  await base44.entities.OnboardingCase.update(termo.onboardingCaseId, {
    status: 'Aprovado',
    categoria_decisao_v5_2: 'cat_5_intensive_monitoring',
  });

  // 6. Notifica equipe
  await notifyComplianceCaseChange({ caseId: termo.onboardingCaseId, event: 'cat5_termo_aceito' });

  return Response.json({ success: true });
});`}</CodeBlock>

      <H2 num="17.5">Workflow de Aplicação — applyV5_2Exception</H2>

      <P>Função admin que executa a aplicação de uma exceção Cat 5. Único caminho legítimo (não pode ser feito via update direto na entidade):</P>

      <CodeBlock language="js">{`// functions/applyV5_2Exception.js — fluxo essencial
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  // 1. Permission check — só head_compliance ou superior
  if (!['admin', 'head_compliance', 'cco'].includes(user.role)) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }

  const {
    onboardingCaseId,
    excecaoCodigo,          // 'cat_5_monitoramento_intensivo'
    justificativa,          // texto livre do head_compliance
    docJustificativaUrl,    // documento de parecer assinado uploaded antes
    tpvCapInicialPct,       // override do default (opcional)
    rollingReserveAdicionalPct,
    gatilhosOffBoarding,    // array customizado de gatilhos
  } = await req.json();

  // 2. Valida que caso está em estado válido para receber Cat 5
  const caseRec = await base44.entities.OnboardingCase.get(onboardingCaseId);
  if (caseRec.status === 'Aprovado') return Response.json({ error: 'already_approved' }, { status: 409 });

  // 3. Cria PlanoMonitoramento
  const plano = await base44.entities.PlanoMonitoramento.create({
    onboardingCaseId, exceptionId: excecaoCodigo,
    tpv_cap_atual_brl: caseRec.tpvDeclarado * (tpvCapInicialPct / 100),
    rolling_reserve_adicional_pct: rollingReserveAdicionalPct,
    frequencia_revisao_dias: 30,
    proxima_revisao_em: addDays(now, 30),
    gatilhos_off_boarding: gatilhosOffBoarding,
    status: 'aguardando_aceite_termo',
  });

  // 4. Cria TermoAdicionalV5_2
  const termo = await base44.entities.TermoAdicionalV5_2.create({
    onboardingCaseId, exceptionId: excecaoCodigo, planoMonitoramentoId: plano.id,
    textoTermo: gerarTextoTermo({ plano, caseRec }),
    publicToken: crypto.getRandomValues(new Uint8Array(24)).join(''),
    status: 'enviado',
    enviado_para_email: caseRec.representanteLegalEmail,
  });

  // 5. Envia e-mail com link do termo
  await sendEmail({
    to: caseRec.representanteLegalEmail,
    subject: 'Pagsmile — Termo Adicional Necessário',
    template: 'termo_adicional_v5_2',
    variables: { url: \`\${origin}/TermoAdicional?token=\${termo.publicToken}\` },
  });

  // 6. Grava no AuditLog (forense regulatório)
  await base44.entities.AuditLog.create({
    entityName: 'OnboardingCase', entityId: onboardingCaseId,
    actionType: 'V5_2_EXCEPTION_APPLIED',
    actionDescription: \`Cat 5 aplicada por \${user.email} — aguardando aceite do seller\`,
    changedBy: user.email,
    details: { excecaoCodigo, justificativa, planoId: plano.id, termoId: termo.id },
  });

  // 7. Atualiza caso
  await base44.entities.OnboardingCase.update(onboardingCaseId, {
    categoria_decisao_v5_2: 'cat_5_intensive_monitoring',
    plano_monitoramento_id: plano.id,
    status: 'Em Processamento',  // aguarda aceite seller para virar Aprovado
  });

  return Response.json({ success: true, planoId: plano.id, termoId: termo.id });
});`}</CodeBlock>

      <H3 num="17.5.1">UI — V5_2ExceptionWorkflow</H3>
      <P>Componente <C>components/cadastro/V5_2ExceptionWorkflow.jsx</C>. Wizard de 4 steps para o Head Compliance: (1) selecionar exceção, (2) preencher justificativa + upload doc, (3) customizar parâmetros (TPV cap, rolling reserve, gatilhos), (4) revisão + confirmação. Cada step é validado antes de avançar.</P>

      <H2 num="17.6">Ciclo de Vida de um Caso Cat 5</H2>

      <Table headers={['Fase', 'Duração típica', 'O que acontece']} rows={[
        ['1. Análise SENTINEL', 'Pipeline backend', 'Decisão = cat_3_manual_review com bloqueio comum'],
        ['2. Avaliação Head Compliance', '24-72h', 'Analisa dossiê, decide entre Cat 4 (recusar) ou Cat 5 (aplicar exceção)'],
        ['3. Aplicação Cat 5', '< 5 min via UI', 'applyV5_2Exception executa — cria Exception + Plano + Termo + envia e-mail'],
        ['4. Aguardando aceite seller', 'Até 30 dias (depois expira)', 'Seller recebe e-mail, abre link, lê termo, aceita/recusa'],
        ['5. Plano ATIVO', '90+ dias', 'Conta operacional liberada com cap TPV + rolling reserve adicional. Monitoramento contínuo dos gatilhos.'],
        ['6a. Revisão periódica', 'A cada 30d', 'Analista revisa: gatilhos respeitados? Pode promover para Cat 2/3? Ou continuar Cat 5?'],
        ['6b. Off-boarding (se gatilho)', 'Imediato', 'Conta suspensa quando gatilho dispara. Caso vai para revisão emergencial.'],
        ['7. Promoção', 'Depois de 90-180d sem incidentes', 'Plano encerrado, caso vira Cat 2 ou Cat 3 normal. Operação volta ao trilho padrão.'],
      ]} />

      <H2 num="17.7">SentinelFeedback — Loop de Aprendizado</H2>

      <P>Toda aplicação de Cat 5 (e outras decisões manuais que divergem do SENTINEL) é registrada na entidade <C>SentinelFeedback</C>. Serve para retreinamento futuro do agente.</P>

      <H3 num="17.7.1">Schema SentinelFeedback</H3>
      <Table dense headers={['Campo', 'Função']} rows={[
        ['onboardingCaseId', 'FK do caso'],
        ['snapshotId', 'FK do Snapshot exato no momento da decisão'],
        ['sentinel_recommendation', 'Recomendação que o SENTINEL deu (campo cópia)'],
        ['decisao_humana_final', 'Decisão que o humano tomou'],
        ['categoria_feedback', 'enum: divergencia_simples | escalacao_manual | aplicacao_cat5 | overide_block | sentinel_alucinou'],
        ['justificativa_humana', 'Texto livre do analista'],
        ['campos_relevantes_para_retreinamento', 'array<string>: quais features o analista considerou mais importantes'],
        ['analista_id, analista_email, criado_em', 'Auditoria'],
      ]} />

      <P>Renderização: <C>components/v5_2/feedback/FeedbackSentinelPanel.jsx</C> aparece como aba dedicada quando há divergência. Catálogo de categorias em <C>feedbackCategoriesCatalog.js</C>.</P>

      <H2 num="17.8">BdcMonitoringEvent — Monitoramento Contínuo (Auto-Detecção de Gatilhos)</H2>

      <P>Casos em Cat 5 ativam <B>monitoramento BDC contínuo</B> — diferente da revalidação periódica do V4 (Cap. 12). A cada evento detectado pelo BDC (novo processo, nova negativação, mudança QSA), gera-se uma <C>BdcMonitoringEvent</C>:</P>

      <CodeBlock language="js">{`// entities/BdcMonitoringEvent.json
{
  onboardingCaseId: string,
  planoMonitoramentoId: string,
  evento_tipo: 'novo_processo' | 'nova_negativacao' | 'mudanca_qsa' | 'sancao_detectada' | 'cnpj_alterado' | ...,
  dataset_origem: string,           // dataset BDC que detectou
  payload_evento: object,           // raw do BDC
  severidade: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA',
  gatilho_off_boarding_disparado: boolean,
  acao_automatica_tomada: string,   // ex: 'off_boarding_imediato' | 'notificou_analista' | 'sem_acao'
  notificacao_slack_enviada: boolean,
  detectado_em: datetime,
}`}</CodeBlock>

      <P>Funções: <C>bdcMonitoringRegister.js</C> (registra inscrição no monitoramento BDC quando Cat 5 é aplicada), <C>bdcMonitoringWebhook.js</C> (recebe webhooks BDC e cria evento). Eventos com severidade CRITICA + gatilho de off-boarding ativo disparam suspensão imediata sem intervenção humana.</P>

      <H2 num="17.9">Tela /CadastroDetalhe — Aba Cat 5</H2>

      <P>Quando o caso é Cat 5, aparece uma aba dedicada com 5 blocos:</P>
      <ol className="list-decimal ml-5 space-y-1 text-[12.5px] text-[#1a1a1a] leading-[1.7]">
        <li><B>V5_2PlanoMonitoramentoCard:</B> status, cap TPV, rolling reserve, próxima revisão, gatilhos com indicadores</li>
        <li><B>Termo Adicional:</B> status do termo (enviado/visualizado/aceito), link para ressubmeter, registro forense (IP, user-agent do aceite)</li>
        <li><B>Histórico de Revisões:</B> tabela com cada revisão 30-em-30 dias, decisão tomada, nome do analista</li>
        <li><B>Eventos BDC Monitorados:</B> lista cronológica de BdcMonitoringEvent com severity colorida</li>
        <li><B>Ações disponíveis:</B> "Revisar agora", "Promover para Cat inferior", "Off-board manualmente", "Solicitar doc complementar"</li>
      </ol>

      <H2 num="17.10">Comparativo Operacional V4 × V5.2 Cat 5</H2>

      <Table headers={['Aspecto', 'V4 (sem Cat 5)', 'V5.2 com Cat 5']} rows={[
        ['Bloqueio comum detectado', 'Recusar ou aprovar (analista escolhe)', 'Recusar (Cat 4), aprovar manual (Cat 3) ou aplicar Cat 5 (monitorado)'],
        ['Aprovação de exceção', 'Analista decide sozinho', 'Head Compliance + termo seller + plano explícito'],
        ['Monitoramento pós-aprovação', 'PLD por nível de subfaixa (mensal a trimestral)', 'BdcMonitoringEvent contínuo + revisão 30d + gatilhos automáticos'],
        ['TPV cap inicial', 'Não existe (libera 100% do declarado)', 'Cap configurável (default 30% nos primeiros 90d)'],
        ['Off-boarding ágil', 'Manual, exige análise', 'Automático quando gatilho dispara'],
        ['Rastreabilidade da decisão', 'AuditLog genérico', 'Snapshot imutável + Exception + Plano + Termo + Feedback (5 entidades)'],
        ['Feedback para SENTINEL', 'Não existe', 'SentinelFeedback grava divergência humana × IA para retreinamento'],
      ]} />

      <Source files={[
        'functions/applyV5_2Exception.js',
        'functions/acceptTermoAdicionalV5_2.js',
        'functions/bdcMonitoringRegister.js',
        'functions/bdcMonitoringWebhook.js',
        'entities/Exception.json (categoria cat_5_monitoramento_intensivo)',
        'entities/PlanoMonitoramento.json',
        'entities/TermoAdicionalV5_2.json',
        'entities/SentinelFeedback.json',
        'entities/BdcMonitoringEvent.json',
        'components/cadastro/V5_2ExceptionWorkflow.jsx',
        'components/cadastro/V5_2PlanoMonitoramentoCard.jsx',
        'components/v5_2/feedback/FeedbackSentinelPanel.jsx',
        'components/v5_2/feedback/feedbackCategoriesCatalog.js',
        'docs/V5_2_BLOCO1_FUNDAMENTOS.md (princípios Cat 5)',
      ]} />
    </Sec>
  );
}