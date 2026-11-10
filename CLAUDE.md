# CLAUDE.md

Landing pages da Aloud servidas pelo Cloudflare Pages (projeto `paginabfnds-v1`, deploy via Git no `main`).
Cada pasta `vNN/` é uma página. O mapeamento das URLs do domínio (ex.: `/pc-le-cdf-v80/` → `/v80/`) é feito
por um roteador no painel da Cloudflare, fora deste repositório.

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

## Preview

Branches que não são o `main` geram `https://<branch>.paginabfnds-v1.pages.dev`. Os assets usam caminhos
absolutos do domínio (`/pc-le-cdf-vNN/img/...`), por isso o `_redirects` reescreve esses caminhos no preview.
