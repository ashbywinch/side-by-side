# PRD — Side by Side

Status: released 1.0.0; bookshelf and accounts are planned.

## JTBD

1. When I am learning Russian, I want to read real literature with the English
   translation beside it, so I can stay in the story instead of stopping at
   every unfamiliar word.
2. When I sit down to read, I want to resume exactly where I stopped, so I do
   not lose my place or re-read a passage.
3. When I finish a session, I want to see what I am reading and how far I have
   got, so I feel progress and choose the next session deliberately.
4. When I move between phone and laptop, I want the same bookshelf and place,
   so reading is one continuous activity.
5. When I choose a book, I want to know whether it is at a useful difficulty,
   so I do not bounce off something far above my level.

## User requirements

- Browse the Russian corpus by author, CEFR level and size.
- Open a book and see one short source passage beside its English translation.
- Reveal translations one at a time (click a card, `Ctrl+ArrowDown`, hide with
  `Esc`), so the source is read before the answer.
- Move between pages without loading the whole book; resume from any page URL.
- Keep the current page, scroll position and back/forward behaviour sane on
  desktop and mobile.
- See only valid CEFR levels and “Unrated” in the level filter; never numeric
  artefacts.
- See “Unrated” rather than a guessed level for books under 250 words.
- (Planned) Add books to a bookshelf and resume from a saved page.
- (Planned) Sign in with Google and see the same bookshelf on every device.

## Personas

- **Intermediate learner** — reads short stories and poems, needs the
  translation close by, switches between phone and laptop, will use a
  bookshelf daily. Primary decision-maker for level filtering and resume.
- **Advanced reader** — reads novels, wants minimal chrome and fast page
  turns, cares about complete translations and preserving literary tone.
- **Lapsed learner** — returns after weeks; needs the bookshelf and "continue
  reading" to restart without hunting.

## Constraints that shape everything

- **Cost**: $0/month on Cloudflare Workers Static Assets; no server script in
  the current release. Planned auth/sync must stay within the Workers/D1 free
  tiers or justify a paid step.
- **Longevity**: the corpus is plain JSONL in git; the site is a static build.
  No runtime service is required to read a book.
- **Backups**: git history is the corpus backup; Cloudflare version history is
  the deployment rollback mechanism.
- **Monitoring**: the release smoke test is the production health check; add
  Cloudflare Web Analytics rather than building an observability stack.
- **Access and auth**: no login today; all content is public. Google sign-in
  is the planned identity mechanism, with minimal profile data.
- **Scale**: 2,148 books, 466,574 segments, ~179 MB source; largest book
  8.1 MB. The deployed corpus is chunked to keep first reads small.
- **Hosting limits**: Workers free plan allows 20,000 files per version and
  25 MiB per file; the current deployment uses ~5,000 files. Adding languages
  is expected to force a chunk-size change or R2 migration.

## Non-goals

- Social features, comments, public profiles.
- Selling books or subscriptions.
- Offline-first mobile apps in the current phase.
- Human-quality literary translation guarantees; translations are
  best-effort and can be repaired per the corpus runbook.
