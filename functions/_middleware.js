// Cloudflare Pages middleware (roda antes de todas as rotas).
// Único papel: não servir arquivos internos do repositório no site publicado (CLAUDE.md e a pasta
// workers/, com o código dos Workers roteadores), comparando o caminho já decodificado para cobrir
// variações como /%43LAUDE.md ou /%77orkers/.
// Qualquer outra requisição segue normalmente; em caso de erro também segue (nunca derruba o site).
const BLOCKED = new Set(['/claude.md']);
const BLOCKED_PREFIXES = ['/workers'];

export async function onRequest({ request, next }) {
  try {
    let path = new URL(request.url).pathname;
    try { path = decodeURIComponent(path); } catch {}
    path = path.replace(/\/{2,}/g, '/').replace(/\/+$/, '').toLowerCase();
    if (BLOCKED.has(path) || BLOCKED_PREFIXES.some(p => path === p || path.startsWith(p + '/'))) {
      return new Response('Not found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
      });
    }
  } catch {}
  return next();
}
