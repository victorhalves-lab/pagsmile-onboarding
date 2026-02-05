import React from 'react';
import { ShieldAlert } from 'lucide-react';
import FormSection from '../FormSection';
import YesNoQuestion from '../YesNoQuestion';

export default function Step8CompliancePLD({ formData, handleChange }) {
  return (
    <FormSection
      title="Compliance"
      subtitle="Perguntas de risco e conformidade regulatória."
      icon={ShieldAlert}
    >
      <YesNoQuestion
        question="1. Algum sócio, acionista (direto ou indireto), administrador, diretor ou beneficiário final da empresa está incluído em listas de sanções nacionais ou internacionais?"
        value={formData.comp_q1}
        onChange={(v) => handleChange('comp_q1', v)}
        detailValue={formData.comp_q1_detalhe}
        onDetailChange={(v) => handleChange('comp_q1_detalhe', v)}
        detailLabel="Especifique"
        required
      />

      <YesNoQuestion
        question="2. A empresa, ou qualquer um de seus diretores, acionistas (diretos ou indiretos) ou beneficiários finais, mantém vínculos com países, regiões ou territórios sujeitos a sanções internacionais abrangentes?"
        value={formData.comp_q2}
        onChange={(v) => handleChange('comp_q2', v)}
        detailValue={formData.comp_q2_detalhe}
        onDetailChange={(v) => handleChange('comp_q2_detalhe', v)}
        detailLabel="Especifique"
        required
      />

      <YesNoQuestion
        question="3. A empresa é de propriedade ou está, direta ou indiretamente, sob controle de pessoa ou entidade incluída em listas de sanções, atuando em nome próprio ou representando interesses de terceiros sancionados?"
        value={formData.comp_q3}
        onChange={(v) => handleChange('comp_q3', v)}
        detailValue={formData.comp_q3_detalhe}
        onDetailChange={(v) => handleChange('comp_q3_detalhe', v)}
        detailLabel="Especifique"
        required
      />

      <YesNoQuestion
        question="4. Nos últimos 12 meses, a empresa ou algum de seus diretores, conselheiros, acionistas (diretos ou indiretos) ou beneficiários finais esteve sob investigação criminal por qualquer motivo?"
        value={formData.comp_q4}
        onChange={(v) => handleChange('comp_q4', v)}
        detailValue={formData.comp_q4_detalhe}
        onDetailChange={(v) => handleChange('comp_q4_detalhe', v)}
        detailLabel="Especifique"
        required
      />

      <YesNoQuestion
        question="5. Nos últimos 12 meses, a empresa ou algum de seus diretores, conselheiros, acionistas (diretos ou indiretos) ou beneficiários finais teve contas bancárias ou de pagamento encerradas por motivos de compliance?"
        value={formData.comp_q5}
        onChange={(v) => handleChange('comp_q5', v)}
        detailValue={formData.comp_q5_detalhe}
        onDetailChange={(v) => handleChange('comp_q5_detalhe', v)}
        detailLabel="Especifique"
        required
      />

      <YesNoQuestion
        question="6. A empresa opera com criptomoedas, criptoativos, tokens ou assimilados?"
        value={formData.comp_q6}
        onChange={(v) => handleChange('comp_q6', v)}
        detailValue={formData.comp_q6_detalhe}
        onDetailChange={(v) => handleChange('comp_q6_detalhe', v)}
        detailLabel="Detalhe a operação"
        required
      />

      <YesNoQuestion
        question="7. A empresa opera com jogos, apostas, cassino ou atividades similares?"
        value={formData.comp_q7}
        onChange={(v) => handleChange('comp_q7', v)}
        detailValue={formData.comp_q7_detalhe}
        onDetailChange={(v) => handleChange('comp_q7_detalhe', v)}
        detailLabel="Nº da Licença"
        required
      />

      <YesNoQuestion
        question="8. A empresa atua em alguma atividade que possa ser considerada proibida ou ilegal?"
        value={formData.comp_q8}
        onChange={(v) => handleChange('comp_q8', v)}
        required
      />

      <YesNoQuestion
        question="9. A empresa atua em alguma atividade considerada de alto risco ou que requer aprovação especial (ex: nutra, viagens, leilões, etc.)?"
        value={formData.comp_q9}
        onChange={(v) => handleChange('comp_q9', v)}
        detailValue={formData.comp_q9_detalhe}
        onDetailChange={(v) => handleChange('comp_q9_detalhe', v)}
        detailLabel="Qual atividade?"
        required
      />

      <YesNoQuestion
        question="10. Algum beneficiário final (UBO) ou administrador é Pessoa Politicamente Exposta (PEP) ou possui relacionamento próximo com PEP?"
        value={formData.comp_q10}
        onChange={(v) => handleChange('comp_q10', v)}
        detailValue={formData.comp_q10_detalhe}
        onDetailChange={(v) => handleChange('comp_q10_detalhe', v)}
        detailLabel="Detalhes"
        required
      />

      <YesNoQuestion
        question="11. A empresa possui relacionamento comercial ou financeiro com terceiros localizados em jurisdições offshore ou consideradas paraísos fiscais?"
        value={formData.comp_q11}
        onChange={(v) => handleChange('comp_q11', v)}
        detailValue={formData.comp_q11_detalhe}
        onDetailChange={(v) => handleChange('comp_q11_detalhe', v)}
        detailLabel="Especifique"
        required
      />
    </FormSection>
  );
}