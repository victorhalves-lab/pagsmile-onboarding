import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CircleDot, CheckCircle2 } from 'lucide-react';

export default function SentinelDeepDiveSection() {
  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-[#002443] to-[#003366] rounded-2xl p-6 text-white">
        <h3 className="text-xl font-bold mb-2">IA SENTINEL — Funcionamento Microscópico das 3 Fases</h3>
        <p className="text-white/80 text-sm leading-relaxed">
          A IA SENTINEL (Helena) é o motor de inteligência artificial que analisa cada caso de compliance em 3 fases progressivas, gerando um score composto de 0 a 1000 e uma recomendação final automática. Cada fase avalia uma dimensão diferente e produz artefatos específicos.
        </p>
      </div>

      {/* FASE 1 */}
      <div className="border-l-4 border-purple-500 bg-purple-50/30 rounded-r-2xl p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white font-bold">F1</div>
          <div>
            <h4 className="font-bold text-[#002443]">Fase 1 — Análise do Questionário</h4>
            <p className="text-xs text-[#002443]/50">Score: score_questionario (0-1000) · Classificação: classificacao_questionario</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-2">O que avalia</p>
            {['Completude das respostas (campos obrigatórios vs opcionais preenchidos)', 'Qualidade textual das respostas (especificidade, coerência, profundidade)', 'Consistência interna (dados não se contradizem)', 'Risk weights configurados por pergunta (0-50 pontos)', 'Risk values por opção de resposta SELECT (cada valor tem peso)', 'Padrões evasivos: respostas genéricas, "N/A" excessivo, copiar-colar', 'Indicadores de risco: MCCs de alto risco, jurisdições sensíveis, PEP declarado'].map((item, i) => (
              <p key={i} className="text-[10px] text-[#002443]/60 flex items-start gap-1.5 mb-1">
                <CircleDot className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" />{item}
              </p>
            ))}
          </div>
          <div>
            <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-2">Artefatos Gerados</p>
            {['ComplianceScore.score_questionario (0-1000)', 'ComplianceScore.classificacao_questionario (Excelente/Bom/Regular/Baixo/Crítico)', 'ComplianceFinding[] — cada problema encontrado com: severidade (INFO/LOW/MEDIUM/HIGH/CRITICAL/BLOCKER), seção, evidência, dedução de pontos, recomendação', 'QualityAssessment — scores 1-5 em 4 dimensões: especificidade, coerência, profundidade, linguagem', 'ComplianceScore.pontos_positivos[] — lista de pontos fortes', 'ComplianceScore.pontos_atencao[] — lista de alertas', 'ComplianceScore.red_flags[] — problemas críticos'].map((item, i) => (
              <p key={i} className="text-[10px] text-[#002443]/60 flex items-start gap-1.5 mb-1">
                <ArrowRight className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" />{item}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* FASE 2 */}
      <div className="border-l-4 border-blue-500 bg-blue-50/30 rounded-r-2xl p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold">F2</div>
          <div>
            <h4 className="font-bold text-[#002443]">Fase 2 — Validações Externas</h4>
            <p className="text-xs text-[#002443]/50">Score: score_validacao_externa (0-1000) · Classificação: classificacao_validacao_externa</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2">Provedores e Serviços</p>
            {['CAF — Liveness: prova de vida facial (7 estágios)', 'CAF — Facematch: comparação 1:1 com documento', 'CAF — Document OCR: extração de dados do documento', 'CAF — Documentoscopy: detecção de fraude documental', 'BigDataCorp — Dados Empresa: CNPJ, razão social, atividade, situação cadastral', 'BigDataCorp — KYC Empresa/Sócios: quadro societário, participações cruzadas', 'BigDataCorp — PEP/Sanções: verificação OFAC, ONU, listas restritivas', 'BigDataCorp — Indicadores de Atividade: faturamento estimado, porte, tempo de operação'].map((item, i) => (
              <p key={i} className="text-[10px] text-[#002443]/60 flex items-start gap-1.5 mb-1">
                <CircleDot className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />{item}
              </p>
            ))}
          </div>
          <div>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2">O que cruza / Artefatos</p>
            {['Cruza dados declarados no questionário vs dados externos (CNPJ, atividade, porte)', 'Verifica se sócios têm histórico PEP ou sanções', 'Valida se documentos enviados são autênticos (documentoscopia)', 'Confirma identidade biométrica (liveness + facematch)', 'ExternalValidationResult[] — resultado de cada chamada a cada provedor', 'IntegrationLog[] — log técnico de cada request/response com duração', 'ComplianceScore.score_validacao_externa atualizado', 'Findings adicionais se divergências encontradas'].map((item, i) => (
              <p key={i} className="text-[10px] text-[#002443]/60 flex items-start gap-1.5 mb-1">
                <ArrowRight className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />{item}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* FASE 3 */}
      <div className="border-l-4 border-[#2bc196] bg-[#2bc196]/5 rounded-r-2xl p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2bc196] flex items-center justify-center text-white font-bold">F3</div>
          <div>
            <h4 className="font-bold text-[#002443]">Fase 3 — Score Composto + Recomendação Final</h4>
            <p className="text-xs text-[#002443]/50">Score: score_geral_composto (0-1000) · Recomendação: recomendacao_final</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold text-[#2bc196] uppercase tracking-wider mb-2">Cálculo do Score Composto</p>
            {['Combina score_questionario + score_validacao_externa com pesos configuráveis', 'Aplica bonus_consistencia (0-1000): premia quando dados declarados = dados externos', 'Aplica overrides automáticos: PEP detectado → desconto automático, CNPJ irregular → desconto, biometria falha → penalidade', 'Resultado: score_geral_composto = (SQ × peso1 + SVE × peso2 + Bônus) / fator_normalização', 'Classificação final: classificacao_geral baseada em thresholds do template'].map((item, i) => (
              <p key={i} className="text-[10px] text-[#002443]/60 flex items-start gap-1.5 mb-1">
                <CircleDot className="w-3 h-3 text-[#2bc196] mt-0.5 shrink-0" />{item}
              </p>
            ))}
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#2bc196] uppercase tracking-wider mb-2">Recomendação Final e Artefatos</p>
            {['recomendacao_final: "Aprovado", "Aprovado com Condições", "Revisão Manual" ou "Recusado"', 'parecer_final: texto conclusivo gerado pela IA', 'sumario_executivo: resumo para visão rápida', 'analise_completa_ia: análise detalhada completa', 'condicoes_aprovacao: se aprovado com ressalvas, lista condições', 'recomendacoes_revisao_manual: guia para o analista', 'perguntas_sugeridas: perguntas adicionais para investigar', 'documentos_adicionais_sugeridos: documentos extras a solicitar', 'nivel_confianca_ia: 0-100 (quão confiante a IA está na decisão)'].map((item, i) => (
              <p key={i} className="text-[10px] text-[#002443]/60 flex items-start gap-1.5 mb-1">
                <ArrowRight className="w-3 h-3 text-[#2bc196] mt-0.5 shrink-0" />{item}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Thresholds */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-[10px] font-bold text-[#002443]/50 uppercase tracking-wider mb-3">Decisão Automática — Thresholds por Template</p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Aprovação Auto', desc: 'Score ≥ autoApproveAbove', color: 'bg-green-50 border-green-200 text-green-700', ex: 'Ex: ≥ 750' },
            { label: 'Revisão Manual', desc: 'Score entre limites', color: 'bg-amber-50 border-amber-200 text-amber-700', ex: 'Ex: 400-749' },
            { label: 'Rejeição Auto', desc: 'Score ≤ autoRejectBelow', color: 'bg-red-50 border-red-200 text-red-700', ex: 'Ex: ≤ 250' },
            { label: 'Aprovado c/ Condições', desc: 'Score entre limites + flags', color: 'bg-blue-50 border-blue-200 text-blue-700', ex: 'Com monitoramento' },
          ].map((t, i) => (
            <div key={i} className={`rounded-lg p-3 border ${t.color}`}>
              <p className="text-[10px] font-bold">{t.label}</p>
              <p className="text-[9px] opacity-70">{t.desc}</p>
              <p className="text-[8px] opacity-50 mt-1">{t.ex}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}