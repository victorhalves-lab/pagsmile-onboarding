import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * bdc_queryCnpjData — Consulta dados básicos de CNPJ na BigDataCorp (REAL)
 * 
 * Retorna dados cadastrais, endereço, CNAE/MCC, domínios e QSA.
 * Usa o endpoint /empresas com datasets: basic_data, registration_data, domains, merchant_category_data
 */

const BDC_BASE_URL = 'https://plataforma.bigdatacorp.com.br';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { cnpj } = payload;

    if (!cnpj) {
      return Response.json({ error: 'CNPJ is required' }, { status: 400 });
    }

    const cleanCnpj = cnpj.replace(/[^\d]/g, '');
    console.log(`[BDC] Querying real data for CNPJ ${cleanCnpj}`);

    const accessToken = Deno.env.get('BDC_ACCESS_TOKEN');
    const tokenId = Deno.env.get('BDC_TOKEN_ID');

    if (!accessToken || !tokenId) {
      return Response.json({ error: 'BDC tokens not configured' }, { status: 500 });
    }

    const datasets = 'basic_data,registration_data,domains,merchant_category_data,activity_indicators';
    const startTime = Date.now();

    const response = await fetch(`${BDC_BASE_URL}/empresas`, {
      method: 'POST',
      headers: {
        'AccessToken': accessToken,
        'TokenId': tokenId,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Datasets: datasets,
        q: `doc{${cleanCnpj}}`,
        Limit: 1,
      }),
    });

    const elapsedMs = Date.now() - startTime;
    const rawText = await response.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return Response.json({ error: 'Failed to parse BDC response', raw: rawText.substring(0, 500) }, { status: 500 });
    }

    const result = data.Result?.[0] || {};

    // Extract basic data
    const bd = result.BasicData || {};
    const regData = result.RegistrationData || {};
    const basicData = regData.BasicData || bd;

    // Extract address
    const addresses = regData.Addresses || result.Addresses;
    const firstAddr = Array.isArray(addresses) ? addresses[0] : (addresses || {});

    // Extract activities (CNAE)
    const activities = basicData.Activities || [];
    const mainActivity = activities.find(a => a.IsMain) || activities[0] || {};

    // Extract domains
    const domains = result.Domains || [];
    const domainNames = (Array.isArray(domains) ? domains : []).map(d => d.DomainName || d.Domain).filter(Boolean);

    // Extract MCC
    const mcc = result.MerchantCategoryData || {};

    // Extract QSA from RegistrationData
    const partners = regData.BasicData?.Partnerships || regData.Partnerships || [];

    // Build response
    const enrichedResponse = {
      basic_data: {
        tax_id: cleanCnpj,
        legal_name: basicData.OfficialName || basicData.CompanyName || '',
        trade_name: basicData.TradeName || basicData.FantasyName || '',
        status: basicData.TaxIdStatus || '',
        status_date: basicData.TaxIdStatusDate || '',
        foundation_date: basicData.FoundedDate || '',
        legal_nature: basicData.LegalNature?.Activity || basicData.LegalNature?.Code || '',
        capital: basicData.AdditionalOutputData?.CapitalRS || basicData.ShareCapital || '',
        company_size: basicData.CompanySize || basicData.Size || '',
        is_headquarter: basicData.IsHeadquarter,
        tax_regime: basicData.TaxRegime || '',
      },
      address: {
        street: firstAddr.Typology ? `${firstAddr.Typology} ${firstAddr.AddressMain || ''}`.trim() : (firstAddr.AddressMain || firstAddr.Street || ''),
        number: firstAddr.Number || '',
        complement: firstAddr.Complement || '',
        neighborhood: firstAddr.Neighborhood || firstAddr.District || '',
        city: firstAddr.City || firstAddr.Municipality || '',
        state: firstAddr.State || '',
        zip_code: firstAddr.ZipCode || firstAddr.Zip || '',
      },
      cnae: {
        code: mainActivity.Code || String(mainActivity.code || ''),
        description: mainActivity.Activity || mainActivity.Description || '',
      },
      secondary_cnaes: activities.filter(a => !a.IsMain).map(a => ({
        code: a.Code || '',
        description: a.Activity || a.Description || '',
      })),
      mcc: {
        code: mcc.MCC || mcc.CategoryCode || '',
        description: mcc.Description || mcc.CategoryDescription || '',
      },
      domains: domainNames.slice(0, 10),
      qsa: (Array.isArray(partners) ? partners : []).map(p => ({
        name: p.Name || p.PartnerName || '',
        document: p.TaxIdNumber || p.PartnerTaxIdNumber || '',
        role: p.Qualification || p.Role || '',
        participation: p.Participation || null,
      })),
      activity_indicators: {
        activity_level: result.ActivityIndicators?.ActivityLevel,
        shell_company_likelihood: result.ActivityIndicators?.ShellCompanyLikelyhood,
        employees_range: result.ActivityIndicators?.EmployeesRange || '',
        income_range: result.ActivityIndicators?.IncomeRange || '',
        has_active_domain: result.ActivityIndicators?.HasActiveDomain,
        has_active_ssl: result.ActivityIndicators?.HasActiveSSL,
        number_of_branches: result.ActivityIndicators?.NumberOfBranches,
      },
      _meta: {
        query_id: data.QueryId,
        elapsed_ms: data.ElapsedMilliseconds || elapsedMs,
        query_date: data.QueryDate,
        datasets_queried: datasets,
        source: 'bigdatacorp_real',
      },
    };

    // Log to IntegrationLog
    try {
      await base44.asServiceRole.entities.IntegrationLog.create({
        provider: "BigDataCorp",
        service_type: "empresas_basic_enrichment",
        request_id: data.QueryId || `bdc_req_${Date.now()}`,
        status: "success",
        result_status: enrichedResponse.basic_data.status || 'UNKNOWN',
        duration_ms: elapsedMs,
        request_payload: { cnpj: cleanCnpj, datasets },
        response_payload: { basic_data: enrichedResponse.basic_data, address: enrichedResponse.address },
      });
    } catch (logErr) {
      console.warn('[BDC] Log error:', logErr.message);
    }

    return Response.json(enrichedResponse);

  } catch (error) {
    console.error("[BDC] Error querying CNPJ:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});