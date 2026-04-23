/**
 * Hook robusto para carregar propostas públicas (Proposal, PixProposal, StandardProposal).
 *
 * Resolve o bug "proposta não encontrada" em dois gargalos:
 * 1. Falhas transitórias de rede (timeout, 502, 503) → retry agressivo (5× com backoff).
 * 2. Token inválido mas slug na URL funcionando → fallback automático por slug.
 *
 * Distingue claramente:
 *   - status === 'loading'  → está carregando (mostrar skeleton)
 *   - status === 'error'    → deu erro de rede (mostrar tela de retry, NUNCA "não encontrada")
 *   - status === 'notfound' → realmente não existe (mostrar "não encontrada")
 *   - status === 'ok'       → proposta carregada
 */
import { useQuery } from '@tanstack/react-query';
// SDK-FREE: these pages are PUBLIC and the app is private on Base44.
// Using the @base44/sdk on anonymous sessions crashes the page with a 401 envelope
// (or a MessagePort instanceof TypeError on some browsers) before React renders.
// callPublicFunction hits /functions/* directly via fetch with credentials:'omit'.
import { callPublicFunction } from '@/lib/publicApi';

const KIND_BY_TYPE = {
  proposal: 'proposal_by_token',
  pix_proposal: 'pix_proposal_by_token',
  standard_proposal: 'standard_proposal_by_token',
};

const SLUG_ENTITY_BY_TYPE = {
  proposal: 'proposal',
  pix_proposal: 'pixProposal',
  standard_proposal: 'standardProposal',
};

/**
 * Extrai slug da URL atual (se estiver em /p/:slug, /pix/:slug, /pp/:slug).
 */
function extractSlugFromUrl() {
  if (typeof window === 'undefined') return null;
  const m = window.location.pathname.match(/^\/(?:p|pix|pp)\/([^/?#]+)/i);
  return m ? m[1] : null;
}

/**
 * Faz uma chamada ao publicReadContext com timeout próprio + retry.
 */
async function fetchProposalByToken(type, token) {
  const kind = KIND_BY_TYPE[type];
  const res = await callPublicFunction('publicReadContext', { kind, token });
  if (res?.error) throw new Error(res.error);
  return res?.proposal || null;
}

/**
 * Fallback: resolve slug → token → proposta.
 * Usado quando o token da URL está inválido/antigo mas o slug ainda aponta para algo.
 */
async function fetchProposalBySlug(type, slug) {
  const entityType = SLUG_ENTITY_BY_TYPE[type];
  const res = await callPublicFunction('publicReadContext', {
    kind: 'resolve_public_slug',
    entityType,
    slug,
  });
  const redirectTo = res?.redirectTo;
  if (!redirectTo) return null;
  // redirectTo é "/PropostaPublica?token=XYZ" — extrair o token
  const url = new URL(redirectTo, window.location.origin);
  const newToken = url.searchParams.get('token');
  if (!newToken) return null;
  return await fetchProposalByToken(type, newToken);
}

export function usePublicProposalQuery(type, token) {
  const query = useQuery({
    queryKey: ['public_proposal', type, token],
    queryFn: async () => {
      if (!token) {
        // Sem token — tenta slug da URL
        const slug = extractSlugFromUrl();
        if (slug) {
          const p = await fetchProposalBySlug(type, slug);
          return { proposal: p, source: 'slug_no_token' };
        }
        return { proposal: null, source: 'empty' };
      }

      // 1ª tentativa: buscar por token
      try {
        const p = await fetchProposalByToken(type, token);
        if (p) return { proposal: p, source: 'token' };
      } catch (e) {
        // erro de rede — deixa o react-query fazer retry
        throw e;
      }

      // Token não encontrou → fallback por slug (se disponível na URL)
      const slug = extractSlugFromUrl();
      if (slug) {
        try {
          const p = await fetchProposalBySlug(type, slug);
          if (p) return { proposal: p, source: 'slug_fallback' };
        } catch (_) { /* ignora e retorna null */ }
      }

      return { proposal: null, source: 'notfound' };
    },
    enabled: true, // sempre roda — mesmo sem token pode resolver por slug
    retry: 4, // 4 retries (total 5 tentativas) para erros de rede
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 8000),
    staleTime: 30_000,
  });

  // Distingue estados claramente
  let status;
  if (query.isLoading) status = 'loading';
  else if (query.isError) status = 'error'; // erro de rede após todos os retries
  else if (!query.data?.proposal) status = 'notfound';
  else status = 'ok';

  return {
    status,
    proposal: query.data?.proposal || null,
    source: query.data?.source,
    error: query.error,
    refetch: query.refetch,
  };
}