import React from 'react';
import { ShieldAlert, AlertTriangle, FileText, Activity, Lock } from 'lucide-react';
import FormSection from '../FormSection';
import YesNoQuestion from '../YesNoQuestion';
import SelectionButton from '../SelectionButton';
import { Label } from '@/components/ui/label';

export default function Step8CompliancePLD({ formData, handleChange }) {
  return (
    <div className="space-y-8">
      {/* Seção 7: Compliance e Integridade */}
      <FormSection
        title="Compliance e Integridade"
        subtitle="Questões regulatórias e de integridade corporativa."
        icon={ShieldAlert}
      >
        <YesNoQuestion
          question="A empresa, sócios ou diretores possuem vínculos com países ou regiões sancionadas (OFAC, ONU, UE)?"
          value={formData.compliance_sancoes_paises}
          onChange={(value) => handleChange('compliance_sancoes_paises', value)}
          detailValue={formData.compliance_sancoes_paises_detalhe}
          onDetailChange={(value) => handleChange('compliance_sancoes_paises_detalhe', value)}
          detailLabel="Quais países e qual a natureza do vínculo?"
          detailPlaceholder="Descreva os países e o tipo de relacionamento..."
          showDetailOn={true}
          required
        />

        <YesNoQuestion
          question="A empresa é de propriedade ou controlada por indivíduos/entidades listadas em listas de sanções?"
          value={formData.compliance_sancoes_lista}
          onChange={(value) => handleChange('compliance_sancoes_lista', value)}
          detailValue={formData.compliance_sancoes_lista_detalhe}
          onDetailChange={(value) => handleChange('compliance_sancoes_lista_detalhe', value)}
          detailLabel="Detalhes da listagem"
          detailPlaceholder="Informe os nomes e as listas específicas..."
          showDetailOn={true}
          required
        />

        <YesNoQuestion
          question="Nos últimos 12 meses, a empresa ou sócios foram alvo de investigação criminal ou administrativa?"
          value={formData.compliance_investigacao}
          onChange={(value) => handleChange('compliance_investigacao', value)}
          detailValue={formData.compliance_investigacao_detalhe}
          onDetailChange={(value) => handleChange('compliance_investigacao_detalhe', value)}
          detailLabel="Detalhes da investigação"
          detailPlaceholder="Descreva o motivo, órgão responsável e status atual..."
          showDetailOn={true}
          required
        />

        <YesNoQuestion
          question="A empresa já teve contas encerradas por instituições financeiras devido a questões de compliance/PLD?"
          value={formData.compliance_contas_encerradas}
          onChange={(value) => handleChange('compliance_contas_encerradas', value)}
          detailValue={formData.compliance_contas_encerradas_detalhe}
          onDetailChange={(value) => handleChange('compliance_contas_encerradas_detalhe', value)}
          detailLabel="Motivo do encerramento"
          detailPlaceholder="Qual instituição e qual o motivo alegado..."
          showDetailOn={true}
          required
        />

        <YesNoQuestion
          question="A empresa opera ou transaciona com Criptomoedas, Jogos de Azar, Apostas Esportivas ou Cassino?"
          value={formData.compliance_atividade_risco}
          onChange={(value) => handleChange('compliance_atividade_risco', value)}
          detailValue={formData.compliance_atividade_risco_detalhe}
          onDetailChange={(value) => handleChange('compliance_atividade_risco_detalhe', value)}
          detailLabel="Detalhes da operação"
          detailPlaceholder="Descreva o tipo de operação e licenças possuídas..."
          showDetailOn={true}
          required
        />

        <YesNoQuestion
          question="A empresa possui relacionamento comercial ou financeiro com Paraísos Fiscais ou jurisdições de alto risco?"
          value={formData.compliance_paraisos_fiscais}
          onChange={(value) => handleChange('compliance_paraisos_fiscais', value)}
          detailValue={formData.compliance_paraisos_fiscais_detalhe}
          onDetailChange={(value) => handleChange('compliance_paraisos_fiscais_detalhe', value)}
          detailLabel="Países e motivo"
          detailPlaceholder="Liste as jurisdições e a natureza do relacionamento..."
          showDetailOn={true}
          required
        />
      </FormSection>

      {/* Seção 8: Prevenção à Lavagem de Dinheiro (PLD/FT) */}
      <FormSection
        title="Prevenção à Lavagem de Dinheiro (PLD/FT)"
        subtitle="Políticas, controles e governança de prevenção."
        icon={Activity}
      >
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">A empresa possui Política de PLD/FT formalizada? <span className="text-red-500">*</span></Label>
          <SelectionButton
            options={[
              { value: true, label: 'Sim' },
              { value: false, label: 'Não' }
            ]}
            value={formData.pld_possui_politica}
            onChange={(value) => handleChange('pld_possui_politica', value)}
            columns={2}
          />
        </div>

        {formData.pld_possui_politica === true && (
          <YesNoQuestion
            question="A política foi revisada e aprovada nos últimos 12 meses?"
            value={formData.pld_politica_revisada}
            onChange={(value) => handleChange('pld_politica_revisada', value)}
            required
          />
        )}

        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Frequência de Treinamento de PLD para funcionários <span className="text-red-500">*</span></Label>
          <SelectionButton
            options={[
              { value: 'admissional', label: 'Apenas na admissão' },
              { value: 'anual', label: 'Anual' },
              { value: 'semestral', label: 'Semestral' },
              { value: 'nao_realiza', label: 'Não realiza' }
            ]}
            value={formData.pld_frequencia_treinamento}
            onChange={(value) => handleChange('pld_frequencia_treinamento', value)}
            columns={2}
          />
        </div>

        <YesNoQuestion
          question="Realiza procedimentos de KYC (Conheça seu Cliente) e KYB (Conheça seu Parceiro) antes de iniciar relacionamentos?"
          value={formData.pld_realiza_kyc}
          onChange={(value) => handleChange('pld_realiza_kyc', value)}
          detailValue={formData.pld_kyc_escopo}
          onDetailChange={(value) => handleChange('pld_kyc_escopo', value)}
          detailLabel="Escopo das verificações"
          detailPlaceholder="Quais documentos e listas são verificados..."
          showDetailOn={true}
          required
        />

        <YesNoQuestion
          question="A empresa verifica se clientes/parceiros são Pessoas Politicamente Expostas (PEPs)?"
          value={formData.pld_verifica_pep}
          onChange={(value) => handleChange('pld_verifica_pep', value)}
          required
        />

        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Possui sistema de monitoramento de transações? <span className="text-red-500">*</span></Label>
          <SelectionButton
            options={[
              { value: 'automatizado', label: 'Sim, sistema automatizado' },
              { value: 'manual', label: 'Sim, análise manual' },
              { value: 'nao_possui', label: 'Não possui' }
            ]}
            value={formData.pld_monitoramento}
            onChange={(value) => handleChange('pld_monitoramento', value)}
            columns={3}
          />
        </div>

        <YesNoQuestion
          question="Existe uma área ou pessoa dedicada exclusivamente ao Compliance/PLD?"
          value={formData.pld_area_dedicada}
          onChange={(value) => handleChange('pld_area_dedicada', value)}
          required
        />

        <YesNoQuestion
          question="A empresa passa por auditorias internas ou externas de PLD/FT?"
          value={formData.pld_auditoria}
          onChange={(value) => handleChange('pld_auditoria', value)}
          detailValue={formData.pld_auditoria_frequencia}
          onDetailChange={(value) => handleChange('pld_auditoria_frequencia', value)}
          detailLabel="Qual a frequência e tipo?"
          detailPlaceholder="Ex: Auditoria externa anual..."
          showDetailOn={true}
          required
        />
      </FormSection>
    </div>
  );
}