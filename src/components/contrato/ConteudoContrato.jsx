import React from 'react';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/aabafccb7_Logo-modo-claro.png";

const V = ({ value, placeholder = '[A DEFINIR]' }) => {
  if (value && String(value).trim()) {
    return <strong style={{ color: '#002443' }}>{value}</strong>;
  }
  return <span style={{ color: '#e53e3e', backgroundColor: '#fff5f5', padding: '0 4px', borderRadius: '3px' }}>{placeholder}</span>;
};

const Num = ({ value, prefix = 'R$ ', placeholder = '[A DEFINIR]' }) => {
  if (value !== null && value !== undefined && value !== '') {
    const formatted = typeof value === 'number' 
      ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : value;
    return <strong style={{ color: '#002443' }}>{prefix}{formatted}</strong>;
  }
  return <span style={{ color: '#e53e3e', backgroundColor: '#fff5f5', padding: '0 4px', borderRadius: '3px' }}>{placeholder}</span>;
};

const Pct = ({ value, placeholder = '[A DEFINIR]' }) => {
  if (value !== null && value !== undefined && value !== '') {
    const formatted = typeof value === 'number'
      ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : value;
    return <strong style={{ color: '#002443' }}>{formatted}%</strong>;
  }
  return <span style={{ color: '#e53e3e', backgroundColor: '#fff5f5', padding: '0 4px', borderRadius: '3px' }}>{placeholder}</span>;
};

const Check = ({ checked }) => checked ? '☑' : '☐';

// Brand-styled section heading
const SectionHeading = ({ children, level = 1 }) => {
  if (level === 1) {
    return (
      <div style={{ borderTop: '3px solid #2bc196', paddingTop: '24px', marginTop: '32px', marginBottom: '16px' }}>
        <h2 style={{ 
          color: '#2bc196', 
          fontSize: '14px', 
          fontWeight: 700, 
          textTransform: 'uppercase', 
          letterSpacing: '1.5px',
          textAlign: 'center',
          margin: 0,
        }}>{children}</h2>
      </div>
    );
  }
  return (
    <h3 style={{ 
      color: '#2bc196', 
      fontSize: '12px', 
      fontWeight: 700, 
      marginBottom: '8px',
      marginTop: '20px',
      paddingBottom: '4px',
      borderBottom: '1px solid rgba(43,193,150,0.2)',
    }}>{children}</h3>
  );
};

// Branded table
const BrandTable = ({ headers, rows, compact = false }) => (
  <table style={{ 
    width: '100%', 
    borderCollapse: 'collapse', 
    marginBottom: '20px', 
    fontSize: compact ? '10px' : '11px',
    border: '1px solid rgba(0,36,67,0.12)',
    borderRadius: '8px',
    overflow: 'hidden',
  }}>
    {headers && (
      <thead>
        <tr style={{ backgroundColor: '#002443', color: '#ffffff' }}>
          {headers.map((h, i) => (
            <th key={i} style={{ 
              padding: compact ? '6px 8px' : '10px 12px', 
              textAlign: i === 0 ? 'left' : 'center',
              fontWeight: 600,
              fontSize: compact ? '9px' : '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>{h}</th>
          ))}
        </tr>
      </thead>
    )}
    <tbody>
      {rows.map((row, i) => (
        <tr key={i} style={{ 
          borderBottom: '1px solid rgba(0,36,67,0.06)',
          backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafb',
        }}>
          {row.map((cell, j) => (
            <td key={j} style={{ 
              padding: compact ? '6px 8px' : '10px 12px', 
              textAlign: j === 0 ? 'left' : 'center',
              fontWeight: j === 0 ? 600 : 400,
              color: '#002443',
              borderRight: j < row.length - 1 ? '1px solid rgba(0,36,67,0.06)' : 'none',
            }}>{cell}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

// KV table (label-value pairs)
const KVTable = ({ items }) => (
  <table style={{ 
    width: '100%', 
    borderCollapse: 'collapse', 
    marginBottom: '20px', 
    fontSize: '11px',
    border: '1px solid rgba(0,36,67,0.12)',
    borderRadius: '8px',
    overflow: 'hidden',
  }}>
    <tbody>
      {items.map(([label, value], i) => (
        <tr key={i} style={{ 
          borderBottom: '1px solid rgba(0,36,67,0.06)',
          backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafb',
        }}>
          <td style={{ 
            padding: '10px 14px', 
            fontWeight: 700, 
            color: '#002443',
            width: '40%',
            backgroundColor: 'rgba(0,36,67,0.02)',
            borderRight: '2px solid #2bc196',
            verticalAlign: 'top',
          }}>{label}</td>
          <td style={{ padding: '10px 14px', color: '#002443' }}>{value}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

// Clause title component
const ClauseTitle = ({ children }) => (
  <h3 style={{
    color: '#2bc196',
    fontSize: '12px',
    fontWeight: 700,
    marginTop: '24px',
    marginBottom: '12px',
    paddingBottom: '6px',
    borderBottom: '2px solid rgba(43,193,150,0.15)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  }}>{children}</h3>
);

// Paragraph
const P = ({ children }) => (
  <p style={{ 
    marginBottom: '10px', 
    textAlign: 'justify', 
    lineHeight: 1.7, 
    color: '#002443',
    fontSize: '11px',
  }}>{children}</p>
);

export default function ConteudoContrato({ contract }) {
  const c = contract || {};
  const rates = c.rates || {};
  const cartao = rates.cartao || {};
  const debito = rates.debito || {};
  const pix = rates.pix || {};
  const rav = rates.rav || {};
  const mods = c.modules || {};

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return dateStr; }
  };

  return (
    <div style={{ 
      padding: '48px 56px', 
      color: '#002443', 
      fontSize: '11px', 
      lineHeight: 1.7, 
      maxWidth: '850px', 
      margin: '0 auto',
      fontFamily: "'Plus Jakarta Sans', 'Helvetica Neue', Arial, sans-serif",
      backgroundColor: '#ffffff',
    }}>
      {/* ===== HEADER WITH LOGO & GRADIENT ===== */}
      <div style={{ 
        background: 'linear-gradient(135deg, #002443 0%, #003366 50%, #36706c 100%)',
        borderRadius: '16px',
        padding: '40px 32px',
        marginBottom: '32px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, right: 0, width: '200px', height: '200px',
          background: 'radial-gradient(circle, rgba(43,193,150,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <img src={LOGO_URL} alt="Pagsmile" style={{ height: '40px', marginBottom: '20px', filter: 'brightness(0) invert(1)' }} />
        <h1 style={{ 
          color: '#ffffff', 
          fontSize: '16px', 
          fontWeight: 700, 
          textTransform: 'uppercase', 
          letterSpacing: '2px',
          marginBottom: '8px',
          position: 'relative',
        }}>
          CONTRATO MASTER DE PRESTAÇÃO DE SERVIÇOS
        </h1>
        <p style={{ color: '#5cf7cf', fontSize: '11px', fontWeight: 500, letterSpacing: '1px', position: 'relative' }}>
          ABERTURA DE CONTA DE PAGAMENTO E SUBADQUIRÊNCIA
        </p>
        <div style={{ width: '60px', height: '3px', background: '#2bc196', margin: '16px auto 0', borderRadius: '2px' }} />
      </div>

      {/* ===== PREÂMBULO ===== */}
      <P>
        Pelo presente instrumento particular, de um lado, <strong>PAGSMILE INSTITUICAO DE PAGAMENTO LTDA</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 37.753.531/0001-65, com sede na Alameda Santos, 1940 - Cerqueira Cesar, São Paulo - SP, 01.418-102, neste ato devidamente representada na forma de seus atos constitutivos, doravante denominada simplesmente <strong>"PAGSMILE"</strong>;
      </P>
      <P>
        E, de outro lado, <V value={c.clientName} placeholder="[NOME COMPLETO DO CONTRATANTE]" />, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº <V value={c.clientDocument} />, com sede na <V value={c.clientAddress} />, <V value={c.clientCity} />/<V value={c.clientState} />, CEP <V value={c.clientZipCode} />, neste ato devidamente representada na forma de seus atos constitutivos, doravante denominado(a) simplesmente <strong>"CONTRATANTE"</strong>;
      </P>
      <P>
        PAGSMILE e CONTRATANTE, quando em conjunto, serão doravante denominadas "PARTES", e, individualmente, "PARTE".
      </P>

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
        ['CONDIÇÕES COMERCIAIS', 'Conforme detalhado no Anexo II-A (Remuneração Módulo Subadquirência) e Anexo II-B (Tarifas Módulo Conta e Cobrança Pix).'],
        ['Data de Início', <V value={formatDate(c.contractDate)} />],
        ['Vigência do Contrato Master', <><V value={c.contractDurationMonths || '24'} /> meses, renovação automática por até 3 períodos consecutivos.</>],
        ['Foro', 'Comarca da Capital do Estado de São Paulo'],
      ]} />

      {/* ===== CLÁUSULAS RESUMIDAS ===== */}
      <div style={{ 
        backgroundColor: '#f8fafb', 
        border: '1px solid rgba(0,36,67,0.08)', 
        borderRadius: '8px', 
        padding: '16px 20px', 
        marginBottom: '24px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '10px', color: '#002443', opacity: 0.5, fontStyle: 'italic', margin: 0 }}>
          As Cláusulas 1ª a 27ª do Contrato Master seguem conforme o modelo padrão Pagsmile, incluindo:
          Objeto Contratual • Vigência • Remuneração • Direitos e Obrigações • Conformidade • Monitoramento de Risco • IA/Antifraude • Confidencialidade • Extinção Contratual • LGPD • Chargeback • Reserva de Segurança • Anticorrupção • Propriedade Intelectual • Limitação de Responsabilidade • Foro
        </p>
      </div>

      {/* ===== ANEXO II-A - REMUNERAÇÃO SUBADQUIRÊNCIA ===== */}
      <SectionHeading>ANEXO II-A – REMUNERAÇÃO MÓDULO SUBADQUIRÊNCIA</SectionHeading>

      <SectionHeading level={2}>1. MDR Cartão de Crédito</SectionHeading>
      <BrandTable 
        headers={['Bandeira', 'À Vista', '2-6x', '7-12x', '13-21x']}
        rows={['visa', 'mastercard', 'elo', 'amex', 'outras'].map(b => [
          b === 'outras' ? 'Outras' : b.charAt(0).toUpperCase() + b.slice(1),
          <Pct value={cartao[b]?.avista} />,
          <Pct value={cartao[b]?.de2a6x} />,
          <Pct value={cartao[b]?.de7a12x} />,
          <Pct value={cartao[b]?.de13a21x} />,
        ])}
      />

      <SectionHeading level={2}>2. MDR Débito</SectionHeading>
      <BrandTable
        headers={['Visa', 'Mastercard', 'Elo', 'Outras']}
        rows={[[
          <Pct value={debito.visa} />,
          <Pct value={debito.mastercard} />,
          <Pct value={debito.elo} />,
          <Pct value={debito.outras} />,
        ]]}
      />

      <SectionHeading level={2}>3. Outras Taxas</SectionHeading>
      <KVTable items={[
        ['Taxa Pix', pix.tipo === 'fixo' ? <Num value={pix.valor} /> : <Pct value={pix.valor} />],
        ['Boleto', <Num value={rates.boleto} />],
        ['Antifraude', <Num value={rates.antifraude} />],
        ['Fee por Transação', <Num value={rates.feeTransacao} />],
        ['Taxa RAV (Antecipação)', <Pct value={rav.taxa} />],
        ['Prazo de Recebimento', <V value={rav.prazo || c.paymentTerm} />],
        ['% Antecipação', <Pct value={rates.percentualAntecipacao} />],
        ['Alerta Pré-Chargeback', <Num value={rates.alertaPreChargeback} />],
        ['Setup', <Num value={c.setupFee} />],
      ]} />

      <SectionHeading level={2}>4. TPV Mínimo Garantido</SectionHeading>
      <P>
        O CONTRATANTE compromete-se a manter os seguintes volumes mínimos de TPV (Total Payment Volume):
      </P>
      <BrandTable
        headers={['Mês 1', 'Mês 2', 'Mês 3 em diante']}
        rows={[[
          <Num value={c.projectedTpvMonth1} />,
          <Num value={c.projectedTpvMonth2} />,
          <Num value={c.projectedTpvMonth3} />,
        ]]}
      />

      {/* ===== ANEXO II-B - TARIFAS CONTA ===== */}
      <SectionHeading>ANEXO II-B – TARIFAS MÓDULO CONTA E COBRANÇA PIX</SectionHeading>

      <KVTable items={[
        ['Manutenção de Conta', <Num value={c.accountMaintenanceFee} />],
        ['Saque com Cartão', <Num value={c.cardWithdrawalFee} />],
        ['Transferência TED/DOC', <Num value={c.tedDocTransferFee} />],
        ['Emissão Cartão Físico', <Num value={c.physicalCardIssuanceFee} />],
        ['2ª Via Cartão Físico', <Num value={c.physicalCard2ndCopyFee} />],
      ]} />

      <SectionHeading level={2}>Dados Bancários para Liquidação</SectionHeading>
      <KVTable items={[
        ['Instituição Bancária', <V value={c.bankInstitution || 'A55 Sociedade de Crédito Direto S/A'} />],
        ['Agência', <V value={c.bankAgency} />],
        ['Conta', <V value={c.bankAccountNumber} />],
      ]} />

      {/* ===== SLAs ===== */}
      <SectionHeading>NÍVEIS DE SERVIÇO (SLA)</SectionHeading>
      <KVTable items={[
        ['Disponibilidade (Uptime)', <V value={c.slaUptime || '99.5%'} />],
        ['Tempo de Resposta API', <V value={c.slaResponseTime || '600ms'} />],
        ['Suporte Crítico', <V value={c.supportCriticalSLA || 'Até 1 hora (24/7)'} />],
        ['Suporte Alto', <V value={c.supportHighSLA || 'Até 6 horas (horário comercial)'} />],
        ['Suporte Médio', <V value={c.supportMediumSLA || 'Até 1 dia (horário comercial)'} />],
        ['Suporte Baixo', <V value={c.supportLowSLA || 'Até 5 dias úteis'} />],
        ['Reserva Risco Pix', <><Pct value={c.pixRiskReservePercentage || 1} /> por <V value={c.pixRiskReserveDays ? `${c.pixRiskReserveDays} dias` : '90 dias'} /></>],
        ['Reserva Risco Cartão', <><Pct value={c.cardRiskReservePercentage || 5} /> por <V value={c.cardRiskReserveDays ? `${c.cardRiskReserveDays} dias` : '120 dias'} /></>],
        ['Taxa de Chargeback', <Num value={c.chargebackFee || 65} />],
        ['Threshold Chargeback', <Pct value={c.chargebackThreshold || 5} />],
      ]} />

      {/* Cláusulas Customizadas */}
      {c.customClauses && (
        <>
          <SectionHeading>CLÁUSULAS ADICIONAIS</SectionHeading>
          <div style={{ marginBottom: '24px', textAlign: 'justify', whiteSpace: 'pre-wrap', fontSize: '11px', lineHeight: 1.7 }}>{c.customClauses}</div>
        </>
      )}

      {/* ===== ASSINATURA ===== */}
      <div style={{ borderTop: '3px solid #2bc196', paddingTop: '32px', marginTop: '40px' }}>
        <P style={{ textAlign: 'center' }}>
          E, por estarem assim justas e contratadas, as PARTES firmam o presente instrumento em 2 (duas) vias de igual teor e forma, na presença de 2 (duas) testemunhas.
        </P>
        <p style={{ textAlign: 'center', marginBottom: '32px', fontSize: '11px', color: '#002443' }}>
          São Paulo, <V value={formatDate(c.contractDate)} />.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '32px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '2px solid #002443', marginBottom: '12px', paddingBottom: '48px' }} />
            <p style={{ fontWeight: 700, fontSize: '11px', color: '#002443', marginBottom: '4px' }}>PAGSMILE INSTITUICAO DE PAGAMENTO LTDA</p>
            <p style={{ fontSize: '10px', color: '#002443' }}>Nome: <V value={c.pagsmileRepresentativeName || 'Ricardo Winter'} /></p>
            <p style={{ fontSize: '10px', color: '#002443' }}>Cargo: <V value={c.pagsmileRepresentativeRole || 'CFO'} /></p>
            <p style={{ fontSize: '10px', color: '#002443' }}>CPF: <V value={c.pagsmileRepresentativeCPF} /></p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '2px solid #002443', marginBottom: '12px', paddingBottom: '48px' }} />
            <p style={{ fontWeight: 700, fontSize: '11px', color: '#002443', marginBottom: '4px' }}><V value={c.clientName} placeholder="[CONTRATANTE]" /></p>
            <p style={{ fontSize: '10px', color: '#002443' }}>Nome: <V value={c.clientRepresentativeName} /></p>
            <p style={{ fontSize: '10px', color: '#002443' }}>Cargo: <V value={c.clientRepresentativeRole} /></p>
            <p style={{ fontSize: '10px', color: '#002443' }}>CPF: <V value={c.clientRepresentativeCPF} /></p>
          </div>
        </div>

        <p style={{ fontWeight: 700, marginBottom: '16px', fontSize: '11px', color: '#002443' }}>TESTEMUNHAS:</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '2px solid #002443', marginBottom: '12px', paddingBottom: '32px' }} />
            <p style={{ fontSize: '10px', color: '#002443' }}>Nome: <V value={c.witness1Name} /></p>
            <p style={{ fontSize: '10px', color: '#002443' }}>CPF: <V value={c.witness1CPF} /></p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '2px solid #002443', marginBottom: '12px', paddingBottom: '32px' }} />
            <p style={{ fontSize: '10px', color: '#002443' }}>Nome: <V value={c.witness2Name} /></p>
            <p style={{ fontSize: '10px', color: '#002443' }}>CPF: <V value={c.witness2CPF} /></p>
          </div>
        </div>

        {/* Footer branding */}
        <div style={{ 
          marginTop: '40px', 
          paddingTop: '16px', 
          borderTop: '1px solid rgba(0,36,67,0.08)',
          textAlign: 'center',
        }}>
          <img src={LOGO_URL} alt="Pagsmile" style={{ height: '24px', opacity: 0.3 }} />
          <p style={{ fontSize: '9px', color: '#002443', opacity: 0.3, marginTop: '8px' }}>
            &copy; {new Date().getFullYear()} Pagsmile Instituição de Pagamento Ltda. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}