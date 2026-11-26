// pc-lpm-mgm-router
// Página de indicação (MGM) da Black Vitalícia, servida do Cloudflare Pages (projeto paginabfnds-v1, pasta pc-lpm-mgmv1/).
// Endereço definitivo: https://indica.aloud.com.br/ (link do aluno: https://indica.aloud.com.br/?ref=CODIGO).
//
// Dois nomes chegam aqui:
//  1. indica.aloud.com.br (custom domain do Worker; o Worker é a origem, não há servidor atrás):
//     - /, /index.html                → paginabfnds-v1.pages.dev/pc-lpm-mgmv1/ (com a query string: ?ref=, UTMs etc.)
//     - /pc-lpm-bf26v4/img|fonts/<arq> → paginabfnds-v1.pages.dev/v4/img|fonts/<arq> (assets da BF26 V4, sem cópia)
//     - qualquer outro caminho         → 404
//  2. cronogramadosfluentes.com.br/pc-lpm-mgmv1* (rota 822336f6c8774e0aad87e10d819caa4b, endereço antigo):
//     - /pc-lpm-mgmv1 e qualquer subcaminho → 301 para https://indica.aloud.com.br/ com a query string inteira
//     - caminhos que só casam pelo prefixo da rota (/pc-lpm-mgmv10, /pc-lpm-mgmv1-off…) → origem (WordPress), sem alteração
//
// Histórico: 9b120409 (26/11/2026, só o endereço antigo, proxy da página). Rollbacks no wrangler.jsonc.

const PAGES_ORIGIN = "https://paginabfnds-v1.pages.dev";
const NEW_HOST = "indica.aloud.com.br";
const NEW_ORIGIN = `https://${NEW_HOST}`;
const PAGE_DIR = "/pc-lpm-mgmv1/";
// true: o endereço antigo faz 301 para o novo. false: o endereço antigo continua servindo a página (como na 9b120409).
const REDIRECT_OLD = true;

function notFound() {
  return new Response("Not Found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
}

async function servePage(request, url) {
  const target = new URL(PAGES_ORIGIN + PAGE_DIR);
  target.search = url.search; // mantém ?ref=, UTMs e demais parâmetros
  return fetch(new Request(target, request));
}

async function serveV4Asset(request, sub) {
  const res = await fetch(new Request(`${PAGES_ORIGIN}/v4/${sub}`, request));
  // Arquivo inexistente: o Pages devolve o HTML de fallback com 200. Aqui vira 404.
  if (res.ok && (res.headers.get("content-type") || "").includes("text/html")) return notFound();
  return res;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.hostname === NEW_HOST) {
      if (url.pathname === "/" || url.pathname === "/index.html") return servePage(request, url);
      const a = url.pathname.match(/^\/pc-lpm-bf26v4\/((?:img|fonts)\/[A-Za-z0-9._-]+)$/);
      if (a) return serveV4Asset(request, a[1]);
      return notFound();
    }

    // Endereço antigo (rota cronogramadosfluentes.com.br/pc-lpm-mgmv1*)
    const m = url.pathname.match(/^\/pc-lpm-mgmv1(\/.*)?$/);
    if (!m) return fetch(request); // /pc-lpm-mgmv10, /pc-lpm-mgmv1-off etc.: origem
    if (REDIRECT_OLD) return Response.redirect(`${NEW_ORIGIN}/${url.search}`, 301);
    const rest = m[1];
    if (!(rest === undefined || rest === "/" || rest === "/index.html")) return notFound();
    return servePage(request, url);
  },
};
