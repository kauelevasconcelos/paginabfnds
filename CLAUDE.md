# CLAUDE.md

Landing pages da Aloud servidas pelo Cloudflare Pages (projeto `paginabfnds-v1`, deploy via Git no `main`).
Cada pasta `vNN/` é uma página do cronogramadosfluentes.com.br; as pastas `dsi-pv-vNN/` são páginas do
mathwerner.com.br (ver a seção "Domínio mathwerner.com.br"). O mapeamento das URLs do domínio (ex.:
`/pc-le-cdf-v80/` → `/v80/`) é feito por Workers roteadores da Cloudflare (ver "Roteador do domínio"). Arquivos internos (`CLAUDE.md`, `workers/`, `_shared/`, `scripts/`)
não são servidos pelo site: o `functions/_middleware.js` devolve 404 para eles. O mesmo middleware esconde, só na
produção do Pages (`paginabfnds-v1.pages.dev`, `main.` e URLs de deployment), as páginas da lista `HIDDEN_IN_PRODUCTION`
(hoje vazia; foi usada para as B da D-007 até a liberação em 26/11/2026); os previews de branch continuam abrindo.

## Leads de teste (regra fixa, 26/11/2026)

**Todo lead de teste, em preview ou no domínio, é enviado com o GTM e todos os pixels bloqueados, mesmo que o pedido
não diga isso.** Bloquear antes de abrir a página (não depois do carregamento): `googletagmanager.com`,
`google-analytics.com`, `analytics.google.com`, `googleadservices.com`, `doubleclick.net`, `connect.facebook.net`,
`facebook.com/tr`, `analytics.tiktok.com`, `clarity.ms` e o sGTM (`servidor.*`, ex.: `servidor.mathjerke.com.br`).
Conferir que nenhuma requisição para esses hosts saiu (aba Rede) antes de enviar. Se não der para bloquear, não envie:
teste o formulário sem enviar e avise. O envio ao ActiveCampaign (`aloud.activehosted.com`) e o obrigado continuam
liberados. Depois do teste, informar os e-mails usados para apagar os contatos no AC.

## Formulários (padrão v136/v137)

Todas as páginas enviam o lead direto ao ActiveCampaign (`https://aloud.activehosted.com/proc.php`,
POST normal do navegador) e **não dependem de nenhuma página do WordPress** para o envio.
Telefone com intl-tel-input + máscara/validação por país (campos AC 41-43) e UTMs nos campos AC
281-293 e 357-370, com os mesmos scripts da v136/v137.

| Página | Formulário(s) | AC u / f |
|---|---|---|
| v80 (`/pc-le-cdf-v80/`) | 2 principais (`#105`, `#105-2`) | 105 / 105 |
| v80 | pop-up de saída padrão (`AEP_PAGE.form = "reserva"`) | 85 / 113 |
| v111 (`/pc-le-cdf-v111/`) | 1 | 113 / 113 |
| v136, v137 | 2 / 1 | 113 / 113 |
| BF26 V25, V26, V27 (`/pc-lpm-bf26v25/` … `v27/`) | 1 cada (`#116`) | 116 / 116 |

As BF26 (V4, V8, V11, V22–V24, V25–V27) usam o padrão próprio das BF26 (scripts da V4: campos 41–43 e UTMs
281–285 + 293, sem os campos 357–370) e o mesmo form AC 116 das páginas no WordPress. Depois do envio, o
próprio AC (configuração do form 116) redireciona para `/confirmacao-bf26v1/`, que é uma página do WordPress.
O lead não depende dela (o AC já gravou), mas a página de obrigado sim.

Até nov/2026 os formulários principais da v80 enviavam pelo WordPress (página 4553, Elementor
`7a14b0e`/`3de2f0f` → webhook `aloud-etl` com `campaign_id=ppt-lpm-cdf` e `conversion_type_id=1`).
Isso foi substituído pelo AC 105; a v80 não depende mais dessa página.

## Exit pop-up padrão (v2.2, nov/2026)

O bloco `_shared/aloud-exit-popup-padrao.html` (config + CSS + HTML + script, entre os comentários
"ALOUD · EXIT POP-UP · PADRÃO ÚNICO" e `<!-- /ALOUD EXIT POP-UP · PADRÃO ÚNICO -->`) fica antes do `</body>` de
v80, v111, v137 e das BF26 V4, V8 (`v29/`), V11 (`v30/`), V23, V24, V25 e V26 (a V27 ficou de fora de propósito).
**Não edite o bloco nas páginas:** mude o arquivo-fonte e rode `node scripts/sync-exit-popup.js` (substitui o bloco
existente ou insere; `--check` só confere). A lista de páginas está no próprio script. Teste: `?aep=1` na URL.

> **DESLIGADO em 26/11/2026 em todas as páginas** (não estava passando as UTMs para o AC): `enabled: false` no
> `AEP_CONFIG` do arquivo-fonte. O bloco continua nas páginas, mas o pop-up não abre sozinho; `?aep=1` ainda abre (para
> testar a correção). Para religar: `enabled: true` + `node scripts/sync-exit-popup.js`.

- O pop-up envia para o 1º form do ActiveCampaign da página (copia os hidden dele): v111/v137 → 113,
  BF26 → 116. Nas BF26 ele também manda os campos 357–361 e 370 (o bloco detecta `source: 281` e preenche os dois conjuntos).
- Gatilhos: desktop = mouse sai da página pelo topo (até 10px do topo, ou na metade de cima subindo, para pegar a
  saída rápida rumo às abas/X; entrar num iframe não conta); celular = botão voltar ou rolagem rápida para cima.
  Limite: 1x a cada 24h **por domínio** (localStorage `aep:aloud-exit:t`), valendo para todas as LPs do domínio; quem
  enviou qualquer form não vê mais. Para testar de novo: janela anônima ou `?aep=1`.
- **v80:** o popup antigo "Ei, espera!" foi removido e o pop-up padrão continua no **form antigo (u=85, f=113)**,
  por decisão de 25/11/2026: a linha `<script>window.AEP_PAGE = { form: "reserva" };</script>` antes do bloco faz o
  pop-up usar o form reserva dele (85/113) em vez do form 105 da página. Os forms principais da v80 seguem no 105.

## Roteador do domínio (Workers da Cloudflare)

- **`bf26-v14-router`**: rotas `cronogramadosfluentes.com.br/pc-lpm-bf26vNN*` e `/pc-le-cdf-v128*` … `v137*`
  (uma rota por página, sem padrão genérico: em 25/11/2026 bf26v4, v8, v11, v14–v24 e pc-le-cdf v128–v137) → pastas
  do Pages `paginabfnds-v1`. Não cobre a V25–V27 nem a V28–V31 (essas estão no `lp-black-aloud`, abaixo).
  Atenção: a rota `pc-lpm-bf26v4*` também casa `/pc-lpm-bf26v40` … `v49` (prefixo), por isso esses números não são usados.
- **`lp-black-aloud`** (fora deste repositório: Worker de assets estáticos publicado com `wrangler` pelo dono da
  conta; a API não devolve o código e não há `wrangler.jsonc` dele aqui). Rotas em 25/11/2026:
  `cronogramadosfluentes.com.br/lp-black-26/*` (respondia 404), `/pc-lpm-bf26v28*`, `v29*`, `v30*` e `v31*`
  (páginas "Black Vitalícia Aloud", servidas por ele com `Cache-Control: max-age=0`). Último deploy: 25/11/2026
  18:57 UTC (versão `616f1dec`), com vários deploys em 24/11. **Não mexer nele a partir deste repositório**; as pastas
  `v29/` e `v30/` daqui (BF26 V8 e V11) não têm relação com as rotas `bf26v29`/`bf26v30` desse Worker.
- **`pc-le-cdf-v80-v111-router`** (código em `workers/pc-le-cdf-v80-v111-router/`, publicado com
  `npx wrangler@4 deploy` a partir dessa pasta; a pasta não é servida pelo Pages — bloqueada no
  `functions/_middleware.js`). Worker separado, só para v80 e v111:
  - `/pc-le-cdf-vNN`, `/pc-le-cdf-vNN/` e `/index.html` → `paginabfnds-v1.pages.dev/vNN/` (com a query string)
  - `/pc-le-cdf-vNN/img/*` e `/fonts/*` → `/vNN/img/…` e `/vNN/fonts/…`
  - `/pc-le-cdf-vNN-off` e `/pc-le-cdf-vNN-off/` → origem (WordPress, página antiga com slug `-off`)
  - outros subcaminhos → 404; caminhos que só casam pelo prefixo da rota (ex.: `/pc-le-cdf-v800`) → origem

  | Página | Rota | No ar desde | WordPress (página antiga) |
  |---|---|---|---|
  | v80 | `cronogramadosfluentes.com.br/pc-le-cdf-v80*` | 10/11/2026 19:50 UTC | id 4553, slug `pc-le-cdf-v80-off` (publicada) |
  | v111 | `cronogramadosfluentes.com.br/pc-le-cdf-v111*` | 10/11/2026 20:03 UTC | id 5651, slug `pc-le-cdf-v111-off` (publicada) |

  Rollback de uma página: tirar a rota do `wrangler.jsonc` e `npx wrangler@4 deploy` (ou apagar a rota no painel
  em Rotas de Workers) e voltar a slug original da página no WordPress. Observação: `wrangler deploy` recria as
  rotas do Worker (a rota da v80 trocou de ID ao publicar a da v111), o que pode deixar a página alguns segundos
  sem o Worker — nesse intervalo o WordPress redireciona a slug antiga para a `-off`.
- **`pc-lpm-bf26-v25-v27-router`** (código em `workers/pc-lpm-bf26-v25-v27-router/`, mesmo modelo e mesmas regras
  do Worker da v80/v111 com o prefixo `/pc-lpm-bf26vNN`; teste: `node test.mjs`). Worker separado, só para
  as BF26 V25, V26 e V27 (pastas `v25/`, `v26/`, `v27/`).
  - Publicado em 16/11/2026 **sem rotas** (versão `b36427a9`). As rotas foram criadas uma a uma pela API
    (`POST /zones/<zona>/workers/routes`), o que não recria as rotas já no ar. O `wrangler.jsonc` lista as 3 rotas
    como registro do estado. Um `wrangler deploy` a partir dele recria as 3, então só em horário de pouco tráfego.

  | Página | Rota (id) | No ar desde | WordPress (página antiga) |
  |---|---|---|---|
  | V25 | `…/pc-lpm-bf26v25*` (`a5022431`) | 16/11/2026 17:33 UTC | id 6458, slug `pc-lpm-bf26v25` (mantida) |
  | V26 | `…/pc-lpm-bf26v26*` (`32252a1b`) | 16/11/2026 17:35 UTC | id 6493, slug `pc-lpm-bf26v26` (mantida) |
  | V27 | `…/pc-lpm-bf26v27*` (`b0c22e65`) | 16/11/2026 17:36 UTC | id 6558, slug `pc-lpm-bf26v27` (mantida) |

  **Decisão (16/11/2026): a slug da V25–V27 NÃO vira `-off`.** As páginas do WordPress ficam com a slug original
  e publicadas, com o título prefixado por "[EM CÓDIGO] " (16/11/2026, só pela Edição rápida: slug, status e
  conteúdo do Elementor intactos). O Worker e as Redirect Rules (abaixo) garantem que todo acesso cai no código.
  Se o Worker falhar, o WordPress serve a página antiga no mesmo endereço (sem 301).
  Rollback de uma página: `DELETE /zones/<zona>/workers/routes/<id>` (ou apagar a rota no painel), tirá-la do
  `wrangler.jsonc` e desligar a Redirect Rule dela.
- **Redirect Rules da zona cronogramadosfluentes.com.br (Regras → Regras de redirecionamento), criadas em 16/11/2026.** Rodam antes dos
  Workers e cobrem o que a rota do Worker não pega (a rota diferencia maiúsculas e não decodifica `%2D`; o
  WordPress aceita essas variações e os acessos por ID). Uma regra por página, 301 estático para o endereço
  canônico, **preservando a query string** (UTMs, fbclid, gclid). Plano Free: 5 de 10 regras em uso.

  | Ordem | Regra | Destino | ID WP |
  |---|---|---|---|
  | 1 | `BF26 V25 -> codigo (variantes e ID WP 6458)` | `/pc-lpm-bf26v25/` | 6458 |
  | 2 | `BF26 V26 -> codigo (variantes e ID WP 6493)` | `/pc-lpm-bf26v26/` | 6493 |
  | 3 | `BF26 V27 -> codigo (variantes e ID WP 6558)` | `/pc-lpm-bf26v27/` | 6558 |
  | 4 | `v80 -> codigo (variantes e ID WP 4553)` | `/pc-le-cdf-v80/` | 4553 |
  | 5 | `v111 -> codigo (variantes e ID WP 5651)` | `/pc-le-cdf-v111/` | 5651 |

  Expressão (modelo da V25; as outras trocam slug e ID):
  ```
  (lower(url_decode(http.request.uri.path)) in {"/pc-lpm-bf26v25" "/pc-lpm-bf26v25/" "//pc-lpm-bf26v25" "//pc-lpm-bf26v25/" "/index.php/pc-lpm-bf26v25" "/index.php/pc-lpm-bf26v25/"}
     and not raw.http.request.uri.path in {"/pc-lpm-bf26v25" "/pc-lpm-bf26v25/"})
  or (http.request.uri.path in {"/" "/index.php"} and (any(http.request.uri.args["page_id"][*] eq "6458")
     or any(http.request.uri.args["p"][*] eq "6458") or any(lower(http.request.uri.args["pagename"][*])[*] in {"pc-lpm-bf26v25" "pc-lpm-bf26v25/"})))
  ```
  - Use `raw.http.request.uri.path` na exclusão: a normalização de URL da zona já decodifica `%2D` em
    `http.request.uri.path`, mas a rota do Worker compara o caminho cru. Com o campo normalizado, `/pc%2Dlpm-…`
    caía no WordPress.
  - Página nova servida por Worker = rota + uma regra destas. As `-off` não são redirecionadas (de propósito).
  - As outras BF26 do `bf26-v14-router` NÃO têm regra: `/PC-LPM-BF26V4/` ainda cai no WordPress (301 para a `-off`).
- **Always Use HTTPS** ligado em 16/11/2026 (SSL/TLS → Certificados de borda): http → 301 https em 1 salto, com a
  query string. Testado sem loop no WordPress, nas BF26, v80/v111/v128–v137 e na `/confirmacao-bf26v1/`.
- **`www.cronogramadosfluentes.com.br` não tem DNS** (NXDOMAIN), de propósito por enquanto: não abre nada.
- **Workers: plano Paid** (deduzido: a conta passa de 100 mil requisições/dia sem erros de limite; confirmar em
  Workers & Pages → Plans). Sem limite diário; excedente US$ 0,30 por milhão acima de 10 milhões/mês. Todas as
  rotas estão em fail closed (`request_limit_fail_open=false`), o que só importaria num plano Free (erro 1027).
  Requisições ao Worker por visita: V25 18, V26 9, V27 10, v80 24, v111 10 (HTML + imagens + fontes).
- **Redirecionamento da slug antiga no WordPress (mantido de propósito).** Ao trocar a slug para `-off`, o
  WordPress gravou `_wp_old_slug` = `pc-le-cdf-v80` (página 4553) e `pc-le-cdf-v111` (página 5651). Por isso, se
  um pedido para `/pc-le-cdf-v80/` ou `/pc-le-cdf-v111/` chegar ao WordPress, ele responde **301 para a `-off`**.
  Hoje isso não acontece, porque o Worker atende esses caminhos antes. Só entra em ação se o Worker deixar de
  atender: rota removida (rollback), Worker fora do ar, ou os segundos em que `wrangler deploy` recria as rotas.
  - **Regra:** republicar o `pc-le-cdf-v80-v111-router` (`npx wrangler@4 deploy`) só em horário de pouco tráfego.
  - **Solução definitiva (quando for preciso):** apagar os dois registros pelo phpMyAdmin da hospedagem. Conferir
    antes com `SELECT meta_id, post_id, meta_value FROM wp_postmeta WHERE meta_key = '_wp_old_slug' AND
    ((post_id = 4553 AND meta_value = 'pc-le-cdf-v80') OR (post_id = 5651 AND meta_value = 'pc-le-cdf-v111'));`
    (o prefixo `wp_` pode ser outro) e então `DELETE` só desses `meta_id`. Não mexe em mais nada nas páginas.
    Depois testar que `/pc-le-cdf-v80-off/` e `/pc-le-cdf-v111-off/` abrem e que a v80/v111 seguem no Pages.
- **Processo usado para colocar uma página no domínio** (v80 e v111, 10/11/2026): conferir que nenhuma rota
  existente cobre o caminho → rota no Worker → limpar o cache da Cloudflare das URLs com e sem barra (Caching →
  Configuração → Limpeza personalizada → URL) → testes (com/sem barra, desktop/mobile, perfil anônimo, assets,
  UTMs, lead real com pixels bloqueados) → slug `-off` no WordPress sem despublicar → limpar o LiteSpeed
  (Caixa de ferramentas → Limpar por… → URL) → testes de novo, incluindo a `-off`.
- ⚠️ **Não use "Editar código" no `bf26-v14-router`.** A versão ativa é a `1de3160a` (rollback feito em
  28/10/2026 às 15:22), mas o painel e a API mostram o código da `c7a57e20`, que foi revertida (tem os cookies
  de geolocalização das BF26 V4/V8/V11/V22–V24, que não estão no ar). Editar e salvar a partir do painel
  publicaria a `c7a57e20` de volta em todas as páginas BF26. Resolver antes de qualquer mudança nesse Worker.

## Domínio mathwerner.com.br (DSI PV V11–V13)

Zona `mathwerner.com.br` na mesma conta da Cloudflare (plano Free, proxy ligado). É **outro WordPress**
("Matheus Werner Jerke", Elementor 4.4, plugins gtm4wp, HandL UTM Grabber e Redirection); o wp-admin tem login próprio.
Outros nomes da zona: `dsi.mathwerner.com.br` → projeto Pages `pagina-dsi-captura-v4` (outro repositório, padrão de
tracking diferente: só pixel Meta, sem GTM); `pv.mathwerner.com.br` → Vercel (fora desta conta);
`servidor.mathwerner.com.br` → Stape. O `www` existe e o WordPress redireciona para o domínio sem www.

- **Páginas** (pastas com o mesmo nome do caminho, então os assets `/dsi-pv-vNN/img/...` funcionam no domínio, no
  pages.dev e no preview sem `_redirects`):

  | Página | WP id | Rota (id) | No ar desde | Formulários |
  |---|---|---|---|---|
  | `/dsi-pv-v11/` | 1749 | `mathwerner.com.br/dsi-pv-v11*` (`832b6f1c`) | 16/11/2026 20:52 UTC | 2 (AC 108), 5 vídeos YouTube, 5 botões → `#form` |
  | `/dsi-pv-v12/` | 1754 | `mathwerner.com.br/dsi-pv-v12*` (`558f5934`) | 16/11/2026 20:54 UTC | 1 (AC 108) |
  | `/dsi-pv-v13/` | 1759 | `mathwerner.com.br/dsi-pv-v13*` (`cd4960a6`) | 16/11/2026 20:56 UTC | 1 (AC 108) |

  São páginas de lead (pré-matrícula), sem checkout. Form AC `u/f=108`, campos 41–43 e UTMs 281–285 + 293 (scripts
  da BF26 V4). Depois do envio o AC redireciona para `https://mathwerner.com.br/confirmacao-dsi/` (WordPress) com
  `campaign_id=lcto-dsi-abr26`.
- **Tracking = o do WordPress do mathwerner, não o das BF26.** No `<head>`, antes de qualquer CSS: dataLayer do
  gtm4wp (`pagePostType`, `pagePostType2`, `pagePostAuthor:"kauele"`), **GTM-TGS4NZX5** (GA4 G-CNBLEJEEQX via sGTM
  `servidor.mathjerke.com.br`, Google Ads 311446904, Meta 463718029855153, visitorapi, witly), Clarity **vx9rdk9acv**
  (única mudança: carrega depois do `load`) e o HandL UTM Grabber no navegador (js-cookie 2.1.0 + a lógica do plugin
  sem jQuery). Sem `page_version`, sem GTM-P9ZJRS9R, sem TikTok. Conferido no domínio: mesmas tags e dataLayer do WordPress.
- **Worker `mathwerner-dsi-pv-router`** (`workers/mathwerner-dsi-pv-router/`, teste `node test.mjs`): mesmo modelo dos
  outros roteadores (`/dsi-pv-vNN[/|/index.html]` → `paginabfnds-v1.pages.dev/dsi-pv-vNN/`, `img/`/`fonts/`, query
  string mantida, outros subcaminhos 404, prefixos como `/dsi-pv-v110` → origem). **Além disso grava, só no HTML, os
  cookies que o HandL do WordPress grava pelo servidor**: `utm_*`, `gclid`, `email`, `username` (gravados se vierem
  na URL, apagados se não), `handl_ref`, `handl_original_ref`, `handl_landing_page`, `handl_url`, `handl_ip`, com os
  mesmos atributos (30 dias, `domain=.mathwerner.com.br`, `secure`, `SameSite=Lax`). Conferido lado a lado com o
  WordPress: 13 cookies idênticos. Publicado sem rotas (versão `fe539448`); rotas criadas pela API, uma por vez.
- **Redirect Rules da zona mathwerner** (3 de 10): `DSI PV V11/V12/V13 -> codigo (variantes e ID WP 17xx)`, mesma
  expressão das regras do cronogramadosfluentes (slug `dsi-pv-vNN`, IDs 1749/1754/1759), 301 com a query string.
  Matriz de acesso: 66 de 66 casos no código (maiúsculas, `%2D`, `?page_id`, `?p`, `?pagename`, `//`, `/index.php/`,
  www, http, UTMs/fbclid/gclid).
- **Always Use HTTPS** ligado na zona em 16/11/2026: testado sem loop no WordPress, `dsi.` e `/confirmacao-dsi/`.
- **Slug mantida** (sem `-off`). Título das páginas 1749, 1754 e 1759 prefixado por "[EM CÓDIGO] " em 16/11/2026
  (Edição rápida: slug, status e conteúdo intactos). Rollback: apagar a rota pela API ou painel e desligar a Redirect Rule da página.

## Cache e otimização (16/11/2026)

- **`_headers`**: `Cache-Control: public, max-age=31536000, immutable` para `img/*` e `fonts/*` de v80, v111, v25–v27 e
  dsi-pv-v11–v13. O HTML segue o padrão do Pages (`max-age=0, must-revalidate`), então publicar o `index.html`
  atualiza a página na hora. As outras pastas (v4, v15–v24 etc.) não foram incluídas.
- **Regra de nomes:** todo arquivo nessas pastas tem hash de conteúdo no nome (`nome-<8 hex do md5>.ext`). Para
  trocar uma imagem/fonte, crie um arquivo novo com outro hash e atualize o `index.html`; **nunca** substitua o
  conteúdo mantendo o mesmo nome (o navegador e a borda guardariam a versão antiga por 1 ano). Página nova que
  entrar nesse regime: hashes nos nomes + linhas no `_headers`.
- v25/v27: imagens de cards com variantes `-400w/-600w` (v27: `-320w/-560w`) em `srcset`/`sizes` medidos por
  breakpoint, com `style="aspect-ratio:W/H;object-fit:cover"` para a altura não mudar conforme a variante.
- v80: o fundo da seção `.bio` só carrega quando ela chega a ~1000px da tela (classe `js` no `<html>` +
  IntersectionObserver; sem JavaScript o fundo carrega normalmente).
- Não mexer no carregamento do GTM nem das tags (render-blocking restante: CSS do intl-tel-input no cdnjs e Google
  Fonts — candidatos a otimizar só com teste visual do campo de telefone).

## Campanha D-007 (teste A/B; as 6 páginas no domínio desde 26/11/2026)

6 páginas novas feitas a partir do Figma `NBH50jkRf0wvWVRjWSRkp6` (linha de cima, sem as linhas "DS novo"). Base técnica
da BF26 V4 (GTM/`page_version`, Clarity com atraso, intl-tel-input, campos 41–43, UTMs 281–285 + 293, form AC 116,
obrigado `/confirmacao-bf26v1/` pela configuração do form). Slugs e pastas aprovados em 25/11/2026 (não há página
no WordPress: são páginas novas, sem `-off` nem ID):

| Pasta | Frame | Endereço | Variante |
|---|---|---|---|
| `v32/` | `3:836` página completa | `/pc-lpm-bf26v32/` | A |
| `v33/` | `14:460` | `/pc-lpm-bf26v33/` | B |
| `v34/` | `2:2` dobra única | `/pc-lpm-bf26v34/` | A |
| `v35/` | `14:921` | `/pc-lpm-bf26v35/` | B |
| `v36/` | `3:551` dobra única | `/pc-lpm-bf26v36/` | A |
| `v37/` | `18:1065` | `/pc-lpm-bf26v37/` | B |

- **Variantes B (v33, v35, v37) liberadas em 26/11/2026** (autorização do depoimento confirmada). Depoimento do Figma:
  Lueinny, foto `foto-lueinny-d78b2dd1.webp` (o Figma não traz profissão nem cidade/UF). Até a liberação ficaram fora do
  Worker e com 404 na produção do Pages (`HIDDEN_IN_PRODUCTION` do middleware, hoje vazio).
- **v32/v33: grade de cards e garantia centralizadas** (26/11/2026): a grade tem 1195px e a garantia 1149px dentro do `.w`
  (1132px), e com `margin:auto` elas começavam na borda do `.w`, 32px à direita do Figma. Correção só a partir de 1196px
  (`@media(min-width:1196px)` com margens negativas simétricas); hero, FAQ e rodapé ficaram idênticos pixel a pixel.
- Branches de preview: `d007-preview` (o trabalho original, com as pastas provisórias `d007-v25a`… renomeadas; páginas e
  Worker idênticos ao `main` em 25/11/2026, nada falta no `main`) e `d007-b-depoimento` (preview das B com o depoimento).
- **Worker `pc-lpm-bf26-d007-router`** (`workers/pc-lpm-bf26-d007-router/`, teste `node test.mjs`): mesmo modelo do
  Worker da V25–V27 (`/pc-lpm-bf26vNN[/|/index.html]` → `paginabfnds-v1.pages.dev/vNN/` com a query string, `img/` e
  `fonts/`, outros subcaminhos 404, prefixos como `/pc-lpm-bf26v320` ou `-off` → origem, que responde 404). Lista fechada
  `VERSIONS` = 32 a 37. Publicado em 25/11/2026 sem rotas (versão `83c85e8b`); B incluídas na versão `6fd5467e` (26/11/2026,
  publicada com `versions upload` + `versions deploy`, que não recria as rotas). Rotas criadas pela API, uma por vez:

  | Página | Rota (id) | No ar desde |
  |---|---|---|
  | V32 | `…/pc-lpm-bf26v32*` (`b75abea9`) | 26/11/2026 13:04 UTC |
  | V34 | `…/pc-lpm-bf26v34*` (`40be5a1b`) | 26/11/2026 13:04 UTC |
  | V36 | `…/pc-lpm-bf26v36*` (`aa7e488c`) | 26/11/2026 13:04 UTC |
  | V33 | `…/pc-lpm-bf26v33*` (`a3a93d05`) | 26/11/2026 13:57 UTC |
  | V35 | `…/pc-lpm-bf26v35*` (`feae1037`) | 26/11/2026 13:57 UTC |
  | V37 | `…/pc-lpm-bf26v37*` (`b575c0f5`) | 26/11/2026 13:57 UTC |

  Sem Redirect Rules (decisão de 26/11/2026: não há página no WordPress, então variações como maiúsculas ou `%2D` só
  dão 404). Sem limpeza de cache: a resposta não passa pelo cache da borda (sem `cf-cache-status`), e o token OAuth do
  wrangler não tem permissão de purge. Testado em 26/11/2026: HTML no domínio idêntico ao do Pages (desktop e celular),
  todos os assets 200 com cache de 1 ano, lead real nas 3 (AC 116, campos 41–43 e UTMs 281–285 + 293, redireciona para
  `/confirmacao-bf26v1/`). B testadas em 26/11/2026 com GTM e pixels bloqueados (Chrome headless por CDP com
  `--host-resolver-rules`: 6 tentativas de tracker por lead, nenhuma com resposta). ⚠️ Os 3 leads das A (e-mails `teste.preview.claude+d007v32dom|v34dom|v36dom@example.com`)
  foram enviados **sem** bloquear o GTM/pixels: as conversões de 26/11/2026 ~13:10 UTC nessas páginas são testes. Rollback: `DELETE /zones/<zona>/workers/routes/<id>` e tirar a rota do `wrangler.jsonc`.
- As D-007 não estão no exit pop-up (`scripts/sync-exit-popup.js`).
- v32–v37 estavam livres em 25/11/2026 (domínio 404, nenhuma página no REST do WordPress, nenhuma rota de Worker).
- Diferenças aprovadas em relação ao Figma: "+62 mil" alunos (o Figma diz +60 mil), "Entre **na** Plataforma" (o Figma
  diz "no"), respostas do FAQ da V32/V33 adaptadas da V25, Switzer ExtraBold no lugar de Switzer Black/Epilogue Black.

## Preview

Branches que não são o `main` geram `https://<branch>.paginabfnds-v1.pages.dev`. Os assets usam caminhos
absolutos do domínio (`/pc-le-cdf-vNN/img/...`, `/pc-lpm-bf26vNN/img/...`), por isso o `_redirects` reescreve
esses caminhos no preview (hoje v80, v111 e BF26 V25–V27). As `dsi-pv-vNN` não precisam (pasta = caminho).
