# PLAN — Side by Side

Phases are ordered for earliest user value; each phase's inputs and outputs are
the software's, not project-management artifacts. A phase is complete when the
app passes its quality gates.

## Phase 0 — Readable corpus (released)

- **Inputs**: public-domain Russian texts, English translations, complexity
  metadata.
- **Outputs**: `corpus/books/ru/` JSONL, `index.jsonl`, a reader that renders
  source and translation cards.
- **Operations**: index filtering, book pagination, translation reveal.
- **Quality gate**: every index entry has a file; every card has source text
  and a translation; a book page renders and turns pages.

## Phase 1 — Chunked reader, hosting, release process (released 1.0.0)

- **Inputs**: the Phase 0 corpus, Cloudflare account and zone, GitHub repo.
- **Outputs**: generated chunk corpus, `sbs.blueumbrella.net`, CI gates,
  green-version approval and promotion, smoke tests, reviewed semver release PR.
- **Operations**: build/stage green, approve production, promote, rollback,
  release a version.
- **Quality gate**: first page ≤60 KB gzipped for the largest book; page turns
  inside a chunk make no request; production smoke passes; failed production
  smoke rolls back.

## Phase 2 — Valid CEFR levels (issue #140)

- **Inputs**: `index.jsonl` with five non-CEFR `Vocab Level` values (`0`, `2`).
- **Outputs**: only A1–C2 options; non-CEFR books normalised to `Unrated` or a
  correct level; defined badge colours; corpus check rejects future numeric
  values.
- **Operations**: filter by level; open an unrated book without a broken badge.
- **Quality gate**: dropdown contains only A1–C2 (+ Unrated if chosen); the
  five affected books render; corpus check passes.

## Phase 3 — Local bookshelf (issue #138)

- **Inputs**: reader page/segment state, `localStorage`.
- **Outputs**: add/remove/finish books; resume from saved page; continue
  reading; bookshelf survives reload.
- **Operations**: read a book, close the browser, resume; mark finished.
- **Quality gate**: progress survives reload and a chunk-size change; no
  backend required; anonymous use works.

## Phase 4 — Google sign-in and cross-device sync (issue #139)

- **Inputs**: Phase 3 bookshelf, Google OAuth client, Cloudflare D1.
- **Outputs**: Google sign-in/out, server-backed bookshelf, anonymous merge,
  account deletion; API Worker in front of the static assets.
- **Operations**: sign in on two devices; merge local shelf; delete account.
- **Quality gate**: same shelf and page on both devices; anonymous use still
  works; session cookie is Secure/HttpOnly/SameSite; no client secret; account
  deletion removes rows.

## Phase 5 — Corpus quality and scale

- **Inputs**: full corpus, correction reports, new languages when added.
- **Outputs**: transliteration/alignment corrections, CEFR data checks, R2 or
  larger chunk size if file count approaches 20,000.
- **Operations**: repair runbook, language onboarding, rollback.
- **Quality gate**: `check-corpus` clean; deploy file count within limits;
  production smoke passes.

## Release operation (applies to every phase)

Input: a semver version supplied for the release. Output: a reviewed release
PR, a promoted version, `production` tag and `v<version>` tag. Quality gate:
protected-main PR checks, green smoke, required production approval,
production smoke, automatic rollback on failure.
