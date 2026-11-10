// pc-le-cdf-v80-v111-router
// Serve as páginas v80 e v111 do Cloudflare Pages (projeto paginabfnds-v1) nos endereços oficiais
// https://cronogramadosfluentes.com.br/pc-le-cdf-v80/ e /pc-le-cdf-v111/ (antes no WordPress).
// Rotas deste Worker: cronogramadosfluentes.com.br/pc-le-cdf-v80* e cronogramadosfluentes.com.br/pc-le-cdf-v111*
// Separado do bf26-v14-router de propósito: nenhuma página já publicada passa por aqui.

const PAGES_ORIGIN = "https://paginabfnds-v1.pages.dev";
const VERSIONS = new Set(["80", "111"]); // lista fechada

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/pc-le-cdf-v(\d+)(-off)?(\/.*)?$/);

    // Caminhos que só chegam aqui pelo prefixo da rota (ex.: /pc-le-cdf-v800, /pc-le-cdf-v80abc):
    // seguem para a origem (WordPress) sem alteração.
    if (!m || !VERSIONS.has(m[1])) return fetch(request);

    const version = m[1];
    const off = m[2];
    const rest = m[3];

    // Página antiga no WordPress com a slug -off: /pc-le-cdf-vNN-off e /pc-le-cdf-vNN-off/ vão para a origem.
    if (off) {
      if (rest === undefined || rest === "/") return fetch(request);
      return new Response("Not Found", { status: 404 });
    }

    let path;
    if (rest === undefined || rest === "/" || rest === "/index.html") {
      path = `/v${version}/`;
    } else if (/^\/(img|fonts)\/[\w.-]+$/.test(rest)) {
      path = `/v${version}${rest}`;
    } else {
      return new Response("Not Found", { status: 404 });
    }

    const target = new URL(PAGES_ORIGIN + path);
    target.search = url.search; // mantém UTMs e demais parâmetros
    return fetch(new Request(target, request));
  },
};
