// Cloudflare Pages middleware (roda antes de todas as rotas).
// Papel 1: não servir arquivos internos do repositório no site publicado (CLAUDE.md e a pasta
// workers/, com o código dos Workers roteadores; _shared/, com blocos-fonte como o exit pop-up; scripts/, com
// os scripts de manutenção), comparando o caminho já decodificado para cobrir variações como /%43LAUDE.md ou /%77orkers/.
// Papel 2: esconder, só na produção do Pages, as páginas que ainda não podem ser públicas (HIDDEN_IN_PRODUCTION):
// hoje as versões B da D-007 (v33, v35, v37), com depoimento provisório. Produção = paginabfnds-v1.pages.dev, o alias
// main.paginabfnds-v1.pages.dev e as URLs de deployment (<hash de 8 hex>.paginabfnds-v1.pages.dev). Os previews de
// branch (<branch>.paginabfnds-v1.pages.dev) continuam abrindo. Para liberar uma página, tire-a da lista.
// Qualquer outra requisição segue normalmente; em caso de erro também segue (nunca derruba o site).
const BLOCKED = new Set(['/claude.md']);
const BLOCKED_PREFIXES = ['/workers', '/_shared', '/scripts'];
const HIDDEN_IN_PRODUCTION = ['/v33', '/v35', '/v37', '/pc-lpm-bf26v33', '/pc-lpm-bf26v35', '/pc-lpm-bf26v37'];
const PRODUCTION_HOST = /^(?:main\.|[0-9a-f]{8}\.)?paginabfnds-v1\.pages\.dev$/;
const matches = (path, prefixes) => prefixes.some(p => path === p || path.startsWith(p + '/'));

export async function onRequest({ request, next }) {
  try {
    const url = new URL(request.url);
    let path = url.pathname;
    try { path = decodeURIComponent(path); } catch {}
    path = path.replace(/\/{2,}/g, '/').replace(/\/+$/, '').toLowerCase();
    if (BLOCKED.has(path) || matches(path, BLOCKED_PREFIXES) ||
        (PRODUCTION_HOST.test(url.hostname.toLowerCase()) && matches(path, HIDDEN_IN_PRODUCTION))) {
      return new Response('Not found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
      });
    }
  } catch {}
  return next();
}
