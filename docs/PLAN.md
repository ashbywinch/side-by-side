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

## Phase 2 — Valid CEFR levels (implemented, issue #140)

- **Inputs**: `index.jsonl` with 1,331 entries under 250 words carrying
  levels, including five legacy numeric values (`0`, `2`).
- **Outputs**: the 250-word rule applied globally (under 250 words is
  Unrated); the zero-word book removed; only present CEFR levels plus
  Unrated in the filter; defined badge colours; corpus check rejects numeric
  levels and rated short books.
- **Operations**: filter by level or Unrated; open an unrated book without a
  broken badge.
- **Quality gate**: no book under 250 words carries a level; the dropdown
  contains only CEFR values and Unrated; every book renders; corpus check
  passes; smoke expects 2,147 books.

## Phase 3a — Bookshelf store and resume (delivered)

- **Inputs**: the reader's reveals, page turns and scrolling; versioned
  `localStorage`.
- **Outputs**: a bookmark per book that survives reload; reveals restored on
  return; a browse bar that offers the way back; automatic finish; a soft-delete
  tombstone ready for sync.
- **Operations**: read, leave, return to the same place; look back a page without
  losing the bookmark; start a book again.
- **Quality gate**: resume restores page, reveals and place on the page; a page
  turn or reveal alone adds the book; looking back never moves the bookmark; no
  backend is required.

## Phase 3b — Bookshelf on the index (delivered, except removal)

- **Inputs**: the local bookshelf; the corpus index.
- **Outputs**: a row of book tiles above the results bar with "See all", the
  same portrait card in the catalogue, progress as a bar on the read books, a
  bookshelf page listing every entry, and filters that collapse behind a results
  bar (a sheet on a phone).
- **Operations**: see what you are reading, continue in one action, reach an
  older book through "See all", filter by level, size or author.
- **Quality gate**: two cards across a phone; a card's row shares one height;
  typing an author lists matches; every filter's list is visible when opened.
- **Remaining**: edit mode with removal and undo.

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
