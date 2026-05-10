import React from 'react';
import { H2, H3, H4, P, B, C, Table, Note, CodeBlock, Pipeline } from '../../DocPrimitives';

/**
 * §1.2 Bootstrap completo — index.html → main.jsx → ensureSdkLoaded → App
 */
export default function Ch01_Bootstrap() {
  return (
    <>
      <H2 num="1.2">Bootstrap da Aplicação — Do Primeiro Byte ao Render</H2>

      <P>A aplicação tem um <B>caminho de boot único e crítico</B>: 8 etapas obrigatórias, todas síncronas exceto uma async (carregar o SDK). Qualquer falha em qualquer etapa derruba o app inteiro. Por isso cada etapa tem defesa em profundidade.</P>

      <H3 num="1.2.1">Sequência exata de inicialização</H3>
      <Pipeline steps={[
        { id: '01', name: 'index.html carrega', desc: 'Browser parseia HTML mínimo: <head> com fontes Inter+JetBrains Mono via Google Fonts (preconnect), favicon Base44, meta lang="pt-BR" + meta google notranslate. <body class="notranslate"> com <div id="root"> e <script type="module" src="/src/main.jsx">.', source: 'index.html (19 linhas)' },
        { id: '02', name: 'Vite carrega main.jsx', desc: 'Imports síncronos: React, ReactDOM/client, index.css, ErrorBoundary, App, ensureSdkLoaded de @/api/base44Client. O simples ATO de importar base44Client.js dispara o módulo de detecção de rota pública.', source: 'main.jsx + api/base44Client.js' },
        { id: '03', name: 'base44Client.js detecta rota pública', desc: 'Avalia window.location.pathname uma única vez. isPublicPath() é executado contra o Set PUBLIC_PATHS (47 paths exatos + 6 prefixes). Resultado bool é cacheado em isPublicRoute. Esta detecção é AUTORITÁRIA — nada mais consulta a URL para decidir SDK.', source: 'api/base44Client.js linhas 12-13 + lib/publicRoutes.js' },
        { id: '04', name: 'Token cleanup defensivo (apenas se público)', desc: 'Em rota pública: localStorage.removeItem("base44_access_token"), "token", "base44_token". Razão: se um link público for aberto no mesmo browser onde um admin já estava logado, removemos o token para evitar SDK tentar usar credenciais inválidas.', source: 'api/base44Client.js linhas 16-22' },
        { id: '05', name: 'Crash shield global instalado', desc: 'addEventListener("error") + addEventListener("unhandledrejection") catchando padrões conhecidos de crash do SDK em routes públicas (TypeError "instanceof not callable", "X is not a function" de chunks index-*.js). evt.preventDefault() impede crash.', source: 'api/base44Client.js linhas 24-60' },
        { id: '06', name: 'createMock() ou loadSdk()', desc: 'Sempre cria mockClient (proxy que throwa em qualquer chamada SDK exceto auth.isAuthenticated → false e analytics noop). Em rota não-pública: loadSdk() inicia dynamic import("@base44/sdk") em background.', source: 'api/base44Client.js linhas 62-138' },
        { id: '07', name: 'await ensureSdkLoaded()', desc: 'main.jsx aguarda promise da etapa 06 antes do primeiro render. Em rota pública resolve instantâneo (Promise.resolve(null)). Em rota admin resolve quando @base44/sdk está pronto. Falha vira mock + console.error.', source: 'main.jsx linhas 11-17 + base44Client.js linhas 100-138' },
        { id: '08', name: 'ReactDOM.createRoot().render(<ErrorBoundary><App /></ErrorBoundary>)', desc: 'Primeiro render da árvore React. ErrorBoundary captura crashes de subárvores. App.jsx começa a montar Providers.', source: 'main.jsx linhas 12-15' },
      ]} />

      <H3 num="1.2.2">Por que ensureSdkLoaded é gating do primeiro render</H3>

      <P>Sem o gating, em rota admin o primeiro frame renderizaria com <B>mock client</B> ativo. Componentes como <C>{'<Layout>'}</C> chamam <C>base44.auth.me()</C> em <C>useQuery</C> imediatamente. Com mock, isso lançaria erro "Blocked SDK call: auth.me — cannot use on public route" — o que é correto para rota pública mas <B>fatal</B> em rota admin.</P>

      <CodeBlock language="js">{`// main.jsx — gating do primeiro render
ensureSdkLoaded().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  )
})`}</CodeBlock>

      <Note title="Sutil mas crítico" kind="warn">
        <C>finally()</C> (não <C>then()</C>) garante que mesmo se o SDK falhar no carregamento, o app ainda renderiza — o usuário verá tela de erro útil em vez de tela branca. Em rota pública o <C>realClient</C> é <C>null</C>, e o Proxy <C>base44</C> automaticamente cai no <C>mockClient</C> que bloqueia chamadas com mensagem clara.
      </Note>

      <H3 num="1.2.3">O Proxy base44 — por que existe</H3>
      <CodeBlock language="js">{`// api/base44Client.js linhas 144-149
export const base44 = new Proxy({}, {
  get(_t, prop) {
    const client = realClient || mockClient;
    return client[prop];
  },
});`}</CodeBlock>

      <P>Componentes podem importar <C>base44</C> em <B>top-level</B> sem se preocupar com timing — o Proxy resolve dinamicamente para o cliente real quando ele estiver disponível, ou para o mock se nunca estiver. Isso permite um padrão de import simples:</P>

      <CodeBlock language="jsx">{`import { base44 } from '@/api/base44Client';
// funciona dentro de qualquer hook/effect, sem precisar de await ensureSdkLoaded()`}</CodeBlock>

      <H4>Limites do mock</H4>
      <Table dense headers={['Acesso', 'Comportamento no mock']} rows={[
        ['base44.auth.me()', 'throw Error("Blocked SDK call: auth.me ...")'],
        ['base44.auth.isAuthenticated()', 'retorna Promise<false> imediatamente'],
        ['base44.auth.logout() / redirectToLogin()', 'noop silencioso'],
        ['base44.auth.updateMe()', 'throw'],
        ['base44.functions.invoke(name, payload)', 'throw'],
        ['base44.entities.X.list/filter/...', 'Proxy aninhado — qualquer chamada throwa'],
        ['base44.analytics.track/identify/page', 'noop silencioso (analytics é safe-by-default)'],
      ]} />

      <H3 num="1.2.4">ErrorBoundary — defesa final</H3>

      <P>Mesmo com todas as proteções, um erro inesperado pode escapar (componente novo com bug, lib quebrada após upgrade). <C>ErrorBoundary</C> em volta de <C>{'<App />'}</C> captura via <C>componentDidCatch</C> e mostra fallback branded (botão "Recarregar página") em vez de tela branca.</P>

      <Note title="O que fazer quando vir 'X is not a function' minificado em produção" kind="info">
        Provavelmente é um bundle cached do SDK em rota pública executando top-level e batendo no crash shield. Diagnóstico: abra DevTools, aba Network, force reload sem cache. O crash shield exibe os erros bloqueados em <C>console</C> com prefixo <C>[base44]</C>. Se vir errors NÃO bloqueados, o padrão minificado mudou — atualizar regex em <C>isSdkCrash()</C>.
      </Note>
    </>
  );
}