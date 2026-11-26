// Unit test of the routing logic with a mocked fetch (no network). Uso: node test.mjs
// Testa o worker.js como está (REDIRECT_OLD = true) e a variante REDIRECT_OLD = false (passo intermediário da publicação).
import fs from 'node:fs';

let last;
globalThis.fetch = async (input) => {
  last = typeof input === 'string' ? input : input.url;
  const html = /\/(img|fonts)\/nao-existe/.test(last) || /\/pc-lpm-mgmv1\/$/.test(last);
  return new Response('origin', { status: 200, headers: { 'content-type': html ? 'text/html; charset=utf-8' : 'image/webp' } });
};
const src = fs.readFileSync(new URL('./worker.js', import.meta.url), 'utf8');
if (!/const REDIRECT_OLD = true;/.test(src)) { console.log('FALHA: worker.js deveria ter REDIRECT_OLD = true'); process.exit(1); }
const load = (s) => import('data:text/javascript;base64,' + Buffer.from(s).toString('base64')).then(m => m.default);
const wFinal = await load(src);
const wInter = await load(src.replace('const REDIRECT_OLD = true;', 'const REDIRECT_OLD = false;'));

const D = 'https://cronogramadosfluentes.com.br', N = 'https://indica.aloud.com.br', P = 'https://paginabfnds-v1.pages.dev';
const comum = [
  [N + '/', 'pages /pc-lpm-mgmv1/'], [N + '/index.html', 'pages /pc-lpm-mgmv1/'],
  [N + '/?ref=ABC_12-x', 'pages /pc-lpm-mgmv1/?ref=ABC_12-x'],
  [N + '/?ref=TESTE&utm_source=whatsapp&fbclid=x', 'pages /pc-lpm-mgmv1/?ref=TESTE&utm_source=whatsapp&fbclid=x'],
  [N + '/pc-lpm-bf26v4/img/bf25img002-d7f2a327.webp', 'pages /v4/img/bf25img002-d7f2a327.webp'],
  [N + '/pc-lpm-bf26v4/img/fivecon.png', 'pages /v4/img/fivecon.png'],
  [N + '/pc-lpm-bf26v4/fonts/switzer-bold-9dcc430a.woff2', 'pages /v4/fonts/switzer-bold-9dcc430a.woff2'],
  [N + '/pc-lpm-bf26v4/img/nao-existe.webp', '404'],
  [N + '/pc-lpm-bf26v4/', '404'], [N + '/pc-lpm-bf26v4/index.html', '404'], [N + '/pc-lpm-bf26v4/img/', '404'],
  [N + '/pc-lpm-bf26v4/img/../index.html', '404'], [N + '/pc-lpm-bf26v4/img/a/b.webp', '404'],
  [N + '/pc-lpm-mgmv1/', '404'], [N + '/robots.txt', '404'], [N + '/favicon.ico', '404'], [N + '/wp-admin/', '404'], [N + '/x', '404'],
  [D + '/pc-lpm-mgmv1-off/', 'origem'], [D + '/pc-lpm-mgmv10/', 'origem'], [D + '/pc-lpm-mgmv1abc', 'origem'], [D + '/pc-lpm-mgmv2/', 'origem'],
  [D + '/pc-lpm-bf26v4/', 'origem'], [D + '/pc-le-cdf-v80/', 'origem'],
];
const final = [
  ...comum,
  [D + '/pc-lpm-mgmv1', '301 https://indica.aloud.com.br/'], [D + '/pc-lpm-mgmv1/', '301 https://indica.aloud.com.br/'],
  [D + '/pc-lpm-mgmv1/index.html', '301 https://indica.aloud.com.br/'],
  [D + '/pc-lpm-mgmv1/?ref=TESTE&utm_source=x', '301 https://indica.aloud.com.br/?ref=TESTE&utm_source=x'],
  [D + '/pc-lpm-mgmv1?ref=TESTE&utm_source=whatsapp&utm_medium=story&fbclid=a%2Fb', '301 https://indica.aloud.com.br/?ref=TESTE&utm_source=whatsapp&utm_medium=story&fbclid=a%2Fb'],
  [D + '/pc-lpm-mgmv1/img/x.webp?a=1', '301 https://indica.aloud.com.br/?a=1'],
];
const inter = [
  ...comum,
  [D + '/pc-lpm-mgmv1', 'pages /pc-lpm-mgmv1/'], [D + '/pc-lpm-mgmv1/', 'pages /pc-lpm-mgmv1/'],
  [D + '/pc-lpm-mgmv1/?ref=TESTE', 'pages /pc-lpm-mgmv1/?ref=TESTE'], [D + '/pc-lpm-mgmv1/img/x.webp', '404'],
];

let fails = 0, n = 0;
for (const [nome, w, cases] of [['REDIRECT_OLD=true (final)', wFinal, final], ['REDIRECT_OLD=false (intermediário)', wInter, inter]]) {
  console.log('\n== ' + nome);
  for (const [u, exp] of cases) {
    last = null; n++;
    const r = await w.fetch(new Request(u));
    const got = r.status === 404 ? '404' : r.status === 301 ? '301 ' + r.headers.get('location')
      : last && last.startsWith(P) ? 'pages ' + last.replace(P, '') : last && last.startsWith(D) ? 'origem' : '?';
    const ok = got === exp; if (!ok) fails++;
    console.log(`${ok ? 'ok  ' : 'FALHA'} ${u.replace(/^https:\/\//, '').padEnd(78)} → ${got}${ok ? '' : '   (esperado: ' + exp + ')'}`);
  }
}
console.log(fails ? `\n${fails} falha(s)` : `\ntodos os ${n} casos ok`);
if (fails) process.exit(1);
