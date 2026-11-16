// mathwerner-dsi-pv-router
// Serve as páginas DSI PV V11, V12 e V13 do Cloudflare Pages (projeto paginabfnds-v1, pastas dsi-pv-v11/ …)
// nos endereços oficiais https://mathwerner.com.br/dsi-pv-v11/, /dsi-pv-v12/ e /dsi-pv-v13/ (antes no WordPress).
// Rotas deste Worker (zona mathwerner.com.br): mathwerner.com.br/dsi-pv-v11*, …v12* e …v13* (uma por página).
// Separado dos roteadores do cronogramadosfluentes.com.br de propósito.

const PAGES_ORIGIN = "https://paginabfnds-v1.pages.dev";
const VERSIONS = new Set(["11", "12", "13"]); // lista fechada

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/dsi-pv-v(\d+)(-off)?(\/.*)?$/);

    // Caminhos que só chegam aqui pelo prefixo da rota (ex.: /dsi-pv-v110, /dsi-pv-v11abc):
    // seguem para a origem (WordPress) sem alteração.
    if (!m || !VERSIONS.has(m[1])) return fetch(request);

    const version = m[1];
    const off = m[2];
    const rest = m[3];

    // Slug -off (se um dia a página antiga for renomeada no WordPress): só a página vai para a origem.
    if (off) {
      if (rest === undefined || rest === "/") return fetch(request);
      return new Response("Not Found", { status: 404 });
    }

    let path;
    if (rest === undefined || rest === "/" || rest === "/index.html") {
      path = `/dsi-pv-v${version}/`;
    } else if (/^\/(img|fonts)\/[\w.-]+$/.test(rest)) {
      path = `/dsi-pv-v${version}${rest}`;
    } else {
      return new Response("Not Found", { status: 404 });
    }

    const target = new URL(PAGES_ORIGIN + path);
    target.search = url.search; // mantém UTMs, fbclid, gclid e demais parâmetros
    const res = await fetch(new Request(target, request));
    if (path.endsWith("/") && res.ok) return withHandlCookies(res, request, url);
    return res;
  },
};

// ---------------------------------------------------------------------------------------------------------
// Cookies do plugin HandL UTM Grabber, que o WordPress grava pelo servidor (PHP) em toda visita à página.
// Reproduzido a partir das respostas reais do WordPress (16/11/2026), só no HTML das páginas:
//  - utm_source/medium/term/content/campaign, gclid, email, username: grava se vier na URL, senão apaga;
//  - handl_ref: Referer, senão apaga; handl_original_ref: mantém o existente, senão Referer, senão apaga;
//  - handl_landing_page: mantém o existente, senão a URL completa; handl_url: URL completa; handl_ip: IP.
// Atributos iguais aos do WordPress: 30 dias, path=/, domain=.mathwerner.com.br, secure, SameSite=Lax.
const HANDL_PARAMS = ["utm_source", "utm_medium", "utm_term", "utm_content", "utm_campaign", "gclid"];
const HANDL_TAIL = ["email", "username"];
const COOKIE_DOMAIN = ".mathwerner.com.br";
const MAX_AGE = 2592000; // 30 dias

// rawurlencode do PHP (RFC 3986): encodeURIComponent + ! ' ( ) * codificados.
function rawurlencode(s) {
  return encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function readCookies(header) {
  const out = {};
  for (const part of (header || "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

function setCookie(name, encodedValue) {
  const exp = new Date(Date.now() + MAX_AGE * 1000).toUTCString().replace(/GMT$/, "GMT");
  return `${name}=${encodedValue}; expires=${exp}; Max-Age=${MAX_AGE}; path=/; domain=${COOKIE_DOMAIN}; secure; SameSite=Lax`;
}

function deleteCookie(name) {
  return `${name}=deleted; expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0; path=/; domain=${COOKIE_DOMAIN}; secure; SameSite=Lax`;
}

function withHandlCookies(res, request, url) {
  try {
    const q = url.searchParams;
    const jar = readCookies(request.headers.get("Cookie"));
    const referer = request.headers.get("Referer") || "";
    const fullUrl = url.origin + url.pathname + url.search;
    const ip = request.headers.get("CF-Connecting-IP") || "";
    const cookies = [];
    const param = (n) => (q.has(n) && q.get(n) !== "" ? cookies.push(setCookie(n, rawurlencode(q.get(n)))) : cookies.push(deleteCookie(n)));
    HANDL_PARAMS.forEach(param);
    if (jar.handl_original_ref) cookies.push(setCookie("handl_original_ref", jar.handl_original_ref));
    else if (referer) cookies.push(setCookie("handl_original_ref", rawurlencode(referer)));
    else cookies.push(deleteCookie("handl_original_ref"));
    cookies.push(setCookie("handl_landing_page", jar.handl_landing_page || rawurlencode(fullUrl)));
    if (ip) cookies.push(setCookie("handl_ip", rawurlencode(ip)));
    cookies.push(referer ? setCookie("handl_ref", rawurlencode(referer)) : deleteCookie("handl_ref"));
    cookies.push(setCookie("handl_url", rawurlencode(fullUrl)));
    HANDL_TAIL.forEach(param);
    const out = new Response(res.body, res);
    for (const c of cookies) out.headers.append("Set-Cookie", c);
    return out;
  } catch {
    return res; // nunca derruba a página por causa dos cookies
  }
}
