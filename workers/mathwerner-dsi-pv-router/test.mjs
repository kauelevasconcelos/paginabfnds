// Unit test of the routing logic with a mocked fetch (no network).
let last;
globalThis.fetch = async (input) => { last = typeof input === 'string' ? input : input.url; return new Response('origin', { status: 299 }); };
const { default: w } = await import('./worker.js');
const D = 'https://mathwerner.com.br';
const cases = [
  ['/dsi-pv-v11', 'pages /dsi-pv-v11/'], ['/dsi-pv-v11/', 'pages /dsi-pv-v11/'], ['/dsi-pv-v11/index.html', 'pages /dsi-pv-v11/'],
  ['/dsi-pv-v11/?utm_source=a&utm_medium=b&fbclid=x&gclid=y', 'pages /dsi-pv-v11/?utm_source=a&utm_medium=b&fbclid=x&gclid=y'],
  ['/dsi-pv-v11/img/hero-1a2b3c4d.webp', 'pages /dsi-pv-v11/img/hero-1a2b3c4d.webp'],
  ['/dsi-pv-v11/fonts/dmsans-1a2b3c4d.woff2', 'pages /dsi-pv-v11/fonts/dmsans-1a2b3c4d.woff2'],
  ['/dsi-pv-v11/img/../index.html', 'pages /dsi-pv-v11/'], ['/dsi-pv-v11/img/sub/x.webp', '404'], ['/dsi-pv-v11/outra', '404'], ['/dsi-pv-v11/wp-admin/', '404'],
  ['/dsi-pv-v11-off/', 'origem'], ['/dsi-pv-v11-off/feed/', '404'],
  ['/dsi-pv-v110/', 'origem'], ['/dsi-pv-v11abc', 'origem'], ['/dsi-pv-v1/', 'origem'], ['/dsi-pv-v10/', 'origem'], ['/dsi-pv-v14/', 'origem'],
  ['/dsi-pv-v12', 'pages /dsi-pv-v12/'], ['/dsi-pv-v12/', 'pages /dsi-pv-v12/'], ['/dsi-pv-v12/img/a.svg', 'pages /dsi-pv-v12/img/a.svg'],
  ['/dsi-pv-v13', 'pages /dsi-pv-v13/'], ['/dsi-pv-v13/?gclid=z', 'pages /dsi-pv-v13/?gclid=z'], ['/dsi-pv-v13/fonts/a.woff2', 'pages /dsi-pv-v13/fonts/a.woff2'],
  ['/dsi-pv-v130/', 'origem'], ['/', 'origem'],
];
let fails = 0;
for (const [p, exp] of cases) {
  last = null;
  const r = await w.fetch(new Request(D + p));
  const got = r.status === 404 ? '404' : last && last.startsWith('https://paginabfnds-v1.pages.dev') ? 'pages ' + last.replace('https://paginabfnds-v1.pages.dev', '') : last && last.startsWith(D) ? 'origem' : '?';
  const ok = got === exp; if (!ok) fails++;
  console.log(`${ok ? 'ok  ' : 'FALHA'} ${p.padEnd(62)} → ${got}`);
}
console.log(fails ? `\n${fails} falha(s)` : `\ntodos os ${cases.length} casos de rota ok`);

// Cookies do HandL: compara com as respostas reais do WordPress (16/11/2026), ignorando expires.
globalThis.fetch = async () => new Response('<html>', { status: 200, headers: { 'Content-Type': 'text/html' } });
const strip = (c) => c.replace(/; expires=[^;]+/, '');
const cookieCases = [
  {
    name: 'sem query, sem referer, sem cookies',
    req: new Request(D + '/dsi-pv-v12/', { headers: { 'CF-Connecting-IP': '187.18.211.239' } }),
    wp: [
      'utm_source=deleted; Max-Age=0', 'utm_medium=deleted; Max-Age=0', 'utm_term=deleted; Max-Age=0', 'utm_content=deleted; Max-Age=0',
      'utm_campaign=deleted; Max-Age=0', 'gclid=deleted; Max-Age=0', 'handl_original_ref=deleted; Max-Age=0',
      'handl_landing_page=https%3A%2F%2Fmathwerner.com.br%2Fdsi-pv-v12%2F; Max-Age=2592000', 'handl_ip=187.18.211.239; Max-Age=2592000',
      'handl_ref=deleted; Max-Age=0', 'handl_url=https%3A%2F%2Fmathwerner.com.br%2Fdsi-pv-v12%2F; Max-Age=2592000',
      'email=deleted; Max-Age=0', 'username=deleted; Max-Age=0',
    ],
  },
  {
    name: 'query com espaço e @, referer externo',
    req: new Request(D + '/dsi-pv-v12/?utm_source=a%20b&email=t%40x.com', { headers: { 'CF-Connecting-IP': '187.18.211.239', Referer: 'https://www.google.com/search?q=x' } }),
    wp: [
      'utm_source=a%20b; Max-Age=2592000', 'utm_medium=deleted; Max-Age=0', 'utm_term=deleted; Max-Age=0', 'utm_content=deleted; Max-Age=0',
      'utm_campaign=deleted; Max-Age=0', 'gclid=deleted; Max-Age=0',
      'handl_original_ref=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dx; Max-Age=2592000',
      'handl_landing_page=https%3A%2F%2Fmathwerner.com.br%2Fdsi-pv-v12%2F%3Futm_source%3Da%2520b%26email%3Dt%2540x.com; Max-Age=2592000',
      'handl_ip=187.18.211.239; Max-Age=2592000', 'handl_ref=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dx; Max-Age=2592000',
      'handl_url=https%3A%2F%2Fmathwerner.com.br%2Fdsi-pv-v12%2F%3Futm_source%3Da%2520b%26email%3Dt%2540x.com; Max-Age=2592000',
      'email=t%40x.com; Max-Age=2592000', 'username=deleted; Max-Age=0',
    ],
  },
  {
    name: 'cookies já existentes (landing page e original_ref mantidos)',
    req: new Request(D + '/dsi-pv-v12/?utm_source=zz', { headers: { 'CF-Connecting-IP': '187.18.211.239', Referer: 'https://l.facebook.com/', Cookie: 'handl_landing_page=https%3A%2F%2Fmathwerner.com.br%2Fx%2F; handl_original_ref=https%3A%2F%2Fprimeiro.com%2F' } }),
    wp: [
      'utm_source=zz; Max-Age=2592000', 'utm_medium=deleted; Max-Age=0', 'utm_term=deleted; Max-Age=0', 'utm_content=deleted; Max-Age=0',
      'utm_campaign=deleted; Max-Age=0', 'gclid=deleted; Max-Age=0', 'handl_original_ref=https%3A%2F%2Fprimeiro.com%2F; Max-Age=2592000',
      'handl_landing_page=https%3A%2F%2Fmathwerner.com.br%2Fx%2F; Max-Age=2592000', 'handl_ip=187.18.211.239; Max-Age=2592000',
      'handl_ref=https%3A%2F%2Fl.facebook.com%2F; Max-Age=2592000', 'handl_url=https%3A%2F%2Fmathwerner.com.br%2Fdsi-pv-v12%2F%3Futm_source%3Dzz; Max-Age=2592000',
      'email=deleted; Max-Age=0', 'username=deleted; Max-Age=0',
    ],
  },
];
const TAIL = '; path=/; domain=.mathwerner.com.br; secure; SameSite=Lax';
for (const c of cookieCases) {
  const r = await w.fetch(c.req);
  const got = r.headers.getSetCookie().map(strip);
  const exp = c.wp.map((x) => x + TAIL);
  const ok = JSON.stringify(got) === JSON.stringify(exp);
  if (!ok) { fails++; console.log('FALHA cookies:', c.name); exp.forEach((e, i) => { if (e !== got[i]) console.log('  esperado', e, '\n  obtido  ', got[i]); }); }
  else console.log('ok   cookies:', c.name);
}
const img = await w.fetch(new Request(D + '/dsi-pv-v12/img/a.webp'));
if (img.headers.getSetCookie().length) { fails++; console.log('FALHA: imagem não deve receber cookies'); } else console.log('ok   imagem sem cookies');
console.log(fails ? `\n${fails} falha(s)` : `\ntudo ok`);
if (fails) process.exit(1);
