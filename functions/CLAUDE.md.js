// Cloudflare Pages Function: GET /CLAUDE.md
// O CLAUDE.md fica no repositório (notas internas), mas não deve ser servido no site publicado.
// A rota da Function tem prioridade sobre o arquivo estático de mesmo caminho.
export function onRequest() {
  return new Response('Not found', {
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  });
}
