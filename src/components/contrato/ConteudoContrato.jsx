import React from 'react';
import { LOGO_URL, V, Check, SectionHeading, KVTable, P, formatDate } from './ContratoStyles';
import ContratoClausulas1a4 from './ContratoClausulas1a4';
import ContratoClausulas5a9 from './ContratoClausulas5a9';
import ContratoClausulas10a14 from './ContratoClausulas10a14';
import ContratoClausulas15a27 from './ContratoClausulas15a27';
import ContratoAnexos from './ContratoAnexos';

export default function ConteudoContrato({ contract }) {
  const c = contract || {};
  const mods = c.modules || {};

  return (
    <div style={{ 
      padding: '48px 56px', color: '#002443', fontSize: '10.5px', lineHeight: 1.75, 
      maxWidth: '850px', margin: '0 auto',
      fontFamily: "'Plus Jakarta Sans', 'Helvetica Neue', Arial, sans-serif",
      backgroundColor: '#ffffff',
    }}>
      {/* ===== HEADER ===== */}
      <div style={{ 
        background: 'linear-gradient(135deg, #002443 0%, #003366 50%, #36706c 100%)',
        borderRadius: '16px', padding: '40px 32px', marginBottom: '32px',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px',
          background: 'radial-gradient(circle, rgba(43,193,150,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
        <img src={LOGO_URL} alt="Pagsmile" style={{ height: '48px', marginBottom: '20px' }} />
        <h1 style={{ color: '#ffffff', fontSize: '15px', fontWeight: 700, textTransform: 'uppercase', 
          letterSpacing: '2px', marginBottom: '8px', position: 'relative' }}>
          CONTRATO MASTER DE PRESTAÇÃO DE SERVIÇOS
        </h1>
        <p style={{ color: '#5cf7cf', fontSize: '11px', fontWeight: 500, letterSpacing: '1px', position: 'relative' }}>
          ABERTURA DE CONTA DE PAGAMENTO E SUBADQUIRÊNCIA
        </p>
        <div style={{ width: '60px', height: '3px', background: '#2bc196', margin: '16px auto 0', borderRadius: '2px' }} />
      </div>

      {/* ===== PREÂMBULO ===== */}
      <P>Pelo presente instrumento particular, de um lado,</P>
      <P><strong>PAGSMILE INSTITUICAO DE PAGAMENTO LTDA</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 37.753.531/0001-65, com sede na Alameda Santos, 1940 - Cerqueira Cesar, São Paulo - SP, 01.418-102, neste ato devidamente representada na forma de seus atos constitutivos, doravante denominada simplesmente <strong>"PAGSMILE"</strong>;</P>
      <P>E, de outro lado,</P>
      <P><V value={c.clientName} placeholder="[NOME COMPLETO DO CONTRATANTE]" />, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº <V value={c.clientDocument} />, com sede na <V value={c.clientAddress} />, <V value={c.clientCity} />/<V value={c.clientState} />, CEP <V value={c.clientZipCode} />, neste ato devidamente representada na forma de seus atos constitutivos, doravante denominado(a) simplesmente <strong>"CONTRATANTE"</strong>;</P>
      <P>PAGSMILE e CONTRATANTE, quando em conjunto, serão doravante denominadas "PARTES", e, individualmente, "PARTE".</P>

      {/* ===== QUADRO-RESUMO ===== */}
      <SectionHeading>QUADRO-RESUMO</SectionHeading>
      <KVTable items={[
        ['CONTRATANTE', <V value={c.clientName} />],
        ['CNPJ/CPF do CONTRATANTE', <V value={c.clientDocument} />],
        ['Endereço do CONTRATANTE', <><V value={c.clientAddress} />, <V value={c.clientCity} />/<V value={c.clientState} />, CEP <V value={c.clientZipCode} /></>],
        ['E-mail do CONTRATANTE', <V value={c.clientEmail} />],
        ['Telefone do CONTRATANTE', <V value={c.clientPhone} />],
        ['CONTRATADA', 'PAGSMILE INSTITUICAO DE PAGAMENTO LTDA'],
        ['CNPJ da CONTRATADA', '37.753.531/0001-65'],
        ['Endereço da CONTRATADA', 'Alameda Santos, 1940 - Cerqueira Cesar, São Paulo - SP, 01.418-102'],
        ['E-mail da CONTRATADA', 'juridico@pagsmile.com'],
        ['Telefone da CONTRATADA', '011996863004'],
        ['MÓDULOS ATIVOS', (
          <div style={{ lineHeight: 2 }}>
            <div><Check checked={mods.subadquirenciaCartao} /> Módulo A – Subadquirência / Gateway / Orquestrador / API Cartão / Antifraude</div>
            <div><Check checked={mods.contaPagamento} /> Módulo B – Conta (Conta de Pagamento / Conta Liquidação)</div>
            <div><Check checked={mods.pixRecebimentos} /> Módulo C – Cobrança Pix (API Pix para cobrança)</div>
            {c.otherModules && <div>Outros: {c.otherModules}</div>}
          </div>
        )],
        ['CONDIÇÕES COMERCIAIS POR MÓDULO', 'Conforme detalhado no Anexo II-A (Remuneração Módulo Subadquirência) e Anexo II-B (Tarifas Módulo Conta e Cobrança Pix).'],
        ['Data de Início', <V value={formatDate(c.contractDate)} />],
        ['Vigência do Contrato Master', <><V value={c.contractDurationMonths || '24'} /> (vinte e quatro) meses, renovação automática por até 3 (três) períodos consecutivos.</>],
        ['Foro', 'Comarca da Capital do Estado de São Paulo'],
      ]} />

      {/* ===== CONDIÇÕES GERAIS ===== */}
      <SectionHeading>CONDIÇÕES GERAIS DE PRESTAÇÃO DOS SERVIÇOS</SectionHeading>
      <P style={{ fontWeight: 600 }}>CONSIDERANDO QUE:</P>
      <P>I. A PAGSMILE é uma instituição de pagamento autorizada a operar no mercado de pagamentos digitais pelo Banco Central do Brasil, oferecendo infraestrutura tecnológica avançada e segura para processamento de pagamentos, gestão de fluxos financeiros, soluções de gateway/orquestrador de pagamento com antifraude robusto, incluindo APIs especializadas para PIX e transações com cartão, além de serviços de conta de pagamento digital, tudo em conformidade com as regulamentações vigentes;</P>
      <P>II. O CONTRATANTE possui interesse em contratar os serviços e soluções tecnológicas oferecidos pela PAGSMILE para otimizar suas operações comerciais e financeiras, buscando maior eficiência no processamento de transações, segurança contra fraudes e uma gestão simplificada de sua conta de pagamento, conforme os módulos de serviço selecionados e detalhados nos Anexos deste instrumento;</P>
      <P>III. As PARTES, de comum acordo e em boa-fé, celebram o presente Contrato Master de Prestação de Serviços e Abertura de Conta de Pagamento, que se regerá pelas cláusulas e condições a seguir estabelecidas e pelos Anexos que o integram, os quais são considerados partes integrantes e indissociáveis deste Contrato para todos os fins de direito.</P>
      <P style={{ fontWeight: 700, textAlign: 'center', marginTop: '20px', marginBottom: '20px', fontSize: '11px' }}>
        RESOLVEM AS PARTES CELEBRAR O PRESENTE CONTRATO, MEDIANTE AS CLÁUSULAS E CONDIÇÕES SEGUINTES:
      </P>

      {/* ===== ALL CLAUSES ===== */}
      <ContratoClausulas1a4 />
      <ContratoClausulas5a9 />
      <ContratoClausulas10a14 />
      <ContratoClausulas15a27 />

      {/* ===== ALL ANNEXES ===== */}
      <ContratoAnexos contract={contract} />

      {/* ===== CLÁUSULAS CUSTOMIZADAS ===== */}
      {c.customClauses && (
        <>
          <SectionHeading>CLÁUSULAS ADICIONAIS</SectionHeading>
          <div style={{ marginBottom: '24px', textAlign: 'justify', whiteSpace: 'pre-wrap', fontSize: '10.5px', lineHeight: 1.75, color: '#002443' }}>{c.customClauses}</div>
        </>
      )}

      {/* ===== ASSINATURAS ===== */}
      <div style={{ borderTop: '3px solid #2bc196', paddingTop: '32px', marginTop: '48px' }}>
        <SectionHeading>ASSINATURAS</SectionHeading>
        <P>E, por estarem assim justas e contratadas, as PARTES assinam o presente Contrato Master em 2 (duas) vias de igual teor e forma, na presença das testemunhas abaixo identificadas, para que produza todos os seus efeitos jurídicos e legais.</P>
        <p style={{ textAlign: 'center', marginBottom: '32px', fontSize: '11px', color: '#002443' }}>
          São Paulo, <V value={formatDate(c.contractDate)} />.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '32px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '2px solid #002443', marginBottom: '12px', paddingBottom: '48px' }} />
            <p style={{ fontWeight: 700, fontSize: '11px', color: '#002443', marginBottom: '4px' }}>PAGSMILE INSTITUICAO DE PAGAMENTO LTDA</p>
            <p style={{ fontSize: '10px', color: '#002443', margin: '2px 0' }}>CONTRATADA</p>
            <p style={{ fontSize: '10px', color: '#002443', margin: '2px 0' }}>Nome: <V value={c.pagsmileRepresentativeName || 'Ricardo Winter'} /></p>
            <p style={{ fontSize: '10px', color: '#002443', margin: '2px 0' }}>Cargo: <V value={c.pagsmileRepresentativeRole || 'CFO'} /></p>
            <p style={{ fontSize: '10px', color: '#002443', margin: '2px 0' }}>CPF: <V value={c.pagsmileRepresentativeCPF} /></p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '2px solid #002443', marginBottom: '12px', paddingBottom: '48px' }} />
            <p style={{ fontWeight: 700, fontSize: '11px', color: '#002443', marginBottom: '4px' }}><V value={c.clientName} placeholder="[NOME COMPLETO DO CONTRATANTE]" /></p>
            <p style={{ fontSize: '10px', color: '#002443', margin: '2px 0' }}>CONTRATANTE</p>
            <p style={{ fontSize: '10px', color: '#002443', margin: '2px 0' }}>Nome: <V value={c.clientRepresentativeName} /></p>
            <p style={{ fontSize: '10px', color: '#002443', margin: '2px 0' }}>Cargo: <V value={c.clientRepresentativeRole} /></p>
            <p style={{ fontSize: '10px', color: '#002443', margin: '2px 0' }}>CPF: <V value={c.clientRepresentativeCPF} /></p>
          </div>
        </div>

        <p style={{ fontWeight: 700, marginBottom: '16px', fontSize: '11px', color: '#002443' }}>TESTEMUNHAS:</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '2px solid #002443', marginBottom: '12px', paddingBottom: '32px' }} />
            <p style={{ fontSize: '10px', color: '#002443', margin: '2px 0' }}>1. Nome: <V value={c.witness1Name} /></p>
            <p style={{ fontSize: '10px', color: '#002443', margin: '2px 0' }}>CPF: <V value={c.witness1CPF} /></p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '2px solid #002443', marginBottom: '12px', paddingBottom: '32px' }} />
            <p style={{ fontSize: '10px', color: '#002443', margin: '2px 0' }}>2. Nome: <V value={c.witness2Name} /></p>
            <p style={{ fontSize: '10px', color: '#002443', margin: '2px 0' }}>CPF: <V value={c.witness2CPF} /></p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '40px', paddingTop: '16px', borderTop: '1px solid rgba(0,36,67,0.08)', textAlign: 'center' }}>
          <img src={LOGO_URL} alt="Pagsmile" style={{ height: '28px', opacity: 0.3 }} />
          <p style={{ fontSize: '9px', color: '#002443', opacity: 0.3, marginTop: '8px' }}>
            &copy; {new Date().getFullYear()} Pagsmile Instituição de Pagamento Ltda. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}