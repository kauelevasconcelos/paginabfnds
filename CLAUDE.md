# CLAUDE.md

Landing pages da Aloud servidas pelo Cloudflare Pages (projeto `paginabfnds-v1`, deploy via Git no `main`).
Cada pasta `vNN/` é uma página. O mapeamento das URLs do domínio (ex.: `/pc-le-cdf-v80/` → `/v80/`) é feito
por Workers roteadores da Cloudflare (ver "Roteador do domínio"). Arquivos internos (`CLAUDE.md`, `workers/`)
não são servidos pelo site: o `functions/_middleware.js` devolve 404 para eles.

## Formulários (padrão v136/v137)

Todas as páginas enviam o lead direto ao ActiveCampaign (`https://aloud.activehosted.com/proc.php`,
POST normal do navegador) e **não dependem de nenhuma página do WordPress** para o envio.
Telefone com intl-tel-input + máscara/validação por país (campos AC 41-43) e UTMs nos campos AC
281-293 e 357-370, com os mesmos scripts da v136/v137.

| Página | Formulário(s) | AC u / f |
|---|---|---|
| v80 (`/pc-le-cdf-v80/`) | 2 principais (`#105`, `#105-2`) | 105 / 105 |
| v80 | popup "Ei, espera!" (`#113`) | 85 / 113 |
| v111 (`/pc-le-cdf-v111/`) | 1 | 113 / 113 |
| v136, v137 | 2 / 1 | 113 / 113 |

Até nov/2026 os formulários principais da v80 enviavam pelo WordPress (página 4553, Elementor
`7a14b0e`/`3de2f0f` → webhook `aloud-etl` com `campaign_id=ppt-lpm-cdf` e `conversion_type_id=1`).
Isso foi substituído pelo AC 105; a v80 não depende mais dessa página.

## Roteador do domínio (Workers da Cloudflare)

- **`bf26-v14-router`**: rotas `cronogramadosfluentes.com.br/pc-lpm-bf26vNN*` e `/pc-le-cdf-v128*` … `v137*`
  (uma rota por página) → pastas do Pages `paginabfnds-v1`.
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
- **Processo usado para colocar uma página no domínio** (v80 e v111, 10/11/2026): conferir que nenhuma rota
  existente cobre o caminho → rota no Worker → limpar o cache da Cloudflare das URLs com e sem barra (Caching →
  Configuração → Limpeza personalizada → URL) → testes (com/sem barra, desktop/mobile, perfil anônimo, assets,
  UTMs, lead real com pixels bloqueados) → slug `-off` no WordPress sem despublicar → limpar o LiteSpeed
  (Caixa de ferramentas → Limpar por… → URL) → testes de novo, incluindo a `-off`.
- ⚠️ **Não use "Editar código" no `bf26-v14-router`.** A versão ativa é a `1de3160a` (rollback feito em
  28/10/2026 às 15:22), mas o painel e a API mostram o código da `c7a57e20`, que foi revertida (tem os cookies
  de geolocalização das BF26 V4/V8/V11/V22–V24, que não estão no ar). Editar e salvar a partir do painel
  publicaria a `c7a57e20` de volta em todas as páginas BF26. Resolver antes de qualquer mudança nesse Worker.

## Preview

Branches que não são o `main` geram `https://<branch>.paginabfnds-v1.pages.dev`. Os assets usam caminhos
absolutos do domínio (`/pc-le-cdf-vNN/img/...`), por isso o `_redirects` reescreve esses caminhos no preview.
