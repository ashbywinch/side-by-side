# Deployment runbook

Hosting: **Cloudflare Workers Static Assets** (assets-only Worker, no script).
Production: <https://sbs.blueumbrella.net>. Preview: a per-PR `workers.dev`
version URL posted as a PR comment.

## Architecture in one paragraph

`corpus/books/` is the committed source of truth. `scripts/build-corpus.mjs`
generates the deployed corpus into `public/api/` (gitignored): one `meta.json`
and a set of `chunk-NNNN.jsonl` files per book, 500 segments per chunk.
`vite build` copies `public/` and the app into `dist/`, then
`scripts/write-version.mjs` adds `dist/version.json` with the commit SHA.
`wrangler versions upload` uploads `dist/` as a new Worker version without
switching traffic; `wrangler versions deploy` promotes it atomically.

## First-time setup

1. Cloudflare account with the `blueumbrella.net` zone (already on
   Cloudflare nameservers). The zone must be in the same account that owns the
   Worker.
2. `npx wrangler login`, then `npx wrangler whoami`.
3. Create an API token for CI with:
   - **Account → Workers Scripts: Edit** — account-scoped, not zone-scoped
   - **Zone → Workers Routes: Edit** (for the custom domain), scoped to
     `blueumbrella.net`
   - Account Settings: Read

   A zone-scoped Workers Scripts grant is deprecated and cannot create an
   account-level Worker; it fails deployment with
   `No access to the specified resource`. Use the account-scoped permission,
   or the **Edit Cloudflare Workers** template.

   Store the token as `CF_API_TOKEN` in the GitHub repository secrets, and the
   account ID as `CF_ACCOUNT_ID` (the house names used by the other repos).
4. A brand-new account needs a one-time bootstrap: create the `side-by-side`
   Worker and the `sbs.blueumbrella.net` custom domain with an approved
   `wrangler deploy` before the green-release workflow can stage versions.
   This project is already bootstrapped; after that all releases use
   `wrangler versions upload` and `wrangler versions deploy`. Do not run
   `wrangler deploy` ad hoc.

## Release flow

Every push to `main` builds and stages a green Worker version, smoke-tests it,
then waits for the required `production` approval. Approval promotes that exact
version atomically; production smoke runs after the switch and rolls back
automatically on failure. PRs get a preview and smoke without an approval gate.

The step-by-step agent runbook, semver command, tag policy and failure handling
are in [`releasing.md`](releasing.md). No `wrangler deploy` runs in the release
path.

## Smoke test

```sh
make smoke ARGS="--base https://sbs.blueumbrella.net --sha $(git rev-parse HEAD)"
```

It verifies the app shell, the `/ru/books` route, a Cyrillic book deep link,
`/version.json` SHA, the language index (2,148 books), a book's metadata, its
first chunk, and that the chunk is served as `text/plain` with `br`/`gzip`
compression. The CLI retries for 5 minutes by default
(`--attempts 30 --delay 10000`).

## Rollback

A failed production smoke automatically rolls back to the previous deployment.
To roll back manually:

```sh
npx wrangler deployments list
npx wrangler rollback <version-id> --name side-by-side --message "reason"
```

Then re-run the smoke test against the rolled-back SHA:

```sh
SHA=$(curl -s https://sbs.blueumbrella.net/version.json | jq -r .sha)
make smoke ARGS="--base https://sbs.blueumbrella.net --sha $SHA"
```

To restore an older commit, open a revert PR and let the release process run,
or promote the previously staged version with
`npx wrangler versions deploy <version-id>@100% --name side-by-side --yes`.
Do not run `wrangler deploy` ad hoc.

## Data pipeline

Translations that have drifted out of alignment have a separate repair
runbook: [`translation-repair.md`](translation-repair.md).

- Add or edit a book in `corpus/books/<lang>/<author>/<title>.jsonl`, and add
  or update its line in `corpus/books/<lang>/index.jsonl`.
- `make data` regenerates `public/api` and removes stale chunks. A warm run
  is skipped using a stamp of source paths, sizes and mtimes.
- `make check-corpus` fails on missing files, orphan files, duplicate index
  entries, non-translated index entries, malformed JSON, real source text
  without a translation, and **any blank source card**. Every card must have
  source text; a translation-only or fully blank card is a data defect and
  never ships. The corpus builder enforces the same rule.
- `chunkSize`, `perPage` and `lruChunks` live in `corpus.config.json` and are
  imported by both the builder and the client. Changing `chunkSize` invalidates
  the build stamp and regenerates chunks; the client computes chunk locations
  from the same file, so one change is enough.

### Limits

Current deployment: ~4,982 files, largest file 8.1 MB, ~51 MB total compressed.
Cloudflare free plan allows 20,000 files per version and 25 MiB per file.
Static asset requests are free and unlimited; there is no Worker script.

When the deployed file count approaches ~15,000 (about two more
Russian-sized languages), either raise `chunkSize` to 1,000 (roughly halves
the file count) or move `/api/books` to an R2 bucket behind a custom domain
and point the client base URL at it. R2 has no file-count limit and no egress
fees.

### Compression check

```sh
curl -sI -H 'Accept-Encoding: br' \
  https://sbs.blueumbrella.net/api/books/ru/index.jsonl \
  | grep -i -E 'content-type|content-encoding'
```

Expected: `content-type: text/plain; charset=utf-8` and
`content-encoding: br` (or `gzip`). If `.jsonl` is served as
`application/octet-stream`, change the chunk extension to `.txt` in
`scripts/build-corpus.mjs` and `src/components/Book/chunking.ts` (one string
each) and redeploy.

## Alternative: Cloudflare Pages

Pages would also fit (same 20k-file limit, Git-integrated builds). We chose
Workers because it gives atomic versions, one-command rollback, per-version
preview URLs and a script-free SPA fallback.
