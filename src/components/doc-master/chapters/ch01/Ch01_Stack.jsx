import React from 'react';
import { H2, H3, P, B, C, Table, Note, CodeBlock } from '../../DocPrimitives';

/**
 * §1.1 Stack tecnológico real — apenas o que está instalado.
 */
export default function Ch01_Stack() {
  return (
    <>
      <H2 num="1.1">Stack Tecnológico Real (lido de package.json)</H2>

      <P>A aplicação roda em um único projeto monorepo: <B>frontend Vite + React 18</B> servido como SPA, e <B>backend Deno Deploy</B> (Base44 platform) onde cada arquivo em <C>functions/*.js</C> é um handler HTTP isolado. O acoplamento entre os dois é via <C>@base44/sdk</C>.</P>

      <H3 num="1.1.1">Frontend — runtime e build</H3>
      <Table headers={['Pacote', 'Versão', 'Papel exato']} rows={[
        ['react / react-dom', '^18.2.0', 'Renderer. Concurrent features (useTransition, useDeferredValue) NÃO são usadas — código clássico class-state-effect.'],
        ['vite + @base44/vite-plugin', 'vite via Base44, plugin ^1.0.13', 'Build/dev server. O plugin Base44 injeta variáveis de ambiente com IDs do app, base path e config de funções.'],
        ['react-router-dom', '^6.26.0', 'Roteamento client-side. <BrowserRouter> em App.jsx + <Routes>/<Route>. Sem code-splitting por rota — todas as páginas no bundle principal exceto as marcadas explicitamente.'],
        ['@tanstack/react-query', '^5.84.1', 'Cache + revalidação de queries. Usado em todo dashboard admin para sincronizar listas de cases, leads, propostas. queryKey por tela.'],
        ['react-hook-form + zod', '^7.54.2 + ^3.24.2', 'Formulários complexos (Editor de Contrato, Editor de Perfil, Editor de Questionário). Validação Zod via @hookform/resolvers.'],
      ]} />

      <H3 num="1.1.2">Frontend — UI</H3>
      <Table headers={['Pacote', 'Versão', 'Uso']} rows={[
        ['tailwindcss + tailwindcss-animate', '— + ^1.0.7', 'CSS utility-first. Tokens via CSS variables (ver §1.5). darkMode: ["class"] mas o app NÃO usa dark mode em produção — variáveis dark estão definidas mas inativas.'],
        ['@radix-ui/* (~30 pacotes)', 'várias 1.x/2.x', 'Componentes não-estilizados de acessibilidade. Encapsulados em components/ui/* (shadcn pattern). NUNCA importar de @radix-ui/* direto em pages — sempre via components/ui/*.'],
        ['class-variance-authority + clsx + tailwind-merge', '^0.7.1 / ^2.1.1 / ^3.0.2', 'Composição de classes Tailwind por variante. cn() helper em lib/utils.js.'],
        ['lucide-react', '^0.475.0', 'Ícones. ÚNICA biblioteca de ícones. Limitação: usar apenas ícones que existem (caso contrário, build falha).'],
        ['framer-motion', '^11.16.4', 'Animações declarativas. Usada em painéis com expand/collapse e modais.'],
        ['recharts', '^2.15.4', 'Gráficos (DashboardCEO, DashboardComercial, DadosInsights, ScoreDistributionChart).'],
        ['sonner + react-hot-toast + @radix-ui/react-toast', 'várias', 'Três bibliotecas de toast coexistem por motivos históricos. <Toaster /> de sonner é o oficial em App.jsx.'],
      ]} />

      <H3 num="1.1.3">Frontend — utilitários e domínio</H3>
      <Table headers={['Pacote', 'Versão', 'Uso']} rows={[
        ['date-fns + moment', '^3.6.0 + ^2.30.1', 'Datas. date-fns é preferido; moment ainda existe em código legado de propostas.'],
        ['lodash', '^4.17.21', 'Helpers (debounce, get, cloneDeep). Importes específicos para reduzir bundle.'],
        ['react-markdown', '^9.0.1', 'Renderização de markdown em SENTINEL output, ContratoPublico, KickOffPublico.'],
        ['react-quill + react-day-picker + react-leaflet + react-resizable-panels + @hello-pangea/dnd + embla-carousel-react + cmdk + vaul + input-otp + next-themes', '—', 'Conjunto de UIs especializadas — editores rich-text, calendar, mapas, drag&drop kanban, carrossel, command palette, drawer mobile, OTP input. Cada uma usada em UMA tela específica.'],
        ['html2canvas + jspdf + jszip + xlsx + xlsx-js-style + docx + file-saver', '—', 'Pipeline de exports (PDF de propostas/contratos, XLSX de cadastros, DOCX de contratos editáveis). PDF: html2canvas + jspdf com smart paging via [data-pdf-block]. DOCX: lib docx em modo paragraph/table.'],
        ['three', '^0.171.0', 'Disponível mas atualmente não usado em produção (legado de protótipo).'],
        ['@stripe/react-stripe-js + @stripe/stripe-js', '^3 + ^5', 'Stripe disponível mas não ativo no fluxo principal (pagamentos Pin Bank usam outra rail).'],
        ['canvas-confetti', '^1.9.4', 'Confetti em momentos de sucesso (KickOff, OnboardingCompletion).'],
      ]} />

      <H3 num="1.1.4">Backend — runtime e SDK</H3>
      <Table headers={['Componente', 'Versão / fonte', 'Papel']} rows={[
        ['Deno Deploy', 'gerenciado por Base44', 'Runtime serverless de cada função. Deno.serve(async (req) => Response).'],
        ['@base44/sdk', 'npm:@base44/sdk@0.8.25 (backend) / ^0.8.27 (frontend)', 'SDK que dá acesso a entities, auth, integrations, asServiceRole. createClientFromRequest(req) é o ponto de entrada padrão.'],
        ['Web Crypto API (crypto.subtle)', 'nativa Deno', 'Hashing SHA-256, HMAC para JWTs e webhooks CAF, AES para PIN. ⚠ ASYNC — nada de operações síncronas tipo Node.'],
        ['fetch nativo', 'nativa', 'Todas as chamadas externas (BDC, CAF, BrasilAPI, Slack) usam fetch. Sem axios no backend.'],
      ]} />

      <H3 num="1.1.5">Integrações externas (build-in vs custom)</H3>
      <Table headers={['Integração', 'Tipo', 'Observação']} rows={[
        ['Core (InvokeLLM, SendEmail, GenerateImage, UploadFile, UploadPrivateFile, ExtractDataFromUploadedFile, CreateFileSignedUrl)', 'Built-in Base44', 'Acessadas via base44.integrations.Core.*. NUNCA chamar APIs OpenAI/Gemini diretamente — sempre via InvokeLLM.'],
        ['Slack (slackbot connector)', 'OAuth shared', 'Scopes autorizados: chat:write, chat:write.public, channels:read, chat:write.customize. Usado por todos os notify*.js.'],
        ['BigDataCorp (BDC)', 'Custom (token-based)', 'Headers AccessToken + TokenId. Endpoints /empresas e /pessoas. Documentado no Cap. 5.'],
        ['CAF (3 caminhos)', 'Custom', 'Caminho 1: SDK web (JWT via cafGenerateToken). Caminho 2: Core API (Bearer CAF_CORE_API_TOKEN). Caminho 3: Connect (OAuth Client Credentials). Documentado no Cap. 6.'],
        ['BrasilAPI', 'Custom (público)', 'CNPJ enrichment, CEP autocomplete. Sem auth.'],
      ]} />

      <Note title="Por que evitar 'just install another lib'" kind="warn">
        Cada dependência é uma superfície de ataque LGPD adicional, um upgrade obrigatório e um peso no bundle. <B>Antes de instalar qualquer pacote novo</B>, verifique se a função pode ser feita com fetch + Web Crypto + a stack acima. Em particular: nada de <C>node-fetch</C> (use fetch nativo), nada de <C>jsonwebtoken</C> (use crypto.subtle HMAC manual), nada de <C>bcrypt</C> (use SHA-256 + salt). O backend Deno NÃO suporta dependências Node-only.
      </Note>

      <CodeBlock language="js">{`// Exemplo do padrão correto de HMAC SHA-256 no backend (sem libs)
async function hmacSha256Hex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sigBuf))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}`}</CodeBlock>
    </>
  );
}