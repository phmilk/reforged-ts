# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **A command in an issue or its brief**: run it once before writing it in, and quote what it printed. #754's brief named `vitest run --repeat 10`, an option vitest 5 does not have.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **Read an issue's parent** (a Ticket's Spec, a ticket's map): `gh api repos/<owner>/<repo>/issues/<n>/parent --jq .number` (for #745 it printed `737`), a 404 ("No parent issue found") when it has none. `gh issue view` has no such field (`Unknown JSON field: "parent"`).
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`
- **Claim an issue**: `gh issue edit <number> --add-assignee @me`, before any work on it and before any other write, a Ticket with its Spec; release it with `--remove-assignee @me` (see "Claim").

Infer the repo from `git remote -v`; `gh` does this automatically when run inside a clone.

## Where issues live

- **The library, the Typings, the harness and the lint plugin**: this repo, `phmilk/reforged-ts`.
- **The Template** (build pipeline, starter, its CI and docs): `phmilk/reforged-ts-template`. Its issues moved there on 2026-09-25, and the old numbers here redirect to them.
- Refer to an issue in the other repo with its full form, `phmilk/reforged-ts-template#12` or `phmilk/reforged-ts#46`; a bare `#12` means this repo. Sub-issues and "blocked by" edges work across the two repos.

## Claim

A Claim marks an issue as taken by one login: it is held while that login is among the issue's assignees. It binds every Collaborator (a person with push access to this repository or the Template's) and every Agent a Collaborator runs: an Agent writes as the Collaborator's login, so its Claim is the Collaborator's. The assignee is the source; the board (below) is a view of it. A Spec has no Claim of its own: its Tickets are claimed, and its assignees are the logins that hold or delivered them (ADR 0023).

An issue's life, from the form or the skill that creates it to its close; under each state, its Status on the Claim board:

```mermaid
stateDiagram-v2
  %% diagram: issue-life
  state "needs-triage" as needs_triage
  state "needs-info" as needs_info
  state "ready-for-agent" as ready_for_agent
  state "ready-for-human" as ready_for_human
  state "an open blocker" as blocked
  state "wontfix" as wontfix
  state "claimed" as claimed
  state "a draft pull request" as draft
  state "a pull request in review" as review
  state "stale" as stale
  state "a Spec, not split: needs-split" as spec_unsplit
  state "a Spec, its Tickets worked" as spec
  state "a Spec, its Tickets closed" as spec_delivered
  state "closed" as closed
  needs_triage : Backlog
  needs_info : Backlog
  ready_for_agent : Ready
  ready_for_human : Ready
  blocked : Blocked
  wontfix : Backlog
  claimed : In progress
  draft : In progress
  stale : In progress
  review : In review
  spec_unsplit : Backlog
  spec : In progress at an assignee, else its open Tickets' highest
  spec_delivered : In progress, at the logins of its Tickets
  closed : Done

  [*] --> needs_triage : an issue form, bug, enhancement or game-patch
  [*] --> ready_for_agent : /split-spec, a Ticket
  [*] --> spec_unsplit : /to-spec or /write-spec, a spec
  needs_triage --> needs_info : /triage
  needs_info --> needs_triage : the reporter answers
  needs_triage --> ready_for_agent : /triage
  needs_triage --> ready_for_human : /triage
  needs_triage --> wontfix : /triage
  ready_for_agent --> blocked : blocked by an open issue
  blocked --> ready_for_agent : its last blocker closes
  ready_for_agent --> claimed : the Claim, the first write, with its Spec for a Ticket
  ready_for_human --> claimed
  claimed --> ready_for_agent : release
  claimed --> draft : opened, checked by claim.yml
  draft --> review : marked ready for review
  review --> closed : merged, it closes the Ticket or the issue, never the Spec
  claimed --> stale : 3 days without a commit or a comment
  draft --> stale : 3 days without a commit or a comment
  stale --> claimed : takeover
  spec_unsplit --> spec : its first Ticket, by /split-spec or by hand; /split-spec or the board swaps needs-split for ready-for-agent
  spec --> spec : a Ticket claimed, its login joins the Spec
  spec --> spec_delivered : its last open Ticket merged
  spec_delivered --> spec_delivered : the coverage check red, the gaps commented
  spec_delivered --> closed : the coverage check green, the merger closes it with a comment
  wontfix --> closed : /triage closes it, with a comment
  closed --> [*]
```

| State                                | Status on the Claim board                                  | Defined in                                                                                                                                                      |
| ------------------------------------ | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `needs-triage`                       | Backlog                                                    | [Triage labels](triage-labels.md); an issue form (`.github/ISSUE_TEMPLATE/`) sets it with its own label                                                         |
| `needs-info`                         | Backlog                                                    | [Triage labels](triage-labels.md)                                                                                                                               |
| `ready-for-agent`, `ready-for-human` | Ready                                                      | [Triage labels](triage-labels.md); a Ticket from `split-spec`, and a Spec gets `ready-for-agent` back once split: [State labels](triage-labels.md#state-labels) |
| `wontfix`                            | Backlog, until closed                                      | [Triage labels](triage-labels.md); triage closes the issue with a comment                                                                                       |
| an open blocker                      | Blocked                                                    | "Claimable" below; "Blocking" under [Wayfinding operations](#wayfinding-operations)                                                                             |
| claimed                              | In progress                                                | "First write", "Claimable", "One login per issue" and "One Claim at a time" below; "Release" for the way back                                                   |
| a draft pull request                 | In progress                                                | "The check" below                                                                                                                                               |
| a pull request in review             | In review                                                  | "The board" below                                                                                                                                               |
| stale                                | In progress                                                | "Stale" below, with the takeover                                                                                                                                |
| a Spec, not split: `needs-split`     | Backlog                                                    | [State labels](triage-labels.md#state-labels); "Claimable" below: not claimable                                                                                 |
| a Spec, its Tickets worked           | In progress at an assignee, else its open Tickets' highest | "A Spec's assignees" below; "The board" for the Status                                                                                                          |
| a Spec, its Tickets closed           | In progress, at the logins of its Tickets                  | "Closing a Spec" below; [A Spec's coverage](#a-specs-coverage) for the check                                                                                    |
| closed                               | Done                                                       | "A pull request names the Tickets it delivers" and "Closing a Spec" below; a `wontfix` issue, closed by triage                                                  |

- **First write.** Before working on an issue, assign yourself: `gh issue edit <n> --add-assignee @me`, before the branch, the first commit, any comment and the pull request; a Ticket, with its Spec in the same command ("A Spec's assignees" below). Read the issue back: if a Ticket or an issue outside a Spec now has two assignees, the later one withdraws (`--remove-assignee @me`) and says so in a comment.
- **Claimable.** An open issue with no assignee that is `ready-for-agent` or `ready-for-human`, a Ticket on its Spec's Frontier, or a ticket of a wayfinder map on its frontier (no open blocker). Not claimable: `needs-triage` and `needs-info` (triaged, not claimed), a map, and a Spec, which has no Claim of its own. An unsplit Spec (`needs-split`, no Ticket yet) is not worked at all, whole or in part: it is split first, with `split-spec`, and its Tickets are claimed once they exist (ADR 0025). Triage and splitting are not claimed: their writes are the brief, the labels and the new issues; whoever implements claims. A bug you find and fix at once: open the issue and claim it in one gesture.
- **One login per issue**, for a Ticket and for an issue outside a Spec. One assigned to another login is theirs: do not add yourself, do not post a brief on it, do not open a pull request that closes it. A second assignee is added only by the first, for pairing; any other two assignees are a conflict to resolve, not work in pair. A Spec is the exception: it carries every login on its Tickets.
- **One Claim at a time**: one issue, or Tickets of one Spec. A Claim means working now, not a reservation: say what you will take next in a comment, and let the native blocked-by order the Tickets. A Ticket is claimed when its work starts, Frontier by Frontier, never ahead; whoever runs `implement-spec` claims every free Ticket of the Spec at once, since its one pull request delivers them: `gh issue edit <ticket>... <spec> --add-assignee @me`. A Ticket already assigned to another login stays theirs.
- **A Spec's assignees.** A Spec's assignees are every login that holds or delivered one of its Tickets, and nothing more: an assignee on a Spec claims none of it. Claiming a Ticket is one command over the Ticket and its Spec, `gh issue edit <ticket> <spec> --add-assignee @me`; the Spec is joined only with a Ticket. `gh issue edit` takes the issues of one repository only ("multiple issues must be in same repo"), so for a Ticket and its Spec in different Board repositories, the two commands go on one line, by their URLs: `gh issue edit <ticket-url> --add-assignee @me && gh issue edit <spec-url> --add-assignee @me`. A login that delivered a Ticket stays on the Spec until it closes; a login leaves the Spec only when it releases a Ticket without having delivered any, and holds no other Ticket of it.
- **Created without an assignee.** An issue created by `to-spec`, `write-spec`, `split-spec`, triage or an issue form has no assignee; whoever starts it claims it then, and a Spec gets its assignees from its Tickets.
- **A pull request names the Tickets it delivers**, and the issues, and never the Spec, so that no keyword closes a Spec past the coverage check. A pull request of `implement-spec` too: drop the Spec from the keywords it writes. A Ticket the pull request does not deliver stays claimed by the same login until done, or is released.
- **Closing a Spec.** Whoever merges a Spec's last open Ticket runs the coverage check, `pnpm spec:check <spec>` (`pnpm spec:check <spec> phmilk/reforged-ts-template` for a Spec of the Template), which reads the Spec and its Tickets in both Board repositories and prints the verdict: every gap, or none ([A Spec's coverage](#a-specs-coverage)). On green (exit 0), they close the Spec with a comment: `gh issue close <spec> --comment "..."`, saying the check is green. On red (exit 1), they comment the gaps it lists on the Spec and leave it open; whoever fills a gap runs the check again. Any assignee of the Spec, or the maintainer, may close it, on a green check.
- **Stale.** A Claim of a Ticket or of an issue outside a Spec is stale after 3 days without a commit on its pull request and without a comment on the issue or the pull request: a draft opened before any work keeps nothing alive. A Spec is never stale; its Tickets are. Any Collaborator may take a stale Claim over: comment first (what and why), then `gh issue edit <n> --remove-assignee <login> --add-assignee @me`, and for a Ticket, join its Spec as when claiming it, while the login taken over leaves it as on a release; the abandoned branch and draft are yours to reuse or drop. The maintainer may reassign at any time.
- **Release.** Leaving an issue you will not finish: comment, then `gh issue edit <n> --remove-assignee @me`. A Ticket released without having delivered any Ticket of its Spec, and with no other held, leaves the Spec in the same command, `gh issue edit <ticket> <spec> --remove-assignee @me`, or in two on one line when they live in different Board repositories.
- **Stopping.** Leaving a claimed issue open (a question for a human, red CI, a check only a human can make): comment what is pending and where the branch and the pull request stand. The comment keeps the Claim fresh and tells the next session what to resume.
- **The check.** The `claim` workflow (the check `claim / check`) runs on every pull request when it is opened, edited and pushed, drafts included, and reads the issues of this repository it closes: an unclaimed one is assigned to the author, with a reminder that the Claim comes first; one claimed by another login fails the check, whose comment names the takeover path. Two more fail it ([ADR 0025](../adr/0025-only-a-split-specs-unblocked-tickets-are-worked.md)), each with its own comment: an issue labelled `spec`, since a pull request names the Tickets it delivers and never their Spec; and an issue with an open blocker, of either Board repository, that the same pull request does not close too, the comment naming each one to deliver first or with it. A pull request of `implement-spec` that closes a Ticket together with its blockers passes. The author of a pull request that closes a Ticket joins its Spec ("A Spec's assignees"): when missing from a Spec of the same repository, they are assigned to it, with a reminder that the Spec is joined in the command that claims the Ticket; a Spec of the other Board repository is out of the check's reach, since its token writes only in the repository it runs in, so it comments on the Ticket the command that joins it, rewritten once the author is on the Spec, and the one-command Claim stays the main path. On an assignment, a second assignee not added by the first or by the maintainer, and an open pull request by a login outside the assignees, draw a comment on the issue; adding to a Spec a login that holds or delivered one of its Tickets is no conflict, while adding one that holds or delivered none of them is. A Claim made too early draws a comment too, saying why: any assignee on an unsplit Spec (no Ticket yet), or on an issue with an open blocker, named; the Claim stays, since the pull request is where the rule holds, and the comment says it settled once the Claim is no longer premature at a later assignment. The check never reverts anything; the ruleset requires it, so a red check blocks the merge. Bots and pull requests that close no issue are outside it.
- **The board.** [The board](https://github.com/users/phmilk/projects/5) over both repositories shows every open issue with a Status derived from GitHub state (Backlog, Ready, Blocked, In progress at an assignee, In review at an open non-draft pull request, Done), written by one reconcile in `phmilk/reforged-ts`; nobody moves a card by hand. Nothing in the protocol requires reading it: the assignee is the source.

## A Spec's coverage

Every item of a Spec reaches a Ticket, and a Spec closes on evidence that each was delivered, not on a count of closed sub-issues (ADR 0023). The rule lives here and in no skill: a split follows it whatever skill runs it, and the coverage check reads by it. It is not ADR 0008's coverage rule, which is about Wrappers and their Natives.

### The coverage rule

- **An item** is every list item, and every paragraph inside a list item, under a Spec's Implementation Decisions, Testing Decisions and Further Notes, except a list item that is only a bold label (`- **The claim check:**`, whose sub-items are the items).
- **Every item gets a Ticket and a criterion**: the Ticket that carries it, and the acceptance criterion of that Ticket that proves it.
- **A "check whether…" becomes a criterion that names both outcomes**: what the Ticket does when the check says yes, and what it does when it says no, so that the check cannot quietly become "not required".
- **A consequence goes into the Ticket that causes it, or into one blocked by it**, never into a Ticket that can merge before its cause.

### The Coverage table

A split writes the Spec's Coverage table into the Spec's body, as a `## Coverage table` section at its end, after the Tickets are published, so that every row names a Ticket that exists; `split-spec` writes it, and the coverage check, `pnpm spec:check <spec>`, reads it, by this rule and this format.

- **One table**: the first table of the section is the Coverage table, and any later one is read as prose.
- **One row per item**, in three columns:
  - **Item**: the item, quoted from the Spec word for word, short enough to find and long enough to name one item: a quote found in items of different texts covers none of them, and an item written twice, word for word in two sections, takes a row each;
  - **Ticket**: the Ticket that carries it, `#761`, or in full form when it lives in the other repository, `phmilk/reforged-ts-template#121`;
  - **Criterion**: the criterion, quoted from the Ticket word for word.
- **The outcome of a "check whether…"** is written in its Ticket after its criterion, as an `Outcome:` line, when the Ticket is delivered. The line is indented under the criterion's checkbox, so that it stays in the same list item:

  ```md
  - [x] **Check whether** one `gh issue edit` can claim a Ticket and its Spec when they live in different Board repositories (by their URLs). If it can, the doc gives that one command; if not, it gives the two commands joined on one line.
        Outcome: it cannot ("multiple issues must be in same repo"); the doc gives the two commands joined on one line.
  ```

The table of #726 is an example:

```md
## Coverage table

| Item                                                        | Ticket                          | Criterion                                                     |
| ----------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------- |
| The stale rule applies to Tickets, not to Specs.            | #761                            | The stale rule applies to Tickets, not to Specs.              |
| It is shared with the Template through its copy (ADR 0024). | phmilk/reforged-ts-template#121 | The Template's copy of the shared skills carries `split-spec` |
```

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues, using the `gh pr` equivalents:

- **Read a PR**: `gh pr view <number> --comments` and `gh pr diff <number>` for the diff.
- **List external PRs for triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` then keep only `authorAssociation` of `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE` (drop `OWNER`/`MEMBER`/`COLLABORATOR`).
- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either: resolve with `gh pr view 42` and fall back to `gh issue view 42`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`, and read its assignees: an assigned Ticket or issue is taken, whatever its labels, and a Spec carries the logins of its Tickets. Claim it before working on it (see "Claim").

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body. `gh issue create --label wayfinder:map`.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue (`gh api` on the sub-issues endpoint). Where sub-issues aren't enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: GitHub's **native issue dependencies**, the canonical, UI-visible representation. Add an edge with `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric **database id** (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`, _not_ the `#number` or `node_id`). GitHub reports `issue_dependencies_summary.blocked_by` (open blockers only, the live gate). Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed.
- **Frontier query**: list the map's open children (`gh issue list --state open`, scoped to the map's sub-issues / task list), drop any with an open blocker (`issue_dependencies_summary.blocked_by > 0`, or an open issue in the `Blocked by` line) or an assignee; first in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me`, the session's first write (see "Claim"). At charting, claim each research ticket before firing its subagent. A named ticket assigned to another login is not claimed: say so and stop.
- **Resolve**: `gh issue comment <n> --body "<answer>"`, then `gh issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far.
