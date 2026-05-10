import React from 'react';
import { H2, H3, H4, P, B, C, Table, Note, CodeBlock } from '../../DocPrimitives';

/**
 * §1.5 Design System — index.css + globals.css + tailwind.config + Pagsmile brand overlay
 */
export default function Ch01_DesignSystem() {
  return (
    <>
      <H2 num="1.5">Design System — Tokens, Tailwind e Brand Overlay</H2>

      <P>O design system é uma <B>pirâmide de 3 camadas</B>: (1) tokens HSL em <C>index.css</C> (camada base shadcn/ui), (2) tema mapeado em <C>tailwind.config.js</C> (HSL → utility classes), (3) brand overlay PagSmile em <C>globals.css</C> que sobrescreve tudo via <C>!important</C> para garantir consistência visual.</P>

      <H3 num="1.5.1">Camada 1 — index.css (tokens HSL shadcn/ui base)</H3>

      <CodeBlock language="css">{`/* index.css — definição base shadcn/ui */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;             /* base shadcn — sobrescrito em globals.css */
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --destructive: 0 84.2% 60.2%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
    --chart-1..5: ...;
    --radius: 0.5rem;
    --sidebar-* : ...;             /* legado shadcn — não usado em prod */
  }
  .dark { ... }                    /* darkMode definido mas inativo */
}`}</CodeBlock>

      <Note title="darkMode coexiste mas é inativo" kind="info">
        <C>tailwind.config.js</C> tem <C>darkMode: ["class"]</C>. As variáveis <C>{'.dark { ... }'}</C> em <C>index.css</C> existem por completude. Em produção <B>nenhum elemento adiciona a classe "dark"</B> — então o tema escuro nunca dispara. Remover seria refactoring fora de escopo. Apenas a sidebar navegacional (#002443) é "escura" mas usa cores fixas, não variáveis dark.
      </Note>

      <H3 num="1.5.2">Camada 2 — tailwind.config.js (mapping HSL → utility)</H3>

      <CodeBlock language="js">{`// tailwind.config.js — extends.colors mapeia tokens
colors: {
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
  primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
  // ... destructive, secondary, muted, accent, border, input, ring
  chart: { '1': 'hsl(var(--chart-1))', /* ... */ '5': 'hsl(var(--chart-5))' },
  sidebar: { DEFAULT: 'hsl(var(--sidebar-background))', /* ... */ },
}`}</CodeBlock>

      <H4>Fontes mapeadas</H4>
      <CodeBlock language="js">{`fontFamily: {
  sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
  mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
},`}</CodeBlock>

      <H4>Animations</H4>
      <CodeBlock language="js">{`keyframes: {
  'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
  'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } }
},
animation: { 'accordion-down': 'accordion-down 0.2s ease-out', 'accordion-up': 'accordion-up 0.2s ease-out' }`}</CodeBlock>

      <H4>Safelist — classes dinâmicas</H4>

      <P>Tailwind purga classes não encontradas como literal no source code. Para classes geradas em runtime (de status badges, severidades, etc.), elas vão para o <C>safelist</C>:</P>

      <CodeBlock language="js">{`safelist: [
  'bg-indigo-50','text-indigo-600',  'bg-blue-50','text-blue-600',
  'bg-violet-50','text-violet-600',  'bg-cyan-50','text-cyan-600',
  'bg-red-50','text-red-600',        'bg-amber-50','text-amber-600',
  'bg-emerald-50','text-emerald-600','bg-orange-50','text-orange-600',
  'bg-slate-50','text-slate-600',    'bg-purple-50','text-purple-600',
  'bg-blue-50/30','border-blue-100', 'bg-amber-50/30','border-amber-100',
  'bg-orange-50/30','border-orange-100', 'bg-emerald-50/30','border-emerald-100',
  'bg-indigo-50/30','border-indigo-100', 'bg-violet-50/30','border-violet-100',
  'bg-rose-50','text-rose-600','bg-rose-100','border-rose-200',
  'bg-green-100','text-green-700','border-green-200',
],`}</CodeBlock>

      <Note title="Quando adicionar à safelist" kind="rule">
        Apenas para classes cujo NOME exato é montado em runtime via concatenação ou map dinâmico. Classes literais (mesmo dentro de objetos const) já são detectadas pelo scanner. Não adicione classes que você escreveu como literal — só infla o CSS.
      </Note>

      <H3 num="1.5.3">Camada 3 — globals.css (Brand Overlay PagSmile)</H3>

      <P>Esta camada é o "<B>truque</B>" do design — sobrescreve tokens shadcn neutros para forçar a paleta PagSmile em <B>todo</B> o app, incluindo componentes de bibliotecas externas (recharts, sonner, radix popover) que não respeitariam tokens nativamente.</P>

      <H4>Tokens PagSmile</H4>
      <Table dense headers={['Variável', 'Valor', 'Uso']} rows={[
        ['--pagsmile-blue', '#002443', 'Cor de texto principal + sidebar admin + headers'],
        ['--pagsmile-green', '#2bc196', 'Acento principal + botões primários + indicadores ativos'],
        ['--pagsmile-green-light', '#5cf7cf', 'Highlights + chips ativos'],
        ['--pagsmile-green-dark', '#36706c', 'Hover de verde escuro'],
        ['--pagsmile-blue-light', '#003366', 'Variação azul mais clara'],
        ['--pagsmile-gray', '#f4f4f4', 'Fundo padrão da área principal'],
        ['--pagsmile-text', '#282828', 'Texto secundário'],
      ]} />

      <H4>Sobrescrita global de cor de texto</H4>
      <CodeBlock language="css">{`/* globals.css — força azul Pagsmile como cor de texto padrão */
* { color: #002443; }

/* Exceções: textos brancos em fundos coloridos */
.bg-\\[\\#2bc196\\], .bg-\\[\\#2bc196\\] *,
.bg-\\[\\#002443\\], .bg-\\[\\#002443\\] *,
[data-state="checked"],
.bg-red-500, .bg-red-500 *,
.bg-green-500, .bg-green-500 * {
  color: #ffffff !important;
}

/* Remove qualquer cor preta/cinza residual de bibliotecas */
.text-black, .text-gray-900, .text-gray-800, .text-gray-700,
.text-gray-600, .text-gray-500, .text-gray-400,
.text-slate-900, .text-slate-800, .text-slate-700,
.text-slate-600, .text-slate-500, .text-slate-400 {
  color: #002443 !important;
}`}</CodeBlock>

      <H4>Sobrescrita de fundos slate/gray</H4>
      <CodeBlock language="css">{`.bg-slate-50, .bg-slate-100, .bg-gray-50, .bg-gray-100 {
  background-color: #f4f4f4 !important;
}

.border-slate-200, .border-slate-100, .border-gray-200, .border-gray-100 {
  border-color: rgba(0, 36, 67, 0.08) !important;
}

.hover\\:bg-slate-50:hover, .hover\\:bg-gray-50:hover {
  background-color: rgba(43, 193, 150, 0.05) !important;
}`}</CodeBlock>

      <H4>Sobrescrita de bibliotecas externas</H4>
      <CodeBlock language="css">{`/* Recharts — labels e legendas em azul PagSmile */
.recharts-text                       { fill: #002443 !important; }
.recharts-cartesian-axis-tick-value  { fill: #002443 !important; }
.recharts-legend-item-text           { color: #002443 !important; }
.recharts-tooltip-label,
.recharts-tooltip-item               { color: #002443 !important; }

/* Sonner toasts */
[data-sonner-toast]                  { background-color: #ffffff !important; color: #002443 !important; border-color: #e2e8f0 !important; }

/* Radix popover/dropdown — força cor padrão dentro de portal */
[data-radix-popper-content-wrapper] *                     { color: #002443; }
[data-radix-popper-content-wrapper] [data-state="checked"] { color: #ffffff !important; }`}</CodeBlock>

      <H3 num="1.5.4">Sidebar — design escuro fixo</H3>

      <P>A sidebar admin (<C>layout.jsx</C>) usa cores HARDCODED <B>#002443</B> como fundo, com texto branco e acentos em <B>#2bc196</B> e <B>#5cf7cf</B>. Não usa tokens — propositalmente, para garantir contraste alto sem depender de variáveis. Scrollbar customizada também é hardcode:</P>

      <CodeBlock language="css">{`/* globals.css */
.sidebar-nav::-webkit-scrollbar              { width: 4px; }
.sidebar-nav::-webkit-scrollbar-track        { background: transparent; }
.sidebar-nav::-webkit-scrollbar-thumb        { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
.sidebar-nav::-webkit-scrollbar-thumb:hover  { background: rgba(255, 255, 255, 0.2); }`}</CodeBlock>

      <H3 num="1.5.5">Tipografia</H3>
      <Table dense headers={['Família', 'Quando usar', 'Como aplicar']} rows={[
        ['Inter', 'TODOS os textos de UI (default no body)', 'Automático — body usa font-family Inter herdado'],
        ['JetBrains Mono', 'Códigos, IDs, monospaces técnicos, badges de role', 'class="font-mono" OU dentro de <code>, <pre>, <kbd>, <samp>'],
      ]} />

      <P>Ambas as famílias são <B>preconnect + preload</B> em <C>index.html</C> para evitar FOUT (Flash of Unstyled Text). Pesos disponíveis: Inter 300-900, JetBrains Mono 400-700.</P>

      <H3 num="1.5.6">Pirâmide de prioridade quando há conflito</H3>
      <Table headers={['Nível', 'Origem', 'Ganha contra']} rows={[
        ['1 (mais forte)', 'globals.css com !important', 'Tudo, exceto inline style com !important'],
        ['2', 'tailwind utility class (bg-primary, text-foreground)', 'Estilos sem !important'],
        ['3', 'index.css :root tokens', 'Apenas quando tailwind utility referencia o token'],
        ['4 (mais fraca)', 'Browser defaults', 'Nada'],
      ]} />

      <P>Na prática isso significa: quando você adiciona <C>className="text-blue-500"</C> em algum lugar, a regra <C>{'* { color: #002443 }'}</C> de globals.css <B>sem !important</B> é vencida pela utility class — então blues específicos do Tailwind funcionam. Mas <C>className="text-gray-500"</C> é sobrescrito porque a regra que mata cinzas USA <C>!important</C>.</P>

      <Note title="Por que essa arquitetura existe" kind="info">
        Histórico: o projeto começou com shadcn/ui puro (cinzas). Conforme o branding PagSmile foi sendo aplicado, ficou claro que tokens eram insuficientes — bibliotecas externas (recharts, sonner) ignoram tokens e usam cores fixas. A camada 3 (<C>globals.css</C> com !important) resolveu isso de forma centralizada. Mover para tokens nativos exigiria fork das bibliotecas — fora de escopo.
      </Note>
    </>
  );
}