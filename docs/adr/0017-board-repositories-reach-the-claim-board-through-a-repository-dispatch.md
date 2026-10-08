---
status: accepted
date: 2026-10-07
---

# Board repositories reach the Claim board through a repository dispatch

The Claim board is the project's, not the library's: it shows every Board repository, `phmilk/reforged-ts` and `phmilk/reforged-ts-template` today, more later. Its single writer, `board.yml`, lives in the library alone (ADR 0016), since a workflow of the Template is copied into every Map project, so a Template issue event triggered nothing and the Template's cards moved only on the hourly run, up to an hour after the Claim they show. We decide that every Board repository other than the library tells the board to reconcile on its own issue and pull-request events, within the run's own time (seconds to a minute): a thin caller workflow in that repository calls a reusable `board-dispatch.yml` in the library, which mints a token of the repositories' GitHub App for the library alone with `contents: write` and sends a `repository_dispatch` of type `board-repository-event`; `board.yml` gains that trigger and ignores the payload, since each run reads everything from GitHub, so the dispatch carries no data and no authority beyond what the hourly schedule already has.

The credential stays inside the project in three layers, any one of which suffices: the caller's job runs only in its own repository (`if: github.repository == ...`), so a copy in a Map project or a fork is skipped, never red; the reusable workflow mints a token only for a repository on its list of Board repositories, a list a convention test holds equal to `release/src/board.ts`'s; and the App's private key lives in an environment `board` of each Board repository, admitting its default branch only, while a Map project has no environment, no key and no installation, and nothing without write access to the library can dispatch to it. `PROJECT_TOKEN` and every project-scoped token stay in the library's environment `board`.

## Considered options

- `workflow_dispatch` of `board.yml` from the Board repository. It needs the App's `Actions: write`, a new permission on every repository of the installation that also cancels and reruns any workflow; `repository_dispatch` needs only `contents: write`, which the App already holds.
- A fine-grained personal access token per Board repository. One more secret to rotate each year, tied to one person's account; the App is already installed on both repositories.
- A shorter schedule in the library. GitHub's schedule allows five minutes at best and often runs ten to thirty minutes late; it spends runs and never reaches a minute.
- The App's webhook to a hosted service. It would be real time and need no workflow in any repository, but the project hosts nothing.
- A repository of the board's own, holding `board.yml` and the board's code, with the library a Board repository like the others. It fits "the board is the project's" best, but moves the code out of `release/` and reopens ADR 0016 for no gain today; deferred, not rejected. Should it happen, only the dispatch's target changes.
- A creation CLI that leaves the Template maintenance files out of a new Map project (#549). A convenience, never the boundary: the Template is public and can always be cloned, forked or used as a template, so the layers above hold whatever the CLI does.

## Consequences

- A new Board repository costs a caller workflow, an environment `board` holding the App's key, the App's installation, an entry in the reusable workflow's list and in `board.ts`; the repository-setup wizard makes the environment.
- The caller fires on the same `issues` and `pull_request_target` types as `board.yml`, a convention test holding the lists equal. What no event covers (blockers, sub-issues) still waits for the hourly run.
- The claim check's `dispatch` job, until now library-only, calls `board-dispatch.yml` in a Board repository other than the library, since its assignments, made with `GITHUB_TOKEN`, raise no event there either.
- Runs coalesce in the library's `board` concurrency group alone: one running, one pending. The caller has no group of its own.
- A failed caller run leaves that repository's cards to the hourly run, as before; its red run is the signal.
- The App's key is still also a repository secret in both repositories, readable by any branch's workflow. The dispatch adds no exposure to it, since the key already mints the same token, and moving every workflow that uses the key onto an environment is a ticket of its own beside this one.
- The caller is Template maintenance: listed among the files a generated Map project deletes, beside `claim.yml` and `sync.yml`.
