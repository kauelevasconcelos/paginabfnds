// Cloudflare Pages Function: POST /api/contato
// Recebe o lead do formulário e repassa para o webhook definido em env.WEBHOOK_URL.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function str(v) {
  return v === undefined || v === null ? '' : String(v).trim();
}

// Deixa só dígitos e tira o +55 do Brasil.
// Sem o "+", só remove o 55 quando sobram 12-13 dígitos (evita cortar o DDD 55 do RS).
export function normalizePhone(raw) {
  const s = str(raw);
  let digits = s.replace(/\D/g, '');
  if (digits.startsWith('55') && (s.startsWith('+55') || digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }
  return digits;
}

const ALLOWED_ORIGINS = [
  'https://cronogramadosfluentes.com.br',
  'https://www.cronogramadosfluentes.com.br',
  'https://paginabfnds-v1.pages.dev',
];

// Só libera CORS para as origens da lista; para as outras, nenhum header de CORS.
function withCors(request, response) {
  const origin = request.headers.get('Origin');
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.append('Vary', 'Origin');
  }
  return response;
}

export function onRequestOptions({ request }) {
  const res = new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
  return withCors(request, res);
}

export async function onRequestPost(context) {
  return withCors(context.request, await handlePost(context));
}

async function handlePost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  // Honeypot preenchido = bot. Finge sucesso e não envia nada.
  if (str(data.website) !== '') return json({ ok: true });

  const nome = str(data.nome);
  const email = str(data.email);
  const phone = normalizePhone(data.phone);

  if (!nome || !EMAIL_RE.test(email) || phone.length < 10) {
    return json({ ok: false, error: 'invalid_fields' }, 400);
  }

  const payload = {
    Name: nome,
    Email: email,
    phone: phone,
    utm_source: str(data.utm_source),
    utm_medium: str(data.utm_medium),
    utm_content: str(data.utm_content),
    utm_campaign: str(data.utm_campaign),
    utm_term: str(data.utm_term),
    fbclid: str(data.fbclid),
    gclid: str(data.gclid),
    conversion_type_id: str(data.conversion_type_id) || '1',
    campaign_id: str(data.campaign_id),
    form_id: str(data.form_id),
    form_name: str(data.form_name) || 'New Form',
  };

  if (!env.WEBHOOK_URL) return json({ ok: false }, 502);

  try {
    const res = await fetch(env.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok ? json({ ok: true }) : json({ ok: false }, 502);
  } catch {
    return json({ ok: false }, 502);
  }
}
