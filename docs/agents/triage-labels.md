# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

Edit the right-hand column to match whatever vocabulary you actually use.

A check in game is `ready-for-agent`, with the label `probe` beside it ([The `probe` label](#the-probe-label)): an agent on a machine with the game settles it with a Probe run. It is `ready-for-human` only for the checks [`probe/README.md`](../../probe/README.md#what-stays-for-a-human) lists, the issue naming which one.

## Kind labels

Four more labels say what an issue is, next to its triage label. Apply `spec` and `ticket` when creating the issue, `probe` as [The `probe` label](#the-probe-label) says, and `next` as [The `next` label](#the-next-label) says.

| Label    | Applied to                                                                                                                                                           |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spec`   | A spec, created with the `write-spec` skill. Its tickets are sub-issues.                                                                                             |
| `ticket` | A ticket of a spec, created with the `split-spec` skill (a sub-issue), which splits a Spec with its Coverage table.                                                  |
| `probe`  | An issue whose work includes a Probe run, so a human may have to log in to Battle.net while it is worked. A **Probe Ticket** is a Ticket that carries it.            |
| `next`   | A Spec or Ticket whose delivery needs a major: its worktree starts from `origin/next` and its pull request goes to the **Next branch**, never to the default branch. |

Both repos (`phmilk/reforged-ts` and `phmilk/reforged-ts-template`) have the four. Issues of the wayfinder map, bugs and follow-ups carry neither `spec` nor `ticket`; any issue can carry `probe` or `next`.

An issue carrying `wayfinder:*`, `ticket` or `spec` is not triaged: its body is its brief, and the map or the split gave it its labels. An assigned Ticket or issue is taken, whatever its labels, and a Spec carries the logins of its Tickets: see "Claim" in `docs/agents/issue-tracker.md`.

### The `probe` label

`probe` says the issue's work includes a Probe run. A Probe run can stop at the Battle.net login: the game's saved session expires, and `probe:run` waits for a human, then gives up ([Running a Probe run](../../probe/README.md#running-a-probe-run)). The label tells a Collaborator beforehand to stay within reach, and lets them ask an Agent to leave such work alone when nobody is ("no Probe Tickets").

- **It is about the Probe run, not the game.** It marks an issue for a run of the library's Probe runner only: a check through the Template's `test:map` or `run-in-game` does not get it. Both repos have the label, as they have the other kind labels.
- **It stays beside the triage label.** A Probe run is the Agent's, so the issue stays `ready-for-agent`, and takeable: the Claim board and the `claim` check read nothing from it.
- **Who puts it, and when.** `split-spec`, when it creates a Ticket one of whose criteria rests on a fact of the game that `docs/research/` does not measure yet; and whoever finds that need in the middle of an implement, at once, before running the Probe: `gh issue edit <n> --add-label probe`. It is put by hand: the board cannot derive it.
- **It is permanent.** It is not removed once the Probe ran: it says what the work included.
- **An issue that only cites the findings of a Probe already run does not get it** (#984, #986): no new run is needed.
- **The default is to take it.** An Agent leaves an issue labelled `probe` alone only when the prompt asks for it ("no Probe Tickets").

A fact only the game can settle is never a Judgement call: the Agent that meets one runs the Probe there, or states it as an Open decision, which holds the auto-merge.

### The `next` label

`next` says the issue's delivery needs a major: a change that breaks a public API of a package at its first stable version or after. Such a change goes to the Next branch, `next`, where a major is prepared in pre mode, and never to the default branch ([Release channels](../release.md#release-channels), [ADR 0031](../adr/0031-a-releases-channel-follows-the-branch-it-runs-from.md)). Without the label, everything goes to the default branch, `master` in the library and `main` in the Template.

- **`write-spec` decides it.** In its explore step it asks whether the Spec's delivery needs a major, and when it does, it publishes the Spec with `next` beside `spec`. During the build phase no Spec needs one: every package is a prerelease of its first stable, and `master` takes a major of any of them.
- **`split-spec` copies it.** Each Ticket of a Spec labelled `next` gets `next` too, so every Ticket says its branch.
- **The loop follows it.** An implement of an issue labelled `next` starts its worktree or branch from `origin/next`, whoever runs it: `ship-spec` makes its worktree from `origin/next`, the Template's from its `origin/next`, and an `/implement` or `/implement-spec` run by hand branches from `origin/next` too; `ship-branch` reviews against `origin/next` and opens the pull request with `--base next`; `next-step` names `origin/next` where it names the base. A Ticket delivered on `next` is closed when its pull request merges ([Closing a Ticket delivered on `next`](../release.md#closing-a-ticket-delivered-on-next)).
- **It needs the branch.** Work labelled `next` starts only once the Next branch exists ([Starting a major](../release.md#starting-a-major)): with no `origin/next`, the Agent stops and says so, and never sends the work to the default branch instead.
- **It is put by hand otherwise.** An issue found to need a major after it was written gets it with `gh issue edit <n> --add-label next`, before its work starts; the board does not derive it.

## State labels

One more label says where a Spec stands. It is not a triage role: the Claim board derives it, whatever set it ([ADR 0025](../adr/0025-only-a-split-specs-unblocked-tickets-are-worked.md)).

| Label         | Applied to                                                                                                                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `needs-split` | An open Spec with no Ticket yet (no sub-issue), in place of `ready-for-agent`: split it first. Once it has a Ticket, the board removes `needs-split` and puts `ready-for-agent` back, within the hour. |

A Spec with another triage label (`ready-for-human`, `needs-triage`, `needs-info`, `wontfix`) keeps it and only gets or loses `needs-split`. Both repos have the label; `pnpm board:labels` writes it ("The labels" in [`docs/release.md`](../release.md#the-board)).
