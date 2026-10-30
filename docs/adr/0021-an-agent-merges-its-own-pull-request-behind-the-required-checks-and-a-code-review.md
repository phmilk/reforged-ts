---
status: accepted
date: 2026-10-23
---

# An Agent merges its own pull request behind the required checks and a code review

A ready Spec still waits on a human at every merge: each Ticket's pull request is implemented, reviewed by `/code-review` and green, and then sits until someone presses the button, after which the next Frontier waits too. The human adds nothing at that point that the repository does not already check: the ruleset of `master` requires `ci (ubuntu)`, `ci (windows)` and `claim / check`, squash only, and no approving review. The places where a human is needed are already named elsewhere (a screen check, multiplayer, a Probe on a machine without the game, a release), and they are stops before the pull request, not at its merge.

We let any Collaborator, and any Agent a Collaborator runs, merge their own pull request without a human review, in both Board repositories, under three limits. The merge is by auto-merge only (`gh pr merge --squash --auto`), so GitHub merges when the required checks pass and never before. The pull request has been through `/code-review`, and what it found is fixed. Nothing goes around a check: never `--admin`, never the API's merge endpoint, never a required check red. When CI is red, the cause is fixed or the work stops, with a rerun allowed only for a failure catalogued as a known flake.

## Considered options

- Only the maintainer merges. Safe, but the maintainer becomes the bottleneck of every Spec, and their review at merge time repeats what `/code-review` and CI already did.
- The Agent leaves every pull request ready for a human (what `implement-spec` does). The same bottleneck, and the next Frontier cannot start until someone comes back.
- A required approving review in the ruleset. It would forbid self-merge outright and make every Agent's pull request wait for a second login, which a project of a few Collaborators does not have at hand.

## Consequences

- `ship-spec` merges each Ticket's pull request on its own and starts the next Frontier from `master`.
- The quality bar of a merge is the required checks plus `/code-review`, so a flaky required check now blocks Agents directly: the known-flake catalogue comes from diagnosing #658, and an empty catalogue allows no rerun.
- The Template's repository settings turn auto-merge on, as the library's already do.
- A Collaborator who wants a human review of a given pull request asks for it; nothing here forbids one.
- No global rule or hook changes: a Collaborator's own instructions and hooks against merging around a check (`--admin`, the API's merge endpoint) stay as they are, and this decision widens none of them.

Decision record: https://github.com/phmilk/reforged-ts/issues/727
