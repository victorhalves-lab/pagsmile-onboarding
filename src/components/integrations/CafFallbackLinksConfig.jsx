import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Save, RotateCcw, Loader2, Link2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { CAF_ONBOARDING_LINKS_BY_COMPLIANCE_V4 } from '@/lib/cafOnboardingLinks';

/**
 * CafFallbackLinksConfig — Editor admin dos links CAF cadastro.io por modelo.
 *
 * Lê defaults de lib/cafOnboardingLinks + overrides em ComplianceConfig.
 * Permite editar e resetar cada link individualmente.
 */

const MODEL_LABELS = {
  ComplianceGatewayV4:            'Gateway',
  ComplianceDropshippingV4:       'Dropshipping',
  ComplianceEcommerceV4:          'E-commerce',
  ComplianceEducacaoV4:           'Educação',
  ComplianceInfoprodutosV4:       'Infoprodutos',
  ComplianceMerchantLinkV4:       'Merchant / Link de Pagamento',
  ComplianceMPEV4:                'MPE',
  CompliancePlataformaVerticalV4: 'Plataforma Vertical',
  ComplianceSaaSV4:               'SaaS',
  ComplianceMarketplaceV4:        'Marketplace',
  CompliancePixMerchantV4:        'PIX Merchant',
  CompliancePixIntermediarioV4:   'PIX Intermediário',
};

export default function CafFallbackLinksConfig() {
  const queryClient = useQueryClient();
  const [editedValues, setEditedValues] = useState({});
  const [savingModel, setSavingModel] = useState(null);

  const { data: fetchResult, isLoading } = useQuery({
    queryKey: ['cafFallbackLinks'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getCafFallbackLinks', {});
      return res.data;
    },
  });

  const currentLinks = fetchResult?.links || CAF_ONBOARDING_LINKS_BY_COMPLIANCE_V4;
  const overriddenModels = new Set(fetchResult?.overriddenModels || []);

  const handleChange = (model, value) => {
    setEditedValues(prev => ({ ...prev, [model]: value }));
  };

  const handleSave = async (model) => {
    const newValue = editedValues[model];
    if (newValue === undefined) return;
    setSavingModel(model);
    try {
      const res = await base44.functions.invoke('updateCafFallbackLink', {
        complianceModel: model,
        url: newValue,
      });
      if (res.data?.success) {
        toast.success(`Link ${MODEL_LABELS[model] || model} atualizado!`);
        setEditedValues(prev => { const n = { ...prev }; delete n[model]; return n; });
        queryClient.invalidateQueries({ queryKey: ['cafFallbackLinks'] });
      } else {
        toast.error(res.data?.error || 'Erro ao salvar');
      }
    } catch (err) {
      toast.error('Erro ao salvar: ' + err.message);
    } finally {
      setSavingModel(null);
    }
  };

  const handleReset = async (model) => {
    if (!confirm(`Resetar o link ${MODEL_LABELS[model] || model} ao valor padrão?`)) return;
    setSavingModel(model);
    try {
      const res = await base44.functions.invoke('updateCafFallbackLink', {
        complianceModel: model,
        url: '',
      });
      if (res.data?.success) {
        toast.success('Link resetado ao padrão');
        setEditedValues(prev => { const n = { ...prev }; delete n[model]; return n; });
        queryClient.invalidateQueries({ queryKey: ['cafFallbackLinks'] });
      }
    } catch (err) {
      toast.error('Erro: ' + err.message);
    } finally {
      setSavingModel(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#2bc196]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Explainer */}
      <div className="bg-[#002443]/5 border border-[#002443]/10 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#002443] flex items-center justify-center shrink-0">
          <Link2 className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 text-xs text-[#002443]/80 leading-relaxed">
          <p className="font-bold text-[#002443] mb-1">Links de Fallback CAF (cadastro.io) por Segmento</p>
          <p>
            Quando o cliente <strong>falha 2x</strong> no Liveness/FaceMatch via SDK embarcado, oferecemos o link
            do segmento dele como alternativa. Cada link é um <em>Query Template</em> configurado no Trust Platform da CAF.
            <strong> Abandonos/desistências não contam</strong> como falha — só reprovas técnicas reais.
          </p>
          <p className="mt-1.5 text-[#002443]/60">
            O webhook desses templates deve apontar para <code className="bg-white px-1 py-0.5 rounded text-[#36706c]">cafWebhookHandler</code> — já configurado.
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-800">
          Ao alterar um link, certifique-se de que o novo template na CAF está com <strong>externalId</strong> mapeado
          e webhook configurado. Links inválidos quebram o fallback para clientes daquele segmento.
        </p>
      </div>

      {/* Lista de modelos */}
      <div className="bg-white rounded-2xl border border-[#002443]/5 divide-y divide-[#002443]/5">
        {Object.keys(MODEL_LABELS).map(model => {
          const currentUrl = currentLinks[model] || '';
          const editedUrl = editedValues[model];
          const displayUrl = editedUrl !== undefined ? editedUrl : currentUrl;
          const hasChanges = editedUrl !== undefined && editedUrl !== currentUrl;
          const isOverridden = overriddenModels.has(model);
          const isSaving = savingModel === model;

          return (
            <div key={model} className="p-4 flex flex-col md:flex-row md:items-center gap-3">
              <div className="md:w-56 shrink-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-[#002443]">{MODEL_LABELS[model]}</p>
                  {isOverridden && (
                    <Badge className="bg-[#2bc196]/10 text-[#2bc196] text-[9px] border-0 px-1.5 py-0">
                      Customizado
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] text-[#002443]/40 font-mono mt-0.5">{model}</p>
              </div>

              <div className="flex-1 flex items-center gap-2 min-w-0">
                <Input
                  value={displayUrl}
                  onChange={(e) => handleChange(model, e.target.value)}
                  placeholder="https://cadastro.io/..."
                  className={`font-mono text-xs ${hasChanges ? 'border-[#2bc196] ring-1 ring-[#2bc196]/30' : 'border-[#002443]/10'}`}
                />
                <a
                  href={currentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-2 rounded-lg hover:bg-[#002443]/5"
                  title="Abrir link atual"
                >
                  <ExternalLink className="w-4 h-4 text-[#002443]/40" />
                </a>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => handleSave(model)}
                  disabled={!hasChanges || isSaving}
                  className="h-9 rounded-lg bg-[#2bc196] hover:bg-[#2bc196]/90 text-white disabled:opacity-40"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span className="ml-1.5 text-xs">Salvar</span>
                </Button>
                {isOverridden && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReset(model)}
                    disabled={isSaving}
                    className="h-9 rounded-lg border-[#002443]/15 text-[#002443]/70 hover:bg-[#002443]/5"
                    title="Resetar ao valor padrão"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}