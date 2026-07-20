import React from 'react';
import { Shield, ExternalLink, AlertCircle, MessageCircle, CheckCircle2 } from 'lucide-react';

/**
 * CafFallbackLinkCard — Cartão padronizado e reutilizável para o link CAF externo (cadastro.io).
 *
 * O link CAF é a "via de fuga" quando a integração tem problema. Aparece em 3 momentos do fluxo:
 *  - variant="ready"  → ANTES de iniciar a verificação (opção alternativa em destaque)
 *  - variant="error"  → quando dá erro no SDK (alternativa imediata, com aviso reforçado)
 *  - variant="done"   → APÓS concluir (lembrete: "se você fez pelo CAF, manda o print")
 *
 * SEMPRE inclui a instrução: "envie o print da tela final do CAF para o comercial / grupo
 * do WhatsApp" — garante a conciliação manual caso o webhook não chegue.
 */
export default function CafFallbackLinkCard({
  variant = 'ready',     // 'ready' | 'error' | 'done'
  cafFallbackUrl,
  onCafFallbackClick,
}) {
  if (!cafFallbackUrl) return null;

  const titles = {
    ready: 'Prefere fazer direto pelo portal oficial da CAF?',
    error: 'Alternativa: concluir pelo onboarding oficial CAF',
    done:  'Concluiu a verificação pelo link da CAF? Importante!',
  };
  const subtitles = {
    ready: 'Se preferir, você pode pular o passo aqui e fazer a verificação direto no portal seguro da CAF. É a mesma verificação — só muda a tela.',
    error: 'Você será direcionado ao portal seguro da CAF para completar a verificação.',
    done:  'Se você usou o link externo da CAF (em vez do passo aqui), confirme o envio do print para garantir a conciliação do seu cadastro.',
  };

  const Icon = variant === 'done' ? CheckCircle2 : Shield;
  const iconBg = variant === 'done' ? 'bg-[#1356E2]' : 'bg-[#0A0A0A]';

  return (
    <div className="rounded-xl border-2 border-[#0A0A0A] bg-gradient-to-br from-[#0A0A0A]/5 to-[#1356E2]/5 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#0A0A0A]">{titles[variant]}</p>
          <p className="text-xs text-[#0A0A0A]/70 mt-1 leading-relaxed">
            {subtitles[variant]}
            {variant === 'error' && (
              <>
                {' '}
                <strong className="text-[#0A0A0A]">Use o mesmo CPF e CNPJ do seu cadastro</strong> — o resultado volta automaticamente para nós.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Aviso reforçado para variant=error: compliance só aprova após concluir 100% */}
      {variant === 'error' && (
        <div className="rounded-lg bg-amber-50 border border-amber-300 px-3 py-2.5 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-900 leading-relaxed">
            <strong>Atenção:</strong> seu compliance só será aprovado após você concluir
            <strong> completamente </strong> a prova de vida + facematch pelo link abaixo.
            Não feche a janela antes de terminar.
          </p>
        </div>
      )}

      {/* Instrução do print — em TODAS as variantes (essencial para conciliação manual) */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5 flex items-start gap-2">
        <MessageCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-900 leading-relaxed">
          <strong>Importante:</strong> se você fizer pelo link da CAF, <strong>envie o print da tela final
          de sucesso</strong> para o seu contato comercial (ou para o grupo do WhatsApp). Isso garante que
          conseguiremos vincular sua verificação ao seu cadastro mesmo se houver falha técnica na
          conciliação automática.
        </p>
      </div>

      {/* Botão (somente para ready/error — em "done" o cliente JÁ fez, é só lembrete) */}
      {variant !== 'done' && (
        <a
          href={cafFallbackUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => { try { onCafFallbackClick?.(); } catch {} }}
          className="inline-flex items-center justify-center w-full h-12 rounded-xl bg-[#0A0A0A] hover:bg-[#0A0A0A]/90 text-white font-semibold text-sm transition-all px-4 shadow-lg shadow-[#0A0A0A]/20"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          {variant === 'ready' ? 'Fazer pelo portal oficial da CAF' : 'Abrir onboarding oficial CAF'}
        </a>
      )}
    </div>
  );
}