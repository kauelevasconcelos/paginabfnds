// Unit test of the routing logic with a mocked fetch (no network).
let last;
globalThis.fetch = async (input) => { last = typeof input === 'string' ? input : input.url; return new Response('origin', { status: 299 }); };
const { default: w } = await import('./worker.js');
const D = 'https://cronogramadosfluentes.com.br';
const P = 'https://paginabfnds-v1.pages.dev';
const cases = [
  ['/pc-lpm-mgmv1', 'pages /pc-lpm-mgmv1/'], ['/pc-lpm-mgmv1/', 'pages /pc-lpm-mgmv1/'], ['/pc-lpm-mgmv1/index.html', 'pages /pc-lpm-mgmv1/'],
  ['/pc-lpm-mgmv1/?ref=ABC_12-x', 'pages /pc-lpm-mgmv1/?ref=ABC_12-x'],
  ['/pc-lpm-mgmv1/?ref=TESTE&utm_source=whatsapp&fbclid=x', 'pages /pc-lpm-mgmv1/?ref=TESTE&utm_source=whatsapp&fbclid=x'],
  ['/pc-lpm-mgmv1/img/x.webp', '404'], ['/pc-lpm-mgmv1/fonts/x.woff2', '404'], ['/pc-lpm-mgmv1/outra', '404'], ['/pc-lpm-mgmv1/wp-admin/', '404'],
  ['/pc-lpm-mgmv1-off/', 'origem'], ['/pc-lpm-mgmv10/', 'origem'], ['/pc-lpm-mgmv1abc', 'origem'], ['/pc-lpm-mgmv2/', 'origem'],
  ['/pc-lpm-bf26v4/', 'origem'], ['/pc-le-cdf-v80/', 'origem'],
];
let fails = 0;
for (const [p, exp] of cases) {
  last = null;
  const r = await w.fetch(new Request(D + p));
  const got = r.status === 404 ? '404' : last && last.startsWith(P) ? 'pages ' + last.replace(P, '') : last && last.startsWith(D) ? 'origem' : '?';
  const ok = got === exp; if (!ok) fails++;
  console.log(`${ok ? 'ok  ' : 'FALHA'} ${p.padEnd(58)} → ${got}`);
}
console.log(fails ? `\n${fails} falha(s)` : `\ntodos os ${cases.length} casos ok`);
if (fails) process.exit(1);
