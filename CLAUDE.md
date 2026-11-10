# CLAUDE.md

Landing pages da Aloud servidas pelo Cloudflare Pages (projeto `paginabfnds-v1`, deploy via Git no `main`).
Cada pasta `vNN/` é uma página. O mapeamento das URLs do domínio (ex.: `/pc-le-cdf-v80/` → `/v80/`) é feito
por um roteador no painel da Cloudflare, fora deste repositório.

## Dependências do WordPress antigo — NÃO apagar nem despublicar

- **v80** (`/pc-le-cdf-v80/`): os dois formulários principais enviam para o WordPress
  (`https://cronogramadosfluentes.com.br/wp-admin/admin-ajax.php`, action `elementor_pro_forms_send_form`)
  com `post_id=4553` e `form_id` `7a14b0e` / `3de2f0f`. As ações do lead (ActiveCampaign, webhooks etc.)
  rodam no WordPress a partir desse post. **A página 4553 do WordPress e esses formulários do Elementor
  não podem ser apagados, despublicados nem ter os formulários renomeados/recriados**, senão os leads
  da v80 deixam de ser processados.
  O popup "Ei, espera!" da v80 envia direto ao ActiveCampaign (u=85, f=113), sem passar pelo WordPress.
- **v111** (`/pc-le-cdf-v111/`): o formulário envia direto ao ActiveCampaign
  (`https://aloud.activehosted.com/proc.php`, u=113, f=113). Não depende do WordPress para o envio.

Esses envios só funcionam a partir do domínio `cronogramadosfluentes.com.br`: no preview `*.pages.dev`
o `admin-ajax` não libera CORS e o formulário da v80 mostra "Ocorreu um erro.".

## Preview

Branches que não são o `main` geram `https://<branch>.paginabfnds-v1.pages.dev`. Os assets usam caminhos
absolutos do domínio (`/pc-le-cdf-vNN/img/...`), por isso o `_redirects` reescreve esses caminhos no preview.
