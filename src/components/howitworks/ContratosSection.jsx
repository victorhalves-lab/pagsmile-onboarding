import React from 'react';
import { CircleDot, FileText, Stamp, CheckCircle2, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ContratosSection() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#002443] to-[#003366] rounded-2xl p-5 text-white">
        <h3 className="text-lg font-bold mb-2">Módulo de Contratos</h3>
        <p className="text-white/80 text-sm leading-relaxed">
          O módulo de Contratos permite a geração, customização e gestão completa de contratos de prestação de serviços de pagamento.
          Integrado com o módulo de Propostas, ele automatiza a criação de contratos a partir de propostas aceitas,
          incluindo cláusulas padrão, módulos de serviço, SLAs, preços e anexos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-[#2bc196]" />Criação de Contratos</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-[#002443]/70 space-y-1.5">
            {[
              'Vinculação a Lead e/ou Proposta existente',
              'Dados do cliente pré-preenchidos (CNPJ, razão social, endereço, representante)',
              'Seleção de módulos de serviço: Pix, Cartão, Boleto, Link de Pagamento, Recorrência',
              'Configuração de SLAs por módulo: tempo de resposta, uptime, suporte',
              'Tabela de preços: taxas por serviço, por bandeira, antecipação, mensalidade',
              'Editor de cláusulas: 27 cláusulas divididas em 4 blocos (1-4, 5-9, 10-14, 15-27)',
              'Cláusulas padrão: objeto, vigência, remuneração, obrigações, confidencialidade, LGPD, rescisão, penalidades, foro',
              'Anexos configuráveis: tabela de preços, SLAs, módulos contratados',
              'Pré-geração automática via IA (preGenerateContract) a partir dos dados do Lead/Proposta',
              'Preview completa antes de finalizar',
            ].map((item, i) => (
              <p key={i} className="flex items-start gap-1.5"><ArrowRight className="w-3 h-3 text-[#2bc196] mt-0.5 shrink-0" />{item}</p>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Stamp className="w-4 h-4 text-[#2bc196]" />Assinatura e Gestão</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-[#002443]/70 space-y-1.5">
            {[
              'Geração de link público para assinatura pelo cliente (ContratoPublico)',
              'Formulário de assinatura: nome completo, CPF, cargo, data, aceite dos termos',
              'Visualização do contrato completo pelo cliente antes de assinar',
              'Status: Rascunho, Enviado, Visualizado, Assinado, Cancelado',
              'Tracking de visualizações e data/hora de assinatura',
              'Gestão centralizada de todos os contratos (GestaoContratos)',
              'Filtros por status, cliente, data, módulo contratado',
              'Editor de contratos existentes (EditorContrato)',
              'Preview de contratos (PreviewContrato)',
              'Vinculação bidirecional: Contrato ↔ Lead ↔ Proposta',
            ].map((item, i) => (
              <p key={i} className="flex items-start gap-1.5"><ArrowRight className="w-3 h-3 text-[#2bc196] mt-0.5 shrink-0" />{item}</p>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="bg-[#002443]/5 rounded-xl p-4 border border-[#002443]/10">
        <h5 className="text-xs font-bold text-[#002443]/50 uppercase tracking-wider mb-2">Entidade & Componentes Técnicos</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            <Badge className="bg-[#002443] text-white font-mono text-[10px] border-0 mb-1">Contract</Badge>
            <p className="text-[10px] text-[#002443]/60">Dados completos do contrato: leadId, proposalId, dados do cliente, módulos, SLAs, preços, cláusulas, status, assinatura, datas</p>
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            <p className="text-[10px] font-bold text-[#002443]/50 mb-1">Componentes de Renderização</p>
            <p className="text-[10px] text-[#002443]/60">ClienteForm, ModulosForm, SLAsForm, PrecosForm, AssinaturaForm, ConteudoContrato, ContratoClausulas (4 blocos), ContratoAnexos, ContratoStyles</p>
          </div>
        </div>
      </div>
    </div>
  );
}