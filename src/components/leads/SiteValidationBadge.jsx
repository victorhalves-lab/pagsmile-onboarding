import React, { useState, useEffect } from 'react';
// SDK-FREE for public routes.
import { callPublicFunction } from '@/lib/publicApi';
import { CheckCircle, AlertTriangle, Globe, Loader2, Lock, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * Valida o site do lead em background (HTTP, SSL, plataforma e-commerce).
 * Resultados são informativos, NÃO bloqueiam.
 * Os dados de enriquecimento são salvos no formData._siteValidation.
 */
export default function SiteValidationBadge({ siteUrl, updateField }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUrl, setLastUrl] = useState('');

  useEffect(() => {
    if (!siteUrl || siteUrl.length < 5 || siteUrl === lastUrl) return;
    
    const timeout = setTimeout(async () => {
      setLoading(true);
      setLastUrl(siteUrl);
      try {
        const body = await callPublicFunction('validateLeadFields', {
          type: 'site',
          value: siteUrl,
        });
        const payload = body?.data ?? body;
        setResult(payload);
        if (updateField) {
          updateField('_siteValidation', payload);
        }
      } catch (e) {
        console.warn('Site validation failed:', e?.message);
      }
      setLoading(false);
    }, 1500); // Debounce 1.5s

    return () => clearTimeout(timeout);
  }, [siteUrl]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-[#0A0A0A]/50 mt-1">
        <Loader2 className="w-3 h-3 animate-spin" /> Verificando site...
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-1.5">
      {result.is_online !== null && (
        <Badge variant="outline" className={`text-[10px] gap-1 ${result.is_online ? 'border-emerald-300 text-emerald-700' : 'border-amber-300 text-amber-700'}`}>
          <Globe className="w-3 h-3" />
          {result.is_online ? 'Online' : 'Offline/Indisponível'}
        </Badge>
      )}
      {result.has_ssl !== null && (
        <Badge variant="outline" className={`text-[10px] gap-1 ${result.has_ssl ? 'border-emerald-300 text-emerald-700' : 'border-red-300 text-red-700'}`}>
          <Lock className="w-3 h-3" />
          {result.has_ssl ? 'SSL Ativo' : 'Sem SSL'}
        </Badge>
      )}
      {result.ecommerce_platform && (
        <Badge variant="outline" className="text-[10px] gap-1 border-blue-300 text-blue-700">
          <ShoppingCart className="w-3 h-3" />
          {result.ecommerce_platform}
        </Badge>
      )}
      {result.is_registered === false && result.domain?.endsWith('.br') && (
        <Badge variant="outline" className="text-[10px] gap-1 border-red-300 text-red-700">
          <AlertTriangle className="w-3 h-3" />
          Domínio .br não registrado
        </Badge>
      )}
    </div>
  );
}