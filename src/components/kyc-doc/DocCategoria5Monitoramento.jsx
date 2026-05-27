import React from 'react';
import { S, H1, H2, H3, P, Li, Bold, Table, InfoBox } from './DocHelpers';

/**
 * Seção 21 — Categoria 5 (Monitoramento Intensivo) + Exceções V5.2
 *
 * Cobertura operacional do que está em Cap. 17 da Documentação Master.
 * Foco: como o analista de compliance opera Cat 5 no dia-a-dia.
 */
export default function DocCategoria5Monitoramento() {
  return (
    <S>
      <H1>21. Categoria 5 — Monitoramento Intensivo (Exceções Avançadas V5.2)</H1>

      <P>A grande inovação operacional do V5.2 é a <Bold>Categoria 5</Bold> da Matriz de Decisão. Antes (V4), só havia "aprovar" ou "recusar" — bloqueios B01-B10 mandavam para recusa direta sem alternativa. V5.2 introduz Cat 5: <Bold>libera com cap de TPV inicial, rolling reserve adicional, plano explícito de monitoramento e aceite formal do seller</Bold>.</P>

      <InfoBox title="Cat 5 NÃO é 'aprovação fácil' — é mais difícil que Cat 2/Cat 3" color="amber">
        <p>Exige: (a) aprovação de Head Compliance ou superior, (b) aceite formal do seller via Termo Adicional assinado eletronicamente, (c) plano de monitoramento com gatilhos automáticos de off-boarding, (d) TPV cap inicial reduzido, (e) rolling reserve adicional. É a alternativa ao "recusado" para sellers com <Bold>bloqueio COMUM (não absoluto)</Bold> mas valor comercial justificável.</p>
      </InfoBox>

      <H2>21.1. Quando Cat 5 é Aplicável</H2>
      <Table headers={['Situação', 'Cat 5 aplicável?', 'Razão']} rows={[
        ['Bloqueio absoluto ativo (10 absolutos)', '🚫 NÃO', 'Bloqueios absolutos são intransponíveis — nem Head Compliance pode liberar'],
        ['Bloqueio comum ativo (62 dos 72 bloqueios)', '✅ Sim', 'Pode ser exceção via Cat 5 com aprovação habilitada'],
        ['Score alto sem bloqueio (findings acumulados)', '✅ Sim — opcional', 'Compliance Officer escolhe entre Cat 3 (manual review) ou aplicar Cat 5 direto'],
        ['Patch Financeiro vermelho', '✅ Sim — comum', 'Caso típico: seller bom comercialmente mas com incoerência financeira'],
        ['CAF fraude biométrica binária', '🚫 NÃO', 'Veto biométrico CAF sobrescreve V5.2'],
      ]} />

      <H2>21.2. Os 5 Componentes Criados ao Aplicar Cat 5</H2>
      <P>Aplicar Cat 5 dispara a criação simultânea de 5 elementos persistentes:</P>
      <Table headers={['Componente', 'Entidade', 'Função']} rows={[
        ['1. Exception (Cat 5)', 'Exception com codigo=cat_5_monitoramento_intensivo', 'Cataloga o tipo de exceção aplicada — papel necessário, prazo, doc justificativa'],
        ['2. Aprovação Hierárquica', '— (registro em AuditLog)', 'Head Compliance ou superior precisa aprovar (não é botão de admin comum)'],
        ['3. PlanoMonitoramento', 'PlanoMonitoramento', 'Cap TPV inicial, % rolling reserve adicional, gatilhos automáticos, prazo revisão (30d)'],
        ['4. TermoAdicionalV5_2', 'TermoAdicionalV5_2', 'Aceite formal do seller via link — pré-condição para ativar a conta'],
        ['5. SentinelFeedback', 'SentinelFeedback', 'Analista grava por que aplicou Cat 5 (alimenta retreinamento do SENTINEL)'],
      ]} />

      <H2>21.3. PlanoMonitoramento</H2>
      <P>Entidade criada exclusivamente quando Cat 5 é aplicada. Atrelada 1:1 ao <code>OnboardingCase</code>. Campos principais:</P>
      <Table dense headers={['Campo', 'Função']} rows={[
        ['tpv_cap_atual_brl', 'Cap de TPV mensal vigente. Inicia em (TPV declarado × 30%). Pode subir em revisões.'],
        ['rolling_reserve_adicional_pct', 'Adicional ao % padrão da subfaixa (ex: 3B normal 20% → Cat 5 vira 30%)'],
        ['frequencia_revisao_dias', 'A cada N dias o caso é re-avaliado. Default 30.'],
        ['proxima_revisao_em', 'Data calculada da próxima revisão obrigatória'],
        ['gatilhos_off_boarding', 'Array de condições que disparam off-boarding automático'],
        ['historico_revisoes', 'Log imutável de cada revisão: data, analista, decisão, novo cap'],
        ['status', 'ativo | em_revisao | promovido_categoria_inferior | off_boarded | encerrado'],
      ]} />

      <H3>21.3.1. Gatilhos de Off-Boarding Ágil</H3>
      <P>Condições que, se disparadas, encerram a operação automaticamente sem nova análise. Tipos comuns:</P>
      <ul className="list-disc ml-6 space-y-1 mb-3">
        <Li><Bold>tpv_excede_cap:</Bold> TPV passa do cap em 10% por 1 mês → off_boarding_imediato</Li>
        <Li><Bold>chargeback_rate:</Bold> Chargeback &gt; 2% em janela de 30d → off_boarding_imediato</Li>
        <Li><Bold>novo_bloqueio_detectado:</Bold> Qualquer B-XXX-NN ativar em revalidação BDC → off_boarding_imediato</Li>
        <Li><Bold>falha_sla_documental:</Bold> Seller não envia doc complementar em 15d → suspensao_temporaria</Li>
      </ul>

      <H2>21.4. TermoAdicionalV5_2 — Aceite Formal</H2>
      <P>Cat 5 só ATIVA depois do seller aceitar formalmente as condições adicionais. Funciona como contrato eletrônico mini — link público enviado por e-mail. Sem aceite, a conta operacional NÃO é liberada.</P>

      <H3>21.4.1. Fluxo de Aceite</H3>
      <ol className="list-decimal ml-6 space-y-1 mb-3">
        <Li>Head Compliance aprova aplicação de Cat 5 via <code>V5_2ExceptionWorkflow</code></Li>
        <Li>Sistema cria <code>TermoAdicionalV5_2</code> com publicToken 192-bit + texto do termo gerado a partir do PlanoMonitoramento</Li>
        <Li>E-mail enviado para representante legal do seller</Li>
        <Li>Seller abre link <code>/TermoAdicional?token=...</code>, lê condições, aceita ou recusa</Li>
        <Li>Função <code>acceptTermoAdicionalV5_2</code> captura forense (IP, user-agent, nome, CPF) + ativa PlanoMonitoramento + libera caso para "Aprovado"</Li>
        <Li>Se seller recusar ou não aceitar em 30d → caso volta para Cat 4 (Recusado)</Li>
      </ol>

      <H2>21.5. Ciclo de Vida de um Caso Cat 5</H2>
      <Table headers={['Fase', 'Duração', 'O que acontece']} rows={[
        ['1. Análise SENTINEL', 'Pipeline', 'Decisão = Manual Review com bloqueio comum'],
        ['2. Head Compliance avalia', '24-72h', 'Decide entre Cat 4 (recusar) ou Cat 5 (aplicar exceção)'],
        ['3. Aplicação Cat 5', '< 5min via UI', 'Cria Exception + Plano + Termo + envia e-mail seller'],
        ['4. Aguardando aceite', 'Até 30d (expira)', 'Seller lê termo e aceita ou recusa'],
        ['5. Plano ATIVO', '90+ dias', 'Conta liberada com cap + reserve adicional + monitoramento contínuo'],
        ['6a. Revisão periódica', 'A cada 30d', 'Analista revisa: gatilhos OK? Promove para Cat 2/3? Continua Cat 5?'],
        ['6b. Off-boarding (gatilho)', 'Imediato', 'Conta suspensa quando gatilho dispara → revisão emergencial'],
        ['7. Promoção', '90-180d sem incidentes', 'Plano encerrado, caso vira Cat 2 ou Cat 3 normal'],
      ]} />

      <H2>21.6. BdcMonitoringEvent — Monitoramento Contínuo</H2>
      <P>Casos em Cat 5 ativam <Bold>monitoramento BDC contínuo</Bold> — diferente da revalidação periódica do V4 (Seção 12). A cada evento detectado pelo BDC (novo processo, nova negativação, mudança QSA, sanção), gera-se um <code>BdcMonitoringEvent</code>. Eventos críticos com gatilho ativo disparam suspensão imediata sem intervenção humana.</P>

      <H2>21.7. SentinelFeedback — Loop de Aprendizado</H2>
      <P>Toda aplicação de Cat 5 (e outras decisões manuais que divergem do SENTINEL) é registrada na entidade <code>SentinelFeedback</code>. Categorias possíveis: <code>divergencia_simples</code>, <code>escalacao_manual</code>, <code>aplicacao_cat5</code>, <code>overide_block</code>, <code>sentinel_alucinou</code>. Serve para retreinamento futuro do agente.</P>

      <H2>21.8. UI no Painel do Analista</H2>
      <P>Casos Cat 5 exibem uma <Bold>aba dedicada</Bold> no <code>/CadastroDetalhe</code> com 5 blocos:</P>
      <ul className="list-decimal ml-6 space-y-1 mb-3">
        <Li><Bold>V5_2PlanoMonitoramentoCard:</Bold> status, cap TPV, rolling reserve, próxima revisão, gatilhos com indicadores de proximidade (ex: "Chargeback atual: 1.8% — atenção, 0.2% do gatilho")</Li>
        <Li><Bold>Termo Adicional:</Bold> status (enviado/visualizado/aceito), link para ressubmeter, registro forense do aceite</Li>
        <Li><Bold>Histórico de Revisões:</Bold> tabela com cada revisão 30-em-30 dias, decisão, nome do analista</Li>
        <Li><Bold>Eventos BDC Monitorados:</Bold> lista cronológica com severity colorida</Li>
        <Li><Bold>Ações:</Bold> "Revisar agora", "Promover para Cat inferior", "Off-board manualmente", "Solicitar doc complementar"</Li>
      </ul>

      <H2>21.9. Comparativo Operacional V4 × V5.2 com Cat 5</H2>
      <Table headers={['Aspecto', 'V4 (sem Cat 5)', 'V5.2 com Cat 5']} rows={[
        ['Bloqueio comum detectado', 'Recusar ou aprovar (sem Cat 5)', 'Recusar (Cat 4), aprovar manual (Cat 3) ou Cat 5 monitorado'],
        ['Aprovação de exceção', 'Analista decide sozinho', 'Head Compliance + termo seller + plano explícito'],
        ['Monitoramento pós-aprovação', 'PLD por nível de subfaixa', 'BdcMonitoringEvent contínuo + revisão 30d + gatilhos automáticos'],
        ['TPV cap inicial', 'Não existe', 'Cap configurável (default 30% nos primeiros 90d)'],
        ['Off-boarding ágil', 'Manual, exige análise', 'Automático quando gatilho dispara'],
        ['Rastreabilidade da decisão', 'AuditLog genérico', 'Snapshot imutável + Exception + Plano + Termo + Feedback'],
        ['Feedback para SENTINEL', '—', 'SentinelFeedback grava divergência humana × IA'],
      ]} />

      <InfoBox title="Permissão necessária para aplicar Cat 5" color="amber">
        <p>Função <code>applyV5_2Exception</code> exige <code>user.role ∈ {`{ 'admin', 'head_compliance', 'cco' }`}</code>. Analistas júnior NÃO podem aplicar Cat 5 — devem escalar para Head Compliance via Slack ou pela tela de Escalações Questionáveis (Seção 15).</p>
      </InfoBox>
    </S>
  );
}