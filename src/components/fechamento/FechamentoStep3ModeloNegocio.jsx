import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, Briefcase, Loader2 } from 'lucide-react';

export default function FechamentoStep3ModeloNegocio({ formData, setFormData, segmentName, prevStep, onSubmit, isSubmitting }) {
  const update = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  const isGatewayOrPlatform = segmentName && ['Gateway', 'Plataformas Verticais'].includes(segmentName);
  const isDropshipping = segmentName === 'Dropshipping';
  
  const canSubmit = formData.modeloNegocio;

  return (
    <div className="space-y-8">
       <div>
        <div className="flex items-center gap-3 mb-2">
          <Briefcase className="w-5 h-5 text-[#0A0A0A]/50" />
          <h3 className="text-lg font-semibold text-[#0A0A0A]">Seu Modelo de Negócio</h3>
        </div>
        <p className="text-sm text-[#0A0A0A]/70">Esta é a parte mais importante. Descreva com clareza para uma análise precisa.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="modeloNegocio" className="text-sm font-semibold text-[#0A0A0A]">
          Como funciona seu modelo de negócio? <span className="text-red-500">*</span>
        </Label>
        <p className="text-xs text-[#0A0A0A]/60 mb-2">
          Detalhe o que é vendido/comercializado para seus clientes através da sua plataforma ou solução (produtos e/ou serviços).
        </p>
        <Textarea
          id="modeloNegocio"
          value={formData.modeloNegocio || ''}
          onChange={e => update('modeloNegocio', e.target.value)}
          placeholder="Ex: Somos um SaaS que vende assinaturas para academias, permitindo que elas gerenciem alunos e pagamentos..."
          className="rounded-xl min-h-[120px] text-sm"
        />
      </div>

      {isGatewayOrPlatform && (
        <div className="space-y-2">
          <Label htmlFor="sellersDescription" className="text-sm font-semibold text-[#0A0A0A]">
            O que seus sellers/clientes vendem?
          </Label>
           <p className="text-xs text-[#0A0A0A]/60 mb-2">
            Descreva os produtos ou serviços que os usuários da sua plataforma comercializam.
          </p>
          <Textarea
            id="sellersDescription"
            value={formData.sellersDescription || ''}
            onChange={e => update('sellersDescription', e.target.value)}
            placeholder="Ex: Nossos clientes são restaurantes que vendem comida por delivery, lojas de roupa, etc."
            className="rounded-xl"
          />
        </div>
      )}

      {isDropshipping && (
        <div className="space-y-2">
          <Label htmlFor="fornecedores" className="text-sm font-semibold text-[#0A0A0A]">
            Quais são seus principais fornecedores?
          </Label>
           <p className="text-xs text-[#0A0A0A]/60 mb-2">
            Informe os nomes dos fornecedores.
          </p>
          <Textarea
            id="fornecedores"
            value={formData.fornecedores || ''}
            onChange={e => update('fornecedores', e.target.value)}
            placeholder="Ex: Fornecedor A, Fornecedor B, Fornecedor C..."
            className="rounded-xl"
          />
        </div>
      )}

      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={prevStep} className="gap-2"><ArrowLeft /> Voltar</Button>
        <Button
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          className="w-auto h-12 bg-[#1356E2] hover:bg-[#1356E2]/90 text-white rounded-xl text-base font-bold shadow-lg shadow-[#1356E2]/20 hover:scale-[1.01] transition-all gap-2 px-6"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
          {isSubmitting ? 'Processando...' : 'Avançar para Compliance'}
        </Button>
      </div>
       {!canSubmit && !isSubmitting && (
        <p className="text-xs text-center text-[#0A0A0A]/40">Descreva seu modelo de negócio para continuar.</p>
      )}
    </div>
  );
}