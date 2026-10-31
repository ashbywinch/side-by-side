# Releasing Side by Side — agent runbook

Audience: an agent or human with no prior context. Read this before touching
production. The long-form hosting details are in `deployment.md`.

## The rule

- **Never guess the version.** The user supplies the semver version. If they
  have not supplied one, ask; do not infer it from the diff.
- **Never run `wrangler deploy`.** Production changes only through the release
  workflow.
- **Never create or move release tags by hand.** CI owns `v<version>` and
  `production`.
- **Never approve the production deployment on the user's behalf.** Ask them.

## Prerequisites

1. The work is merged to `main`; CI is green.
2. There is no other production deployment waiting for approval.
3. The user has supplied a version `x.y.z` greater than `package.json` and not
   already tagged.

Check the queue:

```sh
gh run list --repo ashbywinch/side-by-side --branch main --limit 5
```

## Release

1. Dispatch the release workflow with the supplied version:

   ```sh
   make release VERSION=1.0.1
   ```

   Equivalent: `gh workflow run release.yml --repo ashbywinch/side-by-side -f version=1.0.1`.

   The workflow validates strict semver, greater-than-current, and no existing
   tag. It bumps `package.json`/`package-lock.json`, commits
   `chore(release): vX`, pushes the bump to `main`, and dispatches `ci.yml`.

2. Follow the Release workflow:

   ```sh
   gh run list --repo ashbywinch/side-by-side --workflow release.yml --limit 1
   gh run watch <run-id> --repo ashbywinch/side-by-side
   ```

   A validation failure means no changes were made; fix the version and retry.

3. Follow the resulting main CI run until **Verify, build and stage** passes:

   ```sh
   gh run list --repo ashbywinch/side-by-side --branch main --limit 3
   ```

   The job summary contains the green version ID and its preview URL, and
   **Smoke test green** must be green. No production traffic has changed.

4. Tell the user the green candidate is ready and give them the run URL. They
   approve the `production` deployment in GitHub Actions. Do not approve it
   yourself.

5. After approval, the **Promote approved version** job runs:
   `wrangler versions deploy <id>@100%`, production smoke, automatic rollback
   on failure, then moves `production` and creates `v<version>` if absent.

6. Verify:

   ```sh
   SHA=$(curl -s https://sbs.blueumbrella.net/version.json | jq -r .sha)
   git rev-parse production^{commit}   # must equal $SHA
   git ls-remote --tags origin "refs/tags/v<version>"
   make smoke ARGS="--base https://sbs.blueumbrella.net --sha $SHA"
   ```

## Tags

- **`production`** always points at the live commit. CI force-moves it only
  after a successful production smoke.
- **`v<version>`** is created once, after the first successful production
  smoke for that package version. It is never moved. A later deployment of the
  same version (for example a docs-only deploy) moves `production` only.
- Never create or move either tag by hand.

## Failure handling

- **Release validation fails**: no push, no deploy. Correct the version.
- **Green smoke fails**: no approval, no traffic switch. Fix the build and
  repeat the release.
- **Production smoke fails**: CI rolls back to the previous deployment and
  fails the job. Production is the previous version; investigate before the
  next release.
- **Tag push fails after a successful deploy**: production is live; the
  environment deployment record has the SHA. Fix the tag/CI and do not deploy
  again just to retag.

## Current process constraint

`release.yml` pushes the version-bump commit directly to `main` (with
`GITHUB_TOKEN`) and dispatches CI explicitly. `main` is not branch-protected
today; production is protected by the required `production` environment
approval. If branch protection is added later, convert the bump to a release
PR (or use a token whose push triggers CI) before enabling it.
