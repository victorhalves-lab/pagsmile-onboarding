import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link2, Copy, Check, ExternalLink, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function PropostaRevisaoLink({ proposta, publicLink }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!publicLink) return;
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    toast.success('Link copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 3000);
  };

  if (proposta.status === 'rascunho') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0A0A0A]">Link não disponível</h2>
            <p className="text-sm text-[#0A0A0A]/60">Esta proposta ainda é um rascunho. Gere a proposta para obter o link de envio ao cliente.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!publicLink) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <p className="text-sm text-red-600">Erro: Esta proposta não tem um token público. Edite e gere novamente.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#1356E2]/30 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#1356E2]/10 flex items-center justify-center">
          <Link2 className="w-5 h-5 text-[#1356E2]" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#0A0A0A]">Link para o Cliente</h2>
          <p className="text-sm text-[#0A0A0A]/60">Copie e envie este link para o cliente visualizar e responder a proposta.</p>
        </div>
      </div>

      {/* Link display */}
      <div className="flex items-center gap-2 bg-[#f4f4f4] rounded-xl p-3 mb-4">
        <code className="flex-1 text-sm text-[#0A0A0A]/70 truncate select-all font-mono">
          {publicLink}
        </code>
        <Button
          onClick={handleCopy}
          size="sm"
          className={`gap-2 rounded-lg shrink-0 ${
            copied
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-[#1356E2] hover:bg-[#1356E2]/90 text-white'
          }`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copiado!' : 'Copiar Link'}
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-3">
        <a href={publicLink} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="w-4 h-4" /> Abrir Página do Cliente
          </Button>
        </a>
        <a href={publicLink} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm" className="gap-2 text-[#0A0A0A]/60">
            <Eye className="w-4 h-4" /> Pré-visualizar
          </Button>
        </a>
      </div>
    </div>
  );
}