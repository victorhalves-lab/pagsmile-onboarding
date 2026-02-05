import React from 'react';
import { TrendingUp, Truck, Lock } from 'lucide-react';
import FormSection from '../FormSection';
import FormField from '../FormField';
import SelectionButton from '../SelectionButton';
import YesNoQuestion from '../YesNoQuestion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Step5PerfilOperacional({ formData, handleChange }) {
  
  return (
    <div className="space-y-8">
      {/* Seção 9: Perfil Transacional e Operacional */}
      <FormSection
        title="Perfil Transacional e Operacional"
        subtitle="Descreva o perfil de transações e operações da empresa."
        icon={TrendingUp}
      >
        {/* 1. Informações Gerais */}
        <div className="space-y-6">
           <div className="space-y-2">
             <Label className="text-sm font-medium text-slate-700">Qual modelo de negócio melhor descreve sua operação? <span className="text-red-500">*</span></Label>
             <Select value={formData.modeloNegocio} onValueChange={(val) => handleChange('modeloNegocio', val)}>
               <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="gateway">Gateway</SelectItem>
                 <SelectItem value="infoprodutos">Infoprodutos</SelectItem>
                 <SelectItem value="educacao">Educação</SelectItem>
                 <SelectItem value="ecommerce">E-commerce</SelectItem>
                 <SelectItem value="saas">SaaS</SelectItem>
                 <SelectItem value="foodservice">Foodservice</SelectItem>
                 <SelectItem value="saude">Saúde</SelectItem>
                 <SelectItem value="petshop">Petshop</SelectItem>
                 <SelectItem value="marketplace">Marketplace</SelectItem>
                 <SelectItem value="outro">Outro</SelectItem>
               </SelectContent>
             </Select>
           </div>

           <YesNoQuestion
             question="Possui sub-vendedores/sub-merchants/subcontas?"
             value={formData.possuiSubVendedores}
             onChange={(val) => handleChange('possuiSubVendedores', val)}
             required
             helperText="Define visibilidade Seção Marketplace"
           />

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <YesNoQuestion question="Vende produto físico?" value={formData.vendeFisico} onChange={(val) => handleChange('vendeFisico', val)} required />
             <YesNoQuestion question="Vende produto digital ou presta serviço?" value={formData.vendeDigitalServico} onChange={(val) => handleChange('vendeDigitalServico', val)} required />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <YesNoQuestion question="Prazo típico de entrega > 7 dias?" value={formData.prazoEntregaMaior7} onChange={(val) => handleChange('prazoEntregaMaior7', val)} required />
             <YesNoQuestion question="Opera com afiliados/revendedores/parceiros?" value={formData.operaAfiliados} onChange={(val) => handleChange('operaAfiliados', val)} required />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <YesNoQuestion question="Categoria sensível/regulada (exige licença/RT)?" value={formData.categoriaSensivel} onChange={(val) => handleChange('categoriaSensivel', val)} required />
             <YesNoQuestion question="Armazena ou processa dados de cartão?" value={formData.armazenaCartao} onChange={(val) => handleChange('armazenaCartao', val)} required helperText="Define visibilidade Seção Segurança" />
           </div>
        </div>

        <Separator className="my-6" />

        {/* 2. B1. Perfil de Transações */}
        <h3 className="font-semibold text-slate-800 mb-4">B1. Perfil de Transações</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="space-y-2">
             <Label className="text-sm font-medium text-slate-700">Volume mensal estimado (R$) <span className="text-red-500">*</span></Label>
             <Select value={formData.rangeVolumeMensal} onValueChange={(val) => handleChange('rangeVolumeMensal', val)}>
               <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="ate_10k">Até R$ 10.000</SelectItem>
                 <SelectItem value="10k_50k">R$ 10.001 a R$ 50.000</SelectItem>
                 <SelectItem value="50k_100k">R$ 50.001 a R$ 100.000</SelectItem>
                 <SelectItem value="100k_500k">R$ 100.001 a R$ 500.000</SelectItem>
                 <SelectItem value="500k_1m">R$ 500.001 a R$ 1.000.000</SelectItem>
                 <SelectItem value="1m_5m">R$ 1.000.001 a R$ 5.000.000</SelectItem>
                 <SelectItem value="5m_10m">R$ 5.000.001 a R$ 10.000.000</SelectItem>
                 <SelectItem value="mais_10m">Mais de R$ 10.000.000</SelectItem>
               </SelectContent>
             </Select>
           </div>
           
           <div className="space-y-2">
             <Label className="text-sm font-medium text-slate-700">Quantidade de transações/mês <span className="text-red-500">*</span></Label>
             <Select value={formData.rangeQtdTransacoes} onValueChange={(val) => handleChange('rangeQtdTransacoes', val)}>
               <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="ate_100">Até 100</SelectItem>
                 <SelectItem value="101_500">101 a 500</SelectItem>
                 <SelectItem value="501_1000">501 a 1.000</SelectItem>
                 <SelectItem value="1001_5000">1.001 a 5.000</SelectItem>
                 <SelectItem value="5001_10000">5.001 a 10.000</SelectItem>
                 <SelectItem value="10001_50000">10.001 a 50.000</SelectItem>
                 <SelectItem value="50001_100000">50.001 a 100.000</SelectItem>
                 <SelectItem value="mais_100000">Mais de 100.000</SelectItem>
               </SelectContent>
             </Select>
           </div>

           <div className="space-y-2">
             <Label className="text-sm font-medium text-slate-700">Ticket médio (R$) <span className="text-red-500">*</span></Label>
             <Select value={formData.rangeTicketMedio} onValueChange={(val) => handleChange('rangeTicketMedio', val)}>
               <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="ate_50">Até R$ 50</SelectItem>
                 <SelectItem value="51_100">R$ 51 a R$ 100</SelectItem>
                 <SelectItem value="101_200">R$ 101 a R$ 200</SelectItem>
                 <SelectItem value="201_500">R$ 201 a R$ 500</SelectItem>
                 <SelectItem value="501_1000">R$ 501 a R$ 1.000</SelectItem>
                 <SelectItem value="1001_2000">R$ 1.001 a R$ 2.000</SelectItem>
                 <SelectItem value="2001_5000">R$ 2.001 a R$ 5.000</SelectItem>
                 <SelectItem value="mais_5000">Mais de R$ 5.000</SelectItem>
               </SelectContent>
             </Select>
           </div>
        </div>

        <YesNoQuestion
          question="Existe sazonalidade/picos?"
          value={formData.existeSazonalidade}
          onChange={(val) => handleChange('existeSazonalidade', val)}
          required
        />
        {formData.existeSazonalidade === true && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
             <FormField label="Quando ocorrem os picos?" value={formData.picosQuando} onChange={(val) => handleChange('picosQuando', val)} placeholder="Ex: Black Friday" />
             <FormField label="Pico máximo esperado (R$ ou %)" value={formData.picosMaximo} onChange={(val) => handleChange('picosMaximo', val)} placeholder="Ex: 200%" />
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
           <FormField label="% Físico" type="number" value={formData.pctFisico} onChange={(val) => handleChange('pctFisico', val)} placeholder="%" />
           <FormField label="% Serviço" type="number" value={formData.pctServico} onChange={(val) => handleChange('pctServico', val)} placeholder="%" />
           <FormField label="% Digital" type="number" value={formData.pctDigital} onChange={(val) => handleChange('pctDigital', val)} placeholder="%" />
        </div>

        <Separator className="my-6" />

        {/* 3. B2F. Entrega Física (Condicional) */}
        {formData.vendeFisico === true && (
          <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
             <h3 className="font-semibold text-slate-800">B2F. Entrega Física</h3>
             
             <div className="space-y-2">
               <Label className="text-sm font-medium text-slate-700">Quem realiza a entrega? <span className="text-red-500">*</span></Label>
               <Select value={formData.quemEntrega} onValueChange={(val) => handleChange('quemEntrega', val)}>
                 <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="proprio">Próprio</SelectItem>
                   <SelectItem value="transportadora">Transportadora</SelectItem>
                   <SelectItem value="marketplace">Marketplace</SelectItem>
                   <SelectItem value="dropship">Dropship/Terceiro</SelectItem>
                   <SelectItem value="outro">Outro</SelectItem>
                 </SelectContent>
               </Select>
             </div>

             <YesNoQuestion
               question="Possui política pública de troca/devolução?"
               value={formData.politicaTrocaPublica}
               onChange={(val) => handleChange('politicaTrocaPublica', val)}
               detailValue={formData.politicaTrocaUrl}
               onDetailChange={(val) => handleChange('politicaTrocaUrl', val)}
               detailLabel="Link da política"
               detailPlaceholder="https://..."
               required
             />

             <YesNoQuestion
               question="Consegue comprovar entrega?"
               value={formData.comprovaEntregaFisica}
               onChange={(val) => handleChange('comprovaEntregaFisica', val)}
               required
             />
             {formData.comprovaEntregaFisica === true && (
                <FormField label="Como comprova?" value={formData.comoComprovaEntregaFisica} onChange={(val) => handleChange('comoComprovaEntregaFisica', val)} placeholder="Ex: Rastreamento, AR..." />
             )}
          </div>
        )}

        {/* 4. B2D. Entrega Digital/Serviço (Condicional) */}
        {formData.vendeDigitalServico === true && (
          <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200 mt-4">
             <h3 className="font-semibold text-slate-800">B2D. Entrega Digital/Serviço</h3>
             
             <YesNoQuestion
               question="Consegue comprovar entrega/prestação?"
               value={formData.comprovaEntregaDigital}
               onChange={(val) => handleChange('comprovaEntregaDigital', val)}
               required
             />
             {formData.comprovaEntregaDigital === true && (
               <FormField label="Como comprova?" value={formData.comoComprovaEntregaDigital} onChange={(val) => handleChange('comoComprovaEntregaDigital', val)} placeholder="Ex: Logs, Certificado..." />
             )}

             <YesNoQuestion
               question="Existe política pública de reembolso?"
               value={formData.politicaReembolsoPublica}
               onChange={(val) => handleChange('politicaReembolsoPublica', val)}
               detailValue={formData.politicaReembolsoUrl}
               onDetailChange={(val) => handleChange('politicaReembolsoUrl', val)}
               detailLabel="Link da política"
               detailPlaceholder="https://..."
               required
             />
          </div>
        )}

        {/* 5. B3. Prazos (Condicional) */}
        {formData.prazoEntregaMaior7 === true && (
           <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200 mt-4">
             <h3 className="font-semibold text-slate-800">B3. Prazos</h3>
             
             <div className="space-y-2">
               <Label className="text-sm font-medium text-slate-700">Prazo típico de entrega <span className="text-red-500">*</span></Label>
               <Select value={formData.prazoTipicoEntrega} onValueChange={(val) => handleChange('prazoTipicoEntrega', val)}>
                 <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="imediato">Imediato</SelectItem>
                   <SelectItem value="d1">D+1</SelectItem>
                   <SelectItem value="d2_d7">D+2 a D+7</SelectItem>
                   <SelectItem value="d8_d30">D+8 a D+30</SelectItem>
                   <SelectItem value="mais_30">Mais de 30 dias</SelectItem>
                 </SelectContent>
               </Select>
             </div>

             <YesNoQuestion
               question="Existe pré-venda/entrega futura?"
               value={formData.existePreVenda}
               onChange={(val) => handleChange('existePreVenda', val)}
               required
             />
             {formData.existePreVenda === true && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Prazo máximo prometido" value={formData.prazoMaximoPreVenda} onChange={(val) => handleChange('prazoMaximoPreVenda', val)} placeholder="Ex: Até 60 dias" />
                  <FormField label="Como é comunicado?" value={formData.comunicacaoPreVenda} onChange={(val) => handleChange('comunicacaoPreVenda', val)} placeholder="Ex: No checkout" />
                </div>
             )}
           </div>
        )}

        {/* 6. B4. Cancelamentos e Reembolsos */}
        <div className="space-y-4 mt-6">
           <h3 className="font-semibold text-slate-800">B4. Cancelamentos e Reembolsos</h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                 <Label className="text-sm font-medium text-slate-700">Taxa de reembolso/cancelamento (3 meses) <span className="text-red-500">*</span></Label>
                 <Select value={formData.taxaReembolso} onValueChange={(val) => handleChange('taxaReembolso', val)}>
                   <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="menos_1">Menos de 1%</SelectItem>
                     <SelectItem value="1_3">1% a 3%</SelectItem>
                     <SelectItem value="3_5">3% a 5%</SelectItem>
                     <SelectItem value="mais_5">Mais de 5%</SelectItem>
                   </SelectContent>
                 </Select>
              </div>
              
              <YesNoQuestion
                 question="Reembolso pode ser parcial?"
                 value={formData.reembolsoParcial}
                 onChange={(val) => handleChange('reembolsoParcial', val)}
                 required
              />
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Motivo #1', 'Motivo #2', 'Motivo #3'].map((label, idx) => (
                 <div key={idx} className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">{label} mais comum</Label>
                    <Select value={formData[`motivoReembolso${idx+1}`]} onValueChange={(val) => handleChange(`motivoReembolso${idx+1}`, val)}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="arrependimento">Arrependimento</SelectItem>
                        <SelectItem value="atraso">Atraso na entrega</SelectItem>
                        <SelectItem value="qualidade">Qualidade do produto</SelectItem>
                        <SelectItem value="duplicidade">Duplicidade</SelectItem>
                        <SelectItem value="nao_reconhece">Não reconhece</SelectItem>
                        <SelectItem value="desacordo">Desacordo comercial</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
              ))}
           </div>
        </div>

        {/* 7. B5. Afiliados (Condicional) */}
        {formData.operaAfiliados === true && (
          <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200 mt-4">
             <h3 className="font-semibold text-slate-800">B5. Afiliados/Parceiros</h3>
             
             <YesNoQuestion
               question="Aprova/valida afiliados antes de venderem?"
               value={formData.validaAfiliados}
               onChange={(val) => handleChange('validaAfiliados', val)}
               detailValue={formData.comoValidaAfiliados}
               onDetailChange={(val) => handleChange('comoValidaAfiliados', val)}
               detailLabel="Como é feita a aprovação?"
               required
             />

             <YesNoQuestion
               question="Afiliado recebe comissão antes da entrega?"
               value={formData.comissaoAntecipada}
               onChange={(val) => handleChange('comissaoAntecipada', val)}
               detailValue={formData.momentoComissao}
               onDetailChange={(val) => handleChange('momentoComissao', val)}
               detailLabel="Em que momento a comissão é paga?"
               required
             />

             <YesNoQuestion
               question="Monitora origem de tráfego/ofertas?"
               value={formData.monitoraTrafego}
               onChange={(val) => handleChange('monitoraTrafego', val)}
               detailValue={formData.comoMonitoraTrafego}
               onDetailChange={(val) => handleChange('comoMonitoraTrafego', val)}
               detailLabel="Como monitora?"
               required
             />
          </div>
        )}

        {/* 8. B6. Categoria Regulada (Condicional) */}
        {formData.categoriaSensivel === true && (
          <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200 mt-4">
             <h3 className="font-semibold text-slate-800">B6. Categoria Regulada</h3>
             
             <YesNoQuestion
               question="Operação exige licença/alvará/RT?"
               value={formData.exigeLicencaRT}
               onChange={(val) => handleChange('exigeLicencaRT', val)}
               required
             />

             <YesNoQuestion
               question="Existem restrições de publicidade?"
               value={formData.restricoesPublicidade}
               onChange={(val) => handleChange('restricoesPublicidade', val)}
               detailValue={formData.comoGaranteConformidade}
               onDetailChange={(val) => handleChange('comoGaranteConformidade', val)}
               detailLabel="Como garante conformidade?"
               required
             />
          </div>
        )}

      </FormSection>
    </div>
  );
}