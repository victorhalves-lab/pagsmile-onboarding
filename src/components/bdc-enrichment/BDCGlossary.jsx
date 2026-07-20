import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

/**
 * BDCGlossary — Interactive glossary of compliance and BDC terms.
 * Helps non-technical team members understand technical terminology.
 */

const GLOSSARY = [
  { term: 'PEP', full: 'Pessoa Politicamente Exposta', definition: 'Qualquer pessoa que exerce ou exerceu nos últimos 5 anos um cargo público relevante no Brasil ou no exterior. Inclui: deputados, senadores, governadores, prefeitos, vereadores, juízes, desembargadores, diretores de estatais, militares de alta patente, e seus familiares diretos (cônjuges, pais, filhos) e pessoas próximas. PEPs representam risco maior de lavagem de dinheiro e corrupção por terem acesso a recursos públicos.' },
  { term: 'OFAC', full: 'Office of Foreign Assets Control', definition: 'Órgão do Departamento do Tesouro dos Estados Unidos que administra e aplica sanções econômicas e comerciais. A "Lista OFAC" (SDN List) inclui pessoas, empresas e organizações com quem cidadãos e empresas americanas estão proibidos de fazer negócios. Estar nessa lista significa que a pessoa/empresa tem restrições internacionais severas, geralmente relacionadas a terrorismo, narcotráfico ou regimes autoritários.' },
  { term: 'Shell Company', full: 'Empresa de Fachada', definition: 'Uma empresa que existe legalmente (tem CNPJ ativo) mas não tem operações reais, funcionários, sede física verdadeira ou atividade econômica verificável. É frequentemente usada para lavagem de dinheiro, evasão fiscal ou ocultação de patrimônio. Indicadores: sem empregados, sem domínio na internet, sem passagens web, endereço em escritório virtual, capital social mínimo.' },
  { term: 'KYC', full: 'Know Your Customer (Conheça Seu Cliente)', definition: 'Conjunto de procedimentos regulatórios que instituições financeiras e de pagamento devem seguir para verificar a identidade de seus clientes antes de fazer negócios com eles. Inclui verificar documentos, confirmar endereço, checar listas de sanções, identificar PEPs e avaliar o risco de cada cliente. É obrigatório pela Circular BCB 3.978/2020.' },
  { term: 'PLD/FT', full: 'Prevenção à Lavagem de Dinheiro e ao Financiamento do Terrorismo', definition: 'Conjunto de leis, regulamentos e procedimentos que obrigam instituições financeiras a prevenir que seus serviços sejam usados para lavar dinheiro (transformar dinheiro ilegal em aparentemente legal) ou financiar atividades terroristas. No Brasil, é regulado pela Lei 9.613/1998 e pela Circular BCB 3.978/2020.' },
  { term: 'CNAE', full: 'Classificação Nacional de Atividades Econômicas', definition: 'Código numérico que identifica a atividade econômica de uma empresa junto à Receita Federal. Cada empresa tem um CNAE principal e pode ter vários secundários. Alguns CNAEs são considerados de alto risco para compliance: jogos/apostas (9200), serviços financeiros (6499), intermediação financeira (6619), criptoativos.' },
  { term: 'MCC', full: 'Merchant Category Code', definition: 'Código de 4 dígitos atribuído pelas bandeiras de cartão (Visa, Mastercard) para classificar o tipo de negócio de um merchant. Usado para determinar taxas de intercâmbio, regras antifraude e restrições de processamento. Alguns MCCs são restritos ou proibidos por certas adquirentes.' },
  { term: 'QSA', full: 'Quadro de Sócios e Administradores', definition: 'Lista oficial dos sócios (donos) e administradores (gestores) de uma empresa, registrada na Receita Federal do Brasil. Mostra quem são os donos, qual a participação percentual de cada um, e quem tem poderes de administração. É público e pode ser consultado no site da Receita.' },
  { term: 'UBO', full: 'Ultimate Beneficial Owner (Beneficiário Final)', definition: 'A pessoa física que, em última instância, controla ou se beneficia economicamente de uma empresa. Mesmo que uma empresa seja dona de outra empresa, é necessário "subir" a cadeia societária até encontrar as pessoas físicas que controlam tudo. Reguladores exigem identificação do UBO para prevenir uso de estruturas societárias complexas para ocultar identidades.' },
  { term: 'Dívida Ativa', full: 'Inscrição em Dívida Ativa', definition: 'Quando uma pessoa ou empresa deve impostos ou taxas ao governo (federal, estadual ou municipal) e não paga, o débito é inscrito na "Dívida Ativa". Isso gera restrições como impossibilidade de obter certidões negativas, participar de licitações e, em casos graves, penhora de bens. É diferente de dívida com bancos/empresas privadas.' },
  { term: 'Rolling Reserve', full: 'Reserva Rotativa', definition: 'Percentual de cada transação processada que é retido pela adquirente/processadora como garantia contra chargebacks e fraudes. Por exemplo, Rolling Reserve de 10% significa que a cada R$ 100 processados, R$ 10 ficam retidos por um período (geralmente 180 dias). É aplicado a merchants de maior risco como proteção financeira.' },
  { term: 'Subfaixa', full: 'Subfaixa de Decisão (Framework v4)', definition: 'Classificação do nível de risco de um merchant no Framework v4 da Pin Bank. Vai de 1A (Verde Express — menor risco) até 5 (Bloqueio Total). Cada subfaixa determina: se a aprovação é automática ou manual, qual o Rolling Reserve aplicado, qual o nível de monitoramento, e quais condições são impostas.' },
  { term: 'CEIS/CNEP', full: 'Cadastro de Empresas Inidôneas e Suspensas / Cadastro Nacional de Empresas Punidas', definition: 'Listas mantidas pela Controladoria-Geral da União (CGU) que registram empresas que foram punidas pelo governo por irregularidades em contratos públicos, licitações ou práticas ilícitas. Estar nessas listas é um bloqueio grave para compliance.' },
  { term: 'Adverse Media', full: 'Mídia Adversa', definition: 'Notícias negativas encontradas sobre uma empresa ou pessoa em fontes de mídia (jornais, sites, TV). Pode incluir: escândalos de corrupção, envolvimento em fraudes, problemas regulatórios, processos criminais noticiados. Mídia adversa é um indicador de risco reputacional que pode afetar a decisão de onboarding.' },
  { term: 'Documentoscopy', full: 'Documentoscopia', definition: 'Análise técnica de documentos (RG, CNH, comprovantes) para verificar se são autênticos ou falsificados. Usa técnicas como análise de tipografia, marcas de segurança, consistência de dados e comparação com padrões oficiais. Realizada pela CAF (Combate à Fraude) no fluxo de verificação.' },
  { term: 'Liveness', full: 'Prova de Vida', definition: 'Teste biométrico que verifica se a pessoa está realmente presente e viva durante a verificação. Usa a câmera para detectar movimentos faciais, profundidade 3D e sinais de vida, diferenciando uma pessoa real de uma foto impressa, vídeo gravado ou deepfake. Previne fraude de identidade.' },
  { term: 'Facematch', full: 'Comparação Facial', definition: 'Comparação biométrica entre a foto do rosto da pessoa (capturada pela câmera) e a foto do documento de identidade (RG/CNH). Usa inteligência artificial para calcular um percentual de similaridade. Geralmente, acima de 70-80% é considerado match positivo.' },
  { term: 'Score de Risco', full: 'Pontuação de Risco (0-849)', definition: 'Valor numérico calculado pelo Framework v4 que representa o nível de risco de um merchant. Vai de 0 (risco mínimo) a 849 (risco máximo antes de bloqueio). Acima de 850 é bloqueio automático (causado por bloqueios B01-B10). O score é composto por 3 camadas: Base do Segmento + Variáveis Encontradas + Enriquecimento Externo.' },
];

export default function BDCGlossary() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = GLOSSARY.filter(g => {
    if (!search) return true;
    const q = search.toLowerCase();
    return g.term.toLowerCase().includes(q) || g.full.toLowerCase().includes(q) || g.definition.toLowerCase().includes(q);
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 hover:bg-slate-50/50 transition-colors text-left"
      >
        <div className="p-2 rounded-lg bg-blue-50">
          <BookOpen className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-[#0A0A0A]">📖 Glossário de Termos — Compliance & BDC</h4>
          <p className="text-[10px] text-[#0A0A0A]/40">{GLOSSARY.length} termos explicados em linguagem simples</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[#0A0A0A]/30" /> : <ChevronDown className="w-4 h-4 text-[#0A0A0A]/30" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A0A0A]/30" />
            <Input
              placeholder="Buscar termo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filtered.map((g, i) => (
              <GlossaryItem key={i} item={g} />
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-[#0A0A0A]/40 text-center py-4">Nenhum termo encontrado</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GlossaryItem({ item }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-blue-50/30 transition-colors text-left"
      >
        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md shrink-0">
          {item.term}
        </span>
        <span className="text-xs text-[#0A0A0A]/60 flex-1 truncate">{item.full}</span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-[#0A0A0A]/30" /> : <ChevronDown className="w-3.5 h-3.5 text-[#0A0A0A]/30" />}
      </button>
      {expanded && (
        <div className="px-4 pb-3 pt-0">
          <p className="text-[12px] text-[#0A0A0A]/75 leading-relaxed">{item.definition}</p>
        </div>
      )}
    </div>
  );
}