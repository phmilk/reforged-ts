# PROTOTYPE: environment secret in a reusable workflow across repositories

Throwaway, for #551 (rehearsal #554, [comment](https://github.com/phmilk/reforged-ts/issues/551#issuecomment-6065638313); ADR 0017).

**Question:** which design lets the Template mint the GitHub App token from the secret of its environment `board`, with no secret at the repository level?

**Verdict:** the caller must pass the secret, by name or with `secrets: inherit`, and the called job keeps `environment: board`. Then the called job reads the caller's environment secret, even when no repository secret exists, and the environment's value beats a same-named repository secret. A caller that passes no secrets gets an empty string with no error, which is the rehearsal's failure. An explicit map works between two private repositories of one user account, nested too, so the design does not need `inherit`.

## Setup

- `phmilk/probe-env-secret-reusable` (private): `reusable.yml` declares no secrets, like `board-dispatch.yml`. `reusable-declared.yml` declares `APP_PRIVATE_KEY` with `required: true`. `outer.yml` is a middle level that declares the secret (not required) and maps it on. Every called job has `environment: board`. Actions access level is `user`.
- `phmilk/probe-env-secret-caller` (private): `probe.yml` (`workflow_dispatch` on `main`). It has an environment `board` that admits `main` alone and holds `APP_PRIVATE_KEY`, a dummy value of length 9.
- Round 2 adds a repository secret `APP_PRIVATE_KEY` of length 21, so the length shows which value won.
- Each job prints only whether the secret arrived non-empty and its length.
- `probe.sh` drives it: `setup`, `round1`, `round2`, `teardown`.

## Results (2026-10-08)

| Variant | Round 1: environment only ([run](https://github.com/phmilk/probe-env-secret-caller/actions/runs/37820421033)) | Round 2: environment + repository ([run](https://github.com/phmilk/probe-env-secret-caller/actions/runs/37820518767)) |
| --- | --- | --- |
| (a) caller without `secrets:` | empty, 0 | empty, 0 |
| (b) caller with `secrets: inherit` | non-empty, 9 | non-empty, 9 (environment wins) |
| (c) plain job with `environment: board` | non-empty, 9 | non-empty, 9 (environment wins) |
| (d) explicit map `APP_PRIVATE_KEY: ${{ secrets.APP_PRIVATE_KEY }}` | non-empty, 9 | non-empty, 9 (environment wins) |
| (e) explicit map, nested (caller → outer → inner) | non-empty, 9 | non-empty, 9 (environment wins) |

All jobs concluded `success`, (a) included: an unpassed secret does not fail a job, so in the real workflow the failure happens in `create-github-app-token`.

## What it settles

- (a) reproduces the rehearsal. The repository secret does not reach the job in its place either.
- (d) answers the research note's open question: the explicit map reaches a secret that exists only in the environment, across two repositories of a user account. The calling job has no environment and evaluates `secrets.APP_PRIVATE_KEY` as empty in round 1 and as the repository value in round 2. The called job still receives the environment's value.
- (b) also works between repositories of a user account, but it hands over every secret the caller can reach.
- (e) covers the claim path (Template `claim.yml` → `claim-check.yml` → `board-dispatch.yml`): each level must map the secret on.
- Precedence: the environment's value wins in every variant that receives the secret. Deleting the repository copy (#558) changes nothing for (b), (d) and (e).
