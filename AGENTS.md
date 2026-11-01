# AGENTS.md — Side by Side

Instructions for AI agents working in this repo. This is the bootloader, not
the operating system: it holds only what is relevant to every agent. Details
live in the docs this tree links to.

## Quick start

- `make setup` — install deps, copy `.env`, install git hooks.
- `make dev` — build the chunked corpus and run Vite on :8080.
- `make test` — the gate: lint + typecheck + tests with coverage.
- `make dist` — production build in `dist/`.
- Never run ad-hoc tool commands where a make target exists.

## Releasing — the short version

1. The user supplies the semver version. **Never guess it.**
2. `make release VERSION=x.y.z` → creates the version-bump branch and opens a
   release PR.
3. Ask the user to review and merge the release PR. **Never merge it
   yourself**; `main` is protected.
4. After merge, wait for **Smoke test green** in the main CI run. Do not switch
   production.
5. Ask the user to approve the `production` deployment. **Never approve it
   yourself.**
6. After approval, verify `/version.json`, `production`, and `v<version>`.

Full runbook: `docs/releasing.md`. Hosting details: `docs/deployment.md`.

## Where things live — decision tree

| Task | Route to |
| --- | --- |
| Release a version / recover a failed release | `docs/releasing.md` |
| Hosting, rollback, corpus limits, headers | `docs/deployment.md` |
| Repair shifted translations | `docs/translation-repair.md` |
| What the product is for — JTBD, personas, constraints | `docs/PRD.md` |
| How it is built — components, layers, decisions | `docs/TECHSPEC.md` |
| What is being built, in what order | `docs/PLAN.md` |
| UX journeys and interaction spec | `docs/UX.md` |
| UX standard | `docs/ux-standards.md` |
| Coding standard (design principles, JS/TS conventions) | `docs/coding-standards.md` |
| Testing standard | `docs/testing-standards.md` |
| What good documentation is | `docs/writing-documentation.md` |
| Doc folder structure and required set | `docs/documentation-structure.md` |
| Human quick start | `README.md` |

Read the relevant doc before changing behavior.

## Make targets

| Target | Meaning |
| --- | --- |
| `make setup` | `npm ci`, `.env`, hooks |
| `make data` | rebuild `public/api` from `corpus/books` |
| `make check-corpus` | index/translation gate |
| `make lint` / `make lint-github` | ESLint local / CI annotations |
| `make typecheck` | `vue-tsc` |
| `make check` | lint + typecheck (pre-push) |
| `make test` | check + tests + coverage |
| `make coverage` | tests with coverage only |
| `make dist` | production build |
| `make clean` | remove deps, coverage, dist, generated corpus |
| `make smoke ARGS=...` | post-deploy smoke |
| `make release VERSION=x.y.z` | dispatch the gated semver release |

## Testing rules

- Always use make targets; never construct ad-hoc test commands.
- `make test` is the gate; coverage thresholds are enforced in
  `vitest.config.mjs`.
- New behavior starts with a failing test. Fix bugs with a regression test.

## Git and production rules

- Never commit directly to `main`; `main` is protected and requires a PR with an approving review and the CI check.
- Never run `wrangler deploy`; production changes only through the release
  workflow.
- Never create or move `v*`/`production` tags by hand; CI owns them after a
  successful production smoke.
- Never approve a `production` deployment on the user's behalf.
- The `production` environment requires the user's approval; the green
  candidate is smoked before the switch.

## Secrets

- Real secrets live in the shell environment or GitHub/Cloudflare secret
  stores — never in code, docs, logs, or `.env.example`.
- In shell, check with `test -n "$VAR"`; never echo a secret.
- The app has no runtime env vars today. Future auth/sync work must add them
  to `.env.example` with blank values.

## Repo-specific facts

- Source of truth: `corpus/books/`; `public/api/` is generated (gitignored).
- A card with blank source text is invalid; `make check-corpus` and the
  builder fail on it.
- The reader fetches `meta.json` + one 500-segment chunk; do not reintroduce
  whole-book fetching.
- Reading progress is local-only in `localStorage` (`sbs:bookshelf:v1`) behind
  `useBookshelf`; components never touch storage directly. A bookmark moves
  only by reading — browsing never writes.
- Deployment is an assets-only Cloudflare Worker; adding auth/sync turns it
  into an assets + API Worker (see `docs/TECHSPEC.md`).
