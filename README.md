# Side by Side

A bilingual reader for Russian classics: one short source passage beside its
English translation, with a "reveal as you go" translation mechanic.

Live at <https://sbs.blueumbrella.net>.

## How it fits together

- **App**: Vue 3 + TypeScript + Vite, client-side rendered.
- **Corpus**: `corpus/books/<lang>/<author>/<title>.jsonl` is the source of
  truth. Each line is `{ title, author, start, end, text, translation }`.
- **Deployed data**: `public/api/` is generated (and gitignored) from the
  corpus by `scripts/build-corpus.mjs`. Each book becomes a `meta.json` plus
  `chunk-NNNN.jsonl` files of 500 segments, so the reader fetches ~50 KB
  gzipped instead of a whole novel.
- **Hosting**: Cloudflare Workers Static Assets, assets-only (no Worker
  script). Custom domain `sbs.blueumbrella.net`, free plan.

## Development

```sh
npm ci
npm run dev        # builds the chunked corpus, then Vite on :8080
```

| Command | What it does |
| --- | --- |
| `npm run data` | Rebuild `public/api` from `corpus/books` (warm runs are skipped) |
| `npm run check-corpus` | Validate index ↔ file parity and translations |
| `npm run lint` | ESLint check (use `lint:fix` to apply fixes) |
| `npm run typecheck` | `vue-tsc --noEmit` |
| `npm run coverage` | Vitest with coverage thresholds |
| `npm run build` | Data + Vite build + `dist/version.json` |
| `npm run deploy` | Build and `wrangler deploy` |
| `npm run smoke` | Post-deploy smoke test against production |

`make setup`, `make lint`, `make typecheck`, `make test`, `make data`,
`make check-corpus`, `make dist` are the same entry points.

## Tests

Tests are written first. New behaviour needs a failing test before the
implementation. Test files live in `test/test.*.ts`; component tests use
Vitest + Testing Library + MSW.

## Releases

Every merge to `main` builds and stages a green Worker version, smoke-tests
it, then waits for approval in the `production` GitHub Environment. Approval
promotes that exact version; production smoke runs after the switch and rolls
back automatically on failure. Pull requests get a preview URL and the same
smoke test without an approval gate.

Release a semver version from the workflow, not by hand:

```sh
gh workflow run release.yml --repo ashbywinch/side-by-side -f version=1.1.0
```

After the approved promotion, CI moves the `production` tag to the live commit
and creates the immutable `v<version>` tag. See
[`docs/deployment.md`](docs/deployment.md) for setup, rollback, the chunk size
knob and the R2 scale-out trigger.
