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
| MGM (`indica.aloud.com.br`, pasta `pc-lpm-mgmv1/`) | 2 (sem exit pop-up; ver "Página de indicação MGM") | 117 / 117 |
| v136, v137 | 2 / 1 | 113 / 113 |
| BF26 V25, V26, V27 (`/pc-lpm-bf26v25/` … `v27/`) | 1 cada (`#116`) | 116 / 116 |
| BF26 V25b, V26b, V27b (`/pc-lpm-bf26v25b/` … `v27b/`) | 1 cada (`#116`) | 116 / 116 |

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
v80, v111, v137 e das BF26 V4, V8 (`v29/`), V11 (`v30/`), V23, V24, V25, V26, V25b e V26b (a V27 e a V27b ficaram de
fora de propósito).
**Não edite o bloco nas páginas:** mude o arquivo-fonte e rode `node scripts/sync-exit-popup.js` (substitui o bloco
existente ou insere; `--check` só confere). A lista de páginas está no próprio script. Teste: `?aep=1` na URL.

> Desligado de manhã em 26/11/2026 (não estava passando as UTMs para o AC) e **religado no mesmo dia em todas as
> páginas** (a MGM, que também o tinha, ficou sem pop-up: bloco removido em 26/11/2026). O problema das UTMs foi dado como resolvido pelo time (a correção não foi
> feita no código do bloco, que não mudou entre o desligamento e a religação).
> Para desligar de novo: `enabled: false` no `AEP_CONFIG` do arquivo-fonte + `node scripts/sync-exit-popup.js`; `?aep=1` abre mesmo desligado.

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

  - **Versões B (V25b, V26b, V27b), no ar desde 26/11/2026 18:14 UTC** (ver "Versões B da V25–V27" abaixo): o mesmo
    Worker serve `/pc-lpm-bf26vNNb` (NN = 25, 26, 27; lista fechada `B_VERSIONS`), tratado **antes** das não-b, com as
    mesmas regras (sem barra, `/`, `/index.html` → pasta `vNNb/` com a query string; `img/` e `fonts/`; outros
    subcaminhos 404; `vNNb-off`, `vNNbb`, `vNNc`, `v24b`, `v250b` → origem). **Sem rotas novas**: o padrão
    `…/pc-lpm-bf26v25*` já casa `v25b`. Versão `b956336e`, publicada com `versions upload` + `versions deploy`
    (rotas e IDs intactos, 41 rotas na zona). `node test.mjs`: 86 casos.

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
  - As versões B (`…v25b` etc.) NÃO têm regra e não são afetadas pelas da V25–V27 (conferido em 26/11/2026:
    `/pc-lpm-bf26v25b` não redireciona; `/PC-LPM-BF26V25B/`, `%2D` e `?pagename=pc-lpm-bf26v25b` dão 404 do WordPress).
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

- **`_headers`**: `Cache-Control: public, max-age=31536000, immutable` para `img/*` e `fonts/*` de v80, v111, v25–v27, v25b–v27b e
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

## Versões B da V25–V27 (V25b, V26b, V27b; no domínio desde 26/11/2026)

Variantes B do teste A/B da D-007, nos endereços definitivos (substituem a v33/v35/v37, que ficam no ar até a limpeza
junto com as A):

| Pasta | Conteúdo de | Endereço | Base técnica de |
|---|---|---|---|
| `v25b/` | v33 (frame `14:460`) | https://cronogramadosfluentes.com.br/pc-lpm-bf26v25b/ | v25 |
| `v26b/` | v35 (frame `14:921`) | https://cronogramadosfluentes.com.br/pc-lpm-bf26v26b/ | v26 |
| `v27b/` | v37 (frame `18:1065`) | https://cronogramadosfluentes.com.br/pc-lpm-bf26v27b/ | v27 |

- Conteúdo = v33/v35/v37 (depoimento Lueinny, centralização de 32px). Técnico = V25/V26/V27: mesmo GTM e prioridade,
  `<form … id="116">` igual ao da A, AC 116, campos 41–43, UTMs 281–285 + 293, cookies; `page_version` `v25b`/`v26b`/`v27b`
  (dataLayer e Clarity); título `Cronograma dos Fluentes – BF 26 – V25b – Matheus Werner`. Blocos técnicos comparados
  com a A: 0 linhas de diferença (v26b só difere no script do contador, que é da UI da v35).
- Exit pop-up: v25b e v26b no `scripts/sync-exit-popup.js` (como v25/v26); v27b fora (como a v27). Desligado (`enabled:false`).
- Assets em `/pc-lpm-bf26vNNb/img|fonts/…` (hash no nome, cache de 1 ano no `_headers`; `_redirects` para o preview).
- Não há página no WordPress nem Redirect Rule. Servidas pelo `pc-lpm-bf26-v25-v27-router` (ver "Roteador do domínio").
- Testado em 26/11/2026 no domínio: com/sem barra e `/index.html`, HTML idêntico ao do Pages (desktop e celular), assets
  200 com cache de 1 ano (22/18/16), UTMs mantidas, celular 390px sem overflow; v25/v26/v27, v4/v8/v11/v14/v23/v24/v28/v32,
  v80/v111/v137 byte a byte iguais a antes. Leads com GTM e pixels bloqueados (6 tentativas de tracker por lead, nenhuma
  com resposta): AC 116, field 293 = `pc-lpm-bf26v25b/` etc., obrigado `/confirmacao-bf26v1/`. E-mails
  `teste.preview.claude+v25bdom|v26bdom|v27bdom@example.com` (enviados 2x cada; mesmo contato).
- Branch de preview `bf26-b-v25b-v27b` (já no `main`; pode ser apagado).
- **Pendente:** v25/v26/v27 com os frames A (`3:836`/`2:2`/`3:551`) e depois a remoção da v32–v37, do Worker
  `pc-lpm-bf26-d007-router` e das rotas dele.

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

## Página de indicação MGM (em indica.aloud.com.br desde 26/11/2026)

**`https://indica.aloud.com.br/`** ("Member Get Member" da Black Vitalícia; o aluno compartilha
`https://indica.aloud.com.br/?ref=CODIGO`). Pasta **`pc-lpm-mgmv1/`** no Pages (o nome da pasta ficou do primeiro
endereço). Página nova, sem página no WordPress. O endereço antigo `cronogramadosfluentes.com.br/pc-lpm-mgmv1/`
(no ar só em 26/11/2026, antes da mudança) faz **301 para `https://indica.aloud.com.br/` com a query string inteira**.

- **É uma cópia da BF26 V4 (`v4/`)**, gerada a partir dela, com só estas mudanças: headline + texto de apoio
  (`.sub-mgm`), 3 perguntas no início do FAQ, **sem o exit pop-up** (o bloco padrão da v4 foi removido em
  26/11/2026), `<head>` (title, description, `noindex, nofollow`, canonical `https://indica.aloud.com.br/`) e
  `page_version: 'mgm'` no dataLayer e no Clarity. **GTM próprio da MGM: `GTM-56D2T4ST`** (26/11/2026, pedido do JV; a
  v4 segue no `GTM-P9ZJRS9R`), carregado direto de `www.googletagmanager.com` (script do head, preload e noscript). O Pixel
  vem pelo GTM (no HTML só há o preload do `fbevents.js`); o Clarity (`wcovrh3plq`, o mesmo da v4) está no HTML. O
  `preconnect` para `servidor.cronogramadosfluentes.com.br` (sGTM da v4) ficou da cópia. Textos do arquivo
  `pagina-mgm.html` do Nadal (fora do git; só a fonte do conteúdo, não da estrutura).
- **Assets vêm da pasta da v4**: o HTML usa `/pc-lpm-bf26v4/img|fonts/…` e o Worker da MGM responde esses caminhos em
  `indica.aloud.com.br` com `paginabfnds-v1.pages.dev/v4/img|fonts/…` (sem cópia). A pasta da MGM só tem o `index.html`.
  Não apague nem renomeie assets da v4 sem ver a MGM. No pages.dev e nos previews `/pc-lpm-bf26v4/…` não existe (o Pages
  devolve o HTML de fallback com 200), então lá as imagens não aparecem.
- **Origem (field 281):** `utm_source` da URL; sem ela, `"mgm"` (o referrer não entra no 281). Os outros campos de UTM
  seguem a lógica da v4 (URL, depois referrer).
- **Página de captura (field 293):** fixo `"pc-lpm-mgmv1/"` (constante `PAGINA_CAPTURA_MGM` no script de UTM), porque na
  raiz do `indica.` o caminho é só `/`.
- **Indicação:** script no fim do HTML lê `?ref=` (só `A-Z a-z 0-9 _ -`, até 40), guarda em localStorage `mgm:ref`
  (para recarregar sem o parâmetro; o localStorage é por domínio, então o ref guardado no endereço antigo não passa
  para o novo, mas o 301 leva o `?ref=`) e preenche o hidden `CAMPO_INDICADO_POR` nos 2 forms (`#matricula`,
  `#matricula2`). Sem ref: campo vazio.
- **Listas:** constante `AC_LISTAS` no mesmo script (principal **117/117**, form próprio da MGM confirmado pelo JV em 26/11/2026). O HTML dos forms ainda traz 116 (herdado da v4), mas o script troca para o 117 ao carregar. O embed do 117 (`/f/embed.php?id=117`) só tem nome, telefone e e-mail, igual ao 116.
- **Sem exit pop-up** (removido em 26/11/2026: bloco `ALOUD · EXIT POP-UP` e a lista `popup` do `AC_LISTAS`). A MGM não
  está no `scripts/sync-exit-popup.js`, então o sync não o recoloca. Para voltar: reverter o commit da remoção.
- **TODOs do JV (pendentes em 26/11/2026):**
  1. "Indicado por": o JV vai mandar o ajuste do script de UTM para gravar o ref numa UTM (`CAMPO_INDICADO_POR` ainda é
     o placeholder `"field[ID_INDICADO_POR]"`). Como o script de UTM regrava esses campos no `load` e ao mudar o e-mail, o
     ajuste tem de ser dentro dele (ref com prioridade).
  2. ~~GTM~~: trocado para `GTM-56D2T4ST` em 26/11/2026.
  3. ~~`AC_LISTAS`~~: resolvido em 26/11/2026 (form 117). Pendente: conferir no AC para qual obrigado o form 117 redireciona.
  4. `page_version 'mgm'`: confirmar que os relatórios (GA4/Clarity) separam a MGM da v4.
  Nenhum lead de teste foi enviado. Depois do GTM e do script: lead de teste com GTM/pixels bloqueados pelos 2 forms e
  conferir no AC "indicado por", origem `mgm` e field 293.
- **Worker `pc-lpm-mgm-router`** (`workers/pc-lpm-mgm-router/`, teste `node test.mjs`, 58 casos). Atende dois nomes:
  - `indica.aloud.com.br` (custom domain; o Worker é a origem): `/` e `/index.html` → `paginabfnds-v1.pages.dev/pc-lpm-mgmv1/`
    com a query string; `/pc-lpm-bf26v4/(img|fonts)/<arquivo>` → `pages.dev/v4/…` (arquivo inexistente → 404); o resto → 404.
  - `cronogramadosfluentes.com.br/pc-lpm-mgmv1*` (rota): `/pc-lpm-mgmv1` e qualquer subcaminho → 301 para
    `https://indica.aloud.com.br/` + query string (constante `REDIRECT_OLD`); `/pc-lpm-mgmv10`, `-off` → origem (404 do WP).

  | O quê | Id | Criado |
  |---|---|---|
  | Rota `cronogramadosfluentes.com.br/pc-lpm-mgmv1*` | `822336f6c8774e0aad87e10d819caa4b` | 26/11/2026 (API) |
  | Custom domain `indica.aloud.com.br` (DNS `AAAA indica 100::` com proxy, só leitura, + certificado) | `22257a3502feb3415e4d68200c644f29e734da38` | 26/11/2026 (API) |

  Versões: `9b120409` (só o endereço antigo) → `600900e7` (indica + endereço antigo servindo a página) → **`9641fde3`**
  (atual: indica + 301). Código novo: `versions upload` + `versions deploy` (não use `wrangler deploy`: recria rota e domínio).
  Rollbacks (comandos completos no `wrangler.jsonc`): tirar o 301 = `versions deploy 600900e7-…@100%`; tirar o `indica.` =
  `DELETE accounts/<conta>/workers/domains/22257a35…` (apaga também o DNS); tirar o endereço antigo = `DELETE` da rota.
  Conferido em 26/11/2026: v4 idêntica byte a byte antes/depois, 41 rotas na zona cronogramadosfluentes (intactas), DNS
  da aloud.com.br 73 → 74 (só o `indica`), custom domains da conta só com o novo a mais.
- **Zona aloud.com.br** (mesma conta, plano Pro; o token OAuth do wrangler não lê DNS nem regras dela: conferido pelo
  painel). Nenhuma regra (WAF, rate limit, redirect, config) nem Page Rule pega o `indica.` (todas filtram por outros
  nomes). Configurações da zona que valem para ele, diferentes do cronogramadosfluentes:
  - Rocket Loader ligado, mas **não reescreve** a resposta do Worker (conferido: 0 scripts alterados). Se algum dia
    aparecer `type="…-text/javascript"` ou `rocket-loader` no HTML, desligar só para o `indica.` com uma Configuration Rule.
  - **Cloudflare Fonts** troca o `<link>` do Google Fonts (Inter) por `@font-face` em `/cf-fonts/…` (carrega normal).
  - Detecção de bots por JavaScript: injeta um script `/cdn-cgi/challenge-platform` (não bloqueia).
  - `/robots.txt` é o gerenciado da Cloudflare (`Allow: /`, não chega ao Worker); a página continua `noindex, nofollow`.
  - Prévia de link: WhatsApp, facebookexternalhit e Telegram recebem 200 com o HTML.

## Preview

Branches que não são o `main` geram `https://<branch>.paginabfnds-v1.pages.dev`. Os assets usam caminhos
absolutos do domínio (`/pc-le-cdf-vNN/img/...`, `/pc-lpm-bf26vNN/img/...`), por isso o `_redirects` reescreve
esses caminhos no preview (hoje v80, v111, BF26 V25–V27 e V25b–V27b). As `dsi-pv-vNN` não precisam (pasta = caminho).
