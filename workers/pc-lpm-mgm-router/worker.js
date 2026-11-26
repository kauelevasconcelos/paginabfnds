// pc-lpm-mgm-router  (PREPARADO, NÃO PUBLICADO: revisar com o JV antes)
// Serve a página de indicação (MGM) da Black Vitalícia do Cloudflare Pages (projeto paginabfnds-v1) em
// https://cronogramadosfluentes.com.br/pc-lpm-mgmv1/ (link do aluno: …/pc-lpm-mgmv1/?ref=CODIGO).
// Mesmo modelo do pc-lpm-bf26-d007-router. Diferenças:
//  - a pasta do Pages tem o mesmo nome do caminho (pc-lpm-mgmv1/), como as dsi-pv-vNN do mathwerner;
//  - a página não tem img/ nem fonts/ próprios: usa os da v4 (/pc-lpm-bf26v4/img|fonts/…), que já são servidos
//    pelo bf26-v14-router. Por isso aqui só passa o HTML; qualquer outro subcaminho dá 404.
// Página nova (sem página no WordPress). Separado dos outros roteadores: nenhuma página já publicada passa por aqui.

const PAGES_ORIGIN = "https://paginabfnds-v1.pages.dev";
const VERSIONS = new Set(["1"]); // lista fechada

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/pc-lpm-mgmv(\d+)(\/.*)?$/);

    // Caminhos que só chegam aqui pelo prefixo da rota (ex.: /pc-lpm-mgmv10, /pc-lpm-mgmv1-off):
    // seguem para a origem (WordPress) sem alteração.
    if (!m || !VERSIONS.has(m[1])) return fetch(request);

    const rest = m[2];
    if (!(rest === undefined || rest === "/" || rest === "/index.html")) {
      return new Response("Not Found", { status: 404 });
    }

    const target = new URL(`${PAGES_ORIGIN}/pc-lpm-mgmv${m[1]}/`);
    target.search = url.search; // mantém ?ref=, UTMs e demais parâmetros
    return fetch(new Request(target, request));
  },
};
