# temporaryworksconsulting.com

Astro static site for Temporary Works Consulting, deployed to Cloudflare Workers via the
existing Workers Git integration on this repo.

## Develop

```
npm install
npm run dev
```

## Build

```
npm run build       # outputs to ./dist
npm run preview     # wrangler dev against ./dist
```

## Deploy

The Cloudflare Workers Git integration builds and deploys this repo on push.
`wrangler.toml` configures the Worker (`name = "dm1033"`) and serves `./dist` as
static assets via the `ASSETS` binding.

For a manual deploy:

```
npm run deploy
```

### Cloudflare Workers Build settings

In the Cloudflare dashboard for the `dm1033` Worker, set:

- **Build command:** `npm run build`
- **Deploy command:** `npx wrangler deploy`
- **Root directory:** `/`

Wrangler will pick up `wrangler.toml`, which serves `./dist/` as static assets.

## Structure

- `src/pages/` — routes (index, services, sectors, about, contact, 404)
- `src/layouts/Base.astro` — head, header, footer
- `src/components/` — Header, Footer
- `src/styles/global.css` — site styling (no framework)
- `src/worker.ts` — Cloudflare Worker entrypoint (assets passthrough)
- `public/` — static assets, `robots.txt`, `sitemap.xml`, `favicon.svg`
