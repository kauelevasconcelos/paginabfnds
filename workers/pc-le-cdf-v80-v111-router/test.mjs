// Unit test of the routing logic with a mocked fetch (no network).
let last;
globalThis.fetch = async (input) => { last = typeof input === 'string' ? input : input.url; return new Response('origin', { status: 299 }); };
const { default: w } = await import('./worker.js');
const D = 'https://cronogramadosfluentes.com.br';
const cases = [
  ['/pc-le-cdf-v80', 'pages /v80/'], ['/pc-le-cdf-v80/', 'pages /v80/'], ['/pc-le-cdf-v80/index.html', 'pages /v80/'],
  ['/pc-le-cdf-v80/?utm_source=a&utm_medium=b', 'pages /v80/?utm_source=a&utm_medium=b'],
  ['/pc-le-cdf-v80/img/lpmcopa020-scaled-scaled-scaled-0b35b15f.webp', 'pages /v80/img/lpmcopa020-scaled-scaled-scaled-0b35b15f.webp'],
  ['/pc-le-cdf-v80/fonts/switzer-bold-9dcc430a.woff2', 'pages /v80/fonts/switzer-bold-9dcc430a.woff2'],
  ['/pc-le-cdf-v80/img/../index.html', 'pages /v80/'] /* o URL normaliza para /index.html */, ['/pc-le-cdf-v80/img/sub/x.webp', '404'], ['/pc-le-cdf-v80/outra', '404'], ['/pc-le-cdf-v80/wp-admin/', '404'],
  ['/pc-le-cdf-v80-off', 'origem'], ['/pc-le-cdf-v80-off/', 'origem'], ['/pc-le-cdf-v80-off/?x=1', 'origem'], ['/pc-le-cdf-v80-off/feed/', '404'],
  ['/pc-le-cdf-v800/', 'origem'], ['/pc-le-cdf-v80abc', 'origem'], ['/pc-le-cdf-v8/', 'origem'],
  ['/pc-le-cdf-v111', 'pages /v111/'], ['/pc-le-cdf-v111/', 'pages /v111/'], ['/pc-le-cdf-v111/img/fivecon.svg', 'pages /v111/img/fivecon.svg'],
  ['/pc-le-cdf-v111-off/', 'origem'], ['/pc-le-cdf-v1110/', 'origem'], ['/pc-le-cdf-v136/', 'origem'],
];
let fails = 0;
for (const [p, exp] of cases) {
  last = null;
  const r = await w.fetch(new Request(D + p));
  const got = r.status === 404 ? '404' : last && last.startsWith('https://paginabfnds-v1.pages.dev') ? 'pages ' + last.replace('https://paginabfnds-v1.pages.dev', '') : last && last.startsWith(D) ? 'origem' : '?';
  const ok = got === exp; if (!ok) fails++;
  console.log(`${ok ? 'ok  ' : 'FALHA'} ${p.padEnd(62)} → ${got}`);
}
console.log(fails ? `\n${fails} falha(s)` : `\ntodos os ${cases.length} casos ok`);
