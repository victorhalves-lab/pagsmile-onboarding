import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Validação de campos do Lead:
 * - site: verifica domínio .br (Registro.br), HTTP HEAD, SSL, plataforma e-commerce
 * - email: DNS MX lookup
 * - phone: validação DDD via BrasilAPI
 */

async function validateSite(siteUrl) {
  const result = {
    domain: null,
    is_registered: null,
    domain_age_days: null,
    is_online: null,
    has_ssl: null,
    ecommerce_platform: null,
    errors: []
  };

  if (!siteUrl) return result;

  // Extrair domínio
  let domain;
  try {
    const url = new URL(siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`);
    domain = url.hostname.replace('www.', '');
    result.domain = domain;
  } catch {
    result.errors.push('URL inválida');
    return result;
  }

  // 1. Verificar Registro.br (apenas .br)
  if (domain.endsWith('.br')) {
    try {
      const resp = await fetch(`https://brasilapi.com.br/api/registrobr/v1/${domain}`, {
        signal: AbortSignal.timeout(5000)
      });
      if (resp.ok) {
        const data = await resp.json();
        result.is_registered = data.status !== 'AVAILABLE';
        if (data.expires_at) {
          // Calcular idade aproximada (registrado há quanto tempo)
          const expires = new Date(data.expires_at);
          const now = new Date();
          // Domínios .br são renovados anualmente, expires é a data futura
          result.domain_age_days = null; // Não é possível calcular sem data de criação
        }
      }
    } catch (e) {
      result.errors.push('Registro.br indisponível');
    }
  }

  // 2. HTTP HEAD para verificar se está online + SSL
  const urlToCheck = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`;
  try {
    const resp = await fetch(urlToCheck, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
      redirect: 'follow'
    });
    result.is_online = [200, 301, 302, 303, 307, 308].includes(resp.status);
    result.has_ssl = urlToCheck.startsWith('https://') && result.is_online;
  } catch (e) {
    // Tentar sem SSL
    if (urlToCheck.startsWith('https://')) {
      try {
        const httpUrl = urlToCheck.replace('https://', 'http://');
        const resp2 = await fetch(httpUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000),
          redirect: 'follow'
        });
        result.is_online = [200, 301, 302, 303, 307, 308].includes(resp2.status);
        result.has_ssl = false;
      } catch {
        result.is_online = false;
        result.has_ssl = false;
      }
    } else {
      result.is_online = false;
    }
  }

  // 3. Detectar plataforma e-commerce (GET + analisar HTML/headers)
  if (result.is_online) {
    try {
      const getUrl = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`;
      const resp = await fetch(getUrl, {
        signal: AbortSignal.timeout(8000),
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0 PagSmile Lead Validator' }
      });
      
      const html = await resp.text();
      const htmlLower = html.toLowerCase().slice(0, 50000); // Só analisa os primeiros 50K
      const headers = Object.fromEntries(resp.headers.entries());
      const allHeaders = JSON.stringify(headers).toLowerCase();

      if (htmlLower.includes('shopify') || allHeaders.includes('shopify')) {
        result.ecommerce_platform = 'Shopify';
      } else if (htmlLower.includes('vtex') || allHeaders.includes('vtex')) {
        result.ecommerce_platform = 'VTEX';
      } else if (htmlLower.includes('woocommerce') || htmlLower.includes('wp-content')) {
        result.ecommerce_platform = 'WooCommerce';
      } else if (htmlLower.includes('nuvemshop') || htmlLower.includes('tiendanube')) {
        result.ecommerce_platform = 'Nuvemshop';
      } else if (htmlLower.includes('magento') || htmlLower.includes('mage')) {
        result.ecommerce_platform = 'Magento';
      } else if (htmlLower.includes('lojaintegrada') || htmlLower.includes('loja integrada')) {
        result.ecommerce_platform = 'Loja Integrada';
      } else if (htmlLower.includes('tray.com') || htmlLower.includes('tray ')) {
        result.ecommerce_platform = 'Tray';
      } else if (htmlLower.includes('wix.com') || allHeaders.includes('wix')) {
        result.ecommerce_platform = 'Wix';
      }
    } catch {
      // Silently ignore
    }
  }

  return result;
}

async function validateEmailMx(email) {
  if (!email || !email.includes('@')) return { valid: false, has_mx: null };
  
  const domain = email.split('@')[1];
  try {
    // Use Google DNS-over-HTTPS to check MX records
    const resp = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`, {
      signal: AbortSignal.timeout(5000)
    });
    const data = await resp.json();
    const hasMx = data.Answer && data.Answer.length > 0;
    return { valid: true, has_mx: hasMx, domain };
  } catch {
    return { valid: true, has_mx: null, domain, error: 'DNS lookup failed' };
  }
}

async function validateDdd(phone) {
  if (!phone || phone.length < 2) return { valid: false };
  
  const digits = phone.replace(/\D/g, '');
  const ddd = digits.slice(0, 2);
  
  try {
    const resp = await fetch(`https://brasilapi.com.br/api/ddd/v1/${ddd}`, {
      signal: AbortSignal.timeout(5000)
    });
    if (resp.status === 404) {
      return { valid: false, ddd, state: null, error: `DDD ${ddd} não existe` };
    }
    if (resp.ok) {
      const data = await resp.json();
      return { valid: true, ddd, state: data.state };
    }
    return { valid: true, ddd, state: null };
  } catch {
    return { valid: true, ddd, state: null, error: 'API indisponível' };
  }
}

Deno.serve(async (req) => {
  try {
    // Tolerante a requests anônimos (cliente público sem token).
    // Note: esta função não usa base44 SDK internamente — apenas fetches externos.
    // O createClient tolerante mantém compatibilidade caso seja chamado de página autenticada.
    try {
      createClientFromRequest(req);
    } catch (_) {
      // Anônimo — ok, prosseguir sem cliente Base44.
    }
    const { type, value, cnpjData } = await req.json();

    if (type === 'site') {
      const result = await validateSite(value);
      
      // Adicionar comparação DDD vs UF se temos dados do CNPJ
      if (cnpjData?.endereco?.uf && cnpjData?.telefone) {
        const phoneDdd = cnpjData.telefone.replace(/\D/g, '').slice(0, 2);
        if (phoneDdd.length === 2) {
          const dddResult = await validateDdd(phoneDdd);
          result.ddd_uf_match = dddResult.state === cnpjData.endereco.uf;
          result.ddd_state = dddResult.state;
          result.cnpj_state = cnpjData.endereco.uf;
        }
      }
      
      return Response.json(result);
    }

    if (type === 'email') {
      const result = await validateEmailMx(value);
      return Response.json(result);
    }

    if (type === 'phone') {
      const result = await validateDdd(value);
      return Response.json(result);
    }

    return Response.json({ error: 'Tipo de validação inválido' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});