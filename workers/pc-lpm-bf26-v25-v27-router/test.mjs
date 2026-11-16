// Unit test of the routing logic with a mocked fetch (no network).
let last;
globalThis.fetch = async (input) => { last = typeof input === 'string' ? input : input.url; return new Response('origin', { status: 299 }); };
const { default: w } = await import('./worker.js');
const D = 'https://cronogramadosfluentes.com.br';
const cases = [
  ['/pc-lpm-bf26v25', 'pages /v25/'], ['/pc-lpm-bf26v25/', 'pages /v25/'], ['/pc-lpm-bf26v25/index.html', 'pages /v25/'],
  ['/pc-lpm-bf26v25/?utm_source=a&utm_medium=b', 'pages /v25/?utm_source=a&utm_medium=b'],
  ['/pc-lpm-bf26v25/img/fivecon.svg', 'pages /v25/img/fivecon.svg'],
  ['/pc-lpm-bf26v25/fonts/switzer-bold-9dcc430a.woff2', 'pages /v25/fonts/switzer-bold-9dcc430a.woff2'],
  ['/pc-lpm-bf26v25/img/../index.html', 'pages /v25/'] /* o URL normaliza para /index.html */, ['/pc-lpm-bf26v25/img/sub/x.webp', '404'], ['/pc-lpm-bf26v25/outra', '404'], ['/pc-lpm-bf26v25/wp-admin/', '404'],
  ['/pc-lpm-bf26v25-off', 'origem'], ['/pc-lpm-bf26v25-off/', 'origem'], ['/pc-lpm-bf26v25-off/?x=1', 'origem'], ['/pc-lpm-bf26v25-off/feed/', '404'],
  ['/pc-lpm-bf26v250/', 'origem'], ['/pc-lpm-bf26v25abc', 'origem'], ['/pc-lpm-bf26v2/', 'origem'],
  ['/pc-lpm-bf26v26', 'pages /v26/'], ['/pc-lpm-bf26v26/', 'pages /v26/'], ['/pc-lpm-bf26v26/img/fivecon.svg', 'pages /v26/img/fivecon.svg'], ['/pc-lpm-bf26v26-off/', 'origem'],
  ['/pc-lpm-bf26v27', 'pages /v27/'], ['/pc-lpm-bf26v27/?fbclid=x', 'pages /v27/?fbclid=x'], ['/pc-lpm-bf26v27/fonts/a.woff2', 'pages /v27/fonts/a.woff2'], ['/pc-lpm-bf26v27-off/', 'origem'],
  ['/pc-lpm-bf26v270/', 'origem'], ['/pc-lpm-bf26v24/', 'origem'], ['/pc-lpm-bf26v28/', 'origem'], ['/pc-le-cdf-v80/', 'origem'],
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
if (fails) process.exit(1);
