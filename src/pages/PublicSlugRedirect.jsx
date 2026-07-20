import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { callPublicFunction } from '@/lib/publicApi';
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
      // SDK-free: this route is PUBLIC. Using base44.functions.invoke fails with 401
      // because the SDK requires auth on a private app. callPublicFunction bypasses
      // the SDK entirely and hits /functions/publicReadContext directly.
      const res = await callPublicFunction('publicReadContext', {
        kind: 'resolve_public_slug',
        entityType: type,
        slug,
      });
      return res || {};
    },
    enabled: !!slug && !!type,
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#1356E2]" />
      </div>
    );
  }

  const target = data?.redirectTo;
  if (!target) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center px-4">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-[#0A0A0A] mb-2">Link não encontrado</h2>
        <p className="text-[#0A0A0A]/70">Este link não existe ou foi removido.</p>
      </div>
    );
  }

  return <Navigate to={target} replace />;
}