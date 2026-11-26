// Unit test of the routing logic with a mocked fetch (no network).
let last;
globalThis.fetch = async (input) => { last = typeof input === 'string' ? input : input.url; return new Response('origin', { status: 299 }); };
const { default: w } = await import('./worker.js');
const D = 'https://cronogramadosfluentes.com.br';
const cases = [];
for (const v of ['32', '33', '34', '35', '36', '37']) cases.push(
  [`/pc-lpm-bf26v${v}`, `pages /v${v}/`], [`/pc-lpm-bf26v${v}/`, `pages /v${v}/`], [`/pc-lpm-bf26v${v}/index.html`, `pages /v${v}/`],
  [`/pc-lpm-bf26v${v}/?utm_source=a&utm_medium=b&fbclid=x`, `pages /v${v}/?utm_source=a&utm_medium=b&fbclid=x`],
  [`/pc-lpm-bf26v${v}/img/logo-aloud-17e10ae7.svg`, `pages /v${v}/img/logo-aloud-17e10ae7.svg`],
  [`/pc-lpm-bf26v${v}/fonts/switzer-bold-9dcc430a.woff2`, `pages /v${v}/fonts/switzer-bold-9dcc430a.woff2`],
  [`/pc-lpm-bf26v${v}/img/sub/x.webp`, '404'], [`/pc-lpm-bf26v${v}/outra`, '404'], [`/pc-lpm-bf26v${v}/wp-admin/`, '404'],
  [`/pc-lpm-bf26v${v}-off/`, 'origem'], [`/pc-lpm-bf26v${v}0/`, 'origem'], [`/pc-lpm-bf26v${v}abc`, 'origem']);
cases.push(['/pc-lpm-bf26v38/', 'origem'], ['/pc-lpm-bf26v3/', 'origem'], ['/pc-lpm-bf26v25/', 'origem'], ['/pc-lpm-bf26v31/', 'origem'], ['/pc-le-cdf-v80/', 'origem']);
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
