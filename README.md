# Side by Side

A bilingual reader for Russian classics: one short source passage beside its
English translation, with a "reveal as you go" translation mechanic.

Live at <https://sbs.blueumbrella.net>.

## Quick start

```sh
make setup
make dev        # builds the chunked corpus, then Vite on :8080
make test       # lint + typecheck + tests with coverage
make dist       # production build in dist/
```

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
- **Release**: green Worker version + smoke → required `production` approval
  → atomic promotion → production smoke → automatic rollback on failure.
  CI owns the `production` and `v<version>` tags.

## Commands

| Command | What it does |
| --- | --- |
| `make setup` | `npm ci`, copy `.env`, install git hooks |
| `make dev` | Build `public/api`, run Vite on :8080 |
| `make data` | Rebuild `public/api` from `corpus/books` (warm runs are skipped) |
| `make check-corpus` | Validate index ↔ file parity and translations |
| `make lint` / `make lint-github` | ESLint local / CI annotations |
| `make typecheck` | `vue-tsc` |
| `make check` | lint + typecheck (pre-push) |
| `make test` | check + tests + coverage |
| `make coverage` | tests with coverage only |
| `make dist` | Data + Vite build + `dist/version.json` |
| `make clean` | Remove deps, coverage, dist, generated corpus |
| `make smoke ARGS=…` | Post-deploy smoke |
| `make release VERSION=x.y.z` | Dispatch the gated semver release |

## Releasing

The user supplies the version; never guess it. Do not run `wrangler deploy`
or create release tags by hand.

```sh
make release VERSION=1.1.0
```

Then wait for **Smoke test green**, ask the user to approve the `production`
deployment, and verify `/version.json`, `production`, and `v1.1.0`. The full
agent runbook is [`docs/releasing.md`](docs/releasing.md).

## Docs

| Doc | Purpose |
| --- | --- |
| [`AGENTS.md`](AGENTS.md) | Agent bootloader and decision tree |
| [`docs/PRD.md`](docs/PRD.md) | JTBD, personas, requirements, constraints |
| [`docs/TECHSPEC.md`](docs/TECHSPEC.md) | Components, layers, technology choices |
| [`docs/PLAN.md`](docs/PLAN.md) | Phases, inputs/outputs, quality gates |
| [`docs/UX.md`](docs/UX.md) | User journeys and interaction spec |
| [`docs/releasing.md`](docs/releasing.md) | Release runbook |
| [`docs/deployment.md`](docs/deployment.md) | Hosting, rollback, limits |
| [`docs/translation-repair.md`](docs/translation-repair.md) | Corpus repair runbook |
| [`docs/coding-standards.md`](docs/coding-standards.md) | Coding standard |
| [`docs/testing-standards.md`](docs/testing-standards.md) | Testing standard |
| [`docs/ux-standards.md`](docs/ux-standards.md) | UX standard |
| [`docs/writing-documentation.md`](docs/writing-documentation.md) | Documentation standard |
| [`docs/documentation-structure.md`](docs/documentation-structure.md) | Required doc set |

## Tests

Tests are written first. New behaviour needs a failing test before the
implementation. Test files live in `test/test.*.ts`; component tests use
Vitest + Testing Library + MSW. `make test` is the gate.
