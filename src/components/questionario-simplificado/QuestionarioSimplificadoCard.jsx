import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Link2, FileText } from 'lucide-react';

const STATUS_MAP = {
  novo: { label: 'Novo', color: 'bg-blue-100 text-blue-700' },
  vinculado: { label: 'Vinculado', color: 'bg-amber-100 text-amber-700' },
  convertido: { label: 'Convertido', color: 'bg-green-100 text-green-700' },
};

function formatCnpj(cnpj) {
  if (!cnpj) return '-';
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return cnpj;
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

export default function QuestionarioSimplificadoCard({ questionario, onVerDetalhes, onVincularLead, onGerarProposta }) {
  const st = STATUS_MAP[questionario.status] || STATUS_MAP.novo;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-[#1356E2] font-semibold">{questionario.protocolo || '-'}</span>
            <Badge className="bg-orange-100 text-orange-700 text-xs border-0">Simplificado</Badge>
            <Badge className={`${st.color} text-xs border-0`}>{st.label}</Badge>
          </div>

          {/* Company Info */}
          <div>
            <p className="font-semibold text-[#0A0A0A]">{questionario.nome_empresa}</p>
            <p className="text-xs text-[#0A0A0A]/60">{formatCnpj(questionario.cnpj)}</p>
          </div>

          {/* Contact */}
          <div className="text-xs text-[#0A0A0A]/70 flex gap-4 flex-wrap">
            <span>{questionario.contato_nome}</span>
            <span>{questionario.contato_email}</span>
          </div>

          {/* Quick Rates Summary */}
          <div className="flex gap-4 text-xs text-[#0A0A0A]/60 flex-wrap">
            <span>Visa 1x: {questionario.taxas_credito_1x?.visa != null ? `${questionario.taxas_credito_1x.visa}%` : '-'}</span>
            <span>2-6x: {questionario.taxas_credito_2_6x?.visa != null ? `${questionario.taxas_credito_2_6x.visa}%` : '-'}</span>
            <span>7-12x: {questionario.taxas_credito_7_12x?.visa != null ? `${questionario.taxas_credito_7_12x.visa}%` : '-'}</span>
            <span>PIX: {questionario.pix_valor != null ? `${questionario.pix_valor}${questionario.pix_tipo === 'percentual' ? '%' : ' R$'}` : '-'}</span>
          </div>

          {/* Date */}
          <p className="text-[10px] text-[#0A0A0A]/40">
            {questionario.created_date ? new Date(questionario.created_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => onVerDetalhes?.(questionario)}>
            <Eye className="w-4 h-4 mr-1" /> Detalhes
          </Button>
          {questionario.status === 'novo' && (
            <Button variant="ghost" size="sm" onClick={() => onVincularLead?.(questionario)} className="text-[#1356E2]">
              <Link2 className="w-4 h-4 mr-1" /> Criar Lead
            </Button>
          )}
          {['novo', 'vinculado'].includes(questionario.status) && (
            <Button variant="ghost" size="sm" onClick={() => onGerarProposta?.(questionario)} className="text-purple-600">
              <FileText className="w-4 h-4 mr-1" /> Proposta
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}