import React from 'react';

const V = ({ value, placeholder = '[A DEFINIR]' }) => {
  if (value && String(value).trim()) {
    return <strong className="text-[#002443]">{value}</strong>;
  }
  return <span className="text-red-500 bg-red-50 px-1 rounded">{placeholder}</span>;
};

const Num = ({ value, prefix = 'R$ ', placeholder = '[A DEFINIR]' }) => {
  if (value !== null && value !== undefined && value !== '') {
    const formatted = typeof value === 'number' 
      ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : value;
    return <strong className="text-[#002443]">{prefix}{formatted}</strong>;
  }
  return <span className="text-red-500 bg-red-50 px-1 rounded">{placeholder}</span>;
};

const Pct = ({ value, placeholder = '[A DEFINIR]' }) => {
  if (value !== null && value !== undefined && value !== '') {
    const formatted = typeof value === 'number'
      ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : value;
    return <strong className="text-[#002443]">{formatted}%</strong>;
  }
  return <span className="text-red-500 bg-red-50 px-1 rounded">{placeholder}</span>;
};

const Check = ({ checked }) => checked ? '☑' : '☐';

export default function ConteudoContrato({ contract }) {
  const c = contract || {};
  const rates = c.rates || {};
  const cartao = rates.cartao || {};
  const debito = rates.debito || {};
  const pix = rates.pix || {};
  const rav = rates.rav || {};
  const mods = c.modules || {};

  return (
    <div className="p-8 md:p-12 text-[#002443] text-sm leading-relaxed max-w-[800px] mx-auto" style={{ fontFamily: 'Georgia, serif' }}>
      {/* Título */}
      <h1 className="text-center text-base font-bold mb-6 uppercase tracking-wide">
        CONTRATO MASTER DE PRESTAÇÃO DE SERVIÇOS DE ABERTURA DE CONTA DE PAGAMENTO E SUBADQUIRÊNCIA
      </h1>

      {/* Preâmbulo */}
      <p className="mb-4 text-justify">
        Pelo presente instrumento particular, de um lado, <strong>PAGSMILE INSTITUICAO DE PAGAMENTO LTDA</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 37.753.531/0001-65, com sede na Alameda Santos, 1940 - Cerqueira Cesar, São Paulo - SP, 01.418-102, neste ato devidamente representada na forma de seus atos constitutivos, doravante denominada simplesmente <strong>"PAGSMILE"</strong>;
      </p>
      <p className="mb-4 text-justify">
        E, de outro lado, <V value={c.clientName} placeholder="[NOME COMPLETO DO CONTRATANTE]" />, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº <V value={c.clientDocument} />, com sede na <V value={c.clientAddress} />, <V value={c.clientCity} />/<V value={c.clientState} />, CEP <V value={c.clientZipCode} />, neste ato devidamente representada na forma de seus atos constitutivos, doravante denominado(a) simplesmente <strong>"CONTRATANTE"</strong>;
      </p>
      <p className="mb-6 text-justify">
        PAGSMILE e CONTRATANTE, quando em conjunto, serão doravante denominadas "PARTES", e, individualmente, "PARTE".
      </p>

      {/* Quadro-Resumo */}
      <h2 className="text-center font-bold text-base mb-4 uppercase">QUADRO-RESUMO</h2>
      <table className="w-full border-collapse border border-[#002443]/20 mb-6 text-xs">
        <tbody>
          {[
            ['CONTRATANTE', <V value={c.clientName} />],
            ['CNPJ/CPF do CONTRATANTE', <V value={c.clientDocument} />],
            ['Endereço do CONTRATANTE', <>{<V value={c.clientAddress} />}, {<V value={c.clientCity} />}/{<V value={c.clientState} />}, CEP {<V value={c.clientZipCode} />}</>],
            ['E-mail do CONTRATANTE', <V value={c.clientEmail} />],
            ['Telefone do CONTRATANTE', <V value={c.clientPhone} />],
            ['CONTRATADA', 'PAGSMILE INSTITUICAO DE PAGAMENTO LTDA'],
            ['CNPJ da CONTRATADA', '37.753.531/0001-65'],
            ['Endereço da CONTRATADA', 'Alameda Santos, 1940 - Cerqueira Cesar, São Paulo - SP, 01.418-102'],
            ['E-mail da CONTRATADA', 'juridico@pagsmile.com'],
            ['Telefone da CONTRATADA', '011996863004'],
            ['MÓDULOS ATIVOS', (
              <div className="space-y-1">
                <div><Check checked={mods.subadquirenciaCartao} /> Módulo A – Subadquirência / Gateway / Orquestrador / API Cartão / Antifraude</div>
                <div><Check checked={mods.contaPagamento} /> Módulo B – Conta (Conta de Pagamento / Conta Liquidação)</div>
                <div><Check checked={mods.pixRecebimentos} /> Módulo C – Cobrança Pix (API Pix para cobrança)</div>
                {c.otherModules && <div>Outros: {c.otherModules}</div>}
              </div>
            )],
            ['CONDIÇÕES COMERCIAIS', 'Conforme detalhado no Anexo II-A (Remuneração Módulo Subadquirência) e Anexo II-B (Tarifas Módulo Conta e Cobrança Pix).'],
            ['Data de Início', <V value={c.contractDate} />],
            ['Vigência do Contrato Master', <>{<V value={c.contractDurationMonths || '24'} />} meses, renovação automática.</>],
            ['Foro', 'Comarca da Capital do Estado de São Paulo'],
          ].map(([label, value], i) => (
            <tr key={i} className="border-b border-[#002443]/10">
              <td className="border-r border-[#002443]/20 p-2 font-bold bg-[#002443]/[0.03] w-1/3 align-top">{label}</td>
              <td className="p-2">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Nota: Cláusulas do contrato integral (resumido para renderização) */}
      <p className="text-center text-[10px] text-[#002443]/40 mb-6 italic">
        [As Cláusulas 1ª a 21ª do Contrato Master seguem conforme o modelo padrão Pagsmile]
      </p>

      {/* ===== ANEXO II-A - REMUNERAÇÃO SUBADQUIRÊNCIA ===== */}
      <h2 className="text-center font-bold text-base mb-4 uppercase border-t-2 border-[#002443]/20 pt-6">
        ANEXO II-A – REMUNERAÇÃO MÓDULO SUBADQUIRÊNCIA
      </h2>

      {/* Taxas Cartão Crédito */}
      <h3 className="font-bold text-sm mb-2">1. MDR Cartão de Crédito</h3>
      <table className="w-full border-collapse border border-[#002443]/20 mb-4 text-xs">
        <thead>
          <tr className="bg-[#002443]/[0.05]">
            <th className="border border-[#002443]/20 p-2 text-left">Bandeira</th>
            <th className="border border-[#002443]/20 p-2 text-center">À Vista</th>
            <th className="border border-[#002443]/20 p-2 text-center">2-6x</th>
            <th className="border border-[#002443]/20 p-2 text-center">7-12x</th>
          </tr>
        </thead>
        <tbody>
          {['visa', 'mastercard', 'elo', 'amex', 'outras'].map(b => (
            <tr key={b} className="border-b border-[#002443]/10">
              <td className="border-r border-[#002443]/20 p-2 font-medium capitalize">{b === 'outras' ? 'Outras' : b.charAt(0).toUpperCase() + b.slice(1)}</td>
              <td className="border-r border-[#002443]/20 p-2 text-center"><Pct value={cartao[b]?.avista} /></td>
              <td className="border-r border-[#002443]/20 p-2 text-center"><Pct value={cartao[b]?.de2a6x} /></td>
              <td className="p-2 text-center"><Pct value={cartao[b]?.de7a12x} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Taxas Débito */}
      <h3 className="font-bold text-sm mb-2">2. MDR Débito</h3>
      <table className="w-full border-collapse border border-[#002443]/20 mb-4 text-xs">
        <thead>
          <tr className="bg-[#002443]/[0.05]">
            {['Visa', 'Mastercard', 'Elo', 'Outras'].map(b => (
              <th key={b} className="border border-[#002443]/20 p-2 text-center">{b}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {['visa', 'mastercard', 'elo', 'outras'].map(b => (
              <td key={b} className="border border-[#002443]/20 p-2 text-center"><Pct value={debito[b]} /></td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* Pix e Outras */}
      <h3 className="font-bold text-sm mb-2">3. Outras Taxas</h3>
      <table className="w-full border-collapse border border-[#002443]/20 mb-4 text-xs">
        <tbody>
          {[
            ['Taxa Pix', pix.tipo === 'fixo' ? <Num value={pix.valor} /> : <Pct value={pix.valor} />],
            ['Boleto', <Num value={rates.boleto} />],
            ['Antifraude', <Num value={rates.antifraude} />],
            ['Fee por Transação', <Num value={rates.feeTransacao} />],
            ['Taxa RAV (Antecipação)', <Pct value={rav.taxa} />],
            ['Prazo de Recebimento', <V value={rav.prazo || c.paymentTerm} />],
            ['% Antecipação', <Pct value={rates.percentualAntecipacao} />],
            ['Alerta Pré-Chargeback', <Num value={rates.alertaPreChargeback} />],
            ['Setup', <Num value={c.setupFee} />],
          ].map(([label, value], i) => (
            <tr key={i} className="border-b border-[#002443]/10">
              <td className="border-r border-[#002443]/20 p-2 font-medium w-1/2">{label}</td>
              <td className="p-2 text-center">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TPV Projetado */}
      <h3 className="font-bold text-sm mb-2">4. TPV Projetado</h3>
      <p className="mb-2 text-justify text-xs">
        O CONTRATANTE declara e se compromete a atingir os seguintes volumes mínimos de TPV (Total Payment Volume) projetado:
      </p>
      <table className="w-full border-collapse border border-[#002443]/20 mb-4 text-xs">
        <thead>
          <tr className="bg-[#002443]/[0.05]">
            <th className="border border-[#002443]/20 p-2 text-center">Mês 1</th>
            <th className="border border-[#002443]/20 p-2 text-center">Mês 2</th>
            <th className="border border-[#002443]/20 p-2 text-center">Mês 3 em diante</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-[#002443]/20 p-2 text-center"><Num value={c.projectedTpvMonth1} /></td>
            <td className="border border-[#002443]/20 p-2 text-center"><Num value={c.projectedTpvMonth2} /></td>
            <td className="border border-[#002443]/20 p-2 text-center"><Num value={c.projectedTpvMonth3} /></td>
          </tr>
        </tbody>
      </table>

      {/* ===== ANEXO II-B - TARIFAS CONTA ===== */}
      <h2 className="text-center font-bold text-base mb-4 uppercase border-t-2 border-[#002443]/20 pt-6">
        ANEXO II-B – TARIFAS MÓDULO CONTA E COBRANÇA PIX
      </h2>
      <table className="w-full border-collapse border border-[#002443]/20 mb-4 text-xs">
        <tbody>
          {[
            ['Manutenção de Conta', <Num value={c.accountMaintenanceFee} />],
            ['Saque com Cartão', <Num value={c.cardWithdrawalFee} />],
            ['Transferência TED/DOC', <Num value={c.tedDocTransferFee} />],
            ['Emissão Cartão Físico', <Num value={c.physicalCardIssuanceFee} />],
            ['2ª Via Cartão Físico', <Num value={c.physicalCard2ndCopyFee} />],
          ].map(([label, value], i) => (
            <tr key={i} className="border-b border-[#002443]/10">
              <td className="border-r border-[#002443]/20 p-2 font-medium w-1/2">{label}</td>
              <td className="p-2 text-center">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Dados Bancários */}
      <h3 className="font-bold text-sm mb-2">Dados Bancários para Liquidação</h3>
      <table className="w-full border-collapse border border-[#002443]/20 mb-6 text-xs">
        <tbody>
          {[
            ['Instituição Bancária', <V value={c.bankInstitution} />],
            ['Agência', <V value={c.bankAgency} />],
            ['Conta', <V value={c.bankAccountNumber} />],
          ].map(([label, value], i) => (
            <tr key={i} className="border-b border-[#002443]/10">
              <td className="border-r border-[#002443]/20 p-2 font-medium w-1/3">{label}</td>
              <td className="p-2">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* SLAs */}
      <h2 className="text-center font-bold text-base mb-4 uppercase border-t-2 border-[#002443]/20 pt-6">
        NÍVEIS DE SERVIÇO (SLA)
      </h2>
      <table className="w-full border-collapse border border-[#002443]/20 mb-6 text-xs">
        <tbody>
          {[
            ['Disponibilidade (Uptime)', <V value={c.slaUptime} />],
            ['Tempo de Resposta', <V value={c.slaResponseTime} />],
            ['Suporte Crítico', <V value={c.supportCriticalSLA} />],
            ['Suporte Alto', <V value={c.supportHighSLA} />],
            ['Suporte Médio', <V value={c.supportMediumSLA} />],
            ['Suporte Baixo', <V value={c.supportLowSLA} />],
            ['Reserva Risco Pix', <><Pct value={c.pixRiskReservePercentage} /> por <V value={c.pixRiskReserveDays ? `${c.pixRiskReserveDays} dias` : null} /></>],
            ['Reserva Risco Cartão', <><Pct value={c.cardRiskReservePercentage} /> por <V value={c.cardRiskReserveDays ? `${c.cardRiskReserveDays} dias` : null} /></>],
            ['Taxa de Chargeback', <Num value={c.chargebackFee} />],
            ['Threshold Chargeback', <Pct value={c.chargebackThreshold} />],
          ].map(([label, value], i) => (
            <tr key={i} className="border-b border-[#002443]/10">
              <td className="border-r border-[#002443]/20 p-2 font-medium w-1/3">{label}</td>
              <td className="p-2">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Cláusulas Customizadas */}
      {c.customClauses && (
        <>
          <h2 className="text-center font-bold text-base mb-4 uppercase border-t-2 border-[#002443]/20 pt-6">
            CLÁUSULAS ADICIONAIS
          </h2>
          <div className="mb-6 text-justify whitespace-pre-wrap">{c.customClauses}</div>
        </>
      )}

      {/* Assinatura */}
      <div className="border-t-2 border-[#002443]/20 pt-6 mt-8">
        <p className="text-center mb-8">
          E, por estarem assim justas e contratadas, as PARTES firmam o presente instrumento em 2 (duas) vias de igual teor e forma, na presença de 2 (duas) testemunhas.
        </p>
        <p className="text-center mb-8">São Paulo, <V value={c.contractDate ? new Date(c.contractDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />.</p>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="text-center">
            <div className="border-b border-[#002443]/30 mb-2 pb-12"></div>
            <p className="font-bold">PAGSMILE INSTITUICAO DE PAGAMENTO LTDA</p>
            <p className="text-xs">Nome: <V value={c.pagsmileRepresentativeName} /></p>
            <p className="text-xs">Cargo: <V value={c.pagsmileRepresentativeRole} /></p>
            <p className="text-xs">CPF: <V value={c.pagsmileRepresentativeCPF} /></p>
          </div>
          <div className="text-center">
            <div className="border-b border-[#002443]/30 mb-2 pb-12"></div>
            <p className="font-bold"><V value={c.clientName} placeholder="[CONTRATANTE]" /></p>
            <p className="text-xs">Nome: <V value={c.clientRepresentativeName} /></p>
            <p className="text-xs">Cargo: <V value={c.clientRepresentativeRole} /></p>
            <p className="text-xs">CPF: <V value={c.clientRepresentativeCPF} /></p>
          </div>
        </div>

        <p className="font-bold mb-4">TESTEMUNHAS:</p>
        <div className="grid grid-cols-2 gap-8">
          <div className="text-center">
            <div className="border-b border-[#002443]/30 mb-2 pb-8"></div>
            <p className="text-xs">Nome: <V value={c.witness1Name} /></p>
            <p className="text-xs">CPF: <V value={c.witness1CPF} /></p>
          </div>
          <div className="text-center">
            <div className="border-b border-[#002443]/30 mb-2 pb-8"></div>
            <p className="text-xs">Nome: <V value={c.witness2Name} /></p>
            <p className="text-xs">CPF: <V value={c.witness2CPF} /></p>
          </div>
        </div>
      </div>
    </div>
  );
}