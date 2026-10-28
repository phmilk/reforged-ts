---
status: accepted
date: 2026-10-23
---

# Only a split Spec's unblocked Tickets are worked

A Spec is written to be split into Tickets, and its Tickets are worked in the order their blockers set, but nothing held either. A Spec with no Ticket carried `ready-for-agent`, showed as Ready, and the Claim protocol still let it be claimed and worked whole (#726 and #727 were such Specs). A Ticket with an open blocker showed as Blocked, yet `/implement` started on it and its pull request merged on a green CI. The skills that start the work, `implement` and `implement-spec`, are Upstream skills the repository never edits (ADR 0022), so the rule cannot live in their steps.

We amend ADR 0016 and ADR 0023. A Spec is split once it has a Ticket, and an unsplit Spec is not claimable. Its label says so: `needs-split` replaces `ready-for-agent` on every open Spec with no sub-issue, and the board's reconcile derives that pair of labels as it derives Status, writing only the difference; `write-spec` and `split-spec` set them when they act, and the board confirms. An unsplit Spec shows as Backlog. The claim check fails a pull request that would close a Spec, and one that would close a Ticket with an open blocker not closed by the same pull request; on an assignment, a Claim of an unsplit Spec or a blocked Ticket draws a comment and is never removed. In Claude Code, a hook in the shared project settings stops `implement`, `implement-spec`, `ship-spec` and `split-spec` pointed at the wrong issue and names what to run instead; it reads the Frontier from `pnpm spec:frontier`, and it lets the skill through when it cannot reach GitHub, since the claim check still holds the rule.

## Considered options

- A writer reacting to the Ticket's events (the `claim` workflow on `labeled`) instead of the board. `to-tickets` creates a Ticket before linking it to its Spec, so the event arrives while the Spec has no child yet, and the label would stay.
- A Coverage table as the meaning of "split". Specs already in progress without one (#700, #725) would stop; ADR 0023 already makes the table a condition of the close.
- A Skill variant `implement-ticket` that checks first. A typed `/implement` would stay unguarded.
- Removing a premature Claim on the assignment. It would be the first time the check undoes a Claim, and the board would flicker; the pull request is where the rule holds.

## Consequences

- The board writes labels for the first time, only this pair and only on open Specs; it is still the single writer of what it derives.
- `needs-split` exists in both Board repositories and is documented next to the kind labels, as a state, not a triage role.
- `implement-spec` still delivers a Spec's Tickets in one pull request, since a blocker closed by the same pull request does not fail it.
- The hook and `next-step`, the Skill variant that ends every implement with its next steps, join what both repositories share (ADR 0024).
- An Agent outside Claude Code meets the rule at the claim check only.

Decision record: https://github.com/phmilk/reforged-ts/issues/737

## Amendment (2026-10-27)

The pair of labels has its own writer inside the board, not the reconcile itself (#740). The reconcile writes with `PROJECT_TOKEN`, the maintainer's classic token with the `project` scope alone, which writes no label in a public repository. So `board.yml` runs `pnpm board:labels` first, in a job of the environment `app` with the repositories' App token over both Board repositories (`issues: write`, which the App already holds), then the reconcile, whatever the labels did. The board, its one workflow, stays the single writer of both, and the rule is one pure function, `specLabelsOf`, which the Status rules read too: a Status never waits on a label write. Widening `PROJECT_TOKEN` to `public_repo` was turned down (a long-lived token would write in every public repository of the owner), and so was copying the App's key into the environment `board` (a second copy of the key to rotate, and a maintainer step before the merge). A Spec that carries another triage label than `ready-for-agent` (`ready-for-human`, `needs-triage`, `needs-info`, `wontfix`) keeps it and gets or loses `needs-split` alone, so that a split never skips triage.

Amendment record: https://github.com/phmilk/reforged-ts/issues/740

## Amendment (2026-10-28)

Two points the decision held without saying them outright (#781). The Coverage table stays a condition of a Spec's close, never of its work: a Spec's Tickets are worked once it has one, whether or not its table is written, and the table is checked by `pnpm spec:check` when its last Ticket merges (ADR 0023). And the skill-target check (`.claude/hooks/skill-target.mjs`), the hook in the shared project settings, has two reasons, not one: the Upstream skills that start the work cannot carry the check in their steps (ADR 0022), and the claim check, run by CI, stops the merge of a pull request but not the work that comes before it, so without it a blocked Ticket would still be worked up to its pull request.

Amendment record: https://github.com/phmilk/reforged-ts/issues/781
