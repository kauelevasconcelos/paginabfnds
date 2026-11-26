#!/usr/bin/env node
// Instala/atualiza o exit pop-up padrão da Aloud (_shared/aloud-exit-popup-padrao.html) nas LPs abaixo.
//
//   node scripts/sync-exit-popup.js          aplica nas páginas
//   node scripts/sync-exit-popup.js --check  só confere (sai com código 1 se alguma página estiver desatualizada)
//
// Se o bloco já existe na página (entre o comentário "ALOUD · EXIT POP-UP · PADRÃO ÚNICO" e
// "<!-- /ALOUD EXIT POP-UP · PADRÃO ÚNICO -->"), ele é substituído; senão, entra logo antes do último </body>.
// Rodar de novo não duplica. Mantém UTF-8 e o tipo de quebra de linha (LF ou CRLF) de cada arquivo.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, '_shared', 'aloud-exit-popup-padrao.html');

// URL publicada -> arquivo
const PAGES = {
  '/pc-le-cdf-v80/': 'v80/index.html',
  '/pc-le-cdf-v111/': 'v111/index.html',
  '/pc-le-cdf-v137/': 'v137/index.html',
  '/pc-lpm-bf26v4/': 'v4/index.html',
  '/pc-lpm-bf26v8/': 'v29/index.html',
  '/pc-lpm-bf26v11/': 'v30/index.html',
  '/pc-lpm-bf26v23/': 'v23/index.html',
  '/pc-lpm-bf26v24/': 'v24/index.html',
  '/pc-lpm-bf26v25/': 'v25/index.html',
  '/pc-lpm-bf26v26/': 'v26/index.html',
  '/pc-lpm-bf26v25b/': 'v25b/index.html',
  '/pc-lpm-bf26v26b/': 'v26b/index.html',
};

const START_TEXT = 'ALOUD · EXIT POP-UP · PADRÃO ÚNICO';
const END_MARK = '<!-- /ALOUD EXIT POP-UP · PADRÃO ÚNICO -->';

// Posição [início, fim) do bloco no texto, ou null. O início é o "<!--" do comentário que contém START_TEXT.
function findBlock(text) {
  const s = text.indexOf(START_TEXT);
  if (s < 0) return null;
  const start = text.lastIndexOf('<!--', s);
  const e = text.indexOf(END_MARK, s);
  if (start < 0 || e < 0) throw new Error('bloco incompleto (falta o comentário de início ou de fim)');
  if (text.slice(start, s).includes('-->')) throw new Error('comentário de início malformado');
  if (text.indexOf(START_TEXT, e) >= 0) throw new Error('mais de um bloco do pop-up na página');
  return [start, e + END_MARK.length];
}

const srcText = fs.readFileSync(SOURCE, 'utf8').replace(/\r\n/g, '\n');
const srcPos = findBlock(srcText);
if (!srcPos) throw new Error('bloco não encontrado em ' + SOURCE);
const block = srcText.slice(srcPos[0], srcPos[1]);

const check = process.argv.includes('--check');
let pending = 0;

for (const [url, rel] of Object.entries(PAGES)) {
  const file = path.join(ROOT, rel);
  const before = fs.readFileSync(file, 'utf8');
  const eol = before.includes('\r\n') ? '\r\n' : '\n';
  const b = block.replace(/\n/g, eol);

  let after, action;
  const pos = findBlock(before);
  if (pos) {
    after = before.slice(0, pos[0]) + b + before.slice(pos[1]);
    action = 'substituído';
  } else {
    const body = before.lastIndexOf('</body>');
    if (body < 0) throw new Error(rel + ': sem </body>');
    const lineStart = before.lastIndexOf('\n', body - 1) + 1;
    if (before.slice(lineStart, body).trim() !== '') throw new Error(rel + ': </body> não está no início da linha');
    after = before.slice(0, lineStart) + b + eol + before.slice(lineStart);
    action = 'inserido';
  }

  if (after === before) { console.log('ok        ' + url.padEnd(20) + rel); continue; }
  pending++;
  if (check) { console.log('PENDENTE  ' + url.padEnd(20) + rel); continue; }
  fs.writeFileSync(file, after, 'utf8');
  console.log(action.padEnd(12) + url.padEnd(20) + rel);
}

if (check && pending) process.exit(1);
