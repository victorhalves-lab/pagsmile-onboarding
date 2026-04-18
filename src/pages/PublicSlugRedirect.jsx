import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, AlertTriangle } from 'lucide-react';

/**
 * Resolves a public slug (/p/:slug, /pp/:slug, /pix/:slug, /c/:slug)
 * and redirects to the legacy public page with the token/code in query params.
 *
 * This is intentionally transparent: once the legacy page loads, it canonicalizes
 * the URL back to the slug-based one (see canonicalizeSlugUrl).
 */
export default function PublicSlugRedirect({ type }) {
  const { slug } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['publicSlugResolve', type, slug],
    queryFn: async () => {
      const res = await base44.functions.invoke('publicReadContext', {
        kind: 'resolve_public_slug',
        entityType: type,
        slug,
      });
      return res.data || {};
    },
    enabled: !!slug && !!type,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" />
      </div>
    );
  }

  const target = data?.redirectTo;
  if (!target) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center px-4">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-[#002443] mb-2">Link não encontrado</h2>
        <p className="text-[#002443]/70">Este link não existe ou foi removido.</p>
      </div>
    );
  }

  return <Navigate to={target} replace />;
}