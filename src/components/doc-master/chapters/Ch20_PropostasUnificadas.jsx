import React from 'react';
import { Sec, H1, H2, H3, P, B, C, CodeBlock, Table, Note, Source } from '../DocPrimitives';

/**
 * Capítulo 20 — Propostas Unificadas (Brasil + Global em 1 link)
 *
 * Documenta o "Pacote" — um único link público com tabs Brasil + Global,
 * apontando para propostas já existentes nos dois trilhos sem duplicar dados.
 */
export default function Ch20_PropostasUnificadas() {
  return (
    <Sec id="ch-20">
      <H1 num="20">Propostas Unificadas — Brasil + Global em 1 Link</H1>

      <P>O <B>Pacote Unificado</B> resolve um cenário recorrente: o mesmo cliente precisa ver propostas <B>Brasil</B> (em BRL — Custom, Standard ou PIX) e <B>Global</B> (em USD) ao mesmo tempo, e quer um <B>único link</B> em vez de receber 2-4 URLs diferentes por e-mail. A solução é uma entidade <B>"agregadora"</B> que <B>não duplica dados</B> — apenas referencia as propostas já existentes nos trilhos respectivos e expõe um link público <C>/u/:slug</C> com tabs.</P>

      <Note title="Princípio: SEM duplicação" kind="rule">
        <p>O <C>UnifiedProposalPackage</C> só guarda <B>foreign keys</B> (<C>br_proposal_id</C>, <C>br_standard_proposal_id</C>, <C>br_pix_proposal_id</C>, <C>global_proposal_id</C>) + metadados do link público + status agregado. Toda a lógica de criação, edição, expiração, fees, conteúdo permanece nas entidades originais (<C>Proposal</C>, <C>StandardProposal</C>, <C>PixProposal</C>, <C>GlobalProposal</C>). Aceitar o lado BR no link unificado é o MESMO efeito que aceitar a proposta BR direto — usa o mesmo update.</p>
      </Note>

      <H2 num="20.1">Arquitetura — 1 Entidade + 1 Função + 3 Páginas</H2>

      <Table headers={['Camada', 'Artefato', 'Função']} rows={[
        ['Entidade', <C key="1">UnifiedProposalPackage</C>, 'Pacote agregador. Aponta para até 4 propostas (3 Brasil + 1 Global) + metadados (cliente, idioma inicial, slug público, validade) + status agregado'],
        ['Função pública', <C key="2">publicUnifiedProposal</C>, 'Endpoint do link /u/:slug. Ações: load · accept_br · accept_global'],
        ['Página admin', <C key="3">/HubPropostas</C>, 'Hub central — listagem unificada de todas as propostas (BR + Global + Unificadas) com filtros'],
        ['Página admin', <C key="4">/CriarPropostaUnificada</C>, 'Cria o pacote em 2 modos (Linkar existentes / Wizard do zero)'],
        ['Página pública', <C key="5">/u/:slug → PropostaUnificadaPublica</C>, 'Renderiza tabs Brasil/Global com as propostas reais embutidas no mesmo layout'],
      ]} />

      <H2 num="20.2">Entidade UnifiedProposalPackage</H2>

      <CodeBlock language="js">{`{
  // Identificação do cliente (display no header do link público)
  client_name: string,
  contact_name: string,
  contact_email: string,
  default_language: "pt" | "en" | "zh",   // idioma inicial — cliente pode trocar
  valid_until: date,                       // validade informativa (cada proposta tem a sua própria)

  // ─── Foreign keys (até 4) — NUNCA duplica dados ───
  br_proposal_id: string,                  // FK → Proposal (custom BR)
  br_standard_proposal_id: string,         // FK → StandardProposal (padrão BR)
  br_pix_proposal_id: string,              // FK → PixProposal
  global_proposal_id: string,              // FK → GlobalProposal

  // ─── Link público ───
  public_slug: string,                     // /u/:slug — único

  // ─── Status agregado ───
  status: "draft" | "sent" | "br_accepted" | "global_accepted"
        | "fully_accepted" | "rejected",
  br_accepted_at: datetime,
  global_accepted_at: datetime,
  notes: string,
}`}</CodeBlock>

      <H3 num="20.2.1">Semântica do status agregado</H3>
      <Table dense headers={['Status', 'Quando']} rows={[
        ['draft', 'Criado mas ainda não enviado (não usado pelo wizard atual, mas reservado)'],
        ['sent', 'Link gerado e enviado ao cliente — estado default após criar'],
        ['br_accepted', 'Cliente aceitou o lado Brasil mas ainda não o Global'],
        ['global_accepted', 'Cliente aceitou o lado Global mas ainda não o Brasil'],
        ['fully_accepted', 'Cliente aceitou ambos os lados (cobertura completa)'],
        ['rejected', 'Cliente rejeitou explicitamente (manual)'],
      ]} />

      <H2 num="20.3">Função publicUnifiedProposal — Linha-a-linha</H2>

      <P>Endpoint público (sem auth) chamado pelo link <C>/u/:slug</C>. Três ações:</P>

      <H3 num="20.3.1">action=load</H3>
      <P>Carrega o pacote e <B>resolve as 4 referências em paralelo</B> com <C>Promise.all</C>:</P>
      <ol className="list-decimal ml-5 space-y-1 text-[12.5px] text-[#1a1a1a]">
        <li>Localiza <C>UnifiedProposalPackage</C> por <C>public_slug</C> (404 se não)</li>
        <li>Em paralelo: fetch da <C>Proposal</C> · <C>StandardProposal</C> · <C>PixProposal</C> · <C>GlobalProposal</C> (apenas se os respectivos IDs existirem)</li>
        <li>Cada catch retorna <C>null</C> — uma proposta deletada ou inacessível não derruba o link inteiro</li>
        <li>Retorna <C>{`{ package, br: {custom, standard, pix}, global }`}</C></li>
      </ol>

      <H3 num="20.3.2">action=accept_br</H3>
      <P>Prioridade: <B>custom &gt; standard &gt; pix</B>. Atualiza a primeira proposta BR vinculada que encontrar:</P>
      <ul className="list-disc ml-5 text-[12.5px] text-[#1a1a1a]">
        <li>Se <C>br_proposal_id</C>: atualiza <C>Proposal</C> com <C>status="accepted"</C></li>
        <li>Senão se <C>br_standard_proposal_id</C>: atualiza <C>StandardProposal</C></li>
        <li>Senão se <C>br_pix_proposal_id</C>: atualiza <C>PixProposal</C></li>
        <li>Atualiza o pacote: <C>br_accepted_at = now</C></li>
        <li>Status agregado: vira <C>fully_accepted</C> se <C>global_accepted_at</C> já existia, senão <C>br_accepted</C></li>
      </ul>

      <H3 num="20.3.3">action=accept_global</H3>
      <ul className="list-disc ml-5 text-[12.5px] text-[#1a1a1a]">
        <li>Exige <C>global_proposal_id</C> presente (400 se não)</li>
        <li>Atualiza <C>GlobalProposal.status = "accepted"</C></li>
        <li>Atualiza o pacote: <C>global_accepted_at = now</C></li>
        <li>Status agregado: <C>fully_accepted</C> se BR já aceito, senão <C>global_accepted</C></li>
      </ul>

      <Note title="Aceite no pacote = aceite no trilho original" kind="info">
        <p>Quando o cliente aceita o lado Brasil no link unificado, a <C>Proposal</C>/<C>StandardProposal</C>/<C>PixProposal</C> correspondente recebe <C>status="accepted"</C> exatamente como se o cliente tivesse aceito o link direto da proposta. Isso preserva os <B>triggers downstream</B> (<C>onProposalAccepted</C>, <C>notifyProposalAccepted</C>, criação de OnboardingCase, etc.). Não há lógica especial de aceite "unificado" — o pacote é só uma view.</p>
      </Note>

      <H2 num="20.4">Página /CriarPropostaUnificada — 2 Modos</H2>

      <H3 num="20.4.1">Modo A — "Linkar existentes"</H3>
      <P>Para o caso comum: comercial já criou as propostas BR e Global separadamente e quer só empacotar. UI:</P>
      <ul className="list-disc ml-5 text-[12.5px] text-[#1a1a1a] leading-[1.7]">
        <li>Card "Brasil" com 3 dropdowns: Customizada · Padrão · PIX (carregam as 200 propostas mais recentes de cada tipo)</li>
        <li>Card "Global" com 1 dropdown: Proposta Global</li>
        <li>Cada dropdown mostra <C>client_name · created_date</C> — fácil identificar visualmente</li>
        <li>Pode selecionar 1 ou mais — exige pelo menos 1 para habilitar o botão "Gerar link"</li>
      </ul>

      <H3 num="20.4.2">Modo B — "Criar do zero" (Wizard)</H3>
      <P>Para o caso "não tenho nada pronto ainda". Apresenta 4 checkboxes (BR Custom, BR Standard, BR PIX, Global). Quando o usuário marca um:</P>
      <ol className="list-decimal ml-5 space-y-1 text-[12.5px] text-[#1a1a1a]">
        <li>Aparece um botão "Criar" que <B>abre a tela nativa</B> daquela proposta <B>em nova aba</B> (ex: <C>/CriarProposta</C>, <C>/CriarPropostaPadrao</C>, <C>/CriarPropostaPix</C>, <C>/HubPropostas?tab=global</C>)</li>
        <li>O usuário cria a proposta lá com toda a lógica nativa (sem duplicação de código)</li>
        <li>Volta para esta aba e clica em "Atualizar lista de propostas"</li>
        <li>Seleciona a proposta recém-criada no dropdown ao lado</li>
        <li>Repete para cada módulo desejado</li>
        <li>Clica em "Gerar link unificado"</li>
      </ol>

      <Note title="Por que abrir em nova aba?" kind="info">
        <p>Cada tela de criação de proposta (CriarProposta/CriarPropostaPadrao/CriarPropostaPix/GlobalCriarProposta) tem dezenas de campos, validações específicas e fluxos próprios. <B>Reimplementar tudo dentro de um wizard inline seria duplicar código e introduzir bugs</B>. A solução adotada (abrir em nova aba + voltar e refrescar lista) preserva 100% da lógica nativa sem alterações.</p>
      </Note>

      <H3 num="20.4.3">Geração do slug</H3>
      <CodeBlock language="js">{`slugFromName(name) {
  const base = name
    .toLowerCase()
    .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')   // remove acentos
    .replace(/[^a-z0-9]+/g, '-')                          // não-alfanumérico → hífen
    .replace(/^-+|-+$/g, '')                              // remove hífens das pontas
    .slice(0, 40) || 'proposta';
  return \`\${base}-\${Math.random().toString(36).slice(2, 8)}\`;  // sufixo 6 chars random
}

// Exemplo: "Loja Acmé Brasil Ltda" → "loja-acme-brasil-ltda-x7k2pq"`}</CodeBlock>

      <H2 num="20.5">Página Pública — /u/:slug → PropostaUnificadaPublica</H2>

      <P>Layout em <B>tabs</B>:</P>
      <ul className="list-disc ml-5 text-[12.5px] text-[#1a1a1a] leading-[1.7]">
        <li>Header com <C>client_name</C>, status agregado e selector de idioma (PT/EN/ZH baseado em <C>default_language</C>)</li>
        <li>Tab "🇧🇷 Brasil" — exibe a proposta BR vinculada (renderiza a primeira disponível: custom &gt; standard &gt; pix). Botão "Aceitar Brasil" dispara <C>publicUnifiedProposal action=accept_br</C></li>
        <li>Tab "🌎 Global" — exibe a <C>GlobalProposal</C> vinculada em USD com pricing por país. Botão "Accept Global" dispara <C>publicUnifiedProposal action=accept_global</C></li>
        <li>Cliente pode aceitar um lado, fechar a aba, voltar dias depois e aceitar o outro — o status agregado avança independentemente</li>
        <li>Se uma das propostas vinculadas foi deletada ou expirou, a tab correspondente não aparece (graceful degradation)</li>
      </ul>

      <H2 num="20.6">Página Admin — /HubPropostas</H2>

      <P>O Hub é a <B>landing page</B> do contexto Unificado. Mostra:</P>
      <ul className="list-disc ml-5 text-[12.5px] text-[#1a1a1a] leading-[1.7]">
        <li>KPIs gerais: # pacotes ativos, # totalmente aceitos, # parcialmente aceitos, # rejeitados</li>
        <li>Listagem de todas as <C>UnifiedProposalPackage</C> ordenadas por data, com status agregado em badge colorido</li>
        <li>Tabs para acessar diretamente: <B>Pacotes Unificados</B> · <B>Propostas Brasil</B> (vai para /GestaoPropostas) · <B>Propostas Global</B> (vai para /GlobalPropostas)</li>
        <li>Botão "Criar Proposta Unificada" → /CriarPropostaUnificada</li>
      </ul>

      <H2 num="20.7">Roteamento — Rotas Públicas + Privadas</H2>

      <Table dense headers={['Rota', 'Tipo', 'O que renderiza']} rows={[
        ['/u/:slug', 'PÚBLICA (sem layout admin)', 'PropostaUnificadaPublica — tabs BR/Global com aceite independente'],
        ['/HubPropostas', 'PRIVADA', 'Listagem + KPIs + atalhos para criar'],
        ['/CriarPropostaUnificada', 'PRIVADA', 'Wizard de criação (modo Linkar ou Modo Wizard)'],
      ]} />

      <P>A rota <C>/u/:slug</C> é registrada em <C>App.jsx</C> dentro de <C>PublicRoutes</C> (não precisa autenticação) e em <C>lib/publicRoutes.js</C> como caminho público dinâmico. NÃO usa o <C>LayoutWrapper</C> — renderiza standalone para o cliente final ver uma página limpa.</P>

      <H2 num="20.8">Ciclo Completo — Da Criação ao Aceite Duplo</H2>

      <Table headers={['Fase', 'Onde', 'Quem age']} rows={[
        ['1. Comercial cria as propostas individuais', '/CriarProposta · /CriarPropostaPadrao · /CriarPropostaPix · /GlobalCriarProposta', 'Comercial'],
        ['2. Cria pacote em "Linkar existentes"', '/CriarPropostaUnificada (modo A)', 'Comercial'],
        ['3. Sistema gera slug + UnifiedProposalPackage (status=sent)', 'createM mutation', 'Sistema'],
        ['4. Envia URL /u/:slug por e-mail', '— (manual)', 'Comercial'],
        ['5. Cliente abre o link', '/u/:slug → publicUnifiedProposal action=load', 'Cliente'],
        ['6. Cliente troca idioma (opcional)', 'LanguageSelector — apenas client-side', 'Cliente'],
        ['7. Cliente revisa Brasil → aceita', 'tab Brasil → publicUnifiedProposal action=accept_br', 'Cliente'],
        ['8. Sistema: Proposal/StandardProposal/PixProposal vira status=accepted + pacote vira br_accepted', '—', 'Sistema'],
        ['9. (Dias depois) cliente volta e aceita Global', 'tab Global → publicUnifiedProposal action=accept_global', 'Cliente'],
        ['10. Sistema: GlobalProposal vira status=accepted + pacote vira fully_accepted', '—', 'Sistema'],
        ['11. Triggers downstream disparam normalmente (notifyProposalAccepted, criar OnboardingCase BR, etc.)', '—', 'Sistema'],
      ]} />

      <H2 num="20.9">Edge Cases &amp; Comportamentos</H2>

      <Table dense headers={['Cenário', 'Comportamento']} rows={[
        ['Proposta BR vinculada foi deletada', 'tab Brasil mostra mensagem de erro e botão de aceite fica escondido; load retorna null naquela posição via Promise catch'],
        ['Pacote tem apenas BR (sem Global)', 'Renderiza só a tab Brasil — UI esconde tab Global'],
        ['Pacote tem 2 propostas BR (ex: Custom + Standard)', 'accept_br aceita a de maior prioridade (custom). As outras ficam intocadas — futura melhoria pode permitir aceite por tipo'],
        ['Cliente abre o link, troca idioma, fecha, volta', 'Idioma escolhido NÃO persiste no pacote — só o default_language do criador. O selector usa estado local'],
        ['Cliente aceita 2× clicando rápido', 'Sem idempotency real — backend faz update mesmo já estando accepted; status final é o mesmo, sem dano'],
        ['Slug duplicado', 'Geração inclui sufixo random de 6 chars (base36) — colisão é matematicamente desprezível mas não tem validação dura'],
        ['Pacote sem nenhuma proposta vinculada', 'Validação na criação bloqueia: "Vincule pelo menos uma proposta (Brasil ou Global)"'],
        ['Pacote vencido (valid_until passou)', 'Não há enforcement automático — comercial precisa atualizar manualmente. valid_until é informativo'],
      ]} />

      <H2 num="20.10">Por que esta abordagem (vs duplicar dados)?</H2>

      <Table headers={['Critério', 'Solução adotada (FK)', 'Alternativa (duplicar)']} rows={[
        ['Edição de proposta BR/Global após criar pacote', 'Reflete automaticamente — cliente sempre vê a versão atual', 'Stale data — pacote ficaria com cópia desatualizada'],
        ['Aceite no pacote dispara triggers existentes', 'Sim — atualiza a entidade nativa, triggers rodam', 'Não — precisaria duplicar todos os triggers'],
        ['Manutenção de schema', 'Alterações em Proposal/GlobalProposal funcionam transparentes', 'Cada novo campo teria que ser refletido manualmente'],
        ['Auditoria', 'Histórico vive na entidade original', 'Histórico fragmentado em 2 lugares'],
        ['Storage', '5 fks + 8 metadados = ~200 bytes/pacote', 'Cópia completa de até 4 propostas = ~50KB/pacote'],
        ['Risco de divergência', 'Zero', 'Alto'],
      ]} />

      <Source files={[
        'entities/UnifiedProposalPackage.json',
        'functions/publicUnifiedProposal.js',
        'pages/HubPropostas.jsx',
        'pages/CriarPropostaUnificada.jsx',
        'pages/PropostaUnificadaPublica.jsx',
        'App.jsx (rota /u/:slug em PublicRoutes)',
        'lib/publicRoutes.js (registro do caminho público)',
        'lib/global/globalContext.js (UNIFIED_PAGES — auto-switch de contexto)',
        'layout.jsx (menu Unificado — HubPropostas + CriarPropostaUnificada)',
        'components/unified/UnifiedProposalsList.jsx (lista de pacotes no Hub)',
      ]} />
    </Sec>
  );
}