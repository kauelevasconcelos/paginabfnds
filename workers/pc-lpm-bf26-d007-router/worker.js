// pc-lpm-bf26-d007-router
// Serve as páginas da campanha D-007 (teste A/B, versões A e B) do Cloudflare Pages (projeto paginabfnds-v1) nos
// endereços https://cronogramadosfluentes.com.br/pc-lpm-bf26v32/ … /pc-lpm-bf26v37/.
// São páginas novas (sem página antiga no WordPress). Rotas: uma por página, criadas pela API, uma por vez.
// Separado dos outros roteadores de propósito: nenhuma página já publicada passa por aqui.
// As versões B (v33, v35, v37) entraram em 26/11/2026, com o depoimento final autorizado.

const PAGES_ORIGIN = "https://paginabfnds-v1.pages.dev";
const VERSIONS = new Set(["32", "33", "34", "35", "36", "37"]); // lista fechada

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/pc-lpm-bf26v(\d+)(\/.*)?$/);

    // Caminhos que só chegam aqui pelo prefixo da rota (ex.: /pc-lpm-bf26v320, /pc-lpm-bf26v32-off):
    // seguem para a origem (WordPress) sem alteração.
    if (!m || !VERSIONS.has(m[1])) return fetch(request);

    const version = m[1];
    const rest = m[2];

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
