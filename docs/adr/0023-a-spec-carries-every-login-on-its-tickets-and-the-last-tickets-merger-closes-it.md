---
status: accepted
date: 2026-10-23
---

# A Spec carries every login on its Tickets, and the last Ticket's merger closes it after the coverage check

Spec #693 stayed open after its four Tickets closed. GitHub does not close a parent when its sub-issues close; the Claim protocol had the pull request of the last Ticket name the Spec, or else the Spec's assignee close it, and a Spec worked Ticket by Ticket has no assignee. All 29 closed Specs had been closed by hand. The same Spec lost one of its Further Notes in the split, and nothing compared a Spec's items with what its Tickets carried. And under ADR 0016's "one login per issue", a Spec worked by two Collaborators (Spec #700: wyller holds two Tickets, the maintainer would take the rest) cannot show both: an assignee on a Spec meant "worked whole, in one pull request", and a second one is a conflict for the claim check.

We amend ADR 0016 for Specs. A Spec has no Claim of its own: its assignees are every login that holds or has delivered one of its Tickets, joined in the same command that claims a Ticket, added by the claim check when a pull request's author is missing, and left only by releasing a Ticket without delivering any. "One login per issue" and the stale rule apply to Tickets and to issues outside a Spec; "one Claim at a time" is one issue or Tickets of one Spec, claimed as each one's work starts. Every split writes a Coverage table into the Spec's body, a Ticket and a criterion for each item of its decisions, tests and notes, and `pnpm spec:check` verifies it: every item has a row, every Ticket closed as completed, every criterion checked, every "check whether…" with its outcome. A pull request never names the Spec; whoever merges its last open Ticket runs the check and, on green, closes it, and any assignee of the Spec or the maintainer may.

## Considered options

- The Spec's assignees as only those holding an open Ticket now. The set shrinks on every merge, and at the close it holds one login, or none.
- The board closing a Spec when its sub-issues close. The board is a derived view that writes Status only (ADR 0016); closing issues would make it a second source, and closing on a count is exactly what lost #693's note.
- A workflow syncing a Spec's assignees from its Tickets on every issue event. One more workflow, and a caller in the Template, for what one command and the existing claim check already do.
- The pull request of the last Ticket naming the Spec, as before. A keyword closes the Spec before any check runs.

## Consequences

- The claim check accepts a Spec assignee who holds or held one of its Tickets, and adds a pull request's author to the Ticket's Spec.
- The board is unchanged: a Spec with assignees is In progress, and a parent takes the highest Status of its open Tickets.
- `implement-spec` still claims every free Ticket of a Spec at once, since its one pull request delivers them.
- A Spec split before this change gets its Coverage table from `split-spec` before it can close on the check.
- The Claim entry of the glossary and the Claim section of the issue tracker doc, in both repositories, follow.

Decision record: https://github.com/phmilk/reforged-ts/issues/726
